import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";

const PIMLICO_RPC = `https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_c9cJf16BNp3RT71QvvB9Xe`;

const pimlicoClient = createPimlicoClient({
  transport: http(PIMLICO_RPC),
  entryPoint: { address: entryPoint07Address, version: "0.7" },
});

async function run() {
  const prices = await pimlicoClient.getUserOperationGasPrice();
  console.log(prices);
}
run();
