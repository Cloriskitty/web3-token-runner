"use client"

import { useState } from "react"

import { ROUTES, type RouteName } from "@/lib/routes"

interface RouteSelectProps {
  onSelect: (route: RouteName) => void
}

export function RouteSelect({ onSelect }: RouteSelectProps) {
  const [hoveredRoute, setHoveredRoute] = useState<RouteName | null>(null)

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#0a0a1a] px-4">
      {/* Title */}
      <div className="mb-2 text-center">
        <h1
          className="mb-2 text-3xl tracking-wider text-[#00ff88] sm:text-5xl"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          WEB3 TOKEN
        </h1>
        <h1
          className="mb-4 text-3xl tracking-wider text-[#ff6b6b] sm:text-5xl"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          RUNNER
        </h1>
        <p className="mx-auto max-w-md text-sm text-gray-400">
          Dodge scam bullets. Collect real Web3 knowledge. Battle your way
          across the SF Bay crypto map.
        </p>
      </div>

      {/* Subtitle */}
      <p
        className="mb-8 text-xs tracking-widest text-[#ffe66d]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        CHOOSE YOUR PATH
      </p>

      {/* Route cards */}
      <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:gap-6">
        {(Object.keys(ROUTES) as RouteName[]).map((key) => {
          const route = ROUTES[key]
          const isHovered = hoveredRoute === key

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              onMouseEnter={() => setHoveredRoute(key)}
              onMouseLeave={() => setHoveredRoute(null)}
              className="group flex-1 rounded-lg border-2 p-6 text-left transition-all duration-200"
              style={{
                borderColor: isHovered ? route.color : "#2a2a4e",
                backgroundColor: isHovered
                  ? route.color + "20"
                  : "#1a1a2e",
                transform: isHovered ? "scale(1.03)" : "scale(1)",
                boxShadow: isHovered
                  ? `0 0 30px ${route.color}40`
                  : "none",
              }}
            >
              <div className="mb-3 text-4xl">{route.emoji}</div>
              <h2
                className="mb-2 text-lg text-white"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                {route.label}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-gray-300">
                {route.description}
              </p>
              <div
                className="inline-block rounded px-3 py-1 text-xs text-white"
                style={{ backgroundColor: route.color }}
              >
                {route.companySlugs.length} levels + Boss
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-600">
        OKX US AI-Native Hackathon 2025 &middot; SF Bay Area
      </p>
    </div>
  )
}
