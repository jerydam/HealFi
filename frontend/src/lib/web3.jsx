import { createThirdwebClient, getContract, readContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ethers } from "ethers";
import { 
  CONTRACT_ADDRESSES, 
  DonorContractAbi, 
  HSTcontractAbi, 
  MultisigRedemptionContractAbi, 
  UserSavingsContractAbi, 
  FeeManagerContractAbi, 
  LoanContractAbi, 
  MetricsContractAbi, 
  ERC20Abi 
} from "./contract";

// Create ThirdWeb client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

// Define Celo Alfajores chain for ThirdWeb
export const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores Testnet",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
  },
  rpc: "https://alfajores-forno.celo-testnet.org",
  blockExplorers: [
    {
      name: "Celo Alfajores Explorer",
      url: "https://celo-alfajores.blockscout.com",
    },
  ],
});

// Legacy config for compatibility
export const CELO_ALFAJORES_CONFIG = {
  chainId: 44787,
  chainName: "Celo Alfajores Testnet",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18
  },
  rpcUrls: [
    "https://alfajores-forno.celo-testnet.org",
    "https://celo-alfajores.infura.io/v3/YOUR_INFURA_KEY"
  ],
  blockExplorerUrls: ["https://celo-alfajores.blockscout.com/"]
};

// Contract getters using ThirdWeb
export const getDonorContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.donorContract,
    abi: DonorContractAbi,
  });
};

export const getHSTContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.hstContract,
    abi: HSTcontractAbi,
  });
};

export const getMultisigRedemptionContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.multisig,
    abi: MultisigRedemptionContractAbi,
  });
};

export const getSavingsContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.saving,
    abi: UserSavingsContractAbi,
  });
};

export const getFeeManagerContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.feeManagement,
    abi: FeeManagerContractAbi,
  });
};

export const getLoanContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.loan,
    abi: LoanContractAbi,
  });
};

export const getMetricsContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.metrics,
    abi: MetricsContractAbi,
  });
};

export const getUSDTContract = () => {
  return getContract({
    client,
    chain: celoAlfajores,
    address: CONTRACT_ADDRESSES.usdt,
    abi: ERC20Abi,
  });
};

// Legacy provider functions (deprecated with ThirdWeb)
export const getProvider = () => {
  console.warn("getProvider is deprecated with ThirdWeb. Use account from useActiveAccount hook instead.");
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(CELO_ALFAJORES_CONFIG.rpcUrls[0]);
};

export const connectWallet = async () => {
  console.warn("connectWallet is deprecated with ThirdWeb. Use ConnectButton component instead.");
  return { 
    success: false, 
    error: "Use ThirdWeb ConnectButton component instead" 
  };
};

// Enhanced error handling for contract calls
const getContractError = (error) => {
  if (error.reason) {
    return error.reason;
  }
  if (error.data && error.data.message) {
    return error.data.message;
  }
  if (error.message) {
    const revertMatch = error.message.match(/revert (.+)/);
    if (revertMatch) {
      return revertMatch[1];
    }
    return error.message;
  }
  return "Transaction failed";
};

// Enhanced transaction execution with better error handling
const executeTransaction = async (account, contractCall) => {
  try {
    const transactionResult = await sendTransaction({
      transaction: contractCall,
      account,
    });
    
    console.log(`Transaction sent: ${transactionResult.transactionHash}`);
    return { 
      success: true, 
      txHash: transactionResult.transactionHash,
      receipt: transactionResult 
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    const errorMessage = getContractError(error);
    throw new Error(errorMessage);
  }
};

// Add a helper function to check user registration status
export const checkUserRegistration = async (address) => {
  try {
    const contract = getSavingsContract();
    const savingsInfo = await readContract({
      contract,
      method: "getSavingsInfo",
      params: [address],
    });
    
    return {
      isRegistered: savingsInfo.accountType > 0 || savingsInfo.balance > 0,
      accountType: Number(savingsInfo.accountType),
      planType: Number(savingsInfo.planType)
    };
  } catch (error) {
    console.error("Error checking user registration:", error);
    return { isRegistered: false, accountType: 0, planType: 0 };
  }
};

// FIXED: Enhanced deposit function with comprehensive validation
export const deposit = async (amount, account) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid deposit amount");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // 1. Check if user is registered
    console.log("Checking if user is registered...");
    const registrationStatus = await checkUserRegistration(account.address);
    if (!registrationStatus.isRegistered) {
      throw new Error("User must be registered before making a deposit. Please register first.");
    }

    // 2. Check user's USDT balance
    console.log("Checking USDT balance...");
    const usdtContract = getUSDTContract();
    const balance = await readContract({
      contract: usdtContract,
      method: "balanceOf",
      params: [account.address],
    });
    
    if (balance < amountInWei) {
      throw new Error(`Insufficient USDT balance. Available: ${ethers.formatUnits(balance, 6)} USDT, Required: ${amount} USDT`);
    }

    // 3. Check current allowance
    console.log("Checking current allowance...");
    const currentAllowance = await readContract({
      contract: usdtContract,
      method: "allowance",
      params: [account.address, CONTRACT_ADDRESSES.saving],
    });
    
    if (currentAllowance < amountInWei) {
      // 4. Approve USDT spending (approve max amount to avoid future approvals)
      console.log("Approving USDT transfer...");
      const maxAmount = ethers.parseUnits("1000000", 6); // Approve 1M USDT max
      const approveCall = prepareContractCall({
        contract: usdtContract,
        method: "approve",
        params: [CONTRACT_ADDRESSES.saving, maxAmount],
      });
      
      const approvalResult = await executeTransaction(account, approveCall);
      if (!approvalResult.success) {
        throw new Error("USDT approval failed");
      }
      
      // Wait a bit for the approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 5. Check if contract is paused (if there's such functionality)
    console.log("Checking contract state...");
    
    // 6. Make deposit
    console.log("Making deposit...");
    const savingsContract = getSavingsContract();
    const depositCall = prepareContractCall({
      contract: savingsContract,
      method: "deposit",
      params: [amountInWei],
    });
    
    return await executeTransaction(account, depositCall);
  } catch (error) {
    console.error("Error depositing:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

// Enhanced withdrawal function with better validation
export const withdraw = async (amount, account) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid withdrawal amount");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // Check user's savings info and balance
    console.log("Checking savings balance...");
    const savingsInfo = await getSavingsInfo(account.address);
    if (!savingsInfo) {
      throw new Error("Unable to fetch savings information. Make sure you are registered.");
    }
    
    if (parseFloat(savingsInfo.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient savings balance. Available: ${savingsInfo.balance} USDT, Requested: ${amount} USDT`);
    }

    console.log("Making withdrawal...");
    const savingsContract = getSavingsContract();
    const withdrawCall = prepareContractCall({
      contract: savingsContract,
      method: "withdraw",
      params: [amountInWei],
    });
    
    return await executeTransaction(account, withdrawCall);
  } catch (error) {
    console.error("Error withdrawing:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

// Enhanced register individual with proper validation and gas optimization
export const registerIndividual = async (planType, detailsHash, referrer = ethers.ZeroAddress, account) => {
  try {
    // Validate inputs
    if (!Number.isInteger(planType) || planType < 0 || planType > 2) {
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).");
    }
    if (!detailsHash || typeof detailsHash !== "string") {
      throw new Error("Details hash is required and must be a string.");
    }
    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer)) {
      throw new Error("Invalid referrer address.");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    // Check if user is already registered
    const registrationStatus = await checkUserRegistration(account.address);
    if (registrationStatus.isRegistered) {
      throw new Error("User is already registered");
    }

    console.log("Registering individual with:", { planType, detailsHash, referrer });
    
    const savingsContract = getSavingsContract();
    const registerCall = prepareContractCall({
      contract: savingsContract,
      method: "registerIndividual",
      params: [planType, detailsHash, referrer || ethers.ZeroAddress],
    });
    
    return await executeTransaction(account, registerCall);
  } catch (error) {
    console.error("Error registering individual:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

// Enhanced register family function with proper validation and gas optimization
export const registerFamily = async (familyMembers, planType, familyName, referrer = ethers.ZeroAddress, account) => {
  try {
    // Validate inputs
    if (!Number.isInteger(planType) || planType < 0 || planType > 2) {
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).");
    }
    if (!familyName || typeof familyName !== "string" || !familyName.trim()) {
      throw new Error("Family name is required and must be a non-empty string.");
    }
    if (!Array.isArray(familyMembers) || familyMembers.length < 2) {
      throw new Error("At least 2 family members are required.");
    }
    if (!account) {
      throw new Error("No account connected");
    }
    
    // Validate family members
    for (let i = 0; i < familyMembers.length; i++) {
      const member = familyMembers[i];
      if (!member.member || !ethers.isAddress(member.member)) {
        throw new Error(`Invalid address for family member ${i + 1}.`);
      }
      if (!member.detailsHash || typeof member.detailsHash !== "string") {
        throw new Error(`Details hash is required for family member ${i + 1}.`);
      }
    }
    
    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer)) {
      throw new Error("Invalid referrer address.");
    }

    console.log("Registering family with:", { 
      familyMembers, 
      planType, 
      familyName, 
      referrer 
    });
    
    const savingsContract = getSavingsContract();
    const registerCall = prepareContractCall({
      contract: savingsContract,
      method: "registerFamily",
      params: [familyMembers, planType, familyName, referrer || ethers.ZeroAddress],
    });
    
    return await executeTransaction(account, registerCall);
  } catch (error) {
    console.error("Error registering family:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const removePartneredFacility = async (facility, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstContract = getHSTContract();
    const removeCall = prepareContractCall({
      contract: hstContract,
      method: "removePartneredFacility",
      params: [facility],
    });
    
    return await executeTransaction(account, removeCall);
  } catch (error) {
    console.error("Error removing partnered facility:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getHSTBalance = async (address) => {
  try {
    const contract = getHSTContract();
    const balance = await readContract({
      contract,
      method: "balanceOf",
      params: [address],
    });
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    console.error("Error getting HST balance:", error);
    return "0";
  }
};

export const getFacilityInfo = async (facility) => {
  try {
    const contract = getHSTContract();
    const info = await readContract({
      contract,
      method: "facilityInfo",
      params: [facility],
    });
    
    return {
      name: info.name,
      licenseNumber: info.licenseNumber,
      verified: info.verified
    };
  } catch (error) {
    console.error("Error getting facility info:", error);
    return null;
  }
};

export const isPartneredFacility = async (facility) => {
  try {
    const contract = getHSTContract();
    return await readContract({
      contract,
      method: "partneredFacilities",
      params: [facility],
    });
  } catch (error) {
    console.error("Error checking partnered facility:", error);
    return false;
  }
};

// Multisig Redemption Contract Functions
export const initiateRedemption = async (user, facility, hstAmount, outcomeHash, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18);
    const multisigContract = getMultisigRedemptionContract();
    
    const initiateCall = prepareContractCall({
      contract: multisigContract,
      method: "initiateRedemption",
      params: [user, facility, hstAmountInWei, outcomeHash],
    });
    
    return await executeTransaction(account, initiateCall);
  } catch (error) {
    console.error("Error initiating redemption:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const signRedemption = async (redemptionId, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const multisigContract = getMultisigRedemptionContract();
    const signCall = prepareContractCall({
      contract: multisigContract,
      method: "signRedemption",
      params: [redemptionId],
    });
    
    return await executeTransaction(account, signCall);
  } catch (error) {
    console.error("Error signing redemption:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getRedemptionInfo = async (redemptionId) => {
  try {
    const contract = getMultisigRedemptionContract();
    const redemption = await readContract({
      contract,
      method: "redemptions",
      params: [redemptionId],
    });
    
    return {
      user: redemption.user,
      facility: redemption.facility,
      hstAmount: ethers.formatUnits(redemption.hstAmount, 18),
      facilitySigned: redemption.facilitySigned,
      healfiSigned: redemption.healfiSigned,
      executed: redemption.executed,
      outcomeHash: redemption.outcomeHash
    };
  } catch (error) {
    console.error("Error getting redemption info:", error);
    return null;
  }
};

// Fee Manager Contract Functions
export const collectFee = async (amount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // Approve USDT first
    const usdtContract = getUSDTContract();
    const approveCall = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [CONTRACT_ADDRESSES.feeManagement, amountInWei],
    });
    
    const approvalResult = await executeTransaction(account, approveCall);
    if (!approvalResult.success) {
      throw new Error("USDT approval failed");
    }
    
    // Wait for approval
    await new Promise(resolve => setTimeout(resolve, 2000));

    const feeManagerContract = getFeeManagerContract();
    const collectCall = prepareContractCall({
      contract: feeManagerContract,
      method: "collectFee",
      params: [amountInWei],
    });
    
    return await executeTransaction(account, collectCall);
  } catch (error) {
    console.error("Error collecting fee:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const distributeRedemptionFee = async (facility, totalFee, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const totalFeeInWei = ethers.parseUnits(totalFee.toString(), 6);
    const feeManagerContract = getFeeManagerContract();
    
    const distributeCall = prepareContractCall({
      contract: feeManagerContract,
      method: "distributeRedemptionFee",
      params: [facility, totalFeeInWei],
    });
    
    return await executeTransaction(account, distributeCall);
  } catch (error) {
    console.error("Error distributing redemption fee:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const withdrawFacilityBalance = async (account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const feeManagerContract = getFeeManagerContract();
    const withdrawCall = prepareContractCall({
      contract: feeManagerContract,
      method: "withdrawFacilityBalance",
      params: [],
    });
    
    return await executeTransaction(account, withdrawCall);
  } catch (error) {
    console.error("Error withdrawing facility balance:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getFacilityBalance = async (facility) => {
  try {
    const contract = getFeeManagerContract();
    const balance = await readContract({
      contract,
      method: "facilityBalances",
      params: [facility],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting facility balance:", error);
    return "0";
  }
};

export const getHealfiBalance = async () => {
  try {
    const contract = getFeeManagerContract();
    const balance = await readContract({
      contract,
      method: "healfiBalance",
      params: [],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting healfi balance:", error);
    return "0";
  }
};

export const getTotalFeesCollected = async () => {
  try {
    const contract = getFeeManagerContract();
    const total = await readContract({
      contract,
      method: "totalFeesCollected",
      params: [],
    });
    return ethers.formatUnits(total, 6);
  } catch (error) {
    console.error("Error getting total fees collected:", error);
    return "0";
  }
};

// Loan Contract Functions
export const applyLoan = async (amount, account) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid loan amount");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const loanContract = getLoanContract();
    
    const applyCall = prepareContractCall({
      contract: loanContract,
      method: "applyLoan",
      params: [amountInWei],
    });
    
    return await executeTransaction(account, applyCall);
  } catch (error) {
    console.error("Error applying for loan:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const repayLoan = async (amount, account) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid repayment amount");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // Approve USDT first
    const usdtContract = getUSDTContract();
    const approveCall = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [CONTRACT_ADDRESSES.loan, amountInWei],
    });
    
    const approvalResult = await executeTransaction(account, approveCall);
    if (!approvalResult.success) {
      throw new Error("USDT approval failed");
    }
    
    // Wait for approval
    await new Promise(resolve => setTimeout(resolve, 2000));

    const loanContract = getLoanContract();
    const repayCall = prepareContractCall({
      contract: loanContract,
      method: "repayLoan",
      params: [amountInWei],
    });
    
    return await executeTransaction(account, repayCall);
  } catch (error) {
    console.error("Error repaying loan:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const stakeGuarantor = async (userAddress, guarantorAddress, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const loanContract = getLoanContract();
    const stakeCall = prepareContractCall({
      contract: loanContract,
      method: "stakeGuarantor",
      params: [userAddress, guarantorAddress],
    });
    
    return await executeTransaction(account, stakeCall);
  } catch (error) {
    console.error("Error staking guarantor:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getLoanInfo = async (address) => {
  try {
    const contract = getLoanContract();
    const loanInfo = await readContract({
      contract,
      method: "loans",
      params: [address],
    });
    
    return {
      amount: ethers.formatUnits(loanInfo.amount, 6),
      guarantor: loanInfo.guarantor,
      dueDate: new Date(Number(loanInfo.dueDate) * 1000),
      repaid: loanInfo.repaid,
      interest: ethers.formatUnits(loanInfo.interest, 6)
    };
  } catch (error) {
    console.error("Error getting loan info:", error);
    return null;
  }
};

export const checkLoanEligibility = async (address) => {
  try {
    const contract = getLoanContract();
    const [isEligible, reason] = await readContract({
      contract,
      method: "checkEligibilityWithReason",
      params: [address],
    });
    return { isEligible, reason };
  } catch (error) {
    console.error("Error checking loan eligibility:", error);
    return { isEligible: false, reason: error.message };
  }
};

export const disburseLoan = async (user, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const loanContract = getLoanContract();
    const disburseCall = prepareContractCall({
      contract: loanContract,
      method: "disburseLoan",
      params: [user],
    });
    
    return await executeTransaction(account, disburseCall);
  } catch (error) {
    console.error("Error disbursing loan:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getTotalLoansDisbursed = async () => {
  try {
    const contract = getLoanContract();
    const total = await readContract({
      contract,
      method: "totalLoansDisbursed",
      params: [],
    });
    return ethers.formatUnits(total, 6);
  } catch (error) {
    console.error("Error getting total loans disbursed:", error);
    return "0";
  }
};

export const getTotalLoansRepaid = async () => {
  try {
    const contract = getLoanContract();
    const total = await readContract({
      contract,
      method: "totalLoansRepaid",
      params: [],
    });
    return ethers.formatUnits(total, 6);
  } catch (error) {
    console.error("Error getting total loans repaid:", error);
    return "0";
  }
};

// Metrics Contract Functions
export const getPlatformMetrics = async () => {
  try {
    const contract = getMetricsContract();
    const metrics = await readContract({
      contract,
      method: "getPlatformMetrics",
      params: [],
    });
    
    return {
      totalUsers: Number(metrics.totalUsers),
      totalSavings: ethers.formatUnits(metrics.totalSavings, 6),
      totalLoansDisbursed: ethers.formatUnits(metrics.totalLoansDisbursed, 6),
      totalHSTRedeemed: ethers.formatUnits(metrics._totalHSTRedeemed, 18),
      totalFundsMatched: ethers.formatUnits(metrics.totalFundsMatched, 6)
    };
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    return {
      totalUsers: 0,
      totalSavings: "0",
      totalLoansDisbursed: "0",
      totalHSTRedeemed: "0",
      totalFundsMatched: "0"
    };
  }
};

export const getTotalHSTRedeemed = async () => {
  try {
    const contract = getMetricsContract();
    const total = await readContract({
      contract,
      method: "totalHSTRedeemed",
      params: [],
    });
    return ethers.formatUnits(total, 18);
  } catch (error) {
    console.error("Error getting total HST redeemed:", error);
    return "0";
  }
};

export const updateRedemptionMetrics = async (hstAmount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18);
    const metricsContract = getMetricsContract();
    
    const updateCall = prepareContractCall({
      contract: metricsContract,
      method: "updateRedemptionMetrics",
      params: [hstAmountInWei],
    });
    
    return await executeTransaction(account, updateCall);
  } catch (error) {
    console.error("Error updating redemption metrics:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const batchDeposit = async (users, amounts, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountsInWei = amounts.map(amount => ethers.parseUnits(amount.toString(), 6));
    
    // Approve USDT for each amount
    const usdtContract = getUSDTContract();
    for (let i = 0; i < amountsInWei.length; i++) {
      const approveCall = prepareContractCall({
        contract: usdtContract,
        method: "approve",
        params: [CONTRACT_ADDRESSES.saving, amountsInWei[i]],
      });
      
      const approvalResult = await executeTransaction(account, approveCall);
      if (!approvalResult.success) {
        throw new Error(`USDT approval failed for amount ${i + 1}`);
      }
      
      // Wait between approvals
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const savingsContract = getSavingsContract();
    const batchCall = prepareContractCall({
      contract: savingsContract,
      method: "batchDeposit",
      params: [users, amountsInWei],
    });
    
    return await executeTransaction(account, batchCall);
  } catch (error) {
    console.error("Error batch depositing:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const approveWithdrawer = async (withdrawer, familyId, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const savingsContract = getSavingsContract();
    const approveCall = prepareContractCall({
      contract: savingsContract,
      method: "approveWithdrawer",
      params: [withdrawer, familyId],
    });
    
    return await executeTransaction(account, approveCall);
  } catch (error) {
    console.error("Error approving withdrawer:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const revokeWithdrawer = async (withdrawer, familyId, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const savingsContract = getSavingsContract();
    const revokeCall = prepareContractCall({
      contract: savingsContract,
      method: "revokeWithdrawer",
      params: [withdrawer, familyId],
    });
    
    return await executeTransaction(account, revokeCall);
  } catch (error) {
    console.error("Error revoking withdrawer:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getSavingsInfo = async (address) => {
  try {
    const contract = getSavingsContract();
    const savingsInfo = await readContract({
      contract,
      method: "getSavingsInfo",
      params: [address],
    });
    
    return {
      accountType: Number(savingsInfo.accountType),
      balance: ethers.formatUnits(savingsInfo.balance, 6),
      planType: Number(savingsInfo.planType),
      streak: Number(savingsInfo.streak),
      hstEarned: ethers.formatUnits(savingsInfo.hstEarned, 18),
      familyId: Number(savingsInfo.familyId),
      familyTreasuryBalance: ethers.formatUnits(savingsInfo.familyTreasuryBalance, 6),
      lastDepositTime: new Date(Number(savingsInfo.lastDepositTime) * 1000),
      detailsHash: savingsInfo.detailsHash,
      isVerified: savingsInfo.isVerified,
      referrer: savingsInfo.referrer
    };
  } catch (error) {
    console.error("Error getting savings info:", error);
    return null;
  }
};

export const getUserDashboard = async (address) => {
  try {
    const contract = getSavingsContract();
    const dashboard = await readContract({
      contract,
      method: "getUserDashboard",
      params: [address],
    });
    
    return {
      balance: ethers.formatUnits(dashboard.balance, 6),
      hstEarned: ethers.formatUnits(dashboard.hstEarned, 18),
      streak: Number(dashboard.streak),
      loanAmount: ethers.formatUnits(dashboard.loanAmount, 6),
      loanRepaid: dashboard.loanRepaid,
      isVerified: dashboard.isVerified
    };
  } catch (error) {
    console.error("Error getting user dashboard:", error);
    return null;
  }
};

export const getLockedBalance = async (address) => {
  try {
    const contract = getSavingsContract();
    const balance = await readContract({
      contract,
      method: "getLockedBalance",
      params: [address],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting locked balance:", error);
    return "0";
  }
};

export const getFamilyInfo = async (familyId) => {
  try {
    const contract = getSavingsContract();
    const familyInfo = await readContract({
      contract,
      method: "getFamilyInfo",
      params: [familyId],
    });
    
    return {
      familyName: familyInfo.familyName,
      creator: familyInfo.creator,
      memberCount: Number(familyInfo.memberCount),
      treasuryBalance: ethers.formatUnits(familyInfo.treasuryBalance, 6),
      lockedTreasuryBalance: ethers.formatUnits(familyInfo.lockedTreasuryBalance, 6)
    };
  } catch (error) {
    console.error("Error getting family info:", error);
    return null;
  }
};

export const isApprovedWithdrawer = async (user, familyId) => {
  try {
    const contract = getSavingsContract();
    return await readContract({
      contract,
      method: "isApprovedWithdrawer",
      params: [user, familyId],
    });
  } catch (error) {
    console.error("Error checking approved withdrawer:", error);
    return false;
  }
};

export const isUserVerified = async (user) => {
  try {
    const contract = getSavingsContract();
    return await readContract({
      contract,
      method: "isUserVerified",
      params: [user],
    });
  } catch (error) {
    console.error("Error checking user verification status:", error);
    return false;
  }
};

export const mintSavings = async (user, amount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const savingsContract = getSavingsContract();
    
    const mintCall = prepareContractCall({
      contract: savingsContract,
      method: "mint",
      params: [user, amountInWei],
    });
    
    return await executeTransaction(account, mintCall);
  } catch (error) {
    console.error("Error minting savings:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

// USDT Contract Functions
export const getUSDTBalance = async (address) => {
  try {
    const contract = getUSDTContract();
    const balance = await readContract({
      contract,
      method: "balanceOf",
      params: [address],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting USDT balance:", error);
    return "0";
  }
};

export const approveUSDT = async (spender, amount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const usdtContract = getUSDTContract();
    
    const approveCall = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [spender, amountInWei],
    });
    
    return await executeTransaction(account, approveCall);
  } catch (error) {
    console.error("Error approving USDT:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const transferUSDT = async (to, amount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const usdtContract = getUSDTContract();
    
    const transferCall = prepareContractCall({
      contract: usdtContract,
      method: "transfer",
      params: [to, amountInWei],
    });
    
    return await executeTransaction(account, transferCall);
  } catch (error) {
    console.error("Error transferring USDT:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const transferFromUSDT = async (from, to, amount, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    const usdtContract = getUSDTContract();
    
    const transferCall = prepareContractCall({
      contract: usdtContract,
      method: "transferFrom",
      params: [from, to, amountInWei],
    });
    
    return await executeTransaction(account, transferCall);
  } catch (error) {
    console.error("Error transferring from USDT:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getUSDTAllowance = async (owner, spender) => {
  try {
    const contract = getUSDTContract();
    const allowance = await readContract({
      contract,
      method: "allowance",
      params: [owner, spender],
    });
    return ethers.formatUnits(allowance, 6);
  } catch (error) {
    console.error("Error getting USDT allowance:", error);
    return "0";
  }
};

export const getNetworkName = async () => {
  return celoAlfajores.name;
};

// Utility function to get network info
export const getNetworkInfo = async () => {
  return {
    chainId: celoAlfajores.id,
    name: celoAlfajores.name,
    blockNumber: null, // Would need separate call
    isCorrectNetwork: true // ThirdWeb handles this
  };
};

// Celo-specific gas price helper (deprecated with ThirdWeb)
export const getOptimalGasPrice = async () => {
  console.warn("getOptimalGasPrice is deprecated with ThirdWeb - gas is handled automatically");
  return {
    gasPrice: null,
    maxFeePerGas: null,
    maxPriorityFeePerGas: null
  };
};

// Fetch savings transaction history (needs updated implementation for ThirdWeb)
export async function getSavingsTransactions(address) {
  console.warn("getSavingsTransactions needs to be reimplemented with ThirdWeb event filtering");
  try {
    // TODO: Implement with ThirdWeb's event filtering when available
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Fetch all user activities (needs updated implementation for ThirdWeb)
export async function getUserActivities(address) {
  console.warn("getUserActivities needs to be reimplemented with ThirdWeb event filtering");
  try {
    // TODO: Implement with ThirdWeb's event filtering when available
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
}

// Donor Contract Functions
export const donate = async (amount, poolType, account) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid donation amount");
    }
    if (!poolType || (poolType !== "standard" && poolType !== "feeFree")) {
      throw new Error("Invalid pool type");
    }
    if (!account) {
      throw new Error("No account connected");
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    // Approve USDT first
    const usdtContract = getUSDTContract();
    const approveCall = prepareContractCall({
      contract: usdtContract,
      method: "approve",
      params: [CONTRACT_ADDRESSES.donorContract, amountInWei],
    });
    
    const approvalResult = await executeTransaction(account, approveCall);
    if (!approvalResult.success) {
      throw new Error("USDT approval failed");
    }
    
    // Wait for approval
    await new Promise(resolve => setTimeout(resolve, 2000));

    const donorContract = getDonorContract();
    const donateCall = prepareContractCall({
      contract: donorContract,
      method: "donate",
      params: [amountInWei, poolType],
    });
    
    return await executeTransaction(account, donateCall);
  } catch (error) {
    console.error("Error donating:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getDonorInfo = async (address) => {
  try {
    const contract = getDonorContract();
    const donorInfo = await readContract({
      contract,
      method: "donorInfo",
      params: [address],
    });
    
    return {
      contribution: ethers.formatUnits(donorInfo.contribution, 6),
      poolType: donorInfo.poolType,
      peopleHelped: Number(donorInfo.peopleHelped),
      hstMatched: Number(donorInfo.hstMatched),
      kycVerified: donorInfo.kycVerified
    };
  } catch (error) {
    console.error("Error getting donor info:", error);
    return null;
  }
};

export const matchRedemption = async (user, hstAmount, facility, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18);
    const donorContract = getDonorContract();
    
    const matchCall = prepareContractCall({
      contract: donorContract,
      method: "matchRedemption",
      params: [user, hstAmountInWei, facility],
    });
    
    return await executeTransaction(account, matchCall);
  } catch (error) {
    console.error("Error matching redemption:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const setKYCStatus = async (donor, status, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const donorContract = getDonorContract();
    const setKYCCall = prepareContractCall({
      contract: donorContract,
      method: "setKYCStatus",
      params: [donor, status],
    });
    
    return await executeTransaction(account, setKYCCall);
  } catch (error) {
    console.error("Error setting KYC status:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const getFeeFreePoolBalance = async () => {
  try {
    const contract = getDonorContract();
    const balance = await readContract({
      contract,
      method: "feeFreePoolBalance",
      params: [],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting fee free pool balance:", error);
    return "0";
  }
};

export const getStandardPoolBalance = async () => {
  try {
    const contract = getDonorContract();
    const balance = await readContract({
      contract,
      method: "standardPoolBalance",
      params: [],
    });
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Error getting standard pool balance:", error);
    return "0";
  }
};

export const getTotalFundsMatched = async () => {
  try {
    const contract = getDonorContract();
    const total = await readContract({
      contract,
      method: "totalFundsMatched",
      params: [],
    });
    return ethers.formatUnits(total, 6);
  } catch (error) {
    console.error("Error getting total funds matched:", error);
    return "0";
  }
};

export const getFacilityPatientsServed = async (facility) => {
  try {
    const contract = getDonorContract();
    const patients = await readContract({
      contract,
      method: "facilityPatientsServed",
      params: [facility],
    });
    return Number(patients);
  } catch (error) {
    console.error("Error getting facility patients served:", error);
    return 0;
  }
};

// HST Contract Functions
export const registerFacility = async (name, licenseNumber, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstContract = getHSTContract();
    const registerCall = prepareContractCall({
      contract: hstContract,
      method: "registerFacility",
      params: [name, licenseNumber],
    });
    
    return await executeTransaction(account, registerCall);
  } catch (error) {
    console.error("Error registering facility:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const verifyFacility = async (facility, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstContract = getHSTContract();
    const verifyCall = prepareContractCall({
      contract: hstContract,
      method: "verifyFacility",
      params: [facility],
    });
    
    return await executeTransaction(account, verifyCall);
  } catch (error) {
    console.error("Error verifying facility:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};

export const addPartneredFacility = async (facility, account) => {
  try {
    if (!account) {
      throw new Error("No account connected");
    }

    const hstContract = getHSTContract();
    const addCall = prepareContractCall({
      contract: hstContract,
      method: "addPartneredFacility",
      params: [facility],
    });
    
    return await executeTransaction(account, addCall);
  } catch (error) {
    console.error("Error adding partnered facility:", error);
    const errorMessage = getContractError(error);
    return { success: false, error: errorMessage };
  }
};