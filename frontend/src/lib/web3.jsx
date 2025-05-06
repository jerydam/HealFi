"use client"

import { ethers } from "ethers"
import { CONTRACT_ADDRESSES, LoanContractAbi, UserSavingsContractAbi, HSTcontractAbi, ERC20Abi } from "./contract"

// Initialize provider
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return null
}

// Connect wallet
export const connectWallet = async () => {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const provider = getProvider()
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      return { success: true, address, signer }
    } else {
      return { success: false, error: "Please install MetaMask or another Web3 wallet" }
    }
  } catch (error) {
    console.error("Error connecting wallet:", error)
    return { success: false, error: error.message }
  }
}

// Fetch savings transaction history
export async function getSavingsTransactions(address) {
  try {
    const provider = getProvider()
    if (!provider) {
      throw new Error("No provider available")
    }
    const signer = await provider.getSigner()
    const contract = await getSavingsContract(signer)
    if (!contract) {
      throw new Error("Failed to get savings contract")
    }

    // Fetch Deposit events
    const depositFilter = contract.filters.Deposit(address)
    const depositEvents = await contract.queryFilter(depositFilter, 0, "latest")

    // Fetch Withdraw events
    const withdrawFilter = contract.filters.Withdraw(address)
    const withdrawEvents = await contract.queryFilter(withdrawFilter, 0, "latest")

    // Combine and format events
    const transactions = await Promise.all([
      ...depositEvents.map(async (event) => ({
        type: "Deposit",
        amount: ethers.formatUnits(event.args.amount, 6), // USDT has 6 decimals
        timestamp: (await event.getBlock()).timestamp * 1000, // Convert to milliseconds
        txHash: event.transactionHash,
      })),
      ...withdrawEvents.map(async (event) => ({
        type: "Withdrawal",
        amount: ethers.formatUnits(event.args.amount, 6), // USDT has 6 decimals
        timestamp: (await event.getBlock()).timestamp * 1000, // Convert to milliseconds
        txHash: event.transactionHash,
      })),
    ])

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp)

    return transactions
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

// Get contract instances
export const getLoanContract = async (signer) => {
  try {
    return new ethers.Contract(CONTRACT_ADDRESSES.loan, LoanContractAbi, signer)
  } catch (error) {
    console.error("Error getting loan contract:", error)
    return null
  }
}

export const getSavingsContract = async (signer) => {
  try {
    return new ethers.Contract(CONTRACT_ADDRESSES.saving, UserSavingsContractAbi, signer)
  } catch (error) {
    console.error("Error getting savings contract:", error)
    return null
  }
}

export const getHSTContract = async (signer) => {
  try {
    return new ethers.Contract(CONTRACT_ADDRESSES.hstContract, HSTcontractAbi, signer)
  } catch (error) {
    console.error("Error getting HST contract:", error)
    return null
  }
}

export const getUSDTContract = async (signer) => {
  try {
    return new ethers.Contract(CONTRACT_ADDRESSES.usdt, ERC20Abi, signer)
  } catch (error) {
    console.error("Error getting USDT contract:", error)
    return null
  }
}

// Loan functions
export const checkLoanEligibility = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)
    return await loanContract.checkEligibility(address)
  } catch (error) {
    console.error("Error checking loan eligibility:", error)
    return false
  }
}

export const applyForLoan = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const loanContract = await getLoanContract(signer)

    // Convert amount to wei (assuming 6 decimals for USDT)
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

    // Convert amount to wei (assuming 6 decimals for USDT)
    const amountInWei = ethers.parseUnits(amount.toString(), 6)

    // Approve USDT transfer first
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.loan, amountInWei)
    await approveTx.wait()

    // Repay loan
    const tx = await loanContract.repayLoan(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error repaying loan:", error)
    return { success: false, error: error.message }
  }
}
// Fetch all user activities from savings and loan contracts
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

    // Fetch Savings Contract events
    const registerIndividualFilter = savingsContract.filters.RegisterIndividual(address)
    const registerFamilyFilter = savingsContract.filters.RegisterFamily(address)
    const depositFilter = savingsContract.filters.Deposit(address)
    const withdrawFilter = savingsContract.filters.Withdraw(address)

    const registerIndividualEvents = await savingsContract.queryFilter(registerIndividualFilter, 0, "latest")
    const registerFamilyEvents = await savingsContract.queryFilter(registerFamilyFilter, 0, "latest")
    const depositEvents = await savingsContract.queryFilter(depositFilter, 0, "latest")
    const withdrawEvents = await savingsContract.queryFilter(withdrawFilter, 0, "latest")

    // Fetch Loan Contract events
    const loanAppliedFilter = loanContract.filters.LoanApplied(address)
    const loanRepaidFilter = loanContract.filters.LoanRepaid(address)
    const guarantorStakedFilter = loanContract.filters.GuarantorStaked(address)

    const loanAppliedEvents = await loanContract.queryFilter(loanAppliedFilter, 0, "latest")
    const loanRepaidEvents = await loanContract.queryFilter(loanRepaidFilter, 0, "latest")
    const guarantorStakedEvents = await loanContract.queryFilter(guarantorStakedFilter, 0, "latest")

    // Combine and format events
    const activities = await Promise.all([
      ...registerIndividualEvents.map(async (event) => ({
        type: "RegisterIndividual",
        details: `Plan Type: ${event.args.planType.toString()}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...registerFamilyEvents.map(async (event) => ({
        type: "RegisterFamily",
        details: `Family ID: ${event.args.familyId.toString()}, Plan Type: ${event.args.planType.toString()}`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...depositEvents.map(async (event) => ({
        type: "Deposit",
        details: `${ethers.formatUnits(event.args.amount, 6)} USDT`,
        timestamp: (await event.getBlock()).timestamp * 1000,
        txHash: event.transactionHash,
      })),
      ...withdrawEvents.map(async (event) => ({
        type: "Withdraw",
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
    ])

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp)

    return activities
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return []
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
      interest: ethers.formatUnits(loanInfo.interest, 6),
    }
  } catch (error) {
    console.error("Error getting loan info:", error)
    return null
  }
}

// Savings functions
export const registerIndividual = async (planType) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const tx = await savingsContract.registerIndividual(planType)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error registering individual:", error)
    return { success: false, error: error.message }
  }
}

export const registerFamily = async (members, planType) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    const tx = await savingsContract.registerFamily(members, planType)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error registering family:", error)
    return { success: false, error: error.message }
  }
}

export const deposit = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)
    const usdtContract = await getUSDTContract(signer)

    // Convert amount to wei (assuming 6 decimals for USDT)
    const amountInWei = ethers.parseUnits(amount.toString(), 6)

    // Approve USDT transfer first
    const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.saving, amountInWei)
    await approveTx.wait()

    // Deposit
    const tx = await savingsContract.deposit(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error depositing:", error)
    return { success: false, error: error.message }
  }
}

export const withdraw = async (amount) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const savingsContract = await getSavingsContract(signer)

    // Convert amount to wei (assuming 6 decimals for USDT)
    const amountInWei = ethers.parseUnits(amount.toString(), 6)

    const tx = await savingsContract.withdraw(amountInWei)
    await tx.wait()
    return { success: true, txHash: tx.hash }
  } catch (error) {
    console.error("Error withdrawing:", error)
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
      hstEarned: Number(savingsInfo.hstEarned),
      familyId: Number(savingsInfo.familyId),
      familyTreasuryBalance: ethers.formatUnits(savingsInfo.familyTreasuryBalance, 6),
      lastDepositTime: new Date(Number(savingsInfo.lastDepositTime) * 1000),
    }
  } catch (error) {
    console.error("Error getting savings info:", error)
    return null
  }
}

// HST Token functions
export const getHSTBalance = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const hstContract = await getHSTContract(signer)

    const balance = await hstContract.balanceOf(address)
    return ethers.formatUnits(balance, 18) // Assuming HST has 18 decimals
  } catch (error) {
    console.error("Error getting HST balance:", error)
    return "0"
  }
}

// USDT functions
export const getUSDTBalance = async (address) => {
  try {
    const provider = getProvider()
    const signer = await provider.getSigner()
    const usdtContract = await getUSDTContract(signer)

    const balance = await usdtContract.balanceOf(address)
    return ethers.formatUnits(balance, 6) // USDT has 6 decimals
  } catch (error) {
    console.error("Error getting USDT balance:", error)
    return "0"
  }
}