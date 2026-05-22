const https = require('https');

const PIMLICO_KEY = "pim_c9cJf16BNp3RT71QvvB9Xe";
const BADGE_NFT = "0xc61105160182bB0292753a5020F23ae79054F2fb";
// Smart Account address from logs
const SMART_ACCOUNT = "0x9b07b2277A0225dDB9B306FE9A08a031d05a60a2";
const MUSD_ADDRESS = "0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2";

function callRpc(hostname, path, method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const req = https.request({
      hostname, port: 443, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function ethCall(to, data) {
  return callRpc('ethereum-sepolia-rpc.publicnode.com', '/', 'eth_call', [{ to, data }, 'latest']);
}

async function main() {
  // Check hasClaimed for the Smart Account
  const hasClaimedData = '0x94b94a19' + SMART_ACCOUNT.slice(2).padStart(64, '0');
  const hasClaimed = await ethCall(BADGE_NFT, hasClaimedData);
  console.log('hasClaimed for Smart Account:', hasClaimed.result === '0x0000000000000000000000000000000000000000000000000000000000000001' ? 'YES - already claimed!' : 'NO - not yet claimed');

  // Check MUSD balance of Smart Account
  const balanceData = '0x70a08231' + SMART_ACCOUNT.slice(2).padStart(64, '0');
  const balance = await ethCall(MUSD_ADDRESS, balanceData);
  const balanceBN = BigInt(balance.result || '0x0');
  console.log('Smart Account MUSD balance:', (balanceBN / BigInt(10**18)).toString(), 'MUSD');

  // Check total supply of Badge NFT
  const totalSupplyData = '0x18160ddd';
  const totalSupply = await ethCall(BADGE_NFT, totalSupplyData);
  console.log('Total badges minted:', BigInt(totalSupply.result || '0x0').toString());
}

main().catch(console.error);
