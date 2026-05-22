import hre from "hardhat";
import "dotenv/config";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance on current network:", hre.ethers.formatEther(balance), "ETH");
}

main().catch(console.error);
