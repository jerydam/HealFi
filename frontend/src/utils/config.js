import { CONTRACT_ADDRESSES } from "@/lib/contract";

// botchain network definitions. testnet is the default target; mainnet is here so
// switching networks is a one-line change to ACTIVE_CHAIN_ID.
export const BOTCHAIN_TESTNET = {
  id: 968,
  chainName: "botchain Testnet",
  nativeCurrency: { name: "botchain", symbol: "botchain", decimals: 18 },
  rpcUrls: ["https://rpc.bohr.life"],
  blockExplorerName: "botchain testnet Explorer",
  blockExplorerUrls: ["https://scan.bohr.life"],
  testnet: true,
};

export const BOTCHAIN_MAINNET = {
  id: 677,
  chainName: "botchain",
  nativeCurrency: { name: "botchain", symbol: "botchain", decimals: 18 },
  rpcUrls: ["https://rpc.botchain.ai"],
  blockExplorerName: "botchain Explorer",
  blockExplorerUrls: ["https://scan.botchain.ai"],
  testnet: false,
};

export const SUPPORTED_CHAINS = {
  [BOTCHAIN_TESTNET.id]: BOTCHAIN_TESTNET,
  [BOTCHAIN_MAINNET.id]: BOTCHAIN_MAINNET,
};

export const ACTIVE_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || BOTCHAIN_TESTNET.id
);

export const ACTIVE_CHAIN = SUPPORTED_CHAINS[ACTIVE_CHAIN_ID] || BOTCHAIN_TESTNET;

export const CONTRACTS = CONTRACT_ADDRESSES;

export const getExplorerTxUrl = (txHash) =>
  `${ACTIVE_CHAIN.blockExplorerUrls[0]}/tx/${txHash}`;

export const getExplorerAddressUrl = (address) =>
  `${ACTIVE_CHAIN.blockExplorerUrls[0]}/address/${address}`;
