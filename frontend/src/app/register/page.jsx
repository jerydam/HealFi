"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Users, User, Plus, Trash, ShieldCheck } from "lucide-react"
import { registerIndividual, registerFamily, connectWallet } from "@/lib/web3"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Individual registration state
  const [individualPlan, setIndividualPlan] = useState("0") // 0 = Basic, 1 = Premium
  const [detailsHash, setDetailsHash] = useState("")
  const [referrer, setReferrer] = useState("")

  // Family registration state
  const [familyPlan, setFamilyPlan] = useState("0")
  const [familyMembers, setFamilyMembers] = useState([{ address: "", detailsHash: "" }])
  const [familyName, setFamilyName] = useState("")

  const handleAddFamilyMember = () => {
    setFamilyMembers([...familyMembers, { address: "", detailsHash: "" }])
  }

  const handleRemoveFamilyMember = (index) => {
    const updatedMembers = [...familyMembers]
    updatedMembers.splice(index, 1)
    setFamilyMembers(updatedMembers)
  }

  const handleFamilyMemberChange = (index, field, value) => {
    const updatedMembers = [...familyMembers]
    updatedMembers[index][field] = value
    setFamilyMembers(updatedMembers)
  }

  const handleIndividualRegistration = async () => {
    setIsRegistering(true);
    setError("");
    setSuccess("");

    try {
      // Validate inputs
      if (!detailsHash || detailsHash.length < 40) {
        setError("Please provide a valid details hash (minimum 40 characters).");
        setIsRegistering(false);
        return;
      }
      
      const referrerAddress = referrer && referrer.match(/^0x[a-fA-F0-9]{40}$/) ? referrer : "0x0000000000000000000000000000000000000000";

      // Connect wallet first
      const walletResult = await connectWallet();
      if (!walletResult.success) {
        setError("Failed to connect wallet: " + walletResult.error);
        setIsRegistering(false);
        return;
      }

      const result = await registerIndividual(Number.parseInt(individualPlan), detailsHash, referrerAddress);
      if (result.success) {
        setSuccess("Registration successful! Redirecting to verification...");
        setTimeout(() => {
          router.push("/verify");
        }, 2000);
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("Registration failed: " + error.message);
      console.error("Error registering individual:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleFamilyRegistration = async () => {
    setIsRegistering(true);
    setError("");
    setSuccess("");

    try {
      // Validate family members
      const validMembers = familyMembers.filter((member) => 
        member.address.match(/^0x[a-fA-F0-9]{40}$/) && 
        member.detailsHash && member.detailsHash.length >= 40
      );
      
      if (validMembers.length < 2) {
        setError("Please add at least 2 valid family members with addresses and details hashes.");
        setIsRegistering(false);
        return;
      }
      
      if (!familyName.trim()) {
        setError("Please provide a family name.");
        setIsRegistering(false);
        return;
      }

      // Connect wallet first
      const walletResult = await connectWallet();
      if (!walletResult.success) {
        setError("Failed to connect wallet: " + walletResult.error);
        setIsRegistering(false);
        return;
      }

      const result = await registerFamily(validMembers, Number.parseInt(familyPlan), familyName, "0x0000000000000000000000000000000000000000");
      if (result.success) {
        setSuccess("Family registration successful! Redirecting to verification...");
        setTimeout(() => {
          router.push("/verify");
        }, 2000);
      } else {
        setError(result.error || "Family registration failed. Please try again.");
      }
    } catch (error) {
      setError("Registration failed: " + error.message);
      console.error("Error registering family:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Register with HealFi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Choose your account type and start your healthcare savings journey
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center text-blue-800 dark:text-blue-300">
              <ShieldCheck className="mr-2 h-5 w-5" />
              <p className="text-sm">After registration, you'll be redirected to verify your identity</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Individual</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Family</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Individual Registration</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Register as an individual to start saving for your healthcare needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="detailsHash">Details Hash (IPFS CID)</Label>
                    <Input
                      id="detailsHash"
                      placeholder="Enter your details hash (e.g., QmYourIPFSHash...)"
                      value={detailsHash}
                      onChange={(e) => setDetailsHash(e.target.value)}
                      className="dark:border-gray-700"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This should be an IPFS hash containing your personal details (minimum 40 characters)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referrer">Referrer Address (Optional)</Label>
                    <Input
                      id="referrer"
                      placeholder="0x... (optional)"
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                      className="dark:border-gray-700"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter the wallet address of who referred you (optional)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Plan Type</Label>
                    <RadioGroup
                      defaultValue="0"
                      value={individualPlan}
                      onValueChange={setIndividualPlan}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="basic" />
                        <Label htmlFor="basic" className="cursor-pointer flex items-center">
                          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 mr-2">
                            <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">Basic Plan</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Standard healthcare savings</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="premium" />
                        <Label htmlFor="premium" className="cursor-pointer flex items-center">
                          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 mr-2">
                            <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">Premium Plan</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Enhanced benefits & rewards</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-2">Plan Benefits:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Save for healthcare expenses</li>
                      <li>Earn HST tokens for consistent savings</li>
                      <li>Access to microloans when needed</li>
                      <li>Discounts at partner healthcare facilities</li>
                      {individualPlan === "1" && (
                        <>
                          <li>Higher loan limits</li>
                          <li>Priority access to healthcare partners</li>
                          <li>Additional HST token rewards</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleIndividualRegistration}
                  disabled={isRegistering}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isRegistering ? "Registering..." : "Register as Individual"}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="family">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Family Registration</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Register as a family to pool resources and save together
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      placeholder="Enter your family name"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="dark:border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Plan Type</Label>
                    <RadioGroup
                      defaultValue="0"
                      value={familyPlan}
                      onValueChange={setFamilyPlan}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="family-basic" />
                        <Label htmlFor="family-basic" className="cursor-pointer flex items-center">
                          <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2 mr-2">
                            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">Family Basic Plan</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Shared healthcare savings</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="family-premium" />
                        <Label htmlFor="family-premium" className="cursor-pointer flex items-center">
                          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 mr-2">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium dark:text-white">Family Premium Plan</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Enhanced family benefits</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <Label>Family Members</Label>
                    {familyMembers.map((member, index) => (
                      <div key={index} className="space-y-2 p-4 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Member {index + 1}</Label>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFamilyMember(index)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-auto"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Wallet Address (0x...)"
                          value={member.address}
                          onChange={(e) => handleFamilyMemberChange(index, "address", e.target.value)}
                          className="dark:border-gray-700"
                        />
                        <Input
                          placeholder="Details Hash (IPFS CID, minimum 40 characters)"
                          value={member.detailsHash}
                          onChange={(e) => handleFamilyMemberChange(index, "detailsHash", e.target.value)}
                          className="dark:border-gray-700"
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddFamilyMember}
                      className="mt-2 dark:border-gray-700 dark:text-gray-200"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Family Member
                    </Button>
                  </div>

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-2">Family Plan Benefits:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Pool resources for family healthcare needs</li>
                      <li>Shared savings and loan eligibility</li>
                      <li>Family treasury for emergency healthcare</li>
                      <li>Discounts at partner healthcare facilities</li>
                      {familyPlan === "1" && (
                        <>
                          <li>Higher combined loan limits</li>
                          <li>Priority access for all family members</li>
                          <li>Enhanced HST token rewards</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  onClick={handleFamilyRegistration}
                  disabled={isRegistering}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  {isRegistering ? "Registering..." : "Register as Family"}
                </Button>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}