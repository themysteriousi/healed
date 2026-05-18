import hre from "hardhat";
import "dotenv/config";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1. Deploy MockUSD
  console.log("\n[1/2] Deploying MockUSD...");
  const MockUSD = await ethers.getContractFactory("MockUSD");
  const musd = await MockUSD.deploy();
  await musd.waitForDeployment();
  const musdAddress = await musd.getAddress();
  console.log("MockUSD deployed to:", musdAddress);

  // 2. Deploy BadgeNFT
  console.log("\n[2/2] Deploying BadgeNFT...");
  const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
  const badge = await BadgeNFT.deploy(musdAddress);
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("BadgeNFT deployed to:", badgeAddress);

  console.log("\n✅ Deployment complete!");
  console.log("───────────────────────────────────");
  console.log(`VITE_MUSD_ADDRESS=${musdAddress}`);
  console.log(`VITE_BADGE_NFT_ADDRESS=${badgeAddress}`);
  console.log("───────────────────────────────────");
  console.log("Copy those lines into your frontend .env file");

  // Optional BaseScan verification
  if (process.env.BASESCAN_API_KEY) {
    console.log("\nVerifying on BaseScan...");
    try {
      await hre.run("verify:verify", { address: musdAddress, constructorArguments: [] });
      await hre.run("verify:verify", { address: badgeAddress, constructorArguments: [musdAddress] });
      console.log("✅ Verified");
    } catch (e) {
      console.warn("Verification skipped:", e.message);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
