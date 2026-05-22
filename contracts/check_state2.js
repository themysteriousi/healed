import hre from "hardhat";

const BADGE_NFT = "0xc61105160182bB0292753a5020F23ae79054F2fb";
const MUSD_ADDRESS = "0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2";
const SMART_ACCOUNT = "0x9b07b2277A0225dDB9B306FE9A08a031d05a60a2";

async function main() {
  const BadgeNFT = await hre.ethers.getContractAt("BadgeNFT", BADGE_NFT);
  const MockUSD = await hre.ethers.getContractAt("MockUSD", MUSD_ADDRESS);

  const hasClaimed = await BadgeNFT.hasClaimed(SMART_ACCOUNT);
  const musdBalance = await MockUSD.balanceOf(SMART_ACCOUNT);
  const totalSupply = await BadgeNFT.totalSupply();

  console.log("=== Smart Account State ===");
  console.log("Address:", SMART_ACCOUNT);
  console.log("hasClaimed:", hasClaimed);
  console.log("MUSD Balance:", hre.ethers.formatUnits(musdBalance, 18));
  console.log("Total Badges Minted:", totalSupply.toString());

  if (hasClaimed) {
    // Find the token owned by the smart account
    for (let i = 1; i <= Number(totalSupply); i++) {
      try {
        const owner = await BadgeNFT.ownerOf(i);
        if (owner.toLowerCase() === SMART_ACCOUNT.toLowerCase()) {
          console.log(`✅ Smart Account owns Badge Token ID #${i}`);
        }
      } catch(e) {}
    }
  }
}

main().catch(console.error);
