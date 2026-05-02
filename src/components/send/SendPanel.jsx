import { useState, useMemo, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useSelectedWalletAccount } from '@solana/react';
import { useWallets } from '@wallet-standard/react';
import { useCluster } from '../../solana/provider';
import { CLUSTERS } from '../../solana/config';
import { makeAnchorWallet } from '../../solana/wallet-adapter';
import {
  STABLECOINS,
  getStablecoin,
  getMintAddress,
  getTokenProgramId,
  isStablecoinLive,
} from '../../../apps/pusd-sundollar/src/stablecoins';
import { buildStablecoinTransferTx } from '../../../apps/pusd-sundollar/src/solana/accounts';
import { mintSavingsReceipt, base58Encode } from '../../../apps/pusd-sundollar/src/solana/core';
import { maturityToUnix } from '../../../apps/pusd-sundollar/src/savings';
import { JUICE_ESCROW_LIVE } from '../../../apps/pusd-sundollar/src/solana/juice-escrow-client';

/**
 * Send Juice send flow + optional savings receipt mint.
 *
 * Two transactions, fired in sequence:
 *   1. SPL/Token-2022 transfer (existing flow, always runs)
 *   2. mpl-core CreateV2 mint of the savings receipt NFT to the recipient
 *      (only fires when the user filled in goal amount or maturity)
 *
 * The mint is best-effort — if it fails, the transfer still succeeded and
 * the user sees a non-fatal warning. Sprint 2 will swap the receipt for an
 * escrow-backed bearer NFT via apps/pusd-sundollar/src/solana/juice-escrow-client.js.
 */
export default function SendPanel() {
  // Transfer state
  const [stablecoinId, setStablecoinId] = useState('usdc');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle');
  const [signature, setSignature] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Optional savings goal
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [maturityDate, setMaturityDate] = useState(''); // YYYY-MM-DD
  // Sprint 2 escrow toggle — runtime-gated to false until juice_escrow is deployed.
  // When true (post-deploy), funds route into the program-owned vault PDA instead of
  // the recipient's ATA, and the receipt NFT becomes the claim authority.
  const [lockWithEscrow, setLockWithEscrow] = useState(false);

  // Receipt mint state (independent from transfer state)
  const [mintStatus, setMintStatus] = useState('idle'); // idle | minting | minted | failed
  const [mintAssetAddress, setMintAssetAddress] = useState(null);
  const [mintTxUrl, setMintTxUrl] = useState(null);
  const [mintAssetUrl, setMintAssetUrl] = useState(null);
  const [mintError, setMintError] = useState(null);

  // Wallet wiring
  const [selectedAccount] = useSelectedWalletAccount();
  const wallets = useWallets();
  const { cluster, label: clusterLabel, explorer } = useCluster();

  const stablecoin = getStablecoin(stablecoinId);
  const mint = getMintAddress(stablecoin, cluster);
  const live = isStablecoinLive(stablecoin, cluster);

  const recipientValid = useMemo(() => {
    if (!recipient.trim()) return null;
    try { new PublicKey(recipient.trim()); return true; } catch { return false; }
  }, [recipient]);

  const amountNum = parseFloat(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  const goalAmountNum = parseFloat(goalAmount);
  const wantsReceipt = goalOpen && (goalAmountNum > 0 || !!maturityDate);
  const wantsEscrow = wantsReceipt && lockWithEscrow && JUICE_ESCROW_LIVE;

  // Resolve the wallet that owns the selected account. Brave's built-in
  // Solana wallet doesn't always show up in @wallet-standard/react's
  // useWallets() output (timing / filter quirk), so we fall back to the
  // global wallet-standard registry (window.navigator.wallets.get()) the
  // same way JupiterSwap.jsx does. Without the fallback, Brave-wallet
  // sends throw "supports neither signAndSendTransaction nor signTransaction".
  const connectedWallet = useMemo(() => {
    if (!selectedAccount) return null;
    const findIn = (list) =>
      list.find((w) => w.accounts?.some((a) => a.address === selectedAccount.address)) || null;
    const fromHook = findIn(wallets || []);
    if (fromHook) return fromHook;
    const fromRegistry = typeof window !== 'undefined'
      ? findIn(window.navigator?.wallets?.get?.() || [])
      : null;
    return fromRegistry;
  }, [wallets, selectedAccount]);

  const signAndSendTransaction = useCallback(async ({ transaction }) => {
    const feature = connectedWallet?.features?.['solana:signAndSendTransaction'];
    if (!feature) throw new Error('Wallet does not support signAndSendTransaction.');
    return feature.signAndSendTransaction({ transaction, account: selectedAccount });
  }, [connectedWallet, selectedAccount]);

  const gate =
    !selectedAccount ? { kind: 'wallet', message: 'Connect a wallet to send.' }
    : !live ? {
        kind: 'cluster',
        message: cluster === 'mainnet-beta'
          ? `${stablecoin.symbol} mint not yet published. Switch rail.`
          : `${stablecoin.symbol} has no devnet mint. Switch to USDC for the devnet demo, or flip to mainnet.`,
      }
    : recipientValid === false ? { kind: 'recipient', message: 'That doesn’t look like a valid Solana address.' }
    : !recipient.trim() ? { kind: 'recipient', message: 'Enter a recipient wallet address.' }
    : !amountValid ? { kind: 'amount', message: 'Enter an amount greater than 0.' }
    : null;

  const busy = status === 'sending' || status === 'confirming';

  async function handleMintReceipt() {
    setMintStatus('minting');
    setMintError(null);
    try {
      const result = await mintSavingsReceipt({
        account: selectedAccount,
        signAndSendTransaction,
        recipientAddress: recipient.trim(),
        stablecoinId,
        depositUiAmount: amountNum,
        goalUiAmount: goalAmountNum > 0 ? goalAmountNum : null,
        maturityUnix: maturityToUnix(maturityDate),
        cluster,
      });
      setMintAssetAddress(result.assetAddress);
      setMintTxUrl(result.explorerTxUrl);
      setMintAssetUrl(result.explorerAssetUrl);
      setMintStatus('minted');
    } catch (e) {
      console.error('[SendPanel] receipt mint failed', e);
      setMintError(e?.message || 'Receipt mint failed.');
      setMintStatus('failed');
    }
  }

  async function handleSend() {
    if (gate || busy) return;
    setStatus('sending');
    setErrorMsg(null);
    setSignature(null);
    setMintStatus('idle');
    setMintError(null);
    try {
      const connection = new Connection(CLUSTERS[cluster].rpc, 'confirmed');

      // Sprint 2 escrow path: when wantsEscrow is true (live + opted in), the
      // first tx mints the Core receipt + initialize_savings, routing funds
      // into the vault PDA instead of recipient's ATA. The recipient claims
      // later via juice_escrow's `claim` ix once they hold the receipt NFT.
      //
      // Today this branch is unreachable because JUICE_ESCROW_LIVE = false.
      // Once the program is deployed and the flag flipped, it activates with
      // no further client changes — the integration is pre-wired.
      if (wantsEscrow) {
        throw new Error(
          'Escrow path is pre-wired but not yet implemented end-to-end. ' +
          'After juice_escrow deploys, replace this throw with the bundled ' +
          'mint + initialize_savings tx. See SPRINT_2_TODO comment below.'
        );
        // SPRINT_2_TODO: build a single tx with these instructions in order:
        //   1. mpl-core CreateV2  (mints receipt to recipient — extract via
        //                          umi.transactions builder, convert to web3.js)
        //   2. juice_escrow.initialize_savings(goal, maturity, amount)
        //                         (use buildInitializeSavingsIx from
        //                          apps/pusd-sundollar/src/solana/juice-escrow-client.js)
        // Sign with assetSigner (partial) + wallet (fee payer), submit, confirm.
      }

      const senderPk = new PublicKey(selectedAccount.address);
      const tx = await buildStablecoinTransferTx(connection, {
        sender: senderPk,
        recipient: recipient.trim(),
        mint,
        decimals: stablecoin.decimals,
        uiAmount: amountNum,
        tokenProgramId: getTokenProgramId(stablecoin),
      });

      // Wallet capability fork: prefer `solana:signAndSendTransaction` (Brave,
      // Backpack, modern Phantom) and fall back to `solana:signTransaction`
      // (older wallets, programmatic adapters). Brave Wallet does NOT
      // implement signTransaction at all — without this fork the SPL transfer
      // throws "Wallet does not support signTransaction" before it even
      // builds. The receipt-mint flow already uses signAndSendTransaction
      // exclusively, so this brings the transfer in line.
      setStatus('confirming');
      let sig;
      const signAndSendFeature = connectedWallet?.features?.['solana:signAndSendTransaction'];
      if (signAndSendFeature) {
        const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
        const result = await signAndSendFeature.signAndSendTransaction({
          transaction: serialized,
          account: selectedAccount,
        });
        const sigBytes = result?.signature ?? result;
        sig = typeof sigBytes === 'string' ? sigBytes : base58Encode(sigBytes);
      } else {
        const wallet = makeAnchorWallet(selectedAccount);
        if (!wallet) {
          // Diagnostic: surface what we DID find so we can debug wallet
          // discovery without reverse-engineering from a generic error.
          const hookCount = (wallets || []).length;
          const registryCount = typeof window !== 'undefined'
            ? (window.navigator?.wallets?.get?.() || []).length
            : 0;
          throw new Error(
            `Could not find a wallet supporting signAndSendTransaction or signTransaction for account ${selectedAccount.address.slice(0, 8)}…. ` +
            `Found ${hookCount} wallet(s) via React hook, ${registryCount} via window.navigator.wallets registry. ` +
            `Reconnect the wallet from the Limer header and try again.`
          );
        }
        const signed = await wallet.signTransaction(tx);
        sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
      }
      await connection.confirmTransaction(sig, 'confirmed');
      setSignature(sig);
      setStatus('confirmed');
      // Best-effort receipt mint — do NOT roll back the transfer if it fails.
      if (wantsReceipt) handleMintReceipt();
    } catch (e) {
      console.error('[SendPanel] transfer failed', e);
      setErrorMsg(e?.message || 'Transaction failed.');
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setSignature(null);
    setErrorMsg(null);
    setMintStatus('idle');
    setMintAssetAddress(null);
    setMintTxUrl(null);
    setMintAssetUrl(null);
    setMintError(null);
  }

  const explorerTxBase = explorer.replace(/\?.*$/, '');
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';

  return (
    <section
      className="rounded-[14px] p-5 border border-[var(--color-border)]"
      style={{ background: 'var(--color-card)' }}
    >
      <div className="text-[.66rem] uppercase tracking-widest mb-3 flex items-center gap-2 text-[#7ED957]">
        Send Flow
        <span className="text-[var(--color-muted)] text-[.6rem] font-normal normal-case tracking-normal">
          On-chain transfer · {clusterLabel}
        </span>
      </div>

      {/* Rail picker */}
      <div className="mb-3">
        <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1.5">Send rail</label>
        <div className="flex gap-1.5 flex-wrap">
          {STABLECOINS.map((s) => {
            const liveOnThisCluster = isStablecoinLive(s, cluster);
            const active = s.id === stablecoinId;
            return (
              <button
                key={s.id}
                onClick={() => setStablecoinId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-[.7rem] font-mono cursor-pointer border transition-colors duration-150 ${
                  active
                    ? 'bg-white/5 font-bold'
                    : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-txt)]'
                }`}
                style={active ? { borderColor: s.color, color: s.color } : undefined}
                title={liveOnThisCluster ? s.notes : `${s.symbol} not live on ${clusterLabel.toLowerCase()}`}
              >
                {s.symbol}
                {!liveOnThisCluster && <span className="ml-1.5 text-[.55rem] text-[var(--color-warn)]">·</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipient + amount */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2.5 mb-3">
        <div>
          <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">
            Recipient (Solana address)
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. 9zd2H1...Yo3p"
            spellCheck={false}
            className={`w-full bg-black/30 border rounded-lg px-3 py-2 font-mono text-[.72rem] outline-none transition-colors ${
              recipientValid === false
                ? 'border-[var(--color-down)]/60'
                : 'border-[var(--color-border)] focus:border-[var(--color-sea)]'
            } text-[var(--color-txt)]`}
          />
        </div>
        <div>
          <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">
            Amount ({stablecoin.symbol})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="25.00"
            className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg px-3 py-2 font-mono text-[.8rem] outline-none focus:border-[var(--color-sea)]"
          />
        </div>
      </div>

      {/* Optional savings goal */}
      <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-black/20">
        <button
          type="button"
          onClick={() => setGoalOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 bg-transparent border-none cursor-pointer text-left"
        >
          <span className="text-[.66rem] uppercase tracking-widest text-[var(--color-coral)]">
            {goalOpen ? '▾' : '▸'} Add a savings goal {wantsReceipt && <span className="text-[#7ED957] ml-1">· receipt will mint</span>}
          </span>
          <span className="text-[.6rem] text-[var(--color-muted)] normal-case">
            Optional · mints a Metaplex Core NFT to recipient
          </span>
        </button>
        {goalOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 px-3 pb-3">
            <div>
              <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">
                Goal amount ({stablecoin.symbol})
              </label>
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-[var(--color-sea)]"
              />
            </div>
            <div>
              <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">
                Maturity date
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-[var(--color-sea)]"
              />
            </div>
            <p className="sm:col-span-2 text-[.6rem] text-[var(--color-muted)] leading-relaxed">
              Sprint 1 — receipt is owner-updatable, no escrow. Sprint 2 (juice_escrow program scaffolded) locks deposits in a vault PDA until maturity, with the NFT acting as the bearer instrument.
            </p>

            {/* Sprint 2 escrow toggle — gated by JUICE_ESCROW_LIVE */}
            <label
              className={`sm:col-span-2 flex items-start gap-2 p-2 rounded-lg border ${
                JUICE_ESCROW_LIVE
                  ? 'border-[var(--color-up)]/40 bg-[var(--color-up)]/5 cursor-pointer'
                  : 'border-[var(--color-border)] bg-black/20 opacity-60 cursor-not-allowed'
              }`}
              title={JUICE_ESCROW_LIVE ? 'Funds route into the juice_escrow vault PDA' : 'Deploy juice_escrow first — see anchor/programs/juice_escrow/README.md'}
            >
              <input
                type="checkbox"
                checked={lockWithEscrow && JUICE_ESCROW_LIVE}
                disabled={!JUICE_ESCROW_LIVE}
                onChange={(e) => setLockWithEscrow(e.target.checked)}
                className="mt-0.5 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="flex-1 text-[.7rem] text-[var(--color-txt-2)] leading-snug">
                <span className={`font-bold ${JUICE_ESCROW_LIVE ? 'text-[var(--color-up)]' : 'text-[var(--color-muted)]'}`}>
                  Lock deposits in escrow vault
                </span>
                {' '}
                <span className="text-[.6rem] uppercase tracking-widest text-[var(--color-muted)]">
                  {JUICE_ESCROW_LIVE ? 'Sprint 2 · live' : 'Sprint 2 · awaiting deploy'}
                </span>
                <br />
                <span className="text-[.65rem] text-[var(--color-muted)]">
                  {JUICE_ESCROW_LIVE
                    ? 'Recipient claims from the vault PDA at maturity. Whoever holds the receipt NFT can claim — gift the goal by transferring the NFT.'
                    : 'When juice_escrow ships, this checkbox routes funds into the vault PDA instead of the recipient\'s ATA. UI is wired; runtime is gated.'}
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Action row */}
      {status === 'idle' || status === 'error' ? (
        <>
          <button
            onClick={handleSend}
            disabled={!!gate || busy}
            className={`w-full py-3 rounded-lg text-[.85rem] font-headline uppercase tracking-widest transition-colors duration-150 border-none cursor-pointer ${
              gate
                ? 'bg-[var(--color-night-3)] text-[var(--color-muted)] cursor-not-allowed'
                : 'bg-[#7ED957]/15 text-[#7ED957] hover:bg-[#7ED957]/25 border border-[#7ED957]/40'
            }`}
          >
            {gate
              ? gate.message
              : wantsEscrow
                ? `Lock ${amount || '0'} ${stablecoin.symbol} in vault + mint receipt`
                : `Send ${amount || '0'} ${stablecoin.symbol}${wantsReceipt ? ' + mint receipt' : ''}`}
          </button>
          {status === 'error' && errorMsg && (
            <div className="mt-2 text-[.7rem] text-[var(--color-down)]">{errorMsg}</div>
          )}
          {!gate && (
            <div className="mt-2 text-[.6rem] text-[var(--color-muted)]">
              You’ll be prompted to sign in your wallet{wantsReceipt ? ' twice — once for the transfer, once for the receipt mint' : ''}. Recipient ATA created automatically if missing (you pay rent, ~0.002 SOL).
            </div>
          )}
        </>
      ) : status === 'sending' ? (
        <div className="text-[.78rem] text-[var(--color-warn)]">Awaiting wallet signature…</div>
      ) : status === 'confirming' ? (
        <div className="text-[.78rem] text-[var(--color-warn)]">Submitted. Confirming on Solana…</div>
      ) : (
        <div className="space-y-3">
          <div className="text-[.78rem] text-[#7ED957] font-bold">
            ✓ Sent {amount} {stablecoin.symbol} on {clusterLabel}
          </div>
          {signature && (
            <a
              href={`${explorerTxBase}/tx/${signature}${clusterParam}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[.7rem] text-[var(--color-sea)] hover:underline font-mono break-all"
            >
              {signature.slice(0, 16)}…{signature.slice(-8)} ↗
            </a>
          )}

          {/* Receipt mint status */}
          {wantsReceipt && (
            <div className="pt-2 border-t border-[var(--color-border)]">
              {mintStatus === 'minting' && (
                <div className="text-[.7rem] text-[var(--color-warn)]">Minting savings receipt…</div>
              )}
              {mintStatus === 'minted' && (
                <div className="space-y-1">
                  <div className="text-[.7rem] text-[var(--color-coral)] font-bold">
                    ✓ Receipt minted to recipient
                  </div>
                  {mintAssetUrl && (
                    <a href={mintAssetUrl} target="_blank" rel="noopener noreferrer"
                       className="block text-[.65rem] text-[var(--color-sea)] hover:underline font-mono break-all">
                      asset: {mintAssetAddress?.slice(0, 12)}…{mintAssetAddress?.slice(-6)} ↗
                    </a>
                  )}
                  {mintTxUrl && (
                    <a href={mintTxUrl} target="_blank" rel="noopener noreferrer"
                       className="block text-[.65rem] text-[var(--color-sea)]/80 hover:underline font-mono">
                      mint tx ↗
                    </a>
                  )}
                </div>
              )}
              {mintStatus === 'failed' && (
                <div className="text-[.7rem] text-[var(--color-down)]">
                  Transfer succeeded, receipt mint failed — {mintError}
                  <button onClick={handleMintReceipt}
                          className="ml-2 underline cursor-pointer bg-transparent border-none text-[var(--color-down)] p-0">
                    retry
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={reset}
            className="block text-[.65rem] text-[var(--color-muted)] hover:text-[var(--color-txt)] bg-transparent border-none cursor-pointer p-0 mt-2"
          >
            Send another
          </button>
        </div>
      )}
    </section>
  );
}
