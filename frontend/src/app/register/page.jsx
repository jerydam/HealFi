"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Users, User, Plus, Trash2, ShieldCheck, Shield, AlertCircle } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"
import { registerIndividual, registerFamily, uploadToIPFS } from "@/lib/web3"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"

// TODO: replace with the real contract owner address (or wire this up to a
// getContractOwner()-style read call once you have one available).
const DEFAULT_REFERRER_ADDRESS = "0xB591842B0F3976373FdC06d3fA745C836c942cC3"

const MEMBER_ROLES = [
  { value: "0", label: "Unspecified" },
  { value: "1", label: "Father" },
  { value: "2", label: "Mother" },
  { value: "3", label: "Child" },
  { value: "4", label: "Guardian" },
  { value: "5", label: "Sibling" },
  { value: "6", label: "Other" },
]

const PLAN_TYPES = [
  { value: "0", label: "Daily", description: "Deposit every day" },
  { value: "1", label: "Weekly", description: "Deposit every week" },
  { value: "2", label: "Monthly", description: "Deposit every month" },
]

function isValidAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

export default function RegisterPage() {
  const router = useRouter()
  const { address, isConnected, getSigner } = useWallet()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [statusMsg, setStatusMsg] = useState("")

  // ── Individual state ─────────────────────────────────────────────────────
  const [indPlan, setIndPlan] = useState("0")
  const [indName, setIndName] = useState("")
  // Defaults to the platform's referrer address; the creator can overwrite it.
  const [indReferrer, setIndReferrer] = useState(DEFAULT_REFERRER_ADDRESS)

  // ── Family state ──────────────────────────────────────────────────────────
  const [famPlan, setFamPlan] = useState("0")
  const [famName, setFamName] = useState("")
  // Defaults to the platform's referrer address; the creator can overwrite it.
  const [famReferrer, setFamReferrer] = useState(DEFAULT_REFERRER_ADDRESS)
  // Defaults to the connected wallet (the person creating the family account).
  // isConnected is guaranteed true by the time this renders (see early return
  // below), so `address` is available here.
  const [emergencySigner, setEmergencySigner] = useState(address || "")
  const [trusteeSigner, setTrusteeSigner] = useState("")
  // Each member: { name, address, role }
  const [famMembers, setFamMembers] = useState([
    { name: "", address: address || "", role: "1" }, // Father placeholder — creator by default
    { name: "", address: "", role: "2" }, // Mother placeholder
  ])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMember = () =>
    setFamMembers((prev) => [...prev, { name: "", address: "", role: "0" }])

  const removeMember = (i) => {
    if (famMembers.length <= 2) return
    setFamMembers((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateMember = (i, field, value) => {
    setFamMembers((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  // ── Individual registration ───────────────────────────────────────────────
  const handleIndividualRegistration = async () => {
    setError("")
    setSuccess("")
    setStatusMsg("")

    if (!indName.trim()) {
      setError("Please enter your full name.")
      return
    }

    setIsRegistering(true)
    try {
      const signer = await getSigner()
      const userAddress = await signer.getAddress()

      // Build off-chain record and pin to IPFS
      setStatusMsg("Uploading details to IPFS…")
      const ipfsData = {
        type: "individual",
        name: indName.trim(),
        address: userAddress,
        timestamp: new Date().toISOString(),
      }
      const cid = await uploadToIPFS(ipfsData)

      const referrerAddress =
        indReferrer && isValidAddress(indReferrer) ? indReferrer : ethers.ZeroAddress

      setStatusMsg("Sending registration transaction…")
      const result = await registerIndividual(parseInt(indPlan), cid, referrerAddress, signer)

      if (result.success) {
        setSuccess("Registration successful! Redirecting to dashboard…")
        setTimeout(() => router.push("/dashboard"), 2000)
      } else {
        setError("Registration failed: " + result.error)
      }
    } catch (err) {
      setError("Registration failed: " + err.message)
    } finally {
      setIsRegistering(false)
      setStatusMsg("")
    }
  }

  // ── Family registration ───────────────────────────────────────────────────
  const handleFamilyRegistration = async () => {
    setError("")
    setSuccess("")
    setStatusMsg("")

    // Validation
    if (!famName.trim()) { setError("Please enter a family name."); return }
    if (!isValidAddress(emergencySigner)) { setError("Emergency signer must be a valid wallet address."); return }
    if (!isValidAddress(trusteeSigner)) { setError("Trustee signer must be a valid wallet address."); return }
    if (emergencySigner.toLowerCase() === trusteeSigner.toLowerCase()) {
      setError("Emergency signer and trustee signer must be different addresses.")
      return
    }

    const validMembers = famMembers.filter(
      (m) => m.address.trim() && isValidAddress(m.address.trim())
    )
    if (validMembers.length < 2) {
      setError("At least 2 family members with valid wallet addresses are required.")
      return
    }

    const memberAddrs = validMembers.map((m) => m.address.toLowerCase())
    if (!memberAddrs.includes(emergencySigner.toLowerCase())) {
      setError("Emergency signer must be one of the family members.")
      return
    }
    if (!memberAddrs.includes(trusteeSigner.toLowerCase())) {
      setError("Trustee signer must be one of the family members.")
      return
    }

    setIsRegistering(true)
    try {
      const signer = await getSigner()

      // Build off-chain family record with names
      setStatusMsg("Uploading family details to IPFS…")
      const ipfsData = {
        type: "family",
        familyName: famName.trim(),
        members: validMembers.map((m) => ({
          name: m.name.trim() || "Unknown",
          address: m.address.trim(),
          role: MEMBER_ROLES.find((r) => r.value === m.role)?.label || "Unspecified",
        })),
        emergencySigner,
        trusteeSigner,
        timestamp: new Date().toISOString(),
      }
      const cid = await uploadToIPFS(ipfsData)

      // Build on-chain members array (address + role enum index)
      const onChainMembers = validMembers.map((m) => ({
        member: m.address.trim(),
        role: parseInt(m.role),
      }))

      const referrerAddress =
        famReferrer && isValidAddress(famReferrer) ? famReferrer : ethers.ZeroAddress

      setStatusMsg("Sending family registration transaction…")
      const result = await registerFamily(
        onChainMembers,
        parseInt(famPlan),
        famName.trim(),
        cid,
        emergencySigner,
        trusteeSigner,
        referrerAddress,
        signer
      )

      if (result.success) {
        setSuccess("Family registration successful! Redirecting to dashboard…")
        setTimeout(() => router.push("/dashboard"), 2000)
      } else {
        setError("Family registration failed: " + result.error)
      }
    } catch (err) {
      setError("Registration failed: " + err.message)
    } finally {
      setIsRegistering(false)
      setStatusMsg("")
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Please connect your wallet to register with HealFi
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use the "Connect Wallet" button in the navigation bar to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Register with HealFi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Choose your account type and start your healthcare savings journey
          </p>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Connected:</strong> {address.slice(0, 6)}…{address.slice(-4)}
            </p>
          </div>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Individual
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Family
            </TabsTrigger>
          </TabsList>

          {/* ── INDIVIDUAL ─────────────────────────────────────────────── */}
          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Individual Registration</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Register as an individual to start saving for your healthcare needs.
                  Your name is stored securely on IPFS; only the hash lives on-chain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="indName">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="indName"
                    placeholder="e.g. Amara Okafor"
                    value={indName}
                    onChange={(e) => setIndName(e.target.value)}
                    disabled={isRegistering}
                    className="dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Stored off-chain on IPFS — only the content hash is recorded on-chain.
                  </p>
                </div>

                {/* Plan */}
                <div className="space-y-2">
                  <Label>Savings Plan <span className="text-red-500">*</span></Label>
                  <RadioGroup
                    value={indPlan}
                    onValueChange={setIndPlan}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    disabled={isRegistering}
                  >
                    {PLAN_TYPES.map((p) => (
                      <div key={p.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={p.value} id={`ind-plan-${p.value}`} />
                        <Label htmlFor={`ind-plan-${p.value}`} className="cursor-pointer flex items-center gap-2">
                          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                            <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">{p.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Referrer */}
                <div className="space-y-2">
                  <Label htmlFor="indReferrer">Referrer Address <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    id="indReferrer"
                    placeholder="0x…"
                    value={indReferrer}
                    onChange={(e) => setIndReferrer(e.target.value)}
                    disabled={isRegistering}
                    className="dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Defaults to the platform address — change it if you were referred by someone else.
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Benefits</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Save for healthcare expenses</li>
                    <li>Earn HST tokens for consistent savings</li>
                    <li>Access to microloans when needed</li>
                    <li>Discounts at partner healthcare facilities</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {statusMsg && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 text-center">{statusMsg}</p>
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                <Button
                  onClick={handleIndividualRegistration}
                  disabled={isRegistering}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isRegistering ? "Registering…" : "Register as Individual"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── FAMILY ─────────────────────────────────────────────────── */}
          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Family Registration</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Pool resources and save together. Member names are stored on IPFS;
                  only addresses and the content hash live on-chain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Family name */}
                <div className="space-y-2">
                  <Label htmlFor="famName">Family Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="famName"
                    placeholder="e.g. The Okafor Family"
                    value={famName}
                    onChange={(e) => setFamName(e.target.value)}
                    disabled={isRegistering}
                    className="dark:border-gray-700"
                  />
                </div>

                {/* Plan */}
                <div className="space-y-2">
                  <Label>Savings Plan <span className="text-red-500">*</span></Label>
                  <RadioGroup
                    value={famPlan}
                    onValueChange={setFamPlan}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    disabled={isRegistering}
                  >
                    {PLAN_TYPES.map((p) => (
                      <div key={p.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={p.value} id={`fam-plan-${p.value}`} />
                        <Label htmlFor={`fam-plan-${p.value}`} className="cursor-pointer flex items-center gap-2">
                          <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
                            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">{p.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Family members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Family Members <span className="text-red-500">*</span></Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Minimum 2</span>
                  </div>

                  {famMembers.map((member, i) => (
                    <div
                      key={i}
                      className="p-4 border rounded-lg dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium dark:text-white">
                          Member {i + 1}
                          {member.address &&
                            address &&
                            member.address.toLowerCase() === address.toLowerCase() && (
                              <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                (you)
                              </span>
                            )}
                        </span>
                        {famMembers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeMember(i)}
                            disabled={isRegistering}
                            className="text-red-500 hover:text-red-700 disabled:opacity-40"
                            aria-label="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Name */}
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="Full name"
                            value={member.name}
                            onChange={(e) => updateMember(i, "name", e.target.value)}
                            disabled={isRegistering}
                            className="dark:border-gray-700"
                          />
                        </div>
                        {/* Role */}
                        <div className="space-y-1">
                          <Label className="text-xs">Role</Label>
                          <Select
                            value={member.role}
                            onValueChange={(v) => updateMember(i, "role", v)}
                            disabled={isRegistering}
                          >
                            <SelectTrigger className="dark:border-gray-700">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {MEMBER_ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Wallet address */}
                      <div className="space-y-1">
                        <Label className="text-xs">Wallet Address <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="0x…"
                          value={member.address}
                          onChange={(e) => updateMember(i, "address", e.target.value)}
                          disabled={isRegistering}
                          className={`dark:border-gray-700 ${
                            member.address && !isValidAddress(member.address)
                              ? "border-red-400 focus:ring-red-400"
                              : ""
                          }`}
                        />
                        {member.address && !isValidAddress(member.address) && (
                          <p className="text-xs text-red-500">Invalid address</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMember}
                    disabled={isRegistering}
                    className="dark:border-gray-700 dark:text-gray-200"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Family Member
                  </Button>
                </div>

                {/* Signers */}
                <div className="space-y-4 rounded-lg border border-blue-200 dark:border-blue-800 p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold text-sm">Transaction Signers</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencySigner" className="flex items-center gap-1 text-blue-900 dark:text-blue-200">
                      Emergency Signer <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencySigner"
                      placeholder="0x… (must be a family member)"
                      value={emergencySigner}
                      onChange={(e) => setEmergencySigner(e.target.value)}
                      disabled={isRegistering}
                      className="dark:border-blue-700 bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Registers the family and proposes outbound transactions. Must be a listed member.
                      Defaults to your connected wallet — change it if someone else should hold this role.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trusteeSigner" className="flex items-center gap-1 text-blue-900 dark:text-blue-200">
                      Trustee Signer <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trusteeSigner"
                      placeholder="0x… (must be a different family member)"
                      value={trusteeSigner}
                      onChange={(e) => setTrusteeSigner(e.target.value)}
                      disabled={isRegistering}
                      className="dark:border-blue-700 bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Must co-sign every outbound family transaction. Must be a listed member and different from the emergency signer.
                    </p>
                  </div>
                </div>

                {/* Signer recovery info */}
                <div className="flex gap-2 rounded-lg border border-amber-200 dark:border-amber-800 p-3 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    If a signer loses access or is compromised, any family member can request signer recovery.
                    The platform owner can then rotate the signer address for your family on-chain using your Family ID.
                  </p>
                </div>

                {/* Referrer */}
                <div className="space-y-2">
                  <Label htmlFor="famReferrer">Referrer Address <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    id="famReferrer"
                    placeholder="0x…"
                    value={famReferrer}
                    onChange={(e) => setFamReferrer(e.target.value)}
                    disabled={isRegistering}
                    className="dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Defaults to the platform address — change it if you were referred by someone else.
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-300">
                  <p className="font-medium mb-1">Family Plan Benefits</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Shared treasury for family healthcare emergencies</li>
                    <li>2-of-2 multisig protection on all withdrawals</li>
                    <li>Signer recovery if a key is lost or compromised</li>
                    <li>Discounts at partner healthcare facilities</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                {statusMsg && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 text-center">{statusMsg}</p>
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                <Button
                  onClick={handleFamilyRegistration}
                  disabled={isRegistering}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isRegistering ? "Registering…" : "Register Family"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}