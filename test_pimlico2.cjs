const https = require('https');
const PIMLICO_KEY = "pim_c9cJf16BNp3RT71QvvB9Xe";

function testEndpoint(method, params) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: params
    });

    const options = {
      hostname: 'api.pimlico.io',
      port: 443,
      path: `/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(`[${method}] ${body}`));
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  console.log(await testEndpoint("eth_estimateUserOperationGas", [{
    sender: "0x0000000000000000000000000000000000000000",
    nonce: "0x0",
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0x0",
    verificationGasLimit: "0x0",
    preVerificationGas: "0x0",
    maxFeePerGas: "0x0",
    maxPriorityFeePerGas: "0x0",
    paymasterAndData: "0x",
    signature: "0x"
  }, "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"]));
}
run();
