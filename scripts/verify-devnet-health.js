/**
 * One-shot devnet health check for Limer's Capital's on-chain footprint.
 * Run: `node scripts/verify-devnet-health.js`
 *
 * Verifies that every address the flagship reads (limer program, limer_amm
 * program, mTTDC mint, mock TTSE mints, AMM config PDA, AMM pools, faucet
 * keypair) actually exists on Solana devnet. Intended to run in CI or
 * after a redeploy.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import mockTtdc from '../src/solana/generated/mock-ttdc.json' with { type: 'json' };
import mockStocks from '../src/solana/generated/mock-stocks.json' with { type: 'json' };
import ammConfig from '../src/solana/generated/amm-config.json' with { type: 'json' };
import ammPools from '../src/solana/generated/amm-pools.json' with { type: 'json' };
import faucet from '../src/solana/generated/faucet.json' with { type: 'json' };

const DEVNET_RPC = process.env.VITE_SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com';
const LIMER_PROGRAM = 'HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk';

const conn = new Connection(DEVNET_RPC, 'confirmed');

async function checkAccount(label, addressStr, { executableExpected = false } = {}) {
  try {
    const info = await conn.getAccountInfo(new PublicKey(addressStr));
    if (!info) return { label, address: addressStr, status: 'MISSING' };
    const ok = executableExpected ? info.executable : true;
    return {
      label,
      address: addressStr,
      status: ok ? 'OK' : 'NON_EXECUTABLE',
      owner: info.owner.toBase58(),
      lamports: info.lamports,
      dataLen: info.data.length,
    };
  } catch (err) {
    return { label, address: addressStr, status: 'ERROR', error: err.message };
  }
}

async function main() {
  console.log(`\nLimer's Capital — devnet health check`);
  console.log(`RPC: ${DEVNET_RPC}\n`);

  const checks = [];
  checks.push(await checkAccount('limer program', LIMER_PROGRAM, { executableExpected: true }));
  checks.push(await checkAccount('limer_amm program', ammConfig.programId, { executableExpected: true }));
  checks.push(await checkAccount('AMM config PDA', ammConfig.ammConfig));
  checks.push(await checkAccount('mTTDC mint', mockTtdc.mint));
  checks.push(await checkAccount('faucet keypair', faucet.faucetPubkey));
  checks.push(await checkAccount('faucet mTTDC ATA', faucet.faucetAta));

  for (const stock of mockStocks) {
    checks.push(await checkAccount(`${stock.symbol} mint`, stock.mint));
  }
  for (const pool of ammPools) {
    checks.push(await checkAccount(`pool ${pool.pairLabel}`, pool.pool));
  }

  let ok = 0, bad = 0;
  for (const c of checks) {
    const icon = c.status === 'OK' ? '✓' : '✗';
    const detail = c.status === 'OK'
      ? `(${c.dataLen} bytes · ${(c.lamports / 1e9).toFixed(4)} SOL)`
      : `— ${c.status}${c.error ? `: ${c.error}` : ''}`;
    console.log(`  ${icon} ${c.label.padEnd(24)} ${c.address.slice(0, 10)}… ${detail}`);
    c.status === 'OK' ? ok++ : bad++;
  }

  console.log(`\n${ok}/${checks.length} accounts reachable${bad ? ` — ${bad} failing.` : ' — all healthy.'}`);
  process.exit(bad > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('verification failed:', err);
  process.exit(2);
});
