/**
 * Send Juice savings-receipt minter — mpl-core NFT.
 *
 * Modelled after the parent SPA's working `mintAccessPass` flow in
 * src/solana/terminalPass.js: umi builds the create instruction, an
 * ephemeral asset keypair partial-signs (the asset address is being
 * INITIALIZED, so the create ix requires a signature from that address),
 * and the wallet-standard `signAndSendTransaction` adds the user's
 * fee-payer signature and submits.
 *
 * Sprint 1 attaches the goal/deposit metadata via the Attributes plugin —
 * recipient is the owner and can update or transfer freely. Sprint 2 will
 * swap Attributes for AppData with a PDA `data_authority`, so the
 * juice_escrow program (anchor/programs/juice_escrow/) can append deposits
 * and gate claims without needing the recipient to sign every update.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  generateSigner,
  signerIdentity,
  publicKey as umiPublicKey,
  createNoopSigner,
} from '@metaplex-foundation/umi';
import { mplCore, create, fetchAsset } from '@metaplex-foundation/mpl-core';
import { CLUSTERS, DEFAULT_CLUSTER, getTxExplorerUrl, getAccountExplorerUrl } from './config.js';
import { buildAttributeList, buildReceiptName, resolveReceiptUri, SAVINGS_COLLECTION_NAME } from '../savings.js';

function buildUmi(ownerAddress, cluster = DEFAULT_CLUSTER) {
  const rpcUrl = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const umi = createUmi(rpcUrl).use(mplCore());
  // Noop identity — wallet is the real signer for the fee-payer slot,
  // added later by signAndSendTransaction.
  umi.use(signerIdentity(createNoopSigner(umiPublicKey(ownerAddress))));
  return umi;
}

/**
 * Mint a Send Juice savings receipt to `recipientAddress`.
 *
 * The fee payer is `account` (wallet-standard WalletAccount — usually the
 * sender). Recipient becomes the asset owner; sender pays the rent (~0.003
 * SOL) which mirrors the SPL transfer's existing rent payment for the
 * recipient's ATA.
 *
 * @param {object}   params
 * @param {object}   params.account                — wallet-standard WalletAccount (sender / payer)
 * @param {function} params.signAndSendTransaction — from useSignAndSendTransaction(account, chain)
 * @param {string}   params.recipientAddress       — base58 wallet address of the goal owner
 * @param {string}   params.stablecoinId           — id from STABLECOINS registry (e.g. 'pusd')
 * @param {number}   params.depositUiAmount        — the deposit that triggered the receipt
 * @param {number}  [params.goalUiAmount]          — optional savings goal target
 * @param {number}  [params.maturityUnix]          — optional unix maturity timestamp
 * @param {string}  [params.sourceCountry]
 * @param {string}  [params.recipientCountry]
 * @param {string}  [params.cluster='devnet']
 * @param {function}[params.onStatusChange]        — 'building' | 'wallet-signing' | 'success'
 *
 * @returns {Promise<{ assetAddress, signature, explorerTxUrl, explorerAssetUrl }>}
 */
export async function mintSavingsReceipt({
  account,
  signAndSendTransaction,
  recipientAddress,
  stablecoinId,
  depositUiAmount,
  goalUiAmount,
  maturityUnix,
  sourceCountry,
  recipientCountry,
  cluster = DEFAULT_CLUSTER,
  onStatusChange,
}) {
  const emit = onStatusChange || (() => {});
  if (!account?.address) throw new Error('No wallet account');
  if (typeof signAndSendTransaction !== 'function') {
    throw new Error('signAndSendTransaction missing — pass useSignAndSendTransaction(account, chain) result');
  }
  if (!recipientAddress) throw new Error('recipientAddress required');

  emit('building');
  const umi = buildUmi(account.address, cluster);
  const assetSigner = generateSigner(umi);

  const stablecoin = (await import('../stablecoins.js')).getStablecoin(stablecoinId);
  const attributeList = buildAttributeList({
    stablecoinId,
    goalUiAmount,
    maturityUnix,
    depositUiAmount,
    sourceCountry,
    recipientCountry,
  });

  const builder = create(umi, {
    asset: assetSigner,
    name: buildReceiptName({ stablecoin, goalUiAmount }),
    uri: resolveReceiptUri(),
    owner: umiPublicKey(recipientAddress),
    plugins: [
      { type: 'Attributes', attributeList },
    ],
  });

  const tx = await builder.buildWithLatestBlockhash(umi);
  const partiallySignedTx = await assetSigner.signTransaction(tx);
  const serialized = umi.transactions.serialize(partiallySignedTx);

  emit('wallet-signing');
  const signResult = await signAndSendTransaction({ transaction: serialized });
  const sigBytes = signResult?.signature || signResult;
  const signature = typeof sigBytes === 'string' ? sigBytes : base58Encode(sigBytes);

  emit('success');
  return {
    assetAddress: assetSigner.publicKey,
    signature,
    explorerTxUrl: getTxExplorerUrl(signature, cluster),
    explorerAssetUrl: getAccountExplorerUrl(assetSigner.publicKey, cluster),
  };
}

/**
 * Read a Send Juice savings receipt back. Useful for the future /savings
 * tab that lists a recipient's goals. Returns null on any error.
 */
export async function fetchSavingsReceipt(assetAddress, ownerHint, cluster = DEFAULT_CLUSTER) {
  try {
    const umi = buildUmi(ownerHint || assetAddress, cluster);
    const asset = await fetchAsset(umi, umiPublicKey(assetAddress));
    if (!asset) return null;
    const attrs = {};
    const attrList = asset.attributes?.attributeList || [];
    for (const a of attrList) attrs[a.key] = a.value;
    return {
      assetAddress,
      owner: String(asset.owner),
      name: asset.name,
      uri: asset.uri,
      attributes: attrs,
    };
  } catch (e) {
    console.warn('[core] fetchSavingsReceipt failed:', e?.message || e);
    return null;
  }
}

// ── base58 encoder copied from terminalPass.js (sigs sometimes come back as bytes) ──
// Exported so SendPanel and any future code path that calls
// `solana:signAndSendTransaction` can normalize the result to a Solscan-ready string.
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58Encode(bytes) {
  if (!bytes || !bytes.length) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

export { SAVINGS_COLLECTION_NAME };
