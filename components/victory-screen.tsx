"use client"

import { type RouteName } from "@/lib/routes"

interface VictoryScreenProps {
  route: RouteName
  totalScore: number
  onRestart: () => void
}

export function VictoryScreen({
  route,
  totalScore,
  onRestart,
}: VictoryScreenProps) {
  const isFounder = route === "founder"

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#0a0a1a] px-6">
      <div className="mb-4 text-6xl">🏆</div>

      <h1
        className="mb-2 text-center text-2xl text-[#ffe66d] sm:text-3xl"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        VICTORY!
      </h1>

      <p
        className="mb-6 text-center text-sm"
        style={{
          fontFamily: "var(--font-pixel)",
          color: isFounder ? "#7b1fa2" : "#d32f2f",
        }}
      >
        {isFounder ? "Founder Route" : "Degen Route"} Complete
      </p>

      <p className="mb-8 max-w-md text-center text-sm text-gray-400">
        You&apos;ve conquered the SF Bay Web3 ecosystem! You dodged the scams,
        collected real knowledge, and defeated the final boss.
      </p>

      <div className="mb-8 text-center">
        <div className="text-xs text-gray-500">Final Score</div>
        <div
          className="text-4xl text-[#ffe66d]"
          style={{
            fontFamily: "var(--font-pixel)",
            textShadow: "0 0 30px #ffe66d80",
          }}
        >
          {totalScore.toLocaleString()}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="rounded-lg border-2 border-[#00ff88] bg-[#00ff8820] px-8 py-3 text-sm text-[#00ff88] transition-all hover:bg-[#00ff8840]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        PLAY AGAIN
      </button>

      <p className="mt-8 text-xs text-gray-600">
        Web3 Token Runner &middot; OKX US AI-Native Hackathon 2025
      </p>
    </div>
  )
}
