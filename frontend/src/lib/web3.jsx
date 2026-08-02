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
import { ACTIVE_CHAIN, getExplorerTxUrl, getExplorerAddressUrl } from "@/utils/config";

export { getExplorerTxUrl, getExplorerAddressUrl };

const USDT_DECIMALS = 6;
const HST_DECIMALS = 18;

// Shared read-only provider for the active Celo network. Reads never need a wallet.
let readProvider;
export const getProvider = () => {
  if (!readProvider) {
    readProvider = new ethers.JsonRpcProvider(ACTIVE_CHAIN.rpcUrls[0], {
      chainId: ACTIVE_CHAIN.id,
      name: ACTIVE_CHAIN.chainName,
    });
  }
  return readProvider;
};

// Contract getters. Pass a signer for writes; omit it for reads.
const contractFactory = (address, abi) => (signerOrProvider) =>
  new ethers.Contract(address, abi, signerOrProvider || getProvider());

export const getDonorContract = contractFactory(CONTRACT_ADDRESSES.donorContract, DonorContractAbi);
export const getHSTContract = contractFactory(CONTRACT_ADDRESSES.hstContract, HSTcontractAbi);
export const getMultisigRedemptionContract = contractFactory(CONTRACT_ADDRESSES.multisig, MultisigRedemptionContractAbi);
export const getSavingsContract = contractFactory(CONTRACT_ADDRESSES.saving, UserSavingsContractAbi);
export const getFeeManagerContract = contractFactory(CONTRACT_ADDRESSES.feeManagement, FeeManagerContractAbi);
export const getLoanContract = contractFactory(CONTRACT_ADDRESSES.loan, LoanContractAbi);
export const getMetricsContract = contractFactory(CONTRACT_ADDRESSES.metrics, MetricsContractAbi);
export const getUSDTContract = contractFactory(CONTRACT_ADDRESSES.usdt, ERC20Abi);

// Enhanced error handling for contract calls
const getContractError = (error) => {
  if (error.code === "ACTION_REJECTED" || error.code === 4001) {
    return "Transaction rejected in wallet";
  }
  if (error.reason) {
    return error.reason;
  }
  if (error.shortMessage) {
    return error.shortMessage;
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

const requireSigner = (signer) => {
  if (!signer) {
    throw new Error("No wallet connected");
  }
  return signer;
};

// Send a transaction and wait for it to be mined
const executeTransaction = async (txPromise) => {
  const tx = await txPromise;
  console.log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  return {
    success: true,
    txHash: tx.hash,
    receipt,
  };
};

// Approve `spender` for at least `amount` of USDT, skipping the tx if allowance suffices
const ensureUSDTAllowance = async (signer, spender, amount) => {
  const owner = await signer.getAddress();
  const usdt = getUSDTContract(signer);
  const currentAllowance = await usdt.allowance(owner, spender);

  if (currentAllowance >= amount) return;

  console.log("Approving USDT transfer...");
  await executeTransaction(usdt.approve(spender, amount));
};

// Check user registration status
export const checkUserRegistration = async (address) => {
  try {
    const savingsInfo = await getSavingsContract().getSavingsInfo(address);
    return {
      isRegistered: Number(savingsInfo.accountType) > 0 || savingsInfo.balance > 0n,
      accountType: Number(savingsInfo.accountType),
      planType: Number(savingsInfo.planType)
    };
  } catch (error) {
    console.error("Error checking user registration:", error);
    return { isRegistered: false, accountType: 0, planType: 0 };
  }
};

export const deposit = async (amount, target, signer) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid deposit amount");
    }
    if (target !== 1 && target !== 2) {
      throw new Error("Invalid account target — must be Individual (1) or Family (2).");
    }
    requireSigner(signer);

    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    const userAddress = await signer.getAddress();

    console.log("Checking USDT balance...");
    const balance = await getUSDTContract().balanceOf(userAddress);
    if (balance < amountInWei) {
      throw new Error(
        `Insufficient USDT balance. Available: ${ethers.formatUnits(balance, USDT_DECIMALS)} USDT, Required: ${amount} USDT`
      );
    }

    await ensureUSDTAllowance(signer, CONTRACT_ADDRESSES.saving, amountInWei);

    console.log("Making deposit...");
    return await executeTransaction(getSavingsContract(signer).deposit(amountInWei, target));
  } catch (error) {
    console.error("Error depositing:", error);
    return { success: false, error: getContractError(error) };
  }
};

// web3.js — add after approveFamilyWithdrawal
export const getFamilyWithdrawalRequests = async (familyId) => {
  try {
    const ids = await getSavingsContract().getFamilyWithdrawalRequests(familyId);
    return ids.map(Number);
  } catch (error) {
    console.error("Error getting withdrawal requests:", error);
    return [];
  }
};

export const getWithdrawalRequest = async (requestId) => {
  try {
    const r = await getSavingsContract().withdrawalRequests(requestId);
    return {
      familyId: Number(r.familyId),
      amount: ethers.formatUnits(r.amount, USDT_DECIMALS),
      to: r.to,
      proposer: r.proposer,
      createdAt: Number(r.createdAt),
      executed: r.executed,
      cancelled: r.cancelled,
    };
  } catch (error) {
    console.error("Error getting withdrawal request:", error);
    return null;
  }
};
// Which account types exist for this user, and which is currently "active"
// (relevant for plain withdraw(), which has no target param)
export const getAccountStatus = async (address) => {
  try {
    const status = await getSavingsContract().getAccountStatus(address);
    return {
      hasIndividualAccount: status.hasIndividualAccount,
      hasFamilyAccount: status.hasFamilyAccount,
      familyId: Number(status.familyId),
      activeAccount: Number(status.activeAccount), // 0=None, 1=Individual, 2=Family
    };
  } catch (error) {
    console.error("Error getting account status:", error);
    return null;
  }
};

export const getIndividualAccount = async (address) => {
  try {
    const info = await getSavingsContract().getIndividualAccount(address);
    return {
      registered: info.registered,
      balance: ethers.formatUnits(info.balance, USDT_DECIMALS),
      lockedBalance: ethers.formatUnits(info.lockedBalance, USDT_DECIMALS),
      planType: Number(info.planType),
      streak: Number(info.streak),
      hstEarned: ethers.formatUnits(info.hstEarned, HST_DECIMALS),
      lastDepositTime: new Date(Number(info.lastDepositTime) * 1000),
      detailsHash: info.detailsHash,
      isVerified: info.isVerified,
      referrer: info.referrer,
    };
  } catch (error) {
    console.error("Error getting individual account:", error);
    return null;
  }
};

// Note: distinct from getFamilyInfo(familyId) — this looks up by user address instead
export const getUserFamilyAccount = async (address) => {
  try {
    const info = await getSavingsContract().getFamilyAccount(address);
    return {
      isMember: info.isMember,
      familyId: Number(info.familyId),
      familyName: info.familyName,
      treasuryBalance: ethers.formatUnits(info.treasuryBalance, USDT_DECIMALS),
      lockedTreasuryBalance: ethers.formatUnits(info.lockedTreasuryBalance, USDT_DECIMALS),
      planType: Number(info.planType),
      streak: Number(info.streak),
      hstEarned: ethers.formatUnits(info.hstEarned, HST_DECIMALS),
      lastDepositTime: new Date(Number(info.lastDepositTime) * 1000),
    };
  } catch (error) {
    console.error("Error getting user's family account:", error);
    return null;
  }
};

export const switchActiveAccount = async (target, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getSavingsContract(signer).switchActiveAccount(target));
  } catch (error) {
    console.error("Error switching active account:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const withdraw = async (amount, signer) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid withdrawal amount");
    }
    requireSigner(signer);

    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    const userAddress = await signer.getAddress();

    console.log("Checking savings balance...");
    const savingsInfo = await getSavingsInfo(userAddress);
    if (!savingsInfo) {
      throw new Error("Unable to fetch savings information. Make sure you are registered.");
    }
    if (parseFloat(savingsInfo.balance) < parseFloat(amount)) {
      throw new Error(
        `Insufficient savings balance. Available: ${savingsInfo.balance} USDT, Requested: ${amount} USDT`
      );
    }

    console.log("Making withdrawal...");
    return await executeTransaction(getSavingsContract(signer).withdraw(amountInWei));
  } catch (error) {
    console.error("Error withdrawing:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const registerIndividual = async (planType, detailsHash, referrer = ethers.ZeroAddress, signer) => {
  try {
    if (!Number.isInteger(planType) || planType < 0 || planType > 2) {
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).");
    }
    if (!detailsHash || typeof detailsHash !== "string") {
      throw new Error("Details hash is required and must be a string.");
    }
    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer)) {
      throw new Error("Invalid referrer address.");
    }
    requireSigner(signer);

    const userAddress = await signer.getAddress();
    const registrationStatus = await checkUserRegistration(userAddress);
    if (registrationStatus.isRegistered) {
      throw new Error("User is already registered");
    }

    console.log("Registering individual with:", { planType, detailsHash, referrer });
    return await executeTransaction(
      getSavingsContract(signer).registerIndividual(planType, detailsHash, referrer || ethers.ZeroAddress)
    );
  } catch (error) {
    console.error("Error registering individual:", error);
    return { success: false, error: getContractError(error) };
  }
};

/**
 * Register a family on-chain.
 * @param {Array<{member: string, role: number}>} familyMembers  MemberInput array (role: 0-6)
 * @param {number}  planType           0=Daily, 1=Weekly, 2=Monthly
 * @param {string}  familyName
 * @param {string}  familyDataHash     IPFS CID of the off-chain family record
 * @param {string}  emergencySigner    Proposes withdrawals; must be a member
 * @param {string}  trusteeSigner      Co-signs withdrawals; must be a member
 * @param {string}  [referrer]
 * @param {object}  signer
 */
export const registerFamily = async (
  familyMembers,
  planType,
  familyName,
  familyDataHash,
  emergencySigner,
  trusteeSigner,
  referrer = ethers.ZeroAddress,
  signer
) => {
  try {
    if (!Number.isInteger(planType) || planType < 0 || planType > 2)
      throw new Error("Invalid plan type. Must be 0 (Daily), 1 (Weekly), or 2 (Monthly).");
    if (!familyName?.trim())
      throw new Error("Family name is required.");
    if (!familyDataHash?.trim())
      throw new Error("Family data hash (IPFS CID) is required.");
    if (!Array.isArray(familyMembers) || familyMembers.length < 2)
      throw new Error("At least 2 family members are required.");
    if (!emergencySigner || !ethers.isAddress(emergencySigner))
      throw new Error("Valid emergency signer address required.");
    if (!trusteeSigner || !ethers.isAddress(trusteeSigner))
      throw new Error("Valid trustee signer address required.");
    if (emergencySigner.toLowerCase() === trusteeSigner.toLowerCase())
      throw new Error("Emergency signer and trustee signer must be different addresses.");
    requireSigner(signer);

    for (let i = 0; i < familyMembers.length; i++) {
      const m = familyMembers[i];
      if (!m.member || !ethers.isAddress(m.member))
        throw new Error(`Invalid address for family member ${i + 1}.`);
      if (typeof m.role !== "number" || m.role < 0 || m.role > 6)
        throw new Error(`Invalid role for family member ${i + 1}.`);
    }

    if (referrer && referrer !== ethers.ZeroAddress && !ethers.isAddress(referrer))
      throw new Error("Invalid referrer address.");

    // Verify both signers are in the member list (contract enforces this too)
    const memberAddrs = familyMembers.map((m) => m.member.toLowerCase());
    if (!memberAddrs.includes(emergencySigner.toLowerCase()))
      throw new Error("Emergency signer must be included in the members list.");
    if (!memberAddrs.includes(trusteeSigner.toLowerCase()))
      throw new Error("Trustee signer must be included in the members list.");

    console.log("Registering family with:", { familyMembers, planType, familyName, familyDataHash, emergencySigner, trusteeSigner });

    // Contract MemberInput: (address member, uint8 role)
    const members = familyMembers.map((m) => [m.member, m.role]);

    return await executeTransaction(
      getSavingsContract(signer).registerFamily(
        members,
        planType,
        familyName,
        familyDataHash,
        emergencySigner,
        trusteeSigner,
        referrer || ethers.ZeroAddress
      )
    );
  } catch (error) {
    console.error("Error registering family:", error);
    return { success: false, error: getContractError(error) };
  }
};

// ─── Family query helpers ──────────────────────────────────────────────────

export const getFamilySigners = async (familyId) => {
  try {
    const result = await getSavingsContract().getFamilySigners(familyId);
    return {
      emergencySigner: result[0],
      trusteeSigner: result[1],
      familyDataHash: result[2],
    };
  } catch (error) {
    console.error("Error getting family signers:", error);
    return null;
  }
};

export const getFamilyMembers = async (familyId) => {
  try {
    const result = await getSavingsContract().getFamilyMembers(familyId);
    return {
      addresses: result[0],
      roles: result[1].map(Number),
    };
  } catch (error) {
    console.error("Error getting family members:", error);
    return null;
  }
};

// ─── Family withdrawal flow ────────────────────────────────────────────────

export const proposeFamilyWithdrawal = async (amount, to, signer) => {
  try {
    requireSigner(signer);
    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    return await executeTransaction(
      getSavingsContract(signer).proposeFamilyWithdrawal(amountInWei, to)
    );
  } catch (error) {
    console.error("Error proposing family withdrawal:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const approveFamilyWithdrawal = async (requestId, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(
      getSavingsContract(signer).approveFamilyWithdrawal(requestId)
    );
  } catch (error) {
    console.error("Error approving family withdrawal:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const cancelFamilyWithdrawal = async (requestId, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(
      getSavingsContract(signer).cancelFamilyWithdrawal(requestId)
    );
  } catch (error) {
    console.error("Error cancelling family withdrawal:", error);
    return { success: false, error: getContractError(error) };
  }
};

// ─── Signer recovery flow ─────────────────────────────────────────────────

/**
 * Any family member can submit a recovery request for a compromised/lost signer.
 * @param {number}  familyId
 * @param {number}  signerRole  0 = Emergency, 1 = Trustee
 * @param {string}  proposedSigner  Replacement address
 * @param {string}  reasonHash  IPFS CID of supporting evidence
 */
export const requestSignerRecovery = async (familyId, signerRole, proposedSigner, reasonHash, signer) => {
  try {
    requireSigner(signer);
    if (!ethers.isAddress(proposedSigner)) throw new Error("Invalid proposed signer address.");
    return await executeTransaction(
      getSavingsContract(signer).requestSignerRecovery(familyId, signerRole, proposedSigner, reasonHash || "")
    );
  } catch (error) {
    console.error("Error requesting signer recovery:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getFamilyRecoveryRequests = async (familyId) => {
  try {
    const ids = await getSavingsContract().getFamilyRecoveryRequests(familyId);
    return ids.map(Number);
  } catch (error) {
    console.error("Error getting recovery requests:", error);
    return [];
  }
};

export const getRecoveryRequest = async (requestId) => {
  try {
    const r = await getSavingsContract().recoveryRequests(requestId);
    return {
      familyId: Number(r.familyId),
      role: Number(r.role),
      proposedSigner: r.proposedSigner,
      requester: r.requester,
      reasonHash: r.reasonHash,
      createdAt: Number(r.createdAt),
      resolved: r.resolved,
    };
  } catch (error) {
    console.error("Error getting recovery request:", error);
    return null;
  }
};

// ─── IPFS helpers (Pinata public gateway, no API key needed for reads) ────

/**
 * Upload JSON data to IPFS via the Pinata public pinning API.
 * Requires NEXT_PUBLIC_PINATA_JWT in env.
 */
export const uploadToIPFS = async (data) => {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT not set");

  const pinName =
    data?.type === "family"
      ? `healfi-family-${data.familyName || "unnamed"}`
      : `healfi-individual-${data.name || data.address || "unnamed"}`;

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ pinataContent: data, pinataMetadata: { name: pinName } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`IPFS upload failed: ${err}`);
  }

  const json = await res.json();
  return json.IpfsHash;
};

export const removePartneredFacility = async (facility, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getHSTContract(signer).removePartneredFacility(facility));
  } catch (error) {
    console.error("Error removing partnered facility:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getHSTBalance = async (address) => {
  try {
    const balance = await getHSTContract().balanceOf(address);
    return ethers.formatUnits(balance, HST_DECIMALS);
  } catch (error) {
    console.error("Error getting HST balance:", error);
    return "0";
  }
};

export const getFacilityInfo = async (facility) => {
  try {
    const info = await getHSTContract().facilityInfo(facility);
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
    return await getHSTContract().partneredFacilities(facility);
  } catch (error) {
    console.error("Error checking partnered facility:", error);
    return false;
  }
};

// Multisig Redemption Contract Functions
export const initiateRedemption = async (user, facility, hstAmount, outcomeHash, signer) => {
  try {
    requireSigner(signer);
    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), HST_DECIMALS);
    return await executeTransaction(
      getMultisigRedemptionContract(signer).initiateRedemption(user, facility, hstAmountInWei, outcomeHash)
    );
  } catch (error) {
    console.error("Error initiating redemption:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const signRedemption = async (redemptionId, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getMultisigRedemptionContract(signer).signRedemption(redemptionId));
  } catch (error) {
    console.error("Error signing redemption:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getRedemptionInfo = async (redemptionId) => {
  try {
    const redemption = await getMultisigRedemptionContract().redemptions(redemptionId);
    return {
      user: redemption.user,
      facility: redemption.facility,
      hstAmount: ethers.formatUnits(redemption.hstAmount, HST_DECIMALS),
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
export const collectFee = async (amount, signer) => {
  try {
    requireSigner(signer);
    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);

    await ensureUSDTAllowance(signer, CONTRACT_ADDRESSES.feeManagement, amountInWei);

    return await executeTransaction(getFeeManagerContract(signer).collectFee(amountInWei));
  } catch (error) {
    console.error("Error collecting fee:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const distributeRedemptionFee = async (facility, totalFee, signer) => {
  try {
    requireSigner(signer);
    const totalFeeInWei = ethers.parseUnits(totalFee.toString(), USDT_DECIMALS);
    return await executeTransaction(
      getFeeManagerContract(signer).distributeRedemptionFee(facility, totalFeeInWei)
    );
  } catch (error) {
    console.error("Error distributing redemption fee:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const withdrawFacilityBalance = async (signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getFeeManagerContract(signer).withdrawFacilityBalance());
  } catch (error) {
    console.error("Error withdrawing facility balance:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getFacilityBalance = async (facility) => {
  try {
    const balance = await getFeeManagerContract().facilityBalances(facility);
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting facility balance:", error);
    return "0";
  }
};

export const getHealfiBalance = async () => {
  try {
    const balance = await getFeeManagerContract().healfiBalance();
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting healfi balance:", error);
    return "0";
  }
};

export const getTotalFeesCollected = async () => {
  try {
    const total = await getFeeManagerContract().totalFeesCollected();
    return ethers.formatUnits(total, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting total fees collected:", error);
    return "0";
  }
};

// Loan Contract Functions
export const applyLoan = async (amount, signer) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid loan amount");
    }
    requireSigner(signer);

    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    return await executeTransaction(getLoanContract(signer).applyLoan(amountInWei));
  } catch (error) {
    console.error("Error applying for loan:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const repayLoan = async (amount, signer) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid repayment amount");
    }
    requireSigner(signer);

    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);

    await ensureUSDTAllowance(signer, CONTRACT_ADDRESSES.loan, amountInWei);

    return await executeTransaction(getLoanContract(signer).repayLoan(amountInWei));
  } catch (error) {
    console.error("Error repaying loan:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const stakeGuarantor = async (userAddress, guarantorAddress, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getLoanContract(signer).stakeGuarantor(userAddress, guarantorAddress));
  } catch (error) {
    console.error("Error staking guarantor:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getLoanInfo = async (address) => {
  try {
    const loanInfo = await getLoanContract().loans(address);
    return {
      amount: ethers.formatUnits(loanInfo.amount, USDT_DECIMALS),
      guarantor: loanInfo.guarantor,
      dueDate: new Date(Number(loanInfo.dueDate) * 1000),
      repaid: loanInfo.repaid,
      interest: ethers.formatUnits(loanInfo.interest, USDT_DECIMALS)
    };
  } catch (error) {
    console.error("Error getting loan info:", error);
    return null;
  }
};

export const checkLoanEligibility = async (address) => {
  try {
    const [isEligible, reason] = await getLoanContract().checkEligibilityWithReason(address);
    return { isEligible, reason };
  } catch (error) {
    console.error("Error checking loan eligibility:", error);
    return { isEligible: false, reason: getContractError(error) };
  }
};

export const disburseLoan = async (user, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getLoanContract(signer).disburseLoan(user));
  } catch (error) {
    console.error("Error disbursing loan:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getTotalLoansDisbursed = async () => {
  try {
    const total = await getLoanContract().totalLoansDisbursed();
    return ethers.formatUnits(total, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting total loans disbursed:", error);
    return "0";
  }
};

export const getTotalLoansRepaid = async () => {
  try {
    const total = await getLoanContract().totalLoansRepaid();
    return ethers.formatUnits(total, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting total loans repaid:", error);
    return "0";
  }
};

// Metrics Contract Functions
export const getPlatformMetrics = async () => {
  try {
    const metrics = await getMetricsContract().getPlatformMetrics();
    return {
      totalUsers: Number(metrics.totalUsers),
      totalSavings: ethers.formatUnits(metrics.totalSavings, USDT_DECIMALS),
      totalLoansDisbursed: ethers.formatUnits(metrics.totalLoansDisbursed, USDT_DECIMALS),
      totalHSTRedeemed: ethers.formatUnits(metrics._totalHSTRedeemed, HST_DECIMALS),
      totalFundsMatched: ethers.formatUnits(metrics.totalFundsMatched, USDT_DECIMALS)
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
    const total = await getMetricsContract().totalHSTRedeemed();
    return ethers.formatUnits(total, HST_DECIMALS);
  } catch (error) {
    console.error("Error getting total HST redeemed:", error);
    return "0";
  }
};

export const updateRedemptionMetrics = async (hstAmount, signer) => {
  try {
    requireSigner(signer);
    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), HST_DECIMALS);
    return await executeTransaction(getMetricsContract(signer).updateRedemptionMetrics(hstAmountInWei));
  } catch (error) {
    console.error("Error updating redemption metrics:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const batchDeposit = async (users, amounts, signer) => {
  try {
    requireSigner(signer);
    const amountsInWei = amounts.map((amount) => ethers.parseUnits(amount.toString(), USDT_DECIMALS));
    const total = amountsInWei.reduce((sum, value) => sum + value, 0n);

    await ensureUSDTAllowance(signer, CONTRACT_ADDRESSES.saving, total);

    return await executeTransaction(getSavingsContract(signer).batchDeposit(users, amountsInWei));
  } catch (error) {
    console.error("Error batch depositing:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const approveWithdrawer = async (withdrawer, familyId, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getSavingsContract(signer).approveWithdrawer(withdrawer, familyId));
  } catch (error) {
    console.error("Error approving withdrawer:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const revokeWithdrawer = async (withdrawer, familyId, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getSavingsContract(signer).revokeWithdrawer(withdrawer, familyId));
  } catch (error) {
    console.error("Error revoking withdrawer:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getSavingsInfo = async (address) => {
  try {
    const savingsInfo = await getSavingsContract().getSavingsInfo(address);
    return {
      accountType: Number(savingsInfo.accountType),
      balance: ethers.formatUnits(savingsInfo.balance, USDT_DECIMALS),
      planType: Number(savingsInfo.planType),
      streak: Number(savingsInfo.streak),
      hstEarned: ethers.formatUnits(savingsInfo.hstEarned, HST_DECIMALS),
      familyId: Number(savingsInfo.familyId),
      familyTreasuryBalance: ethers.formatUnits(savingsInfo.familyTreasuryBalance, USDT_DECIMALS),
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
    const dashboard = await getSavingsContract().getUserDashboard(address);
    return {
      balance: ethers.formatUnits(dashboard.balance, USDT_DECIMALS),
      hstEarned: ethers.formatUnits(dashboard.hstEarned, HST_DECIMALS),
      streak: Number(dashboard.streak),
      loanAmount: ethers.formatUnits(dashboard.loanAmount, USDT_DECIMALS),
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
    const balance = await getSavingsContract().getLockedBalance(address);
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting locked balance:", error);
    return "0";
  }
};

export const getFamilyInfo = async (familyId) => {
  try {
    const familyInfo = await getSavingsContract().getFamilyInfo(familyId);
    return {
      familyName: familyInfo.familyName,
      creator: familyInfo.creator,
      memberCount: Number(familyInfo.memberCount),
      treasuryBalance: ethers.formatUnits(familyInfo.treasuryBalance, USDT_DECIMALS),
      lockedTreasuryBalance: ethers.formatUnits(familyInfo.lockedTreasuryBalance, USDT_DECIMALS)
    };
  } catch (error) {
    console.error("Error getting family info:", error);
    return null;
  }
};

export const isApprovedWithdrawer = async (user, familyId) => {
  try {
    return await getSavingsContract().isApprovedWithdrawer(user, familyId);
  } catch (error) {
    console.error("Error checking approved withdrawer:", error);
    return false;
  }
};

export const isUserVerified = async (user) => {
  try {
    return await getSavingsContract().isUserVerified(user);
  } catch (error) {
    console.error("Error checking user verification status:", error);
    return false;
  }
};

// USDT Contract Functions
export const getUSDTBalance = async (address) => {
  try {
    const balance = await getUSDTContract().balanceOf(address);
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting USDT balance:", error);
    return "0";
  }
};

export const approveUSDT = async (spender, amount, signer) => {
  try {
    requireSigner(signer);
    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    return await executeTransaction(getUSDTContract(signer).approve(spender, amountInWei));
  } catch (error) {
    console.error("Error approving USDT:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const transferUSDT = async (to, amount, signer) => {
  try {
    requireSigner(signer);
    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    return await executeTransaction(getUSDTContract(signer).transfer(to, amountInWei));
  } catch (error) {
    console.error("Error transferring USDT:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const transferFromUSDT = async (from, to, amount, signer) => {
  try {
    requireSigner(signer);
    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);
    return await executeTransaction(getUSDTContract(signer).transferFrom(from, to, amountInWei));
  } catch (error) {
    console.error("Error transferring from USDT:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getUSDTAllowance = async (owner, spender) => {
  try {
    const allowance = await getUSDTContract().allowance(owner, spender);
    return ethers.formatUnits(allowance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting USDT allowance:", error);
    return "0";
  }
};

export const getNetworkName = async () => ACTIVE_CHAIN.chainName;

export const getNetworkInfo = async () => {
  try {
    const blockNumber = await getProvider().getBlockNumber();
    return {
      chainId: ACTIVE_CHAIN.id,
      name: ACTIVE_CHAIN.chainName,
      blockNumber,
    };
  } catch (error) {
    console.error("Error getting network info:", error);
    return { chainId: ACTIVE_CHAIN.id, name: ACTIVE_CHAIN.chainName, blockNumber: null };
  }
};

// How far back to scan for a user's on-chain history
const EVENT_LOOKBACK_BLOCKS = 100000;

const queryUserEvents = async (contract, eventName, address, fromBlock, toBlock, type) => {
  try {
    const logs = await contract.queryFilter(contract.filters[eventName](address), fromBlock, toBlock);
    return await Promise.all(
      logs.map(async (log) => {
        const block = await log.getBlock();
        const amount = ethers.formatUnits(log.args?.amount ?? 0n, USDT_DECIMALS);
        return {
          type,
          amount,
          details: `${amount} USDT`,
          timestamp: block.timestamp * 1000,
          txHash: log.transactionHash,
        };
      })
    );
  } catch (error) {
    console.error(`Error querying ${eventName} events:`, error);
    return [];
  }
};

// Fetch savings transaction history from contract events
export async function getSavingsTransactions(address) {
  try {
    const contract = getSavingsContract();
    const toBlock = await getProvider().getBlockNumber();
    const fromBlock = Math.max(0, toBlock - EVENT_LOOKBACK_BLOCKS);

    const [deposits, withdrawals] = await Promise.all([
      queryUserEvents(contract, "Deposit", address, fromBlock, toBlock, "Deposit"),
      queryUserEvents(contract, "Withdrawal", address, fromBlock, toBlock, "Withdrawal"),
    ]);

    return [...deposits, ...withdrawals].sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// Savings events plus loan activity
export async function getUserActivities(address) {
  try {
    const savingsContract = getSavingsContract();
    const loanContract = getLoanContract();
    const toBlock = await getProvider().getBlockNumber();
    const fromBlock = Math.max(0, toBlock - EVENT_LOOKBACK_BLOCKS);

    const activities = await Promise.all([
      queryUserEvents(savingsContract, "Deposit", address, fromBlock, toBlock, "Deposit"),
      queryUserEvents(savingsContract, "Withdrawal", address, fromBlock, toBlock, "Withdrawal"),
      queryUserEvents(loanContract, "LoanDisbursed", address, fromBlock, toBlock, "LoanDisbursed"),
      queryUserEvents(loanContract, "LoanRepaid", address, fromBlock, toBlock, "LoanRepaid"),
    ]);

    return activities.flat().sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
}

// Donor Contract Functions
export const donate = async (amount, poolType, signer) => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Invalid donation amount");
    }
    if (!poolType || (poolType !== "standard" && poolType !== "feeFree")) {
      throw new Error("Invalid pool type");
    }
    requireSigner(signer);

    const amountInWei = ethers.parseUnits(amount.toString(), USDT_DECIMALS);

    await ensureUSDTAllowance(signer, CONTRACT_ADDRESSES.donorContract, amountInWei);

    return await executeTransaction(getDonorContract(signer).donate(amountInWei, poolType));
  } catch (error) {
    console.error("Error donating:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getDonorInfo = async (address) => {
  try {
    const donorInfo = await getDonorContract().donorInfo(address);
    return {
      contribution: ethers.formatUnits(donorInfo.contribution, USDT_DECIMALS),
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

export const matchRedemption = async (user, hstAmount, facility, signer) => {
  try {
    requireSigner(signer);
    const hstAmountInWei = ethers.parseUnits(hstAmount.toString(), HST_DECIMALS);
    return await executeTransaction(getDonorContract(signer).matchRedemption(user, hstAmountInWei, facility));
  } catch (error) {
    console.error("Error matching redemption:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const setKYCStatus = async (donor, status, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getDonorContract(signer).setKYCStatus(donor, status));
  } catch (error) {
    console.error("Error setting KYC status:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const getFeeFreePoolBalance = async () => {
  try {
    const balance = await getDonorContract().feeFreePoolBalance();
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting fee free pool balance:", error);
    return "0";
  }
};

export const getStandardPoolBalance = async () => {
  try {
    const balance = await getDonorContract().standardPoolBalance();
    return ethers.formatUnits(balance, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting standard pool balance:", error);
    return "0";
  }
};

export const getTotalFundsMatched = async () => {
  try {
    const total = await getDonorContract().totalFundsMatched();
    return ethers.formatUnits(total, USDT_DECIMALS);
  } catch (error) {
    console.error("Error getting total funds matched:", error);
    return "0";
  }
};

export const getFacilityPatientsServed = async (facility) => {
  try {
    const patients = await getDonorContract().facilityPatientsServed(facility);
    return Number(patients);
  } catch (error) {
    console.error("Error getting facility patients served:", error);
    return 0;
  }
};

// HST Contract Functions
export const registerFacility = async (name, licenseNumber, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getHSTContract(signer).registerFacility(name, licenseNumber));
  } catch (error) {
    console.error("Error registering facility:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const verifyFacility = async (facility, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getHSTContract(signer).verifyFacility(facility));
  } catch (error) {
    console.error("Error verifying facility:", error);
    return { success: false, error: getContractError(error) };
  }
};

export const addPartneredFacility = async (facility, signer) => {
  try {
    requireSigner(signer);
    return await executeTransaction(getHSTContract(signer).addPartneredFacility(facility));
  } catch (error) {
    console.error("Error adding partnered facility:", error);
    return { success: false, error: getContractError(error) };
  }
};