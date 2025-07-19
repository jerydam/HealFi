import { NextResponse } from "next/server";
import { getUserIdentifier, SelfBackendVerifier } from "@selfxyz/core";
import { setUserVerified } from "@/lib/web3";

export async function POST(req) {
  try {
    const body = await req.json();
    const { proof, publicSignals, userAddress } = body;

    if (!proof || !publicSignals || !userAddress) {
      return NextResponse.json(
        { message: "Proof, publicSignals, and userAddress are required" },
        { status: 400 }
      );
    }

    const selfBackendVerifier = new SelfBackendVerifier(
      "HEALFI-scope",
      process.env.NEXT_PUBLIC_SELF_BACKEND_URL,
      "uuid"
    );

    const result = await selfBackendVerifier.verify(proof, publicSignals);

    if (result.isValid) {
      // Store verification status on-chain
      const verificationResult = await setUserVerified(userAddress, true);
      if (!verificationResult.success) {
        throw new Error("Failed to store verification status on-chain");
      }
      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result,
        txHash: verificationResult.txHash
      });
    } else {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: "Verification failed",
          details: result.isValidDetails
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        message: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}