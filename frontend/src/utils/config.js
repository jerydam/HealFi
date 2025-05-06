import { ethers } from "ethers";

const validateContractAddress = (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
  return address;
};

export const CONTRACTS = {
  LISK_SEPOLIA: {
    ContriboostFactory: validateContractAddress("0xB5d3e4080dF612d33E78A523c9F4d3362ee2EC48"),
    GoalFundFactory: validateContractAddress("0x68fF2794A087da4B0A5247e9693eC4290D8eaE99"),
    USDT: validateContractAddress("0x52Aee1645CA343515D12b6bd6FE24c026274e91D"),
  }
};

export const SUPPORTED_CHAINS = {
  4202: {
    chainName: "Lisk Sepolia Testnet",
    nativeCurrency: { name: "Lisk Sepolia ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia-api.lisk.com"],
    blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
  }
};