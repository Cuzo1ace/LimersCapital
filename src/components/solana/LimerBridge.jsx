/**
 * LimerBridge — mounts the on-chain sync hook with no visible output.
 * Place once near the root of the app (inside QueryClientProvider + SolanaProvider).
 */
import { useLimerBridge } from '../../solana/bridge';

export default function LimerBridge() {
  useLimerBridge();
  return null;
}
