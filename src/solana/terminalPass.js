/**
 * Terminal Access Pass — mpl-core NFT minter.
 *
 * Issues a non-transferable-by-convention mpl-core Asset to the connected
 * wallet on devnet. Terminal gates on ownership of this asset, replacing
 * the brittle Supabase `users.tier='pro'` column with an on-chain check.
 *
 * Signing strategy: umi builds the mint transaction; we generate an
 * ephemeral asset keypair in-process and partial-sign as the asset, then
 * hand the serialized bytes to wallet-standard's `signAndSendTransaction`
 * which adds the user's fee-payer signature and submits.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  generateSigner,
  signerIdentity,
  publicKey as umiPublicKey,
  createNoopSigner,
} from '@metaplex-foundation/umi';
import { mplCore, create, fetchAsset } from '@metaplex-foundation/mpl-core';
import { CLUSTERS, DEFAULT_CLUSTER, getTxExplorerUrl, getAccountExplorerUrl } from './config';

export const ACCESS_PASS_NAME = "Limer's Terminal Access Pass";
export const ACCESS_PASS_URI  = typeof window !== 'undefined'
  ? `${window.location.origin}/metadata/access-pass.json`
  : 'https://limerscapital.com/metadata/access-pass.json';

/**
 * Build a umi instance bound to our devnet RPC with the mpl-core plugin.
 * The wallet-standard user account is only registered as a noop signer
 * for `identity` — we partial-sign with the asset keypair and let the
 * wallet co-sign as fee payer afterwards.
 */
function buildUmi(ownerAddress, cluster = DEFAULT_CLUSTER) {
  const rpcUrl = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const umi = createUmi(rpcUrl).use(mplCore());
  // Noop identity: signs return the transaction untouched. The wallet is
  // the real signer for the fee-payer slot, added later via wallet-standard.
  umi.use(signerIdentity(createNoopSigner(umiPublicKey(ownerAddress))));
  return umi;
}

/**
 * Mint a Terminal Access Pass to the connected wallet.
 *
 * @param {object}   params
 * @param {object}   params.account              — wallet-standard WalletAccount (from useSelectedWalletAccount)
 * @param {function} params.signAndSendTransaction — from useSignAndSendTransaction(account, chain)
 * @param {string}   [params.cluster='devnet']
 * @param {function} [params.onStatusChange]     — optional status callback ('building'|'partial-signing'|'wallet-signing'|'confirming'|'success')
 *
 * @returns {Promise<{ assetAddress, signature, explorerTxUrl, explorerAssetUrl }>}
 */
export async function mintAccessPass({
  account,
  signAndSendTransaction,
  cluster = DEFAULT_CLUSTER,
  onStatusChange,
}) {
  const emit = onStatusChange || (() => {});
  if (!account?.address) throw new Error('No wallet account');
  if (typeof signAndSendTransaction !== 'function') {
    throw new Error('signAndSendTransaction missing — pass the hook result from useSignAndSendTransaction(account, chain).');
  }

  emit('building');
  const umi = buildUmi(account.address, cluster);

  // Generate the asset mint address. The asset keypair partial-signs the
  // create instruction (the asset account is being INITIALIZED, so the
  // instruction requires a signature from the asset PDA/keypair to prove
  // the caller owns the address).
  const assetSigner = generateSigner(umi);

  const builder = create(umi, {
    asset: assetSigner,
    name: ACCESS_PASS_NAME,
    uri: ACCESS_PASS_URI,
    owner: umiPublicKey(account.address),
    // Immutable = metadata can't be changed by us post-mint; still transferable
    // by owner unless we add a FreezeDelegate plugin. For MVP we ship it as
    // owner-transferable so users can move it between wallets if needed.
  });

  const tx = await builder.buildWithLatestBlockhash(umi);
  const partiallySignedTx = await assetSigner.signTransaction(tx);
  const serialized = umi.transactions.serialize(partiallySignedTx);

  emit('wallet-signing');
  const signResult = await signAndSendTransaction({ transaction: serialized });
  // signResult shape varies across @solana/react versions: { signature: Uint8Array } or bare bytes
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
 * Read a mpl-core asset to confirm it still exists and is owned by `expectedOwner`.
 * Returns null on any error (account closed, RPC flake, burned).
 */
export async function fetchPassAsset(assetAddress, expectedOwner, cluster = DEFAULT_CLUSTER) {
  try {
    const umi = buildUmi(expectedOwner, cluster);
    const asset = await fetchAsset(umi, umiPublicKey(assetAddress));
    if (!asset) return null;
    if (String(asset.owner) !== String(expectedOwner)) return null;
    return { assetAddress, owner: String(asset.owner), name: asset.name, uri: asset.uri };
  } catch (e) {
    console.warn('[terminalPass] fetchPassAsset failed:', e?.message || e);
    return null;
  }
}

// ── Minimal base58 encoder (Solana-style) ─────────────────────────────
// umi sometimes returns signature bytes as Uint8Array on some wallet
// backends; we need to render them as the canonical base58 string for
// explorer links. Bignum-free implementation.
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
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
