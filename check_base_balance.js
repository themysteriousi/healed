import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

const MUSD_ADDRESS = "0x27DC1C167AeF232bb1e21073304B526726a8727e";
const USER_ADDRESS = "0xd05D0C5DeEafbC24a58b40D158c2E6CE9cC67fC8";

const abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const contract = new ethers.Contract(MUSD_ADDRESS, abi, provider);

async function main() {
    const balance = await contract.balanceOf(USER_ADDRESS);
    const decimals = await contract.decimals();
    console.log(`MUSD Balance: ${ethers.formatUnits(balance, decimals)}`);
    console.log(`Raw balance: ${balance.toString()} (Decimals: ${decimals})`);
}
main();
