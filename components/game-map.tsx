"use client"

import { type Company } from "@/lib/companies"
import { ROUTES, type RouteName } from "@/lib/routes"

interface GameMapProps {
  route: RouteName
  companies: Company[]
  boss: Company | undefined
  completedLevels: string[]
  score: number
  health: number
  maxHealth: number
  onSelectCompany: (slug: string) => void
  onStartBoss: () => void
  onBack: () => void
}

export function GameMap({
  route,
  companies,
  boss,
  completedLevels,
  score,
  health,
  maxHealth,
  onSelectCompany,
  onStartBoss,
  onBack,
}: GameMapProps) {
  const config = ROUTES[route]
  const allCleared = companies.every((c) => completedLevels.includes(c.slug))

  return (
    <div className="flex h-dvh flex-col bg-[#0a0a1a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a4e] px-4 py-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: maxHealth }).map((_, i) => (
              <span key={i} className="text-sm" style={{ opacity: i < health ? 1 : 0.2 }}>
                ❤️
              </span>
            ))}
          </div>
          <div
            className="text-sm text-[#ffe66d]"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Route title */}
      <div className="px-4 pt-4 pb-2">
        <h2
          className="text-lg"
          style={{
            fontFamily: "var(--font-pixel)",
            color: config.color,
          }}
        >
          {config.emoji} {config.label}
        </h2>
        <p className="text-xs text-gray-500">
          Select a company to start a level
        </p>
      </div>

      {/* Company list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid gap-2">
          {companies.map((company) => {
            const isCompleted = completedLevels.includes(company.slug)

            return (
              <button
                key={company.slug}
                onClick={() => !isCompleted && onSelectCompany(company.slug)}
                disabled={isCompleted}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all"
                style={{
                  borderColor: isCompleted ? "#1a3a2e" : "#2a2a4e",
                  backgroundColor: isCompleted ? "#0a1a15" : "#1a1a2e",
                  opacity: isCompleted ? 0.6 : 1,
                }}
              >
                {/* Category dot */}
                <div
                  className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: isCompleted ? "#00ff8830" : config.color + "30",
                    border: `2px solid ${isCompleted ? "#00ff88" : config.color}`,
                  }}
                >
                  {isCompleted ? "✓" : company.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {company.name}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: config.color + "30",
                        color: config.color,
                      }}
                    >
                      {company.category}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {company.shortDescription}
                  </p>
                </div>

                {!isCompleted && (
                  <div className="text-xs text-gray-500">▶</div>
                )}
              </button>
            )
          })}

          {/* Boss */}
          {boss && (
            <button
              onClick={onStartBoss}
              disabled={!allCleared}
              className="mt-2 flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all"
              style={{
                borderColor: allCleared ? "#ff6b6b" : "#2a2a4e",
                backgroundColor: allCleared ? "#ff6b6b15" : "#1a1a2e",
                opacity: allCleared ? 1 : 0.4,
                boxShadow: allCleared ? "0 0 20px #ff6b6b20" : "none",
              }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#ff6b6b] bg-[#ff6b6b30] text-xl">
                ⚔️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm text-[#ff6b6b]"
                    style={{ fontFamily: "var(--font-pixel)" }}
                  >
                    BOSS: {boss.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {allCleared
                    ? "All levels cleared! Ready to fight the boss."
                    : `Clear all ${companies.length} levels to unlock`}
                </p>
              </div>
              {allCleared && (
                <div className="animate-pulse text-lg text-[#ff6b6b]">⚔️</div>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
