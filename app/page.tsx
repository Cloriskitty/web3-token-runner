// app/page.tsx — NEW state machine: map → playing → result/victory → map
"use client"

import { useCallback, useReducer } from "react"
import {
  createInitialState,
  gameReducer,
  type LevelResult,
} from "@/lib/game-state"
import { COMPANIES } from "@/lib/companies"
import { MapScreen } from "@/components/map-screen"
import { BulletGame } from "@/components/bullet-game"
import { ResultScreen } from "@/components/result-screen"
import { VictoryScreen } from "@/components/victory-screen"

const BOSS_SLUG = "coinbase"

export default function Page() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  const handleStartLevel = useCallback(
    (companySlug: string) => dispatch({ type: "START_LEVEL", companySlug }),
    []
  )
  const handleCollectToken = useCallback(
    (points: number) => dispatch({ type: "COLLECT_TOKEN", points }),
    []
  )
  const handleHitBullet = useCallback(
    () => dispatch({ type: "HIT_BULLET" }),
    []
  )
  const handleFinish = useCallback(
    (result: LevelResult) => dispatch({ type: "END_LEVEL", result }),
    []
  )
  const handleBackToMap = useCallback(
    () => dispatch({ type: "BACK_TO_MAP" }),
    []
  )
  const handleRestart = useCallback(
    () => dispatch({ type: "RESTART" }),
    []
  )

  // ── Map: company selection ──────────────────────────────────
  if (state.phase === "map") {
    return (
      <MapScreen
        completedLevels={state.completedLevels}
        totalScore={state.score}
        onSelectCompany={handleStartLevel}
      />
    )
  }

  // ── Playing: bullet game ────────────────────────────────────
  if (state.phase === "playing" && state.currentCompanySlug) {
    const company = COMPANIES.find((c) => c.slug === state.currentCompanySlug)
    if (!company) return null
    const isBoss = company.slug === BOSS_SLUG
    return (
      <BulletGame
        company={company}
        isBoss={isBoss}
        health={state.health}
        maxHealth={state.maxHealth}
        score={state.score}
        combo={state.combo}
        onCollectToken={handleCollectToken}
        onHitBullet={handleHitBullet}
        onFinish={handleFinish}
      />
    )
  }

  // ── Result: level over (not boss) ───────────────────────────
  if (state.phase === "result") {
    const lastResult = state.levelResults[state.levelResults.length - 1]
    const companyName =
      COMPANIES.find((c) => c.slug === lastResult.companySlug)?.name ?? ""
    const okxDone = state.completedLevels.includes("okx-sj")
    return (
      <ResultScreen
        result={lastResult}
        companyName={companyName}
        totalScore={state.score}
        completedCount={state.completedLevels.length}
        totalLevels={2}
        canStartBoss={okxDone}
        onContinue={handleBackToMap}
        onBoss={() => handleStartLevel(BOSS_SLUG)}
      />
    )
  }

  // ── Victory ─────────────────────────────────────────────────
  if (state.phase === "victory") {
    return (
      <VictoryScreen
        route="degen"
        totalScore={state.score}
        onRestart={handleRestart}
      />
    )
  }

  return null
}
