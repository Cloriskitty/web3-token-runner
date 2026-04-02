"use client"

interface HudProps {
  health: number
  maxHealth: number
  score: number
  combo: number
  companyName: string
  timeLeft: number
  isBoss?: boolean
}

export function Hud({
  health,
  maxHealth,
  score,
  combo,
  companyName,
  timeLeft,
  isBoss,
}: HudProps) {
  const comboColor =
    combo >= 20
      ? "#ff00ff"
      : combo >= 10
        ? "#ffe66d"
        : combo >= 5
          ? "#00ff88"
          : "#ffffff"

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-3">
      {/* Left: Health + Company */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {Array.from({ length: maxHealth }).map((_, i) => (
            <span
              key={i}
              className="text-lg"
              style={{ opacity: i < health ? 1 : 0.2 }}
            >
              {i < health ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
        <div
          className="text-xs text-white/80"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {isBoss ? "⚔️ BOSS: " : "📍 "}
          {companyName}
        </div>
      </div>

      {/* Center: Timer */}
      <div className="flex flex-col items-center">
        <div
          className="text-lg tabular-nums"
          style={{
            fontFamily: "var(--font-pixel)",
            color: timeLeft <= 5 ? "#ff4757" : "#ffffff",
          }}
        >
          {Math.ceil(timeLeft)}s
        </div>
      </div>

      {/* Right: Score + Combo */}
      <div className="flex flex-col items-end gap-1">
        <div
          className="text-lg text-[#ffe66d]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {score.toLocaleString()}
        </div>
        {combo >= 3 && (
          <div
            className="animate-pulse text-xs"
            style={{
              fontFamily: "var(--font-pixel)",
              color: comboColor,
            }}
          >
            {combo}x COMBO!
          </div>
        )}
      </div>
    </div>
  )
}
