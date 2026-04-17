#!/usr/bin/env bash
#
# transfer-authority-to-squads.sh
# ────────────────────────────────────────────────────────────────────────
# Transfer the `limer` program's BPF Loader Upgradeable authority from the
# current single-signer keypair to a pre-deployed Squads v4 multisig vault.
#
# Audit reference: Limers-Capital-Security-Audit-Report-April-2026.md C-01.
# Governance doc: docs/SECURITY_MODEL.md §2 + §3.
#
# Safety posture
#   - Dry-run by default. You must pass --execute to actually send the tx.
#   - Exits non-zero if any precondition is wrong.
#   - Prints a line-by-line diff of current vs. target state before executing.
#   - Logs the resulting transaction signature to docs/program-upgrade-log.md.
#
# Required inputs (edit the ENV section below to your setup, or export them
# before running):
#   PROGRAM_ID            — the Anchor program ID (already set, below)
#   SQUADS_VAULT_PDA      — the PDA of the Squads v4 vault you want as
#                           the new upgrade authority. Obtain via the
#                           Squads app after creating the multisig.
#   CURRENT_AUTHORITY_KP  — path to the JSON keypair file currently holding
#                           upgrade authority. Keep this on a cold machine.
#   NETWORK               — devnet or mainnet-beta (default devnet).
#
# Usage:
#   ./scripts/transfer-authority-to-squads.sh              # dry-run devnet
#   ./scripts/transfer-authority-to-squads.sh --network mainnet-beta --dry-run
#   ./scripts/transfer-authority-to-squads.sh --network devnet --execute
#
# After a successful run:
#   1. Copy the tx signature printed at the end.
#   2. Append it to docs/program-upgrade-log.md.
#   3. Update the Authority Inventory in docs/SECURITY_MODEL.md §1.
#   4. Close C-01 in docs/remediation-log.md.
#
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── ENV (edit me before first run) ─────────────────────────────────────

PROGRAM_ID="${PROGRAM_ID:-HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk}"

# The Squads v4 vault PDA — REPLACE THIS with the vault address printed by
# the Squads app after you create the multisig. Leaving the placeholder in
# place will cause the script to abort.
SQUADS_VAULT_PDA="${SQUADS_VAULT_PDA:-REPLACE_WITH_SQUADS_VAULT_PDA}"

# Path to the JSON keypair file that currently holds upgrade authority.
# Default matches the Anchor deploy keypair layout.
CURRENT_AUTHORITY_KP="${CURRENT_AUTHORITY_KP:-$HOME/.config/solana/id.json}"

# ── Arg parsing ────────────────────────────────────────────────────────

NETWORK="devnet"
EXECUTE=false
DRY_RUN=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --execute)
      EXECUTE=true
      DRY_RUN=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      EXECUTE=false
      shift
      ;;
    -h|--help)
      sed -n '2,40p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      exit 1
      ;;
  esac
done

# ── Resolve the RPC URL ───────────────────────────────────────────────

case "$NETWORK" in
  devnet)       RPC_URL="https://api.devnet.solana.com" ;;
  mainnet-beta) RPC_URL="https://api.mainnet-beta.solana.com" ;;
  *)
    echo "Error: --network must be devnet or mainnet-beta (got: $NETWORK)" >&2
    exit 1
    ;;
esac

# ── Locate solana CLI ──────────────────────────────────────────────────

if command -v solana >/dev/null 2>&1; then
  SOLANA="$(command -v solana)"
elif [[ -x "$HOME/.local/share/solana/install/active_release/bin/solana" ]]; then
  SOLANA="$HOME/.local/share/solana/install/active_release/bin/solana"
else
  echo "Error: solana CLI not found on PATH. Install from https://docs.solana.com/cli/install-solana-cli-tools" >&2
  exit 1
fi

# ── Precondition checks ────────────────────────────────────────────────

echo "────────────────────────────────────────────────────────────────────"
echo "  Limer's Capital — Upgrade Authority Transfer (C-01 remediation)"
echo "────────────────────────────────────────────────────────────────────"
echo "  Program ID       : $PROGRAM_ID"
echo "  Network          : $NETWORK ($RPC_URL)"
echo "  Current auth KP  : $CURRENT_AUTHORITY_KP"
echo "  Target authority : $SQUADS_VAULT_PDA"
echo "  Mode             : $($DRY_RUN && echo 'DRY-RUN (no tx)' || echo 'EXECUTE')"
echo "────────────────────────────────────────────────────────────────────"

if [[ "$SQUADS_VAULT_PDA" == "REPLACE_WITH_SQUADS_VAULT_PDA" ]]; then
  echo "✗ SQUADS_VAULT_PDA is still the placeholder. Deploy your Squads v4 multisig first."
  echo "  See docs/SECURITY_MODEL.md §3 for the signer-set checklist."
  exit 1
fi

if [[ ! -f "$CURRENT_AUTHORITY_KP" ]]; then
  echo "✗ Current authority keypair file not found: $CURRENT_AUTHORITY_KP"
  echo "  Override with CURRENT_AUTHORITY_KP=/path/to/keypair.json"
  exit 1
fi

# Verify the keypair matches the current on-chain authority
PROGRAM_DATA_AUTHORITY=$("$SOLANA" program show "$PROGRAM_ID" --url "$RPC_URL" 2>&1 | awk -F': +' '/^Authority:/ {print $2}' || true)
CURRENT_KP_PUBKEY=$("$SOLANA" address --keypair "$CURRENT_AUTHORITY_KP")

if [[ -z "$PROGRAM_DATA_AUTHORITY" ]]; then
  echo "✗ Could not read current program authority. Is the program deployed on $NETWORK?"
  exit 1
fi

echo ""
echo "  On-chain authority : $PROGRAM_DATA_AUTHORITY"
echo "  Keypair resolves to: $CURRENT_KP_PUBKEY"

if [[ "$PROGRAM_DATA_AUTHORITY" != "$CURRENT_KP_PUBKEY" ]]; then
  echo "✗ Keypair does not match on-chain authority. Aborting."
  echo "  The keypair at $CURRENT_AUTHORITY_KP is NOT the upgrade authority."
  exit 1
fi

echo "  ✓ Keypair matches on-chain authority."
echo ""

# ── Extra guardrail for mainnet ────────────────────────────────────────

if [[ "$NETWORK" == "mainnet-beta" && "$EXECUTE" == "true" ]]; then
  echo "  ⚠  You are about to transfer authority on MAINNET-BETA."
  echo "  ⚠  This is IRREVERSIBLE without multisig cooperation."
  echo ""
  read -r -p "  Type the full program ID to confirm: " CONFIRM_PROGRAM_ID
  if [[ "$CONFIRM_PROGRAM_ID" != "$PROGRAM_ID" ]]; then
    echo "✗ Confirmation mismatch. Aborting."
    exit 1
  fi
fi

# ── The transfer ───────────────────────────────────────────────────────

TRANSFER_CMD=(
  "$SOLANA" program set-upgrade-authority
  "$PROGRAM_ID"
  --new-upgrade-authority "$SQUADS_VAULT_PDA"
  --upgrade-authority "$CURRENT_AUTHORITY_KP"
  --url "$RPC_URL"
)

# BPF Loader Upgradeable's set-upgrade-authority requires the NEW authority
# to co-sign unless --skip-new-upgrade-authority-signer-check is passed.
# Squads vault PDAs CANNOT sign directly — this flag is required.
TRANSFER_CMD+=( --skip-new-upgrade-authority-signer-check )

echo "  Command:"
printf "    %s \\\\\n" "${TRANSFER_CMD[@]:0:1}"
for arg in "${TRANSFER_CMD[@]:1}"; do printf "      %s \\\\\n" "$arg"; done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "  DRY-RUN: not executing. Re-run with --execute to send the transaction."
  exit 0
fi

echo "  Executing in 5 seconds... (Ctrl-C to abort)"
for i in 5 4 3 2 1; do printf "    %d..." "$i"; sleep 1; done
echo ""
echo ""

TX_SIG=$("${TRANSFER_CMD[@]}" 2>&1 | tee /dev/tty | awk '/Signature:/ {print $2}')

if [[ -z "$TX_SIG" ]]; then
  echo ""
  echo "✗ Transfer did not produce a signature. Check the output above."
  exit 1
fi

# ── Post-transfer verification ─────────────────────────────────────────

echo ""
echo "  ✓ Transaction signature: $TX_SIG"
echo "  Verifying on-chain..."

sleep 3
NEW_AUTHORITY=$("$SOLANA" program show "$PROGRAM_ID" --url "$RPC_URL" | awk -F': +' '/^Authority:/ {print $2}')

if [[ "$NEW_AUTHORITY" == "$SQUADS_VAULT_PDA" ]]; then
  echo "  ✓ New authority confirmed: $NEW_AUTHORITY"
else
  echo "✗ On-chain authority is $NEW_AUTHORITY, expected $SQUADS_VAULT_PDA"
  echo "  Transfer may have silently failed. Investigate immediately."
  exit 1
fi

# ── Write to upgrade log ──────────────────────────────────────────────

LOG_FILE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/docs/program-upgrade-log.md"
mkdir -p "$(dirname "$LOG_FILE")"
{
  echo ""
  echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — authority transfer"
  echo "- Network: $NETWORK"
  echo "- Program ID: $PROGRAM_ID"
  echo "- Previous authority: $CURRENT_KP_PUBKEY"
  echo "- New authority (Squads vault): $SQUADS_VAULT_PDA"
  echo "- Transaction: $TX_SIG"
  echo "- Operator: $(whoami)@$(hostname -s)"
  echo "- Audit finding closed: C-01"
} >> "$LOG_FILE"

echo ""
echo "  ✓ Appended to $LOG_FILE"
echo ""
echo "  Next steps:"
echo "    1. Commit docs/program-upgrade-log.md with the new entry."
echo "    2. Update docs/SECURITY_MODEL.md §1 Authority Inventory."
echo "    3. Update docs/remediation-log.md — close C-01 with this tx sig."
echo "    4. Archive $CURRENT_AUTHORITY_KP to cold storage (no longer authoritative)."
echo ""
