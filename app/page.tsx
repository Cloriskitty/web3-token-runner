"use client"

import { useCallback, useReducer } from "react"

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
import { MapRunner } from "@/components/map-runner"
import { RouteSelect } from "@/components/route-select"
import { VictoryScreen } from "@/components/victory-screen"
import { ResultScreen } from "@/components/result-screen"

export default function Page() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  const handleSelectRoute = useCallback(
    (route: RouteName) => dispatch({ type: "SELECT_ROUTE", route }),
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
    (result: LevelResult) => {
      if (result.cleared) {
        dispatch({ type: "END_BOSS", result }) // triggers victory
      } else {
        dispatch({ type: "END_LEVEL", result }) // triggers result screen
      }
    },
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

  if (!state.route) return null

  const routeCompanies = getRouteCompanies(state.route)
  const boss = getRouteBoss(state.route)
  if (!boss) return null

  // Game over screen (died during run)
  if (state.phase === "result") {
    const lastResult = state.levelResults[state.levelResults.length - 1]
    return (
      <ResultScreen
        result={lastResult}
        companyName="Game Over"
        totalScore={state.score}
        completedCount={0}
        totalLevels={routeCompanies.length}
        canStartBoss={false}
        onContinue={handleRestart}
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

  // Main game — continuous map runner
  return (
    <MapRunner
      companies={routeCompanies}
      boss={boss}
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
