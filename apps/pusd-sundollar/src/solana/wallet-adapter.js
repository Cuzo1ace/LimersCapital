/**
 * Bridge a wallet-standard WalletAccount → web3.js-style signer.
 * Copied from Limer's main app to keep the wiring identical.
 */
import { Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';

export function makeAnchorWallet(selectedAccount) {
  if (!selectedAccount) return null;
  const features = selectedAccount.features || {};
  const signFeature = features['solana:signTransaction'];
  if (!signFeature) return null;

  const publicKey = new PublicKey(selectedAccount.address);

  return {
    publicKey,
    async signTransaction(tx) {
      let serialized;
      if (tx instanceof VersionedTransaction) {
        serialized = tx.serialize();
      } else {
        serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      }
      const { signedTransactions } = await signFeature.signTransaction({
        account: selectedAccount,
        transactions: [serialized],
      });
      const bytes = Buffer.from(signedTransactions[0]);
      try {
        return VersionedTransaction.deserialize(bytes);
      } catch {
        return Transaction.from(bytes);
      }
    },
    async signAllTransactions(txs) {
      const serialized = txs.map((tx) => {
        if (tx instanceof VersionedTransaction) return tx.serialize();
        return tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      });
      const { signedTransactions } = await signFeature.signTransaction({
        account: selectedAccount,
        transactions: serialized,
      });
      return signedTransactions.map((st) => {
        const bytes = Buffer.from(st);
        try {
          return VersionedTransaction.deserialize(bytes);
        } catch {
          return Transaction.from(bytes);
        }
      });
    },
  };
}
