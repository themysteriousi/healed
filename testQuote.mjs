import { UGFClient, TYI_USD_PAYMENT_COIN } from "@tychilabs/ugf-testnet-js";
import { ethers, parseUnits } from "ethers";

const MUSD_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const wallet = ethers.Wallet.createRandom().connect(provider);
    const ugf = new UGFClient();
    
    // Login
    await ugf.auth.login(wallet);

    const officialMusdAddress = "0x27DC1C167AeF232bb1e21073304B526726a8727e";
    const musdContract = new ethers.Contract(officialMusdAddress, MUSD_ABI, wallet);
    const amountWei = parseUnits("0.005", 6);
    
    // Test if approve throws a 500
    const txData = await musdContract.approve("0x000000000000000000000000000000000000dEaD", amountWei);

    console.log("Requesting quote...");
    const quote = await ugf.quote.get({
      payment_coin: TYI_USD_PAYMENT_COIN,
      payer_address: await wallet.getAddress(),
      tx_object: JSON.stringify({
        to: txData.to,
        data: txData.data,
        value: "0"
      }),
      dest_chain_id: "84532",
    });
    console.log("Success!", quote);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
