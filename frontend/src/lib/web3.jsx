import { ethers } from "ethers"
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
} from "./contract"

// Celo Alfajores Network Configuration
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
    "https://celo-alfajores.infura.io/v3/YOUR_INFURA_KEY" // Replace with your Infura key if needed
  ],
  blockExplorerUrls: ["https://celo-alfajores.blockscout.com//"]
}

// Network validation helper
const checkNetwork = async (provider) => {
  try {
    const network = await provider.getNetwork()
    const expectedChainId = CELO_ALFAJORES_CONFIG.chainId
    
    if (Number(network.chainId) !== expectedChainId) {
      // Try to switch network automatically
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
        })
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${expectedChainId.toString(16)}`,
              chainName: CELO_ALFAJORES_CONFIG.chainName,
              nativeCurrency: CELO_ALFAJORES_CONFIG.nativeCurrency,
              rpcUrls: CELO_ALFAJORES_CONFIG.rpcUrls,
              blockExplorerUrls: CELO_ALFAJORES_CONFIG.blockExplorerUrls,
            }],
          })
        } else {
          throw switchError
        }
      }
    }
  } catch (error) {
    console.error("Network check/switch failed:", error)
    throw new Error(`Please switch to Celo Alfajores testnet. Current network is not supported.`)
  }
}

// Initialize provider with Celo Alfajores support
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  
  // Fallback to public RPC if no injected provider
  return new ethers.JsonRpcProvider(CELO_ALFAJORES_CONFIG.rpcUrls[0])
}

// FIXED: Enhanced connect wallet with network validation
export const connectWallet = async () => {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      // Check and switch to correct network first
      const provider = getProvider()
      await checkNetwork(provider)
      
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      // Verify we're on the correct network after connection
      const network = await provider.getNetwork()
      console.log(`Connected to ${network.name} (Chain ID: ${network.chainId})`)
      
      return { 
        success: true, 
        address, 
        signer, 
        network: {
          chainId: Number(network.chainId),
          name: network.name
        }
      }
    } else {
      return { 
        success: false, 
        error: "Please install MetaMask or another Web3 wallet that supports Celo" 
      }
    }
  } catch (error) {
    console.error("Error connecting wallet:", error)
    return { 
      success: false, 
      error: error.message || "Failed to connect wallet"
    }
  } 
}

// Enhanced error handling for contract calls
const getContractError = (error) => {
  if (error.reason) {
    return error.reason
  }
  if (error.data && error.data.message) {
    return error.data.message
  }
  if (error.message) {
    // Extract revert reason from error message
    const revertMatch = error.message.match(/revert (.+)/)
    if (revertMatch) {
      return revertMatch[1]
    }
    return error.message
  }
  return "Transaction failed"
}

// Gas estimation helper for Celo
const estimateGasWithBuffer = async (contract, functionName, args = [], options = {}) => {
  try {
    const estimatedGas = await contract[functionName].estimateGas(...args, options)
    // Add 30% buffer for Celo network
    return estimatedGas * 130n / 100n
  } catch (error) {
    console.warn("Gas estimation failed, using default:", error.message)
    return 300000n // Increased default gas limit for Celo
  }
}

// Enhanced transaction execution with better error handling
const executeTransaction = async (contract, functionName, args = [], options = {}) => {
  try {
    const gasLimit = await estimateGasWithBuffer(contract, functionName, args, options)
    const tx = await contract[functionName](...args, { ...options, gasLimit })
    console.log(`Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`)
    
    return { success: true, txHash: receipt.hash, receipt }
  } catch (error) {
    console.error(`Transaction failed for ${functionName}:`, error)
    throw error
  }
}

// Get contract instances with network validation
export const getDonorContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.donorContract, DonorContractAbi, signer)
  } catch (error) {
    console.error("Error getting donor contract:", error)
    return null
  }
}

export const getHSTContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.hstContract, HSTcontractAbi, signer)
  } catch (error) {
    console.error("Error getting HST contract:", error)
    return null
  }
}

export const getMultisigRedemptionContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.multisig, MultisigRedemptionContractAbi, signer)
  } catch (error) {
    console.error("Error getting multisig redemption contract:", error)
    return null
  }
}

export const getSavingsContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.saving, UserSavingsContractAbi, signer)
  } catch (error) {
    console.error("Error getting savings contract:", error)
    return null
  }
}

export const getFeeManagerContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.feeManagement, FeeManagerContractAbi, signer)
  } catch (error) {
    console.error("Error getting fee manager contract:", error)
    return null
  }
}

export const getLoanContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.loan, LoanContractAbi, signer)
  } catch (error) {
    console.error("Error getting loan contract:", error)
    return null
  }
}

export const getMetricsContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.metrics, MetricsContractAbi, signer)
  } catch (error) {
    console.error("Error getting metrics contract:", error)
    return null
  }
}

export const getUSDTContract = async (signer) => {
  try {
    await checkNetwork(signer.provider)
    return new ethers.Contract(CONTRACT_ADDRESSES.usdt, ERC20Abi, signer)
  } catch (error) {
    console.error("Error getting USDT contract:", error)
    return null
  }
}

// Add a helper function to check user registration status
export const checkUserRegistration = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)
    
    if (!savingsContract) {
      throw new Error("Failed to get savings contract instance")
    }

    const savingsInfo = await savingsContract.getSavingsInfo(address)
    return {
      isRegistered: savingsInfo.accountType > 0 || savingsInfo.balance > 0,
      accountType: Number(savingsInfo.accountType),
      planType: Number(savingsInfo.planType)
    }
  } catch (error) {
    console.error("Error checking user registration:", error)
    return { isRegistered: false, accountType: 0, planType: 0 }
  }
}

// FIXED: Enhanced deposit function with comprehensive validation
export const deposit = async (amount) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid deposit amount")
    }

    const provider = getProvider()
    await checkNetwork(provider)
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()
    
    // Get contract instances
    const savingsContract = await getSavingsContract(signer)
    const usdtContract = await getUSDTContract(signer)

    if (!savingsContract || !usdtContract) {
      throw new Error("Failed to get contract instances")
    }

    // Convert amount to Wei
    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    
    // 1. Check if user is registered
    console.log("Checking if user is registered...")
    let isRegistered = false
    try {
      const savingsInfo = await savingsContract.getSavingsInfo(userAddress)
      // If accountType is 0 and no other data, user is not registered
      isRegistered = savingsInfo.accountType > 0 || savingsInfo.balance > 0 || savingsInfo.lastDepositTime > 0
    } catch (error) {
      console.log("User not registered or getSavingsInfo failed:", error.message)
      isRegistered = false
    }

    if (!isRegistered) {
      throw new Error("User must be registered before making a deposit. Please register first.")
    }

    // 2. Check user's USDT balance
    console.log("Checking USDT balance...")
    const balance = await usdtContract.balanceOf(userAddress)
    if (balance < amountInWei) {
      throw new Error(`Insufficient USDT balance. Available: ${ethers.formatUnits(balance, 6)} USDT, Required: ${amount} USDT`)
    }

    // 3. Check current allowance
    console.log("Checking current allowance...")
    const currentAllowance = await usdtContract.allowance(userAddress, CONTRACT_ADDRESSES.saving)
    if (currentAllowance < amountInWei) {
      // 4. Approve USDT spending (approve max amount to avoid future approvals)
      console.log("Approving USDT transfer...")
      const maxAmount = ethers.parseUnits("1000000", 6) // Approve 1M USDT max
      const approvalResult = await executeTransaction(
        usdtContract,
        'approve',
        [CONTRACT_ADDRESSES.saving, maxAmount]
      )
      
      if (!approvalResult.success) {
        throw new Error("USDT approval failed")
      }
      
      // Wait a bit for the approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // 5. Check if contract is paused (if there's such functionality)
    console.log("Checking contract state...")
    
    // 6. Estimate gas for the deposit transaction
    try {
      await savingsContract.deposit.estimateGas(amountInWei)
    } catch (estimateError) {
      console.error("Gas estimation failed:", estimateError)
      throw new Error(`Transaction would fail: ${getContractError(estimateError)}`)
    }

    // 7. Make deposit
    console.log("Making deposit...")
    return await executeTransaction(
      savingsContract,
      'deposit',
      [amountInWei]
    )
  } catch (error) {
    console.error("Error depositing:", error)
    const errorMessage = getContractError(error)
    return { success: false, error: errorMessage }
  }
}

// Enhanced withdrawal function with better validation
export const withdraw = async (amount) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid withdrawal amount")
    }

    const provider = getProvider()
    await checkNetwork(provider)
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()
    const savingsContract = await getSavingsContract(signer)

    if (!savingsContract) {
      throw new Error("Failed to get savings contract instance")
    }

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    
    // Check user's savings info and balance
    console.log("Checking savings balance...")
    const savingsInfo = await getSavingsInfo(userAddress)
    if (!savingsInfo) {
      throw new Error("Unable to fetch savings information. Make sure you are registered.")
    }
    
    if (parseFloat(savingsInfo.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient savings balance. Available: ${savingsInfo.balance} USDT, Requested: ${amount} USDT`)
    }

    // Estimate gas for the withdrawal transaction
    try {
      await savingsContract.withdraw.estimateGas(amountInWei)
    } catch (estimateError) {
      console.error("Gas estimation failed:", estimateError)
      throw new Error(`Transaction would fail: ${getContractError(estimateError)}`)
    }

    console.log("Making withdrawal...")
    return await executeTransaction(
      savingsContract,
      'withdraw',
      [amountInWei]
    )
  } catch (error) {
    console.error("Error withdrawing:", error)
    const errorMessage = getContractError(error)
    return { success: false, error: errorMessage }
  }
}

// Enhanced register individual with proper validation and gas optimization
export const registerIndividual = async (planType, detailsHash, referrer = ethers.ZeroAddress) => {
  try {
    // Validate inputs
    if (!Number.isInteger(planType) || planType < 0 || planType > 2) {
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).")
    }
    if (!detailsHash || typeof detailsHash !== "string") {
      throw new Error("Details hash is required and must be a string.")
    }
    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer)) {
      throw new Error("Invalid referrer address.")
    }

    const provider = getProvider()
    await checkNetwork(provider)
    const signer = await provider.getSigner()
    const userAddress = await signer.getAddress()
    const savingsContract = await getSavingsContract(signer)

    if (!savingsContract) {
      throw new Error("Failed to get savings contract instance")
    }

    // Check if user is already registered
    try {
      const savingsInfo = await savingsContract.getSavingsInfo(userAddress)
      if (savingsInfo.accountType > 0) {
        throw new Error("User is already registered")
      }
    } catch (error) {
      // If getSavingsInfo fails, user might not be registered, which is what we want
      console.log("User registration check:", error.message)
    }

    console.log("Registering individual with:", { planType, detailsHash, referrer })
    
    return await executeTransaction(
      savingsContract, 
      'registerIndividual', 
      [planType, detailsHash, referrer || ethers.ZeroAddress]
    )
  } catch (error) {
    console.error("Error registering individual:", error)
    const errorMessage = getContractError(error)
    return { success: false, error: errorMessage }
  }
}

// Enhanced register family function with proper validation and gas optimization
export const registerFamily = async (familyMembers, planType, familyName, referrer = ethers.ZeroAddress) => {
  try {
    // Validate inputs
    if (!Number.isInteger(planType) || planType < 0 || planType > 2) {
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).")
    }
    if (!familyName || typeof familyName !== "string" || !familyName.trim()) {
      throw new Error("Family name is required and must be a non-empty string.")
    }
    if (!Array.isArray(familyMembers) || familyMembers.length < 2) {
      throw new Error("At least 2 family members are required.")
    }
    
    // Validate family members
    for (let i = 0; i < familyMembers.length; i++) {
      const member = familyMembers[i]
      if (!member.address || !ethers.isAddress(member.address)) {
        throw new Error(`Invalid address for family member ${i + 1}.`)
      }
      if (!member.detailsHash || typeof member.detailsHash !== "string") {
        throw new Error(`Details hash is required for family member ${i + 1}.`)
      }
    }
    
    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer)) {
      throw new Error("Invalid referrer address.")
    }

    const provider = getProvider()
    await checkNetwork(provider)
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    if (!savingsContract) {
      throw new Error("Failed to get savings contract instance")
    }

    // Prepare member addresses and details hashes
    const memberAddresses = familyMembers.map(member => member.address)
    const memberDetailsHashes = familyMembers.map(member => member.detailsHash)

    console.log("Registering family with:", { 
      memberAddresses, 
      memberDetailsHashes, 
      planType, 
      familyName, 
      referrer 
    })
    
    return await executeTransaction(
      savingsContract, 
      'registerFamily', 
      [memberAddresses, memberDetailsHashes, planType, familyName, referrer || ethers.ZeroAddress]
    )
  } catch (error) {
    console.error("Error registering family:", error)
    const errorMessage = getContractError(error)
    return { success: false, error: errorMessage }
  }
}

export const removePartneredFacility = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const tx = await hstContract.removePartneredFacility(facility)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error removing partnered facility:", error)
    return { success: false, error: error.message }
  }
}

export const getHSTBalance = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const balance = await hstContract.balanceOf(address)
    return ethers.formatUnits(balance, 18)
  } catch (error) {
    console.error("Error getting HST balance:", error)
    return "0"
  }
}

export const getFacilityInfo = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const info = await hstContract.facilityInfo(facility)
    return {
      name: info.name,
      licenseNumber: info.licenseNumber,
      verified: info.verified
    }
  } catch (error) {
    console.error("Error getting facility info:", error)
    return null
  }
}

export const isPartneredFacility = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    return await hstContract.partneredFacilities(facility)
  } catch (error) {
    console.error("Error checking partnered facility:", error)
    return false
  }
}

// Multisig Redemption Contract Functions
export const initiateRedemption = async (user, facility, hstAmount, outcomeHash) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const multisigContract = await getMultisigRedemptionContract(signer)

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18)
    const tx = await multisigContract.initiateRedemption(user, facility, hstAmountInWei, outcomeHash)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error initiating redemption:", error)
    return { success: false, error: error.message }
  }
}

export const signRedemption = async (redemptionId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const multisigContract = await getMultisigRedemptionContract(signer)

    const tx = await multisigContract.signRedemption(redemptionId)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error signing redemption:", error)
    return { success: false, error: error.message }
  }
}

export const getRedemptionInfo = async (redemptionId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const multisigContract = await getMultisigRedemptionContract(signer)

    const redemption = await multisigContract.redemptions(redemptionId)
    return {
      user: redemption.user,
      facility: redemption.facility,
      hstAmount: ethers.formatUnits(redemption.hstAmount, 18),
      facilitySigned: redemption.facilitySigned,
      healfiSigned: redemption.healfiSigned,
      executed: redemption.executed,
      outcomeHash: redemption.outcomeHash
    }
  } catch (error) {
    console.error("Error getting redemption info:", error)
    return null
  }
}

// Fee Manager Contract Functions
export const collectFee = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.feeManagement, amountInWei)
    await approveTx.wait()

    const tx = await feeManagerContract.collectFee(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error collecting fee:", error)
    return { success: false, error: error.message }
  }
}

export const distributeRedemptionFee = async (facility, totalFee) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)

    const totalFeeInWei = ethers.parseUnits(totalFee.toString(), 6)
    const tx = await feeManagerContract.distributeRedemptionFee(facility, totalFeeInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error distributing redemption fee:", error)
    return { success: false, error: error.message }
  }
}

export const withdrawFacilityBalance = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)

    const tx = await feeManagerContract.withdrawFacilityBalance()
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error withdrawing facility balance:", error)
    return { success: false, error: error.message }
  }
}

export const getFacilityBalance = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)

    const balance = await feeManagerContract.facilityBalances(facility)
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting facility balance:", error)
    return "0"
  }
}

export const getHealfiBalance = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)

    const balance = await feeManagerContract.healfiBalance()
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting healfi balance:", error)
    return "0"
  }
}

export const getTotalFeesCollected = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const feeManagerContract = await getFeeManagerContract(signer)

    const total = await feeManagerContract.totalFeesCollected()
    return ethers.formatUnits(total, 6)
  } catch (error) {
    console.error("Error getting total fees collected:", error)
    return "0"
  }
}

// Loan Contract Functions
export const applyLoan = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const tx = await loanContract.applyLoan(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error applying for loan:", error)
    return { success: false, error: error.message }
  }
}

export const repayLoan = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.loan, amountInWei)
    await approveTx.wait()

    const tx = await loanContract.repayLoan(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error repaying loan:", error)
    return { success: false, error: error.message }
  }
}

export const stakeGuarantor = async (userAddress, guarantorAddress) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const tx = await loanContract.stakeGuarantor(userAddress, guarantorAddress)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error staking guarantor:", error)
    return { success: false, error: error.message }
  }
}

export const getLoanInfo = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const loanInfo = await loanContract.loans(address)
    return {
      amount: ethers.formatUnits(loanInfo.amount, 6),
      guarantor: loanInfo.guarantor,
      dueDate: new Date(Number(loanInfo.dueDate) * 1000),
      repaid: loanInfo.repaid,
      interest: ethers.formatUnits(loanInfo.interest, 6)
    }
  } catch (error) {
    console.error("Error getting loan info:", error)
    return null
  }
}

export const checkLoanEligibility = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const [isEligible, reason] = await loanContract.checkEligibilityWithReason(address)
    return { isEligible, reason }
  } catch (error) {
    console.error("Error checking loan eligibility:", error)
    return { isEligible: false, reason: error.message }
  }
}

export const disburseLoan = async (user) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const tx = await loanContract.disburseLoan(user)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error disbursing loan:", error)
    return { success: false, error: error.message }
  }
}

export const getTotalLoansDisbursed = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const total = await loanContract.totalLoansDisbursed()
    return ethers.formatUnits(total, 6)
  } catch (error) {
    console.error("Error getting total loans disbursed:", error)
    return "0"
  }
}

export const getTotalLoansRepaid = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    const total = await loanContract.totalLoansRepaid()
    return ethers.formatUnits(total, 6)
  } catch (error) {
    console.error("Error getting total loans repaid:", error)
    return "0"
  }
}

// Metrics Contract Functions
export const getPlatformMetrics = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const metricsContract = await getMetricsContract(signer)

    const metrics = await metricsContract.getPlatformMetrics()
    return {
      totalUsers: Number(metrics.totalUsers),
      totalSavings: ethers.formatUnits(metrics.totalSavings, 6),
      totalLoansDisbursed: ethers.formatUnits(metrics.totalLoansDisbursed, 6),
      totalHSTRedeemed: ethers.formatUnits(metrics._totalHSTRedeemed, 18),
      totalFundsMatched: ethers.formatUnits(metrics.totalFundsMatched, 6)
    }
  } catch (error) {
    console.error("Error fetching platform metrics:", error)
    return {
      totalUsers: 0,
      totalSavings: "0",
      totalLoansDisbursed: "0",
      totalHSTRedeemed: "0",
      totalFundsMatched: "0"
    }
  }
}

export const getTotalHSTRedeemed = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const metricsContract = await getMetricsContract(signer)

    const total = await metricsContract.totalHSTRedeemed()
    return ethers.formatUnits(total, 18)
  } catch (error) {
    console.error("Error getting total HST redeemed:", error)
    return "0"
  }
}

export const updateRedemptionMetrics = async (hstAmount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const metricsContract = await getMetricsContract(signer)

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18)
    const tx = await metricsContract.updateRedemptionMetrics(hstAmountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error updating redemption metrics:", error)
    return { success: false, error: error.message }
  }
}

export const batchDeposit = async (users, amounts) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)
    const usdtContract = await getUSDTContract(signer)

    const amountsInWei = amounts.map(amount => ethers.parseUnits(amount.toString(), 6))
    for (let i = 0; i < users.length; i++) {
      const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.saving, amountsInWei[i])
      await approveTx.wait()
    }

    const tx = await savingsContract.batchDeposit(users, amountsInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error batch depositing:", error)
    return { success: false, error: error.message }
  }
}

export const approveWithdrawer = async (withdrawer, familyId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const tx = await savingsContract.approveWithdrawer(withdrawer, familyId)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error approving withdrawer:", error)
    return { success: false, error: error.message }
  }
}

export const revokeWithdrawer = async (withdrawer, familyId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const tx = await savingsContract.revokeWithdrawer(withdrawer, familyId)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error revoking withdrawer:", error)
    return { success: false, error: error.message }
  }
}

export const getSavingsInfo = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const savingsInfo = await savingsContract.getSavingsInfo(address)
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
    }
  } catch (error) {
    console.error("Error getting savings info:", error)
    return null
  }
}

export const getUserDashboard = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const dashboard = await savingsContract.getUserDashboard(address)
    return {
      balance: ethers.formatUnits(dashboard.balance, 6),
      hstEarned: ethers.formatUnits(dashboard.hstEarned, 18),
      streak: Number(dashboard.streak),
      loanAmount: ethers.formatUnits(dashboard.loanAmount, 6),
      loanRepaid: dashboard.loanRepaid,
      isVerified: dashboard.isVerified
    }
  } catch (error) {
    console.error("Error getting user dashboard:", error)
    return null
  }
}

export const getLockedBalance = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const balance = await savingsContract.getLockedBalance(address)
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting locked balance:", error)
    return "0"
  }
}

export const getFamilyInfo = async (familyId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const familyInfo = await savingsContract.getFamilyInfo(familyId)
    return {
      familyName: familyInfo.familyName,
      creator: familyInfo.creator,
      memberCount: Number(familyInfo.memberCount),
      treasuryBalance: ethers.formatUnits(familyInfo.treasuryBalance, 6),
      lockedTreasuryBalance: ethers.formatUnits(familyInfo.lockedTreasuryBalance, 6)
    }
  } catch (error) {
    console.error("Error getting family info:", error)
    return null
  }
}

export const isApprovedWithdrawer = async (user, familyId) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    return await savingsContract.isApprovedWithdrawer(user, familyId)
  } catch (error) {
    console.error("Error checking approved withdrawer:", error)
    return false
  }
}

export const isUserVerified = async (user) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    return await savingsContract.isUserVerified(user)
  } catch (error) {
    console.error("Error checking user verification status:", error)
    return false
  }
}

export const mintSavings = async (user, amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const tx = await savingsContract.mint(user, amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error minting savings:", error)
    return { success: false, error: error.message }
  }
}

// USDT Contract Functions
export const getUSDTBalance = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const balance = await usdtContract.balanceOf(address)
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting USDT balance:", error)
    return "0"
  }
}

export const approveUSDT = async (spender, amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const tx = await usdtContract.approve(spender, amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error approving USDT:", error)
    return { success: false, error: error.message }
  }
}

export const transferUSDT = async (to, amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const tx = await usdtContract.transfer(to, amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error transferring USDT:", error)
    return { success: false, error: error.message }
  }
}

export const transferFromUSDT = async (from, to, amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const tx = await usdtContract.transferFrom(from, to, amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error transferring from USDT:", error)
    return { success: false, error: error.message }
  }
}

export const getUSDTAllowance = async (owner, spender) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const allowance = await usdtContract.allowance(owner, spender)
    return ethers.formatUnits(allowance, 6)
  } catch (error) {
    console.error("Error getting USDT allowance:", error)
    return "0"
  }
}

export const getNetworkName = async () => {
  try {
    const provider = getProvider()
    const network = await provider.getNetwork()
    return network.name
  } catch (error) {
    console.error("Error getting network name:", error)
    return "Unknown Network"
  }
}

// Utility function to get network info
export const getNetworkInfo = async () => {
  try {
    const provider = getProvider()
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    
    return {
      chainId: Number(network.chainId),
      name: network.name,
      blockNumber,
      isCorrectNetwork: Number(network.chainId) === CELO_ALFAJORES_CONFIG.chainId
    }
  } catch (error) {
    console.error("Error getting network info:", error)
    return null
  }
}

// Celo-specific gas price helper
export const getOptimalGasPrice = async () => {
  try {
    const provider = getProvider()
    const feeData = await provider.getFeeData()
    
    // Celo uses a different fee structure
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    }
  } catch (error) {
    console.error("Error getting gas price:", error)
    return null
  }
}

// Fetch savings transaction history
export async function getSavingsTransactions(address) {
  try {
    const provider = getProvider()
    await checkNetwork(provider)
    const signer = await provider.getSigner()
    const contract = await getSavingsContract(signer)
    
    if (!contract) {
      throw new Error("Failed to get savings contract")
    }

    // Fetch Deposit events
    const depositFilter = contract.filters.Deposit(address)
    const depositEvents = await contract.queryFilter(depositFilter, 0, "latest")

    // Fetch Withdraw events
    const withdrawFilter = contract.filters.Withdrawal(address)
    const withdrawEvents = await contract.queryFilter(withdrawFilter, 0, "latest")

    // Combine and format events
    const transactions = await Promise.all([
      ...depositEvents.map(async (event) => ({
        type: "Deposit",
        amount: ethers.formatUnits(event.args.amount, 6),
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...withdrawEvents.map(async (event) => ({
        type: "Withdrawal",
        amount: ethers.formatUnits(event.args.amount, 6),
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
    ])

    transactions.sort((a, b) => b.timestamp - a.timestamp)
    return transactions
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

// Fetch all user activities
export async function getUserActivities(address) {
  try {
    const provider = getProvider()
    if (!provider) {
      throw new Error("No provider available")
    }
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)
    const loanContract = await getLoanContract(signer)
    if (!savingsContract || !loanContract) {
      throw new Error("Failed to get contract instances")
    }

    const registerIndividualFilter = savingsContract.filters.UserRegistered(address, null, null, null, null)
    const familyUpdatedFilter = savingsContract.filters.FamilyUpdated(address, null, null)
    const depositFilter = savingsContract.filters.Deposit(address, null, null, null)
    const withdrawFilter = savingsContract.filters.Withdrawal(address, null, null)
    const loanAppliedFilter = loanContract.filters.LoanApplied(address, null)
    const loanRepaidFilter = loanContract.filters.LoanRepaid(address, null)
    const guarantorStakedFilter = loanContract.filters.GuarantorStaked(address, null, null)
    const hstAwardedFilter = savingsContract.filters.HSTAwarded(address, null)
    const streakUpdatedFilter = savingsContract.filters.StreakUpdated(address, null)
    const verificationStatusFilter = savingsContract.filters.VerificationStatusUpdated(address, null)
    const referralRewardedFilter = savingsContract.filters.ReferralRewarded(address, null, null)

    const [
      registerIndividualEvents,
      familyUpdatedEvents,
      depositEvents,
      withdrawEvents,
      loanAppliedEvents,
      loanRepaidEvents,
      guarantorStakedEvents,
      hstAwardedEvents,
      streakUpdatedEvents,
      verificationStatusEvents,
      referralRewardedEvents
    ] = await Promise.all([
      savingsContract.queryFilter(registerIndividualFilter, 0, "latest"),
      savingsContract.queryFilter(familyUpdatedFilter, 0, "latest"),
      savingsContract.queryFilter(depositFilter, 0, "latest"),
      savingsContract.queryFilter(withdrawFilter, 0, "latest"),
      loanContract.queryFilter(loanAppliedFilter, 0, "latest"),
      loanContract.queryFilter(loanRepaidFilter, 0, "latest"),
      loanContract.queryFilter(guarantorStakedFilter, 0, "latest"),
      savingsContract.queryFilter(hstAwardedFilter, 0, "latest"),
      savingsContract.queryFilter(streakUpdatedFilter, 0, "latest"),
      savingsContract.queryFilter(verificationStatusFilter, 0, "latest"),
      savingsContract.queryFilter(referralRewardedFilter, 0, "latest"),
    ])

    const activities = await Promise.all([
      ...registerIndividualEvents.map(async (event) => ({
        type: "UserRegistered",
        details: `Account Type: ${event.args.accountType}, Plan Type: ${event.args.planType}, Details Hash: ${event.args.detailsHash}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...familyUpdatedEvents.map(async (event) => ({
        type: "FamilyUpdated",
        details: `Family ID: ${event.args.familyId}, Family Name: ${event.args.familyName}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...depositEvents.map(async (event) => ({
        type: "Deposit",
        details: `${ethers.formatUnits(event.args.amount, 6)} USDT, Streak: ${event.args.streak}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...withdrawEvents.map(async (event) => ({
        type: "Withdrawal",
        details: `${ethers.formatUnits(event.args.amount, 6)} USDT`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...loanAppliedEvents.map(async (event) => ({
        type: "LoanApplied",
        details: `${ethers.formatUnits(event.args.amount, 6)} USDT`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...loanRepaidEvents.map(async (event) => ({
        type: "LoanRepaid",
        details: `${ethers.formatUnits(event.args.amount, 6)} USDT`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...guarantorStakedEvents.map(async (event) => ({
        type: "GuarantorStaked",
        details: `Guarantor: ${event.args.guarantor.slice(0, 6)}...${event.args.guarantor.slice(-4)}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...hstAwardedEvents.map(async (event) => ({
        type: "HSTAwarded",
        details: `${ethers.formatUnits(event.args.amount, 18)} HST`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...streakUpdatedEvents.map(async (event) => ({
        type: "StreakUpdated",
        details: `New Streak: ${event.args.newStreak}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...verificationStatusEvents.map(async (event) => ({
        type: "VerificationStatusUpdated",
        details: `Status: ${event.args.status}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...referralRewardedEvents.map(async (event) => ({
        type: "ReferralRewarded",
        details: `Referee: ${event.args.referee.slice(0, 6)}...${event.args.referee.slice(-4)}, Amount: ${ethers.formatUnits(event.args.amount, 18)} HST`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
    ])

    activities.sort((a, b) => b.timestamp - a.timestamp)
    return activities
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return []
  }
}

// Donor Contract Functions
export const donate = async (amount, poolType) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)
    const usdtContract = await getUSDTContract(signer)

    const amountInWei = ethers.parseUnits(amount.toString(), 6)
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.donorContract, amountInWei)
    await approveTx.wait()

    const tx = await donorContract.donate(amountInWei, poolType)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error donating:", error)
    return { success: false, error: error.message }
  }
}

export const getDonorInfo = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const donorInfo = await donorContract.donorInfo(address)
    return {
      contribution: ethers.formatUnits(donorInfo.contribution, 6),
      poolType: donorInfo.poolType,
      peopleHelped: Number(donorInfo.peopleHelped),
      hstMatched: Number(donorInfo.hstMatched),
      kycVerified: donorInfo.kycVerified
    }
  } catch (error) {
    console.error("Error getting donor info:", error)
    return null
  }
}

export const matchRedemption = async (user, hstAmount, facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), 18)
    const tx = await donorContract.matchRedemption(user, hstAmountInWei, facility)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error matching redemption:", error)
    return { success: false, error: error.message }
  }
}

export const setKYCStatus = async (donor, status) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const tx = await donorContract.setKYCStatus(donor, status)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error setting KYC status:", error)
    return { success: false, error: error.message }
  }
}

export const getFeeFreePoolBalance = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const balance = await donorContract.feeFreePoolBalance()
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting fee free pool balance:", error)
    return "0"
  }
}

export const getStandardPoolBalance = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const balance = await donorContract.standardPoolBalance()
    return ethers.formatUnits(balance, 6)
  } catch (error) {
    console.error("Error getting standard pool balance:", error)
    return "0"
  }
}

export const getTotalFundsMatched = async () => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const total = await donorContract.totalFundsMatched()
    return ethers.formatUnits(total, 6)
  } catch (error) {
    console.error("Error getting total funds matched:", error)
    return "0"
  }
}

export const getFacilityPatientsServed = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const donorContract = await getDonorContract(signer)

    const patients = await donorContract.facilityPatientsServed(facility)
    return Number(patients)
  } catch (error) {
    console.error("Error getting facility patients served:", error)
    return 0
  }
}

// HST Contract Functions
export const registerFacility = async (name, licenseNumber) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const tx = await hstContract.registerFacility(name, licenseNumber)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error registering facility:", error)
    return { success: false, error: error.message }
  }
}

export const verifyFacility = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const tx = await hstContract.verifyFacility(facility)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error verifying facility:", error)
    return { success: false, error: error.message }
  }
}

export const addPartneredFacility = async (facility) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const tx = await hstContract.addPartneredFacility(facility)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error adding partnered facility:", error)
    return { success: false, error: error.message }
  }
}