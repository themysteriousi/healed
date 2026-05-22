const hre = require("hardhat");

async function main() {
  const MUSD_ADDRESS = "0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2";
  const USER_ADDRESS = "0xd05D0C5DeEafbC24a58b40D158c2E6CE9cC67fC8";

  const MockUSD = await hre.ethers.getContractAt("MockUSD", MUSD_ADDRESS);
  const balance = await MockUSD.balanceOf(USER_ADDRESS);
  console.log("Actual MUSD Balance on Sepolia:", hre.ethers.formatUnits(balance, 18));
}

main().catch(console.error);
