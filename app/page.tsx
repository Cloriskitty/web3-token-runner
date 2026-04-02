"use client"

import { useCallback, useReducer } from "react"

import { COMPANIES } from "@/lib/companies"
import {
  createInitialState,
  gameReducer,
  type LevelResult,
} from "@/lib/game-state"
import {
  getRouteBoss,
  getRouteCompanies,
  type RouteName,
} from "@/lib/routes"
import { BossIntro } from "@/components/boss-intro"
import { BulletRunner } from "@/components/bullet-runner"
import { GameMap } from "@/components/game-map"
import { ResultScreen } from "@/components/result-screen"
import { RouteSelect } from "@/components/route-select"
import { VictoryScreen } from "@/components/victory-screen"

export default function Page() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  const handleSelectRoute = useCallback(
    (route: RouteName) => dispatch({ type: "SELECT_ROUTE", route }),
    []
  )

  const handleStartLevel = useCallback(
    (slug: string) => dispatch({ type: "START_LEVEL", companySlug: slug }),
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

  const handleEndLevel = useCallback(
    (result: LevelResult) => dispatch({ type: "END_LEVEL", result }),
    []
  )

  const handleStartBoss = useCallback(
    () => dispatch({ type: "START_BOSS" }),
    []
  )

  const handleEndBoss = useCallback(
    (result: LevelResult) => dispatch({ type: "END_BOSS", result }),
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

  // Route select
  if (state.phase === "route-select") {
    return <RouteSelect onSelect={handleSelectRoute} />
  }

  // Need route from here on
  if (!state.route) return null

  const routeCompanies = getRouteCompanies(state.route)
  const boss = getRouteBoss(state.route)

  // Map
  if (state.phase === "map") {
    return (
      <GameMap
        route={state.route}
        companies={routeCompanies}
        boss={boss}
        completedLevels={state.completedLevels}
        score={state.score}
        health={state.health}
        maxHealth={state.maxHealth}
        onSelectCompany={handleStartLevel}
        onStartBoss={handleStartBoss}
        onBack={handleRestart}
      />
    )
  }

  // Playing a level
  if (state.phase === "playing" && state.currentCompanySlug) {
    const company =
      COMPANIES.find((c) => c.slug === state.currentCompanySlug) ??
      COMPANIES[0]

    return (
      <BulletRunner
        company={company}
        health={state.health}
        maxHealth={state.maxHealth}
        score={state.score}
        combo={state.combo}
        onCollectToken={handleCollectToken}
        onHitBullet={handleHitBullet}
        onEndLevel={handleEndLevel}
      />
    )
  }

  // Level result
  if (state.phase === "result") {
    const lastResult = state.levelResults[state.levelResults.length - 1]
    const company = COMPANIES.find(
      (c) => c.slug === lastResult?.companySlug
    )
    const allCleared = routeCompanies.every((c) =>
      state.completedLevels.includes(c.slug)
    )

    return (
      <ResultScreen
        result={lastResult}
        companyName={company?.name ?? "Unknown"}
        totalScore={state.score}
        completedCount={state.completedLevels.length}
        totalLevels={routeCompanies.length}
        canStartBoss={allCleared}
        onContinue={handleBackToMap}
        onBoss={handleStartBoss}
      />
    )
  }

  // Boss intro
  if (state.phase === "boss-intro" && boss) {
    return (
      <BossIntro
        boss={boss}
        onReady={() => {
          dispatch({ type: "START_LEVEL", companySlug: boss.slug })
          // We override phase manually by dispatching after
          // Actually we handle boss phase separately
        }}
      />
    )
  }

  // Boss battle (reuses BulletRunner with isBoss flag)
  if (
    (state.phase === "playing" || state.phase === "boss-battle") &&
    boss &&
    state.currentCompanySlug === boss.slug
  ) {
    return (
      <BulletRunner
        company={boss}
        health={state.health}
        maxHealth={state.maxHealth}
        score={state.score}
        combo={state.combo}
        isBoss
        onCollectToken={handleCollectToken}
        onHitBullet={handleHitBullet}
        onEndLevel={handleEndBoss}
      />
    )
  }

  // Boss result
  if (state.phase === "boss-result") {
    const lastResult = state.levelResults[state.levelResults.length - 1]
    return (
      <ResultScreen
        result={lastResult}
        companyName={boss?.name ?? "Boss"}
        totalScore={state.score}
        completedCount={state.completedLevels.length}
        totalLevels={routeCompanies.length}
        canStartBoss={false}
        onContinue={handleBackToMap}
        onBoss={() => {}}
      />
    )
  }

  // Victory
  if (state.phase === "victory") {
    return (
      <VictoryScreen
        route={state.route}
        totalScore={state.score}
        onRestart={handleRestart}
      />
    )
  }

  return null
}
