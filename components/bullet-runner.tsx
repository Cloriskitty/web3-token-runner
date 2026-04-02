"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  checkCollision,
  createBossBullet,
  createBullet,
  type Bullet,
  type Player,
} from "@/lib/bullet-engine"
import { type Company } from "@/lib/companies"
import { type LevelResult } from "@/lib/game-state"
import { Hud } from "@/components/hud"

interface BulletRunnerProps {
  company: Company
  health: number
  maxHealth: number
  score: number
  combo: number
  isBoss?: boolean
  onCollectToken: (points: number) => void
  onHitBullet: () => void
  onEndLevel: (result: LevelResult) => void
}

const LEVEL_DURATION = 35 // seconds
const BOSS_DURATION = 50
const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 48
const SPAWN_INTERVAL = 600 // ms

export function BulletRunner({
  company,
  health,
  maxHealth,
  score,
  combo,
  isBoss = false,
  onCollectToken,
  onHitBullet,
  onEndLevel,
}: BulletRunnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const bulletsRef = useRef<Bullet[]>([])
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  })
  const lastSpawnRef = useRef(0)
  const startTimeRef = useRef(Date.now())
  const tokensCollectedRef = useRef(0)
  const bulletsHitRef = useRef(0)
  const maxComboRef = useRef(0)
  const healthRef = useRef(health)
  const scoreRef = useRef(score)
  const comboRef = useRef(combo)
  const inputRef = useRef({ left: false, right: false, touchX: -1 })

  const [bullets, setBullets] = useState<Bullet[]>([])
  const [playerX, setPlayerX] = useState(0)
  const [timeLeft, setTimeLeft] = useState(isBoss ? BOSS_DURATION : LEVEL_DURATION)
  const [flashEffect, setFlashEffect] = useState<string | null>(null)
  const [shakeScreen, setShakeScreen] = useState(false)
  const [displayCombo, setDisplayCombo] = useState(0)
  const [displayScore, setDisplayScore] = useState(score)
  const [displayHealth, setDisplayHealth] = useState(health)

  // Keep refs in sync
  useEffect(() => {
    healthRef.current = health
    setDisplayHealth(health)
  }, [health])
  useEffect(() => {
    scoreRef.current = score
    setDisplayScore(score)
  }, [score])
  useEffect(() => {
    comboRef.current = combo
    maxComboRef.current = Math.max(maxComboRef.current, combo)
    setDisplayCombo(combo)
  }, [combo])

  // Flash effect helper
  const triggerFlash = useCallback((color: string) => {
    setFlashEffect(color)
    setTimeout(() => setFlashEffect(null), 150)
  }, [])

  const triggerShake = useCallback(() => {
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 200)
  }, [])

  // Initialize player position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    playerRef.current.x = rect.width / 2 - PLAYER_WIDTH / 2
    playerRef.current.y = rect.height - PLAYER_HEIGHT - 20
    setPlayerX(playerRef.current.x)
  }, [])

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  // Touch input
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = container.getBoundingClientRect()
      inputRef.current.touchX = touch.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onTouchEnd = () => {
      inputRef.current.touchX = -1
    }

    container.addEventListener("touchmove", onTouchMove, { passive: false })
    container.addEventListener("touchend", onTouchEnd)
    return () => {
      container.removeEventListener("touchmove", onTouchMove)
      container.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  // Mouse input
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      inputRef.current.touchX = e.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onMouseLeave = () => {
      inputRef.current.touchX = -1
    }

    container.addEventListener("mousemove", onMouseMove)
    container.addEventListener("mouseleave", onMouseLeave)
    return () => {
      container.removeEventListener("mousemove", onMouseMove)
      container.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [])

  // Game loop
  useEffect(() => {
    startTimeRef.current = Date.now()
    const duration = (isBoss ? BOSS_DURATION : LEVEL_DURATION) * 1000

    const loop = () => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, duration - elapsed) / 1000

      setTimeLeft(remaining)

      // End conditions
      if (remaining <= 0 || healthRef.current <= 0) {
        const result: LevelResult = {
          companySlug: company.slug,
          score: scoreRef.current,
          tokensCollected: tokensCollectedRef.current,
          bulletsHit: bulletsHitRef.current,
          maxCombo: maxComboRef.current,
          cleared: healthRef.current > 0,
        }
        onEndLevel(result)
        return
      }

      // Move player
      const speed = 6
      const player = playerRef.current

      if (inputRef.current.touchX >= 0) {
        // Smooth follow for touch/mouse
        const target = Math.max(
          0,
          Math.min(inputRef.current.touchX, rect.width - PLAYER_WIDTH)
        )
        const diff = target - player.x
        player.x += diff * 0.15
      } else {
        if (inputRef.current.left) player.x -= speed
        if (inputRef.current.right) player.x += speed
      }
      player.x = Math.max(0, Math.min(rect.width - PLAYER_WIDTH, player.x))
      setPlayerX(player.x)

      // Spawn bullets
      const difficulty = isBoss ? 3 + elapsed / 10000 : elapsed / 15000
      if (now - lastSpawnRef.current > SPAWN_INTERVAL - difficulty * 30) {
        const newBullet = isBoss
          ? createBossBullet(company.slug, rect.width, Math.floor(elapsed / 10000))
          : createBullet(company.slug, rect.width, difficulty)
        bulletsRef.current.push(newBullet)
        lastSpawnRef.current = now
      }

      // Update bullets
      const activeBullets: Bullet[] = []
      for (const bullet of bulletsRef.current) {
        bullet.y += bullet.speed

        // Collision check
        if (checkCollision(player, bullet)) {
          if (bullet.type === "token") {
            tokensCollectedRef.current++
            onCollectToken(10)
            triggerFlash("#00ff8840")
          } else {
            bulletsHitRef.current++
            onHitBullet()
            triggerFlash("#ff475740")
            triggerShake()
          }
          continue // Remove bullet after collision
        }

        // Remove if off-screen
        if (bullet.y > rect.height + 50) {
          continue
        }

        activeBullets.push(bullet)
      }

      bulletsRef.current = activeBullets
      setBullets([...activeBullets])

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [company.slug, isBoss, onCollectToken, onEndLevel, onHitBullet, triggerFlash, triggerShake])

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full cursor-none overflow-hidden select-none"
      style={{
        backgroundColor: isBoss ? "#0d0015" : "#0a0a1a",
        transform: shakeScreen
          ? `translate(${Math.random() * 6 - 3}px, ${Math.random() * 6 - 3}px)`
          : "none",
      }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Flash overlay */}
      {flashEffect && (
        <div
          className="pointer-events-none absolute inset-0 z-50"
          style={{ backgroundColor: flashEffect }}
        />
      )}

      {/* HUD */}
      <Hud
        health={displayHealth}
        maxHealth={maxHealth}
        score={displayScore}
        combo={displayCombo}
        companyName={company.name}
        timeLeft={timeLeft}
        isBoss={isBoss}
      />

      {/* Bullets */}
      {bullets.map((bullet) => (
        <div
          key={bullet.id}
          className="absolute flex items-center justify-center rounded-md px-2 text-xs font-bold whitespace-nowrap"
          style={{
            left: bullet.x,
            top: bullet.y,
            width: bullet.width,
            height: bullet.height,
            backgroundColor:
              bullet.type === "token" ? "#00ff8830" : "#ff475730",
            border: `2px solid ${bullet.type === "token" ? "#00ff88" : "#ff4757"}`,
            color: bullet.type === "token" ? "#00ff88" : "#ff4757",
            transform: `rotate(${bullet.rotation}deg)`,
            fontFamily: "var(--font-pixel)",
            fontSize: "9px",
          }}
        >
          {bullet.type === "token" ? "✓ " : "✗ "}
          {bullet.label}
        </div>
      ))}

      {/* Player */}
      <div
        className="absolute z-20"
        style={{
          left: playerX,
          bottom: 20,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center rounded-lg border-2 border-[#00ff88] bg-[#00ff8830] text-2xl"
          style={{
            boxShadow: "0 0 20px #00ff8840",
          }}
        >
          🏃
        </div>
      </div>

      {/* Instructions (fade out) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 animate-pulse text-center">
        <p
          className="text-xs text-white/40"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          ← → or mouse to move &middot; collect ✓ dodge ✗
        </p>
      </div>
    </div>
  )
}
