// lib/game-state.ts — SIMPLIFIED (no routes, starts at map)

export type GamePhase = "map" | "playing" | "result" | "victory"

export interface LevelResult {
  companySlug: string
  score: number
  tokensCollected: number
  bulletsHit: number
  maxCombo: number
  cleared: boolean
  isBoss: boolean
}

export interface GameState {
  phase: GamePhase
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
    phase: "map",
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
  | { type: "START_LEVEL"; companySlug: string }
  | { type: "COLLECT_TOKEN"; points: number }
  | { type: "HIT_BULLET" }
  | { type: "END_LEVEL"; result: LevelResult }
  | { type: "BACK_TO_MAP" }
  | { type: "RESTART" }

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_LEVEL":
      return {
        ...state,
        phase: "playing",
        currentCompanySlug: action.companySlug,
        combo: 0,
        health: state.maxHealth, // refresh health each level
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

    case "END_LEVEL": {
      const newCompleted = action.result.cleared
        ? [...new Set([...state.completedLevels, action.result.companySlug])]
        : state.completedLevels
      const isVictory = action.result.cleared && action.result.isBoss
      return {
        ...state,
        phase: isVictory ? "victory" : "result",
        completedLevels: newCompleted,
        levelResults: [...state.levelResults, action.result],
      }
    }

    case "BACK_TO_MAP":
      return {
        ...state,
        phase: "map",
        currentCompanySlug: null,
      }

    case "RESTART":
      return createInitialState()

    default:
      return state
  }
}
