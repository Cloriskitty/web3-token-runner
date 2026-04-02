import type { RouteName } from "./routes"

export type GamePhase =
  | "route-select"
  | "map"
  | "playing"
  | "result"
  | "boss-intro"
  | "boss-battle"
  | "boss-result"
  | "victory"

export interface LevelResult {
  companySlug: string
  score: number
  tokensCollected: number
  bulletsHit: number
  maxCombo: number
  cleared: boolean
}

export interface GameState {
  phase: GamePhase
  route: RouteName | null
  currentCompanySlug: string | null
  health: number
  maxHealth: number
  score: number
  combo: number
  maxCombo: number
  completedLevels: string[]
  levelResults: LevelResult[]
}

export function createInitialState(): GameState {
  return {
    phase: "route-select",
    route: null,
    currentCompanySlug: null,
    health: 5,
    maxHealth: 5,
    score: 0,
    combo: 0,
    maxCombo: 0,
    completedLevels: [],
    levelResults: [],
  }
}

export type GameAction =
  | { type: "SELECT_ROUTE"; route: RouteName }
  | { type: "START_LEVEL"; companySlug: string }
  | { type: "COLLECT_TOKEN"; points: number }
  | { type: "HIT_BULLET" }
  | { type: "BREAK_COMBO" }
  | { type: "END_LEVEL"; result: LevelResult }
  | { type: "START_BOSS" }
  | { type: "END_BOSS"; result: LevelResult }
  | { type: "RESTART" }
  | { type: "BACK_TO_MAP" }

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_ROUTE":
      return {
        ...state,
        route: action.route,
        phase: "map",
        health: 5,
        score: 0,
        combo: 0,
        maxCombo: 0,
        completedLevels: [],
        levelResults: [],
      }

    case "START_LEVEL":
      return {
        ...state,
        phase: "playing",
        currentCompanySlug: action.companySlug,
        combo: 0,
        health: Math.min(state.health + 1, state.maxHealth),
      }

    case "COLLECT_TOKEN": {
      const newCombo = state.combo + 1
      const comboMultiplier = Math.floor(newCombo / 5) + 1
      const points = action.points * comboMultiplier
      return {
        ...state,
        score: state.score + points,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
      }
    }

    case "HIT_BULLET":
      return {
        ...state,
        health: Math.max(0, state.health - 1),
        combo: 0,
      }

    case "BREAK_COMBO":
      return { ...state, combo: 0 }

    case "END_LEVEL": {
      const newCompleted = [
        ...state.completedLevels,
        action.result.companySlug,
      ]
      return {
        ...state,
        phase: "result",
        completedLevels: newCompleted,
        levelResults: [...state.levelResults, action.result],
      }
    }

    case "START_BOSS":
      return {
        ...state,
        phase: "boss-intro",
        combo: 0,
      }

    case "END_BOSS":
      return {
        ...state,
        phase: action.result.cleared ? "victory" : "boss-result",
        levelResults: [...state.levelResults, action.result],
      }

    case "BACK_TO_MAP":
      return { ...state, phase: "map", currentCompanySlug: null }

    case "RESTART":
      return createInitialState()

    default:
      return state
  }
}
