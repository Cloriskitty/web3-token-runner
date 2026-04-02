"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapLibreMap,
} from "maplibre-gl"

import {
  checkCollision,
  createBossBullet,
  createBullet,
  type Bullet,
  type Player,
} from "@/lib/bullet-engine"
import {
  CATEGORY_COLORS,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/companies"
import { type LevelResult } from "@/lib/game-state"
import { Hud } from "@/components/hud"

// ── Map constants ──────────────────────────────────────────────
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
const MAP_PITCH = 54
const MAP_BEARING = -24
const PLAYER_WIDTH = 48
const PLAYER_HEIGHT = 48

// Time per company wave (seconds)
const WAVE_DURATION = 18
const BOSS_WAVE_DURATION = 30
const TRANSITION_DURATION = 3000 // ms for camera fly between companies
const SPAWN_INTERVAL_BASE = 550

// ── Map styling (from sf-web3-quest) ──────────────────────────

function sp(
  map: MapLibreMap,
  id: string,
  prop: string,
  val: unknown
) {
  if (map.getLayer(id)) map.setPaintProperty(id, prop, val)
}

function addVoxelBuildings(map: MapLibreMap) {
  if (!map.getSource("carto") || map.getLayer("minecraft-buildings")) return
  const rawH: ExpressionSpecification = [
    "coalesce",
    ["to-number", ["get", "render_height"]],
    ["to-number", ["get", "height"]],
    12,
  ]
  const snH: ExpressionSpecification = [
    "max",
    8,
    ["min", 180, ["*", ["round", ["/", rawH, 8]], 8]],
  ]
  map.addLayer(
    {
      id: "minecraft-buildings",
      type: "fill-extrusion",
      source: "carto",
      "source-layer": "building",
      minzoom: 11,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          snH,
          8,
          "#c9a87c",
          32,
          "#d4b88e",
          72,
          "#dfc8a2",
          140,
          "#ebd8b8",
        ],
        "fill-extrusion-height": snH,
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.88,
        "fill-extrusion-vertical-gradient": false,
      },
    },
    "boundary_country_outline"
  )
}

function applyPixelStyle(map: MapLibreMap) {
  sp(map, "background", "background-color", "#a5c76e")
  sp(map, "landcover", "fill-color", "#7ea64a")
  sp(map, "landcover", "fill-opacity", 0.96)
  ;["park_national_park", "park_nature_reserve"].forEach((id) => {
    sp(map, id, "fill-color", "#5f9235")
    sp(map, id, "fill-opacity", 0.92)
  })
  sp(map, "landuse_residential", "fill-color", "#ddd2ac")
  sp(map, "landuse", "fill-color", "#d6c99a")
  sp(map, "landuse", "fill-opacity", 0.88)
  sp(map, "water", "fill-color", "#4b83c2")
  sp(map, "water_shadow", "fill-color", "#325f97")
  sp(map, "waterway", "line-color", "#4479b1")
  sp(map, "waterway", "line-width", 2.4)
  sp(map, "building", "fill-color", "#c4a87a")
  sp(map, "building", "fill-opacity", 0.2)
  sp(map, "building-top", "fill-color", "#e0cca0")
  sp(map, "building-top", "fill-opacity", 0)

  const roadCases = [
    "road_service_case",
    "road_minor_case",
    "road_pri_case_ramp",
    "road_trunk_case_ramp",
    "road_mot_case_ramp",
    "road_sec_case_noramp",
    "road_pri_case_noramp",
    "road_trunk_case_noramp",
    "road_mot_case_noramp",
  ]
  roadCases.forEach((id) => sp(map, id, "line-color", "#3f3427"))

  const roadFills = [
    "road_service_fill",
    "road_minor_fill",
    "road_pri_fill_ramp",
    "road_trunk_fill_ramp",
    "road_mot_fill_ramp",
    "road_sec_fill_noramp",
    "road_pri_fill_noramp",
  ]
  roadFills.forEach((id) => sp(map, id, "line-color", "#8f856a"))
  sp(map, "road_trunk_fill_noramp", "line-color", "#a79b76")
  sp(map, "road_mot_fill_noramp", "line-color", "#8a7c5b")
  sp(map, "road_path", "line-color", "#735d3a")
  sp(map, "rail", "line-color", "#5a5650")
  sp(map, "rail_dash", "line-color", "#b1aa94")

  const tunnelC = [
    "tunnel_service_case",
    "tunnel_minor_case",
    "tunnel_sec_case",
    "tunnel_pri_case",
    "tunnel_trunk_case",
    "tunnel_mot_case",
  ]
  tunnelC.forEach((id) => sp(map, id, "line-color", "#645642"))
  const tunnelF = [
    "tunnel_service_fill",
    "tunnel_minor_fill",
    "tunnel_sec_fill",
    "tunnel_pri_fill",
    "tunnel_trunk_fill",
    "tunnel_mot_fill",
  ]
  tunnelF.forEach((id) => sp(map, id, "line-color", "#887a5d"))

  const bridgeC = [
    "bridge_service_case",
    "bridge_minor_case",
    "bridge_sec_case",
    "bridge_pri_case",
    "bridge_trunk_case",
    "bridge_mot_case",
  ]
  bridgeC.forEach((id) => sp(map, id, "line-color", "#473c2e"))
  const bridgeF = [
    "bridge_service_fill",
    "bridge_minor_fill",
    "bridge_sec_fill",
    "bridge_pri_fill",
    "bridge_trunk_fill",
    "bridge_mot_fill",
  ]
  bridgeF.forEach((id) => sp(map, id, "line-color", "#978567"))

  sp(map, "boundary_county", "line-color", "#8d6c49")
  sp(map, "boundary_state", "line-color", "#725536")

  const placeLabels = [
    "place_hamlet",
    "place_suburbs",
    "place_villages",
    "place_town",
    "place_city_r6",
    "place_city_r5",
  ]
  placeLabels.forEach((id) => {
    sp(map, id, "text-color", "#3d2e1f")
    sp(map, id, "text-halo-color", "#d9cb97")
    sp(map, id, "text-halo-width", 1.5)
  })

  const waterLabels = [
    "watername_ocean",
    "watername_sea",
    "watername_lake",
    "watername_lake_line",
    "waterway_label",
  ]
  waterLabels.forEach((id) => {
    sp(map, id, "text-color", "#244e82")
    sp(map, id, "text-halo-color", "#78a7db")
    sp(map, id, "text-halo-width", 1)
  })
}

// ── Marker helpers (simplified from map-shell) ────────────────

function sd(styles: Partial<CSSStyleDeclaration>) {
  const el = document.createElement("div")
  Object.assign(el.style, styles)
  return el
}

function createSimpleMarker(company: Company, active: boolean) {
  const accent = CATEGORY_COLORS[company.category]
  const OL = "#342414"
  const isBoss = company.mapSprite === "boss"
  const sz = isBoss ? (active ? 36 : 28) : active ? 28 : 22

  const wrapper = sd({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "transform 0.3s",
    transform: active ? "scale(1.3)" : "scale(1)",
    filter: active ? "drop-shadow(0 0 8px rgba(255,255,100,0.7))" : "none",
  })

  // Logo badge
  const badge = sd({
    width: `${sz}px`,
    height: `${sz}px`,
    border: `2px solid ${OL}`,
    background: isBoss ? "#f26522" : accent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    boxSizing: "border-box",
    boxShadow: active
      ? `0 0 0 2px rgba(255,242,199,0.7), 2px 2px 0 ${OL}`
      : `2px 2px 0 ${OL}`,
  })

  const innerSz = Math.max(8, sz - 8)
  const inner = sd({
    width: `${innerSz}px`,
    height: `${innerSz}px`,
    background: "#fffefc",
    border: `1px solid ${OL}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  })

  const img = document.createElement("img")
  img.src = getCompanyLogoUrl(company)
  img.alt = company.name
  const logoSz = Math.max(8, innerSz - 4)
  Object.assign(img.style, {
    width: `${logoSz}px`,
    height: `${logoSz}px`,
    objectFit: "contain",
  })
  const mono = getCompanyMonogram(company)
  img.addEventListener("error", () => {
    const span = document.createElement("span")
    span.textContent = mono
    span.style.fontSize = "8px"
    span.style.fontWeight = "700"
    span.style.color = OL
    img.replaceWith(span)
  })
  inner.appendChild(img)
  badge.appendChild(inner)
  wrapper.appendChild(badge)

  // Name label when active
  if (active) {
    const label = sd({
      marginTop: "4px",
      padding: "2px 6px",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      fontSize: "9px",
      fontFamily: "var(--font-pixel)",
      whiteSpace: "nowrap",
      border: `1px solid ${accent}`,
    })
    label.textContent = company.name
    wrapper.appendChild(label)
  }

  return wrapper
}

// ── Props ────────────────────────────────────────────────────

interface MapRunnerProps {
  companies: Company[] // ordered route
  boss: Company
  health: number
  maxHealth: number
  score: number
  combo: number
  onCollectToken: (points: number) => void
  onHitBullet: () => void
  onFinish: (result: LevelResult) => void
}

export function MapRunner({
  companies,
  boss,
  health,
  maxHealth,
  score,
  combo,
  onCollectToken,
  onHitBullet,
  onFinish,
}: MapRunnerProps) {
  // All companies including boss at the end
  const allStops = [...companies, boss]

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const gameOverlayRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const frameRef = useRef<number>(0)
  const bulletsRef = useRef<Bullet[]>([])
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  })
  const inputRef = useRef({ left: false, right: false, touchX: -1 })
  const phaseRef = useRef<"flying" | "wave" | "boss" | "done">("flying")
  const currentStopRef = useRef(0)
  const waveStartRef = useRef(0)
  const tokensCollectedRef = useRef(0)
  const bulletsHitRef = useRef(0)
  const maxComboRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const healthRef = useRef(health)
  const scoreRef = useRef(score)
  const comboRef = useRef(combo)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())

  const [bullets, setBullets] = useState<Bullet[]>([])
  const [playerX, setPlayerX] = useState(0)
  const [currentCompany, setCurrentCompany] = useState<Company>(allStops[0])
  const [isBossWave, setIsBossWave] = useState(false)
  const [waveTimeLeft, setWaveTimeLeft] = useState(0)
  const [displayHealth, setDisplayHealth] = useState(health)
  const [displayScore, setDisplayScore] = useState(score)
  const [displayCombo, setDisplayCombo] = useState(combo)
  const [flashEffect, setFlashEffect] = useState<string | null>(null)
  const [shakeScreen, setShakeScreen] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Keep refs in sync
  useEffect(() => { healthRef.current = health; setDisplayHealth(health) }, [health])
  useEffect(() => { scoreRef.current = score; setDisplayScore(score) }, [score])
  useEffect(() => {
    comboRef.current = combo
    maxComboRef.current = Math.max(maxComboRef.current, combo)
    setDisplayCombo(combo)
  }, [combo])

  const triggerFlash = useCallback((color: string) => {
    setFlashEffect(color)
    setTimeout(() => setFlashEffect(null), 150)
  }, [])

  const triggerShake = useCallback(() => {
    setShakeScreen(true)
    setTimeout(() => setShakeScreen(false), 200)
  }, [])

  const announce = useCallback((text: string) => {
    setAnnouncement(text)
    setTimeout(() => setAnnouncement(null), 2500)
  }, [])

  // ── Initialize map ──────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const firstCompany = allStops[0]
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: firstCompany.coordinates,
      zoom: 13.5,
      pitch: MAP_PITCH,
      bearing: MAP_BEARING,
      minZoom: 9.5,
      maxZoom: 15.8,
      attributionControl: false,
      renderWorldCopies: false,
      interactive: false, // No user interaction — camera is auto-controlled
    })

    map.on("load", () => {
      applyPixelStyle(map)
      addVoxelBuildings(map)
      map.resize()

      // Add all company markers
      allStops.forEach((company) => {
        const el = document.createElement("div")
        el.appendChild(createSimpleMarker(company, false))
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(company.coordinates)
          .addTo(map)
        markersRef.current.set(company.slug, marker)
      })

      setMapLoaded(true)
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Initialize player position ──────────────────────────────
  useEffect(() => {
    const overlay = gameOverlayRef.current
    if (!overlay) return
    const rect = overlay.getBoundingClientRect()
    playerRef.current.x = rect.width / 2 - PLAYER_WIDTH / 2
    playerRef.current.y = rect.height - PLAYER_HEIGHT - 20
    setPlayerX(playerRef.current.x)
  }, [])

  // ── Keyboard input ──────────────────────────────────────────
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
    return () => {
      window.removeEventListener("keydown", onDown)
      window.removeEventListener("keyup", onUp)
    }
  }, [])

  // ── Touch/Mouse input ───────────────────────────────────────
  useEffect(() => {
    const overlay = gameOverlayRef.current
    if (!overlay) return
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = overlay.getBoundingClientRect()
      inputRef.current.touchX = touch.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onTouchEnd = () => { inputRef.current.touchX = -1 }
    const onMouseMove = (e: MouseEvent) => {
      const rect = overlay.getBoundingClientRect()
      inputRef.current.touchX = e.clientX - rect.left - PLAYER_WIDTH / 2
    }
    const onMouseLeave = () => { inputRef.current.touchX = -1 }

    overlay.addEventListener("touchmove", onTouchMove, { passive: false })
    overlay.addEventListener("touchend", onTouchEnd)
    overlay.addEventListener("mousemove", onMouseMove)
    overlay.addEventListener("mouseleave", onMouseLeave)
    return () => {
      overlay.removeEventListener("touchmove", onTouchMove)
      overlay.removeEventListener("touchend", onTouchEnd)
      overlay.removeEventListener("mousemove", onMouseMove)
      overlay.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [])

  // ── Fly camera to next company ──────────────────────────────
  const flyToCompany = useCallback(
    (company: Company, onArrive: () => void) => {
      const map = mapRef.current
      if (!map) return

      // Highlight active marker
      markersRef.current.forEach((marker, slug) => {
        const el = marker.getElement()
        el.replaceChildren(
          createSimpleMarker(
            allStops.find((c) => c.slug === slug) ?? company,
            slug === company.slug
          )
        )
      })

      const isBoss = company.mapSprite === "boss"
      map.flyTo({
        center: company.coordinates,
        zoom: isBoss ? 14.0 : 13.5,
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
        speed: 0.5,
        curve: 1.2,
        essential: true,
      })

      setTimeout(onArrive, TRANSITION_DURATION)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ── Start the game sequence once map loads ──────────────────
  useEffect(() => {
    if (!mapLoaded) return

    // Start with first company
    const startWave = (stopIndex: number) => {
      if (stopIndex >= allStops.length || healthRef.current <= 0) {
        // Game over or all stops done
        phaseRef.current = "done"
        const result: LevelResult = {
          companySlug: boss.slug,
          score: scoreRef.current,
          tokensCollected: tokensCollectedRef.current,
          bulletsHit: bulletsHitRef.current,
          maxCombo: maxComboRef.current,
          cleared: healthRef.current > 0,
        }
        onFinish(result)
        return
      }

      const company = allStops[stopIndex]
      const isBoss = company.mapSprite === "boss"

      phaseRef.current = "flying"
      currentStopRef.current = stopIndex
      setCurrentCompany(company)
      setIsBossWave(!!isBoss)

      flyToCompany(company, () => {
        if (isBoss) {
          announce(`⚔️ BOSS: ${company.name}`)
        } else {
          announce(`📍 ${company.name}`)
        }
        phaseRef.current = isBoss ? "boss" : "wave"
        waveStartRef.current = Date.now()
        bulletsRef.current = []
      })
    }

    // Game loop
    const loop = () => {
      const overlay = gameOverlayRef.current
      if (!overlay || phaseRef.current === "done") return

      const rect = overlay.getBoundingClientRect()
      const now = Date.now()
      const player = playerRef.current

      // Move player
      const speed = 6
      if (inputRef.current.touchX >= 0) {
        const target = Math.max(
          0,
          Math.min(inputRef.current.touchX, rect.width - PLAYER_WIDTH)
        )
        player.x += (target - player.x) * 0.15
      } else {
        if (inputRef.current.left) player.x -= speed
        if (inputRef.current.right) player.x += speed
      }
      player.x = Math.max(0, Math.min(rect.width - PLAYER_WIDTH, player.x))
      setPlayerX(player.x)

      // Only process bullets during wave/boss
      if (phaseRef.current === "wave" || phaseRef.current === "boss") {
        const isBoss = phaseRef.current === "boss"
        const duration = (isBoss ? BOSS_WAVE_DURATION : WAVE_DURATION) * 1000
        const elapsed = now - waveStartRef.current
        const remaining = Math.max(0, duration - elapsed) / 1000
        setWaveTimeLeft(remaining)

        // Check if wave is over or player died
        if (remaining <= 0 || healthRef.current <= 0) {
          bulletsRef.current = []
          setBullets([])

          if (healthRef.current <= 0) {
            phaseRef.current = "done"
            onFinish({
              companySlug: allStops[currentStopRef.current].slug,
              score: scoreRef.current,
              tokensCollected: tokensCollectedRef.current,
              bulletsHit: bulletsHitRef.current,
              maxCombo: maxComboRef.current,
              cleared: false,
            })
            return
          }

          // Move to next stop
          startWave(currentStopRef.current + 1)
          frameRef.current = requestAnimationFrame(loop)
          return
        }

        // Spawn bullets
        const difficulty = isBoss ? 3 + elapsed / 10000 : elapsed / 12000
        const spawnInterval = SPAWN_INTERVAL_BASE - difficulty * 25
        if (now - lastSpawnRef.current > spawnInterval) {
          const slug = allStops[currentStopRef.current].slug
          const bullet = isBoss
            ? createBossBullet(slug, rect.width, Math.floor(elapsed / 8000))
            : createBullet(slug, rect.width, difficulty)
          bulletsRef.current.push(bullet)
          lastSpawnRef.current = now
        }

        // Update bullets
        const active: Bullet[] = []
        for (const bullet of bulletsRef.current) {
          bullet.y += bullet.speed

          if (checkCollision(player, bullet)) {
            if (bullet.type === "rare") {
              tokensCollectedRef.current++
              onCollectToken(50)
              triggerFlash("#ffe66d60")
            } else if (bullet.type === "token") {
              tokensCollectedRef.current++
              onCollectToken(10)
              triggerFlash("#00ff8840")
            } else {
              bulletsHitRef.current++
              onHitBullet()
              triggerFlash("#ff475740")
              triggerShake()
            }
            continue
          }

          if (bullet.y > rect.height + 50) continue
          active.push(bullet)
        }

        bulletsRef.current = active
        setBullets([...active])
      }

      frameRef.current = requestAnimationFrame(loop)
    }

    // Kick off
    startWave(0)
    frameRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frameRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded])

  // ── Render ──────────────────────────────────────────────────

  const bulletColors = {
    token: { bg: "#00ff8830", border: "#00ff88", text: "#00ff88", icon: "✓" },
    scam: { bg: "#ff475730", border: "#ff4757", text: "#ff4757", icon: "✗" },
    rare: { bg: "#ffe66d40", border: "#ffe66d", text: "#ffe66d", icon: "★" },
  }

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{
        transform: shakeScreen
          ? `translate(${Math.random() * 6 - 3}px, ${Math.random() * 6 - 3}px)`
          : "none",
      }}
    >
      {/* Map layer */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Pixel grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(53,37,20,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(53,37,20,0.2) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Dark tint for readability during boss */}
      {isBossWave && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/30 transition-opacity duration-1000" />
      )}

      {/* Flash overlay */}
      {flashEffect && (
        <div
          className="pointer-events-none absolute inset-0 z-50"
          style={{ backgroundColor: flashEffect }}
        />
      )}

      {/* Game overlay (bullets + player) */}
      <div
        ref={gameOverlayRef}
        className="absolute inset-0 z-20 cursor-none select-none"
      >
        {/* HUD */}
        <Hud
          health={displayHealth}
          maxHealth={maxHealth}
          score={displayScore}
          combo={displayCombo}
          companyName={currentCompany.name}
          timeLeft={waveTimeLeft}
          isBoss={isBossWave}
        />

        {/* Company announcement */}
        {announcement && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 z-40 text-center">
            <div
              className="inline-block rounded-lg border-2 border-[#ffe66d] bg-black/70 px-6 py-3 text-lg text-[#ffe66d]"
              style={{
                fontFamily: "var(--font-pixel)",
                animation: "fadeInUp 0.5s ease-out",
              }}
            >
              {announcement}
            </div>
          </div>
        )}

        {/* Bullets */}
        {bullets.map((bullet) => {
          const c = bulletColors[bullet.type]
          return (
            <div
              key={bullet.id}
              className="absolute flex items-center justify-center rounded-md px-2 text-xs font-bold whitespace-nowrap"
              style={{
                left: bullet.x,
                top: bullet.y,
                width: bullet.width,
                height: bullet.height,
                backgroundColor: c.bg,
                border: `2px solid ${c.border}`,
                color: c.text,
                transform: `rotate(${bullet.rotation}deg)`,
                fontFamily: "var(--font-pixel)",
                fontSize: "9px",
                boxShadow:
                  bullet.type === "rare" ? `0 0 15px ${c.border}80` : "none",
              }}
            >
              {c.icon} {bullet.label}
            </div>
          )
        })}

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
            style={{ boxShadow: "0 0 20px #00ff8840" }}
          >
            🏃
          </div>
        </div>

        {/* Instructions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 text-center">
          <p
            className="text-xs text-white/40"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            ← → or mouse &middot; collect ✓ dodge ✗ catch ★
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        .maplibregl-canvas {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes marker-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
