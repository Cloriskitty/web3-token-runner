// components/bullet-game.tsx — Single-company bullet game (top-to-bottom)

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  checkCollision,
  createBullet,
  createBossBullet,
  type Bullet,
  type Player,
} from "@/lib/bullet-engine"
import { type Company } from "@/lib/companies"
import { type LevelResult } from "@/lib/game-state"
import { Hud } from "@/components/hud"

const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 48
const WAVE_DURATION = 25
const BOSS_WAVE_DURATION = 35
const SPAWN_INTERVAL_BASE = 600

// ── BGM per level ──────────────────────────────────────────────
// Map screen  → /audio/sf-ai-startup-map-theme.mp3  (handled in map-screen.tsx)
// OKX (US HQ) → /audio/heroes-bgm.mp3
// Coinbase    → /audio/banggarang.mp3
function getBgmSrc(companySlug: string): string {
  if (companySlug === "coinbase") return "/audio/banggarang.mp3"
  return "/audio/heroes-bgm.mp3" // default: OKX and any future levels
}

interface BulletGameProps {
  company: Company
  isBoss: boolean
  health: number
  maxHealth: number
  score: number
  combo: number
  onCollectToken: (points: number) => void
  onHitBullet: () => void
  onFinish: (result: LevelResult) => void
}

export function BulletGame({
  company,
  isBoss,
  health,
  maxHealth,
  score,
  combo,
  onCollectToken,
  onHitBullet,
  onFinish,
}: BulletGameProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const bulletsRef = useRef<Bullet[]>([])
  const playerRef = useRef<Player>({ x: 0, y: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT })
  const inputRef = useRef({ left: false, right: false, touchX: -1 })
  const waveStartRef = useRef(Date.now())
  const lastSpawnRef = useRef(0)
  const tokensCollectedRef = useRef(0)
  const bulletsHitRef = useRef(0)
  const maxComboRef = useRef(0)
  const doneRef = useRef(false)

  const healthRef = useRef(health)
  const scoreRef = useRef(score)
  const comboRef = useRef(combo)
  useEffect(() => { healthRef.current = health }, [health])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { comboRef.current = combo; maxComboRef.current = Math.max(maxComboRef.current, combo) }, [combo])

  const [bullets, setBullets] = useState<Bullet[]>([])
  const [playerX, setPlayerX] = useState(0)
  const [timeLeft, setTimeLeft] = useState(isBoss ? BOSS_WAVE_DURATION : WAVE_DURATION)
  const [displayHealth, setDisplayHealth] = useState(health)
  const [displayScore, setDisplayScore] = useState(score)
  const [displayCombo, setDisplayCombo] = useState(combo)
  const [flash, setFlash] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [bgmOn, setBgmOn] = useState(true)

  useEffect(() => { setDisplayHealth(health) }, [health])
  useEffect(() => { setDisplayScore(score) }, [score])
  useEffect(() => { setDisplayCombo(combo) }, [combo])

  // ── BGM: start muted on mount, unmute when countdown ends ─────
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(getBgmSrc(company.slug))
    audio.loop = true
    audio.preload = "auto"
    audio.volume = 0.5
    audio.muted = true // muted autoplay always works; unmute after countdown
    audioRef.current = audio
    audio.play().catch(() => {})

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [company.slug])

  // Unmute when countdown reaches 0 (if bgmOn)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (countdown <= 0 && bgmOn) {
      audio.muted = false
    }
  }, [countdown, bgmOn])

  // Sync mute when user toggles button
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !bgmOn
  }, [bgmOn])

  const triggerFlash = useCallback((color: string) => {
    setFlash(color); setTimeout(() => setFlash(null), 150)
  }, [])
  const triggerShake = useCallback(() => {
    setShake(true); setTimeout(() => setShake(false), 200)
  }, [])

  // 3-2-1 countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Init player position
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    playerRef.current.x = rect.width / 2 - PLAYER_WIDTH / 2
    playerRef.current.y = rect.height - PLAYER_HEIGHT - 20
    setPlayerX(playerRef.current.x)
  }, [])

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = true
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false
    }
    window.addEventListener("keydown", onDown)
    window.addEventListener("keyup", onUp)
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp) }
  }, [])

  // Touch/Mouse input
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const t = e.touches[0]
      const rect = el.getBoundingClientRect()
      inputRef.current.touchX = t.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onTouchEnd = () => { inputRef.current.touchX = -1 }
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      inputRef.current.touchX = e.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onMouseLeave = () => { inputRef.current.touchX = -1 }
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    el.addEventListener("mousemove", onMouseMove)
    el.addEventListener("mouseleave", onMouseLeave)
    return () => {
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("mousemove", onMouseMove)
      el.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [])

  // Main game loop
  useEffect(() => {
    if (countdown > 0) return
    waveStartRef.current = Date.now()
    doneRef.current = false
    const duration = (isBoss ? BOSS_WAVE_DURATION : WAVE_DURATION) * 1000

    const loop = () => {
      if (doneRef.current) return
      const el = overlayRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const now = Date.now()
      const player = playerRef.current

      const speed = 6
      if (inputRef.current.touchX >= 0) {
        const target = Math.max(0, Math.min(inputRef.current.touchX, rect.width - PLAYER_WIDTH))
        player.x += (target - player.x) * 0.15
      } else {
        if (inputRef.current.left) player.x -= speed
        if (inputRef.current.right) player.x += speed
      }
      player.x = Math.max(0, Math.min(rect.width - PLAYER_WIDTH, player.x))
      setPlayerX(player.x)

      const elapsed = now - waveStartRef.current
      const remaining = Math.max(0, duration - elapsed) / 1000
      setTimeLeft(remaining)

      if (remaining <= 0) {
        doneRef.current = true
        bulletsRef.current = []
        setBullets([])
        onFinish({ companySlug: company.slug, score: scoreRef.current, tokensCollected: tokensCollectedRef.current, bulletsHit: bulletsHitRef.current, maxCombo: maxComboRef.current, cleared: true, isBoss })
        return
      }
      if (healthRef.current <= 0) {
        doneRef.current = true
        bulletsRef.current = []
        setBullets([])
        onFinish({ companySlug: company.slug, score: scoreRef.current, tokensCollected: tokensCollectedRef.current, bulletsHit: bulletsHitRef.current, maxCombo: maxComboRef.current, cleared: false, isBoss })
        return
      }

      const difficulty = isBoss ? 3 + elapsed / 10000 : elapsed / 15000
      const spawnInterval = Math.max(200, SPAWN_INTERVAL_BASE - difficulty * 20)
      if (now - lastSpawnRef.current > spawnInterval) {
        const bullet = isBoss
          ? createBossBullet(company.slug, rect.width, Math.floor(elapsed / 8000))
          : createBullet(company.slug, rect.width, difficulty)
        bulletsRef.current.push(bullet)
        lastSpawnRef.current = now
      }

      const active: Bullet[] = []
      for (const bullet of bulletsRef.current) {
        bullet.y += bullet.speed
        if (checkCollision(player, bullet)) {
          if (bullet.type === "rare") { tokensCollectedRef.current++; onCollectToken(50); triggerFlash("#ffe66d60") }
          else if (bullet.type === "token") { tokensCollectedRef.current++; onCollectToken(10); triggerFlash("#00ff8840") }
          else { bulletsHitRef.current++; onHitBullet(); triggerFlash("#ff475740"); triggerShake() }
          continue
        }
        if (bullet.y > rect.height + 60) continue
        active.push(bullet)
      }
      bulletsRef.current = active
      setBullets([...active])
      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  const bulletColors = {
    token: { bg: "#00ff8830", border: "#00ff88", text: "#00ff88", icon: "✓" },
    scam: { bg: "#ff475730", border: "#ff4757", text: "#ff4757", icon: "✗" },
    rare: { bg: "#ffe66d40", border: "#ffe66d", text: "#ffe66d", icon: "★" },
  }

  const bgGradient = isBoss ? "from-red-950 via-orange-950 to-slate-950" : "from-blue-950 via-indigo-950 to-slate-950"

  return (
    <div
      className={`relative h-dvh w-full overflow-hidden bg-gradient-to-b ${bgGradient}`}
      style={{ transform: shake ? `translate(${Math.random() * 6 - 3}px, ${Math.random() * 4 - 2}px)` : "none" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      {isBoss && <div className="pointer-events-none absolute inset-0 z-10 bg-red-950/40" />}
      {flash && <div className="pointer-events-none absolute inset-0 z-50" style={{ backgroundColor: flash }} />}

      <div className="absolute inset-x-0 top-0 z-20 pt-16 text-center" style={{ fontFamily: "var(--font-pixel, monospace)" }}>
        <div className="text-xs" style={{ color: isBoss ? "#f97316" : "#ffe66d" }}>{isBoss ? "⚡ BOSS BATTLE" : "📍 LEVEL"}</div>
        <div className="text-base font-bold text-white/80 mt-0.5">{company.name}</div>
      </div>

      {countdown > 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="text-8xl font-bold text-[#ffe66d]" style={{ fontFamily: "var(--font-pixel, monospace)", textShadow: "0 0 40px rgba(255,230,100,0.8)", animation: "pop 0.5s ease-out" }}>
            {countdown}
          </div>
        </div>
      )}

      <div ref={overlayRef} className="absolute inset-0 z-20 cursor-none select-none">
        <Hud health={displayHealth} maxHealth={maxHealth} score={displayScore} combo={displayCombo} companyName={company.name} timeLeft={timeLeft} isBoss={isBoss} />

        {bullets.map((bullet) => {
          const c = bulletColors[bullet.type]
          return (
            <div key={bullet.id} className="absolute flex items-center justify-center rounded-md px-2 text-xs font-bold whitespace-nowrap"
              style={{ left: bullet.x, top: bullet.y, width: bullet.width, height: bullet.height, backgroundColor: c.bg, border: `2px solid ${c.border}`, color: c.text, transform: `rotate(${bullet.rotation}deg)`, fontFamily: "var(--font-pixel, monospace)", fontSize: "9px", boxShadow: bullet.type === "rare" ? `0 0 15px ${c.border}80` : "none" }}>
              {c.icon} {bullet.label}
            </div>
          )
        })}

        <div className="absolute z-30" style={{ left: playerX, bottom: 20, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }}>
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 text-2xl"
            style={{ borderColor: isBoss ? "#f97316" : "#00ff88", background: isBoss ? "#f9731630" : "#00ff8830", boxShadow: isBoss ? "0 0 20px #f9731640" : "0 0 20px #00ff8840" }}>
            🏃
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 text-center">
          <p className="text-xs text-white/30" style={{ fontFamily: "var(--font-pixel, monospace)" }}>← → or mouse · collect ✓ dodge ✗ catch ★</p>
        </div>
      </div>

      {/* BGM toggle button */}
      <button
        onClick={() => setBgmOn(v => !v)}
        className="absolute z-40 rounded-lg px-3 py-1 text-xs font-bold border-2 transition-all"
        style={{ top: 52, right: 12, fontFamily: "var(--font-pixel, monospace)", borderColor: bgmOn ? "#ffe66d" : "#ffffff40", color: bgmOn ? "#1a1a1a" : "#ffffff70", background: bgmOn ? "#ffe66d" : "rgba(0,0,0,0.7)", boxShadow: bgmOn ? "0 0 10px rgba(255,230,109,0.5)" : "none" }}
      >
        {bgmOn ? "🎵 BGM" : "🔇 BGM"}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes pop { from { transform: scale(1.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }` }} />
    </div>
  )
}
