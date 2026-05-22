import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

const MUSD_ADDRESS = "0x5979BC7ab248ef93d2aEF12eB40961ec0ee06FD2";
const USER_ADDRESS = "0xd05D0C5DeEafbC24a58b40D158c2E6CE9cC67fC8";

const abi = [
    "function balanceOf(address owner) view returns (uint256)"
];

const contract = new ethers.Contract(MUSD_ADDRESS, abi, provider);

async function main() {
    const balance = await contract.balanceOf(USER_ADDRESS);
    console.log("MUSD Balance:", ethers.formatUnits(balance, 18));
}
main();
