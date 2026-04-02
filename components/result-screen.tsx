"use client"

import { type LevelResult } from "@/lib/game-state"

interface ResultScreenProps {
  result: LevelResult
  companyName: string
  totalScore: number
  completedCount: number
  totalLevels: number
  canStartBoss: boolean
  onContinue: () => void
  onBoss: () => void
}

export function ResultScreen({
  result,
  companyName,
  totalScore,
  completedCount,
  totalLevels,
  canStartBoss,
  onContinue,
  onBoss,
}: ResultScreenProps) {
  const grade =
    result.maxCombo >= 15
      ? "S"
      : result.maxCombo >= 10
        ? "A"
        : result.maxCombo >= 5
          ? "B"
          : "C"

  const gradeColor =
    grade === "S"
      ? "#ff00ff"
      : grade === "A"
        ? "#ffe66d"
        : grade === "B"
          ? "#00ff88"
          : "#ffffff"

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#0a0a1a] px-6">
      {/* Status */}
      <div
        className="mb-4 text-xl"
        style={{
          fontFamily: "var(--font-pixel)",
          color: result.cleared ? "#00ff88" : "#ff4757",
        }}
      >
        {result.cleared ? "LEVEL CLEAR!" : "GAME OVER"}
      </div>

      {/* Company name */}
      <div className="mb-6 text-sm text-gray-400">{companyName}</div>

      {/* Grade */}
      <div
        className="mb-6 text-6xl font-bold"
        style={{
          fontFamily: "var(--font-pixel)",
          color: gradeColor,
          textShadow: `0 0 30px ${gradeColor}80`,
        }}
      >
        {grade}
      </div>

      {/* Stats */}
      <div className="mb-8 grid w-full max-w-xs grid-cols-2 gap-3">
        <StatBox label="Score" value={result.score.toLocaleString()} color="#ffe66d" />
        <StatBox label="Tokens" value={`${result.tokensCollected}`} color="#00ff88" />
        <StatBox label="Hits Taken" value={`${result.bulletsHit}`} color="#ff4757" />
        <StatBox label="Max Combo" value={`${result.maxCombo}x`} color="#a855f7" />
      </div>

      {/* Progress */}
      <div className="mb-6 text-center">
        <div className="mb-1 text-xs text-gray-500">Progress</div>
        <div className="flex gap-1">
          {Array.from({ length: totalLevels }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-6 rounded-sm"
              style={{
                backgroundColor:
                  i < completedCount ? "#00ff88" : "#2a2a4e",
              }}
            />
          ))}
          <div
            className="h-3 w-8 rounded-sm border"
            style={{
              backgroundColor: canStartBoss ? "#ff6b6b40" : "#2a2a4e",
              borderColor: canStartBoss ? "#ff6b6b" : "#2a2a4e",
            }}
          >
            {canStartBoss && (
              <span className="flex h-full items-center justify-center text-[6px] text-[#ff6b6b]">
                BOSS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total score */}
      <div className="mb-6 text-center">
        <div className="text-xs text-gray-500">Total Score</div>
        <div
          className="text-2xl text-[#ffe66d]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {totalScore.toLocaleString()}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onContinue}
          className="rounded-lg border-2 border-[#00ff88] bg-[#00ff8820] px-6 py-3 text-sm text-[#00ff88] transition-all hover:bg-[#00ff8840]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {canStartBoss ? "BACK TO MAP" : "CONTINUE"}
        </button>
        {canStartBoss && (
          <button
            onClick={onBoss}
            className="animate-pulse rounded-lg border-2 border-[#ff6b6b] bg-[#ff6b6b20] px-6 py-3 text-sm text-[#ff6b6b] transition-all hover:bg-[#ff6b6b40]"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            ⚔️ BOSS FIGHT
          </button>
        )}
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-[#2a2a4e] bg-[#1a1a2e] p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className="text-lg"
        style={{ fontFamily: "var(--font-pixel)", color }}
      >
        {value}
      </div>
    </div>
  )
}
