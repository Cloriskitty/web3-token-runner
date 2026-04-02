"use client"

import { useEffect, useState } from "react"

import { type Company } from "@/lib/companies"

interface BossIntroProps {
  boss: Company
  onReady: () => void
}

export function BossIntro({ boss, onReady }: BossIntroProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
    const timer = setTimeout(onReady, 4000)
    return () => clearTimeout(timer)
  }, [onReady])

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#0d0015]">
      {/* Warning flash */}
      <div
        className="absolute inset-0 animate-pulse bg-[#ff000010]"
        style={{ animationDuration: "0.5s" }}
      />

      <div
        className="text-center transition-all duration-1000"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.5)",
        }}
      >
        <div
          className="mb-2 text-xs tracking-widest text-[#ff6b6b]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          ⚠️ WARNING ⚠️
        </div>

        <div
          className="mb-4 text-3xl text-[#ff6b6b] sm:text-4xl"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          BOSS BATTLE
        </div>

        <div className="mb-2 text-6xl">⚔️</div>

        <div
          className="mb-2 text-xl text-white"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {boss.name}
        </div>

        <p className="mx-auto mb-4 max-w-sm text-sm text-gray-400">
          {boss.whyItMatters}
        </p>

        <div className="animate-pulse text-xs text-gray-600">
          Get ready...
        </div>
      </div>
    </div>
  )
}
