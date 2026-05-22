const https = require('https');

const PIMLICO_KEY = "pim_c9cJf16BNp3RT71QvvB9Xe";
const USER_OP_HASH = "0xebf51c0bfef16f31af7fa78baf9b5d6b916d3b6d6136fa1b1bd55717fb3f3211";

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const req = https.request({
      hostname: 'api.pimlico.io', port: 443,
      path: `/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`,
      method: 'POST',
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

async function main() {
  const result = await rpc('eth_getUserOperationByHash', [USER_OP_HASH]);
  console.log(JSON.stringify(result, null, 2));
}
main();
