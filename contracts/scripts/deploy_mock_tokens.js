import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "Ripple" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "tron", symbol: "TRX", name: "Tron" },
  { id: "the-open-network", symbol: "TON", name: "Toncoin" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "polygon-ecosystem-token", symbol: "POL", name: "Polygon" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu" },
  { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "stellar", symbol: "XLM", name: "Stellar" },
  { id: "monero", symbol: "XMR", name: "Monero" },
  { id: "cosmos", symbol: "ATOM", name: "Cosmos" }
];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying tokens with:", deployer.address);
  console.log("Current balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  const MockToken = await hre.ethers.getContractFactory("MockToken");
  
  const outPath = path.resolve(__dirname, "../../src/config/mockTokens.json");
  let mapping = {};
  
  // Note: We want to overwrite the old mock-named deployments so that the token contracts represent authentic names
  console.log("Starting deployment of authentic named tokens...");

  let nonce = await deployer.getNonce();

  for (const t of TOKENS) {
    console.log(`Deploying ${t.name} (${t.symbol}) with nonce ${nonce}...`);
    try {
      // Pass deployer.address as the relayer argument to MockToken constructor
      const contract = await MockToken.deploy(t.name, t.symbol, 18, deployer.address, { nonce });
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      console.log(`-> Deployed at: ${addr}`);
      mapping[t.id] = {
        address: addr,
        symbol: t.symbol,
        name: t.name,
        decimals: 18
      };
      
      // Save progress immediately
      fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));

      nonce++;
      // Sleep 2 seconds to let the RPC node register the transaction
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Failed to deploy ${t.symbol}:`, err.message);
      // Wait longer and fetch nonce again to resolve any out-of-sync state
      await new Promise(r => setTimeout(r, 5000));
      nonce = await deployer.getNonce();
    }
  }

  console.log("Mapping saved to:", outPath);
  console.log("✅ All tokens processed!");
}

main().catch(console.error);
