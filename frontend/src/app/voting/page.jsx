"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"

export default function VotingPage() {
  const { address, isConnected, isReconnecting, getSigner } = useWallet()

  const [proposalTitle, setProposalTitle] = useState("")
  const [proposalDescription, setProposalDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleVoteFor = async (proposalId) => {
    setError("")
    setSuccess("")
    try {
      // Placeholder: Implement vote for logic with smart contract
      // Example: await voteForProposal(proposalId)
      setSuccess(`Voted for proposal ${proposalId}! (Placeholder)`)
    } catch (error) {
      setError("Failed to vote. Please try again.")
      console.error(error)
    }
  }

  const handleVoteAgainst = async (proposalId) => {
    setError("")
    setSuccess("")
    try {
      // Placeholder: Implement vote against logic with smart contract
      // Example: await voteAgainstProposal(proposalId)
      setSuccess(`Voted against proposal ${proposalId}! (Placeholder)`)
    } catch (error) {
      setError("Failed to vote. Please try again.")
      console.error(error)
    }
  }

  const handleSubmitProposal = async () => {
    if (!proposalTitle || !proposalDescription) {
      setError("Please provide a title and description for the proposal")
      return
    }
    setIsSubmitting(true)
    setError("")
    setSuccess("")
    try {
      // Placeholder: Implement proposal submission logic with smart contract
      // Example: await submitProposal(proposalTitle, proposalDescription)
      setSuccess("Proposal submitted! (Placeholder)")
      setProposalTitle("")
      setProposalDescription("")
    } catch (error) {
      setError("Failed to submit proposal. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected && !isReconnecting) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-md mx-auto text-center">
          <Send className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Please connect your wallet to participate in voting</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use the &quot;Connect Wallet&quot; button in the navigation bar to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 sm:py-8">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight dark:text-white">Community Voting</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Vote on proposals to shape the HealFi ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="dark:text-white">Active Proposals</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Review and vote on community proposals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Placeholder: Proposal data should be fetched from a contract */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Proposals Not Available</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Voting proposals not implemented yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please check back later for active community proposals.
                  </p>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button
                    onClick={() => handleVoteFor(1)}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" /> Vote For
                  </Button>
                  <Button
                    onClick={() => handleVoteAgainst(1)}
                    variant="outline"
                    className="dark:border-gray-700 dark:text-gray-200"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" /> Vote Against
                  </Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Submit a Proposal</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Share your ideas for the HealFi community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300">Proposal Title</label>
                <Input
                  placeholder="Enter proposal title"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-300">Description</label>
                <Textarea
                  placeholder="Describe your proposal"
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                onClick={handleSubmitProposal}
                disabled={isSubmitting || !proposalTitle || !proposalDescription}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Proposal
                  </>
                )}
              </Button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}