// components/map-screen.tsx — SF Bay Area map for level selection
"use client"

import "maplibre-gl/dist/maplibre-gl.css" // ← required for MapLibre to render correctly

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import {
  CATEGORY_COLORS,
  COMPANIES,
  getCompanyLogoUrl,
  getCompanyMonogram,
  type Company,
} from "@/lib/companies"

// ── Constants ────────────────────────────────────────────────────
// Inline style — no external CDN dependency; map.on("load") fires immediately
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron"

// Center between OKX SJ (-121.89, 37.33) and Coinbase SF (-122.39, 37.77)
const MAP_CENTER: [number, number] = [-122.14, 37.56]
const MAP_ZOOM = 9.5

// Only these two are playable
const UNLOCKED_SLUGS = ["okx-sj", "coinbase"]
const BOSS_SLUG = "coinbase"

// ── Pixel map style (from map-runner) ─────────────────────────────
function sp(map: maplibregl.Map, id: string, prop: string, val: unknown) {
  if (map.getLayer(id)) map.setPaintProperty(id, prop, val)
}

function applyPixelStyle(map: maplibregl.Map) {
  sp(map, "background", "background-color", "#a5c76e")
  sp(map, "landcover", "fill-color", "#7ea64a")
  sp(map, "landcover", "fill-opacity", 0.96)
  sp(map, "water", "fill-color", "#4b83c2")
  sp(map, "water_shadow", "fill-color", "#325f97")
  sp(map, "waterway", "line-color", "#4479b1")
  const roadFills = [
    "road_service_fill",
    "road_minor_fill",
    "road_pri_fill_ramp",
    "road_trunk_fill_ramp",
    "road_sec_fill_noramp",
    "road_pri_fill_noramp",
  ]
  roadFills.forEach((id) => sp(map, id, "line-color", "#8f856a"))
  const placeLabels = [
    "place_hamlet",
    "place_suburbs",
    "place_town",
    "place_city_r6",
    "place_city_r5",
  ]
  placeLabels.forEach((id) => {
    sp(map, id, "text-color", "#3d2e1f")
    sp(map, id, "text-halo-color", "#d9cb97")
    sp(map, id, "text-halo-width", 1.5)
  })
}

// ── Marker element builder ────────────────────────────────────────
function buildMarkerEl(
  company: Company,
  state: "locked" | "unlocked" | "completed" | "selected"
) {
  const accent = CATEGORY_COLORS[company.category]
  const isBoss = company.mapSprite === "boss"

  const wrapper = document.createElement("div")
  wrapper.style.cssText = `
    display:flex; flex-direction:column; align-items:center;
    cursor:${state === "locked" ? "default" : "pointer"};
    transition: transform 0.2s;
    transform: scale(${state === "selected" ? 1.4 : 1});
    filter: ${state === "selected" ? "drop-shadow(0 0 10px rgba(255,230,100,0.9))" : "none"};
    opacity: ${state === "locked" ? 0.4 : 1};
  `

  const sz = isBoss ? 36 : state === "selected" ? 30 : 24
  const badge = document.createElement("div")
  badge.style.cssText = `
    width:${sz}px; height:${sz}px; border:2px solid #342414;
    background:${state === "completed" ? "#22c55e" : isBoss ? "#f26522" : accent};
    display:flex; align-items:center; justify-content:center;
    padding:2px; box-sizing:border-box;
    box-shadow:${state === "selected" ? "0 0 0 3px rgba(255,242,199,0.8), 2px 2px 0 #342414" : "2px 2px 0 #342414"};
  `

  if (state === "locked") {
    badge.textContent = "🔒"
    badge.style.fontSize = "12px"
  } else if (state === "completed") {
    badge.textContent = "✅"
    badge.style.fontSize = "14px"
  } else {
    const inner = document.createElement("div")
    const innerSz = Math.max(8, sz - 8)
    inner.style.cssText = `
      width:${innerSz}px; height:${innerSz}px; background:#fffefc;
      border:1px solid #342414; display:flex; align-items:center;
      justify-content:center; box-sizing:border-box;
    `
    const img = document.createElement("img")
    img.src = getCompanyLogoUrl(company)
    img.alt = company.name
    const logoSz = Math.max(8, innerSz - 4)
    img.style.cssText = `width:${logoSz}px; height:${logoSz}px; object-fit:contain;`
    img.addEventListener("error", () => {
      const span = document.createElement("span")
      span.textContent = getCompanyMonogram(company)
      span.style.cssText = "font-size:8px; font-weight:700; color:#342414;"
      img.replaceWith(span)
    })
    inner.appendChild(img)
    badge.appendChild(inner)
  }

  wrapper.appendChild(badge)

  // Character on top if selected
  if (state === "selected") {
    const char = document.createElement("div")
    char.textContent = isBoss ? "⚔️" : "🧑‍💻"
    char.style.cssText = `
      font-size:18px; margin-bottom:2px;
      animation: float 1s ease-in-out infinite alternate;
    `
    wrapper.insertBefore(char, badge)
  }

  // Label
  if (state === "selected" || state === "unlocked") {
    const label = document.createElement("div")
    label.textContent = isBoss ? `⚡ BOSS: ${company.name}` : company.name
    label.style.cssText = `
      margin-top:3px; padding:2px 6px;
      background:rgba(0,0,0,0.8);
      color:${isBoss ? "#f97316" : "#fff"};
      font-size:9px; white-space:nowrap;
      border:1px solid ${isBoss ? "#f97316" : accent};
      font-family:var(--font-pixel, monospace);
    `
    wrapper.appendChild(label)
  }

  return wrapper
}

// ── Props ─────────────────────────────────────────────────────────
interface MapScreenProps {
  completedLevels: string[]
  totalScore: number
  onSelectCompany: (slug: string) => void
}

// ── Component ─────────────────────────────────────────────────────
export function MapScreen({
  completedLevels,
  totalScore,
  onSelectCompany,
}: MapScreenProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [selected, setSelected] = useState<Company | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [bgmOn, setBgmOn] = useState(false)

  // Single ref bundles all audio state — no race conditions
  const bgmRef = useRef<{
    ctx: AudioContext
    timer: number
    noteIdx: number
    nextNote: number
  } | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        window.clearTimeout(bgmRef.current.timer)
        bgmRef.current.ctx.close()
        bgmRef.current = null
      }
    }
  }, [])

  // ── BGM toggle — AudioContext created INSIDE onClick = browser never blocks ──
  const toggleBGM = () => {
    if (bgmOn) {
      bgmRef.current?.ctx.suspend()
      setBgmOn(false)
      return
    }
    if (bgmRef.current) {
      bgmRef.current.ctx.resume()
      setBgmOn(true)
      return
    }
    // First press: create everything fresh inside this click handler
    const NOTES = [
      523, 659, 784, 1047, 784, 659, 523, 440, 523, 659, 784, 880, 784, 659,
      523, 392,
    ]
    const BEAT = 0.2
    const ctx = new AudioContext()
    const state = { ctx, timer: 0, noteIdx: 0, nextNote: ctx.currentTime + 0.05 }
    bgmRef.current = state

    const tick = () => {
      const s = bgmRef.current
      if (!s || s.ctx.state === "closed") return
      while (s.nextNote < s.ctx.currentTime + 0.2) {
        const freq = NOTES[s.noteIdx % NOTES.length]
        const osc = s.ctx.createOscillator()
        const env = s.ctx.createGain()
        osc.type = "square"
        osc.frequency.value = freq
        env.gain.setValueAtTime(0.09, s.nextNote)
        env.gain.exponentialRampToValueAtTime(0.0001, s.nextNote + BEAT * 0.8)
        osc.connect(env)
        env.connect(s.ctx.destination)
        osc.start(s.nextNote)
        osc.stop(s.nextNote + BEAT)
        s.nextNote += BEAT
        s.noteIdx++
      }
      s.timer = window.setTimeout(tick, 25)
    }
    tick()
    setBgmOn(true)
  }

  // ── Init map ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      renderWorldCopies: false,
    })

    map.on("load", () => {
      try {
        applyPixelStyle(map)
      } catch {
        /* decorative */
      }
      map.resize()

      // Add markers for ALL companies
      COMPANIES.forEach((company) => {
        const isUnlocked = UNLOCKED_SLUGS.includes(company.slug)
        const isCompleted = completedLevels.includes(company.slug)
        const state = !isUnlocked
          ? "locked"
          : isCompleted
            ? "completed"
            : "unlocked"

        const el = document.createElement("div")
        el.appendChild(buildMarkerEl(company, state))

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(company.coordinates)
          .addTo(map)

        if (isUnlocked) {
          el.addEventListener("click", () => {
            setSelected(company)
          })
        }

        markersRef.current.set(company.slug, marker)
      })

      setMapReady(true)
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

  // ── Re-render markers when selection changes ───────────────────
  useEffect(() => {
    if (!mapReady) return
    COMPANIES.forEach((company) => {
      const marker = markersRef.current.get(company.slug)
      if (!marker) return

      const isUnlocked = UNLOCKED_SLUGS.includes(company.slug)
      const isCompleted = completedLevels.includes(company.slug)
      const isSelected = selected?.slug === company.slug

      let markerState: "locked" | "unlocked" | "completed" | "selected"
      if (!isUnlocked) markerState = "locked"
      else if (isSelected) markerState = "selected"
      else if (isCompleted) markerState = "completed"
      else markerState = "unlocked"

      const el = marker.getElement()
      el.replaceChildren(buildMarkerEl(company, markerState))
      if (isUnlocked) {
        el.style.cursor = "pointer"
        el.addEventListener("click", () => setSelected(company))
      }
    })
  }, [selected, completedLevels, mapReady])

  // ── Fly to selected company ────────────────────────────────────
  useEffect(() => {
    if (!selected || !mapRef.current) return
    mapRef.current.flyTo({
      center: selected.coordinates,
      zoom: 13,
      speed: 0.8,
      essential: true,
    })
  }, [selected])

  const isBoss = selected?.slug === BOSS_SLUG
  const isSelectedCompleted = selected
    ? completedLevels.includes(selected.slug)
    : false

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Map */}
      {/* Inline style beats MapLibre's .maplibregl-map { position:relative } CSS */}
      <div
        ref={mapContainerRef}
        className="z-0"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      {/* Pixel grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(53,37,20,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(53,37,20,0.3) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Top HUD bar */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.75)",
          borderBottom: "2px solid #ffe66d",
        }}
      >
        <div style={{ fontFamily: "var(--font-pixel, monospace)" }}>
          <span className="text-xs text-[#ffe66d]">WEB3 TOKEN RUNNER</span>
          <span className="ml-2 text-xs text-white/50">· OKX US AI Hackathon</span>
        </div>
        <div
          className="flex items-center gap-4"
          style={{ fontFamily: "var(--font-pixel, monospace)" }}
        >
          <span className="text-xs text-white/70">
            ✅ {completedLevels.length}/2 cleared
          </span>
          {totalScore > 0 && (
            <span className="text-sm text-[#ffe66d]">
              ⭐ {totalScore.toLocaleString()}
            </span>
          )}
          <button
            onClick={toggleBGM}
            className="rounded px-3 py-1 text-xs font-bold border-2 transition-all"
            style={{
              fontFamily: "var(--font-pixel, monospace)",
              borderColor: bgmOn ? "#ffe66d" : "#ffffff50",
              color: bgmOn ? "#1a1a1a" : "#ffffff80",
              background: bgmOn ? "#ffe66d" : "rgba(255,255,255,0.08)",
              boxShadow: bgmOn ? "0 0 10px rgba(255,230,109,0.5)" : "none",
              letterSpacing: "0.05em",
            }}
          >
            {bgmOn ? "🎵 BGM" : "🔇 BGM"}
          </button>
        </div>
      </div>

      {/* Instruction when nothing selected */}
      {!selected && (
        <div className="absolute inset-x-0 bottom-8 z-30 text-center">
          <div
            className="inline-block rounded-lg border-2 border-[#ffe66d] bg-black/80 px-6 py-3"
            style={{ fontFamily: "var(--font-pixel, monospace)" }}
          >
            <p className="text-sm text-[#ffe66d]">
              📍 Click OKX or Coinbase to select a level
            </p>
            <p className="mt-1 text-xs text-white/50">
              🔒 Other companies = coming soon
            </p>
          </div>
        </div>
      )}

      {/* Selected company panel */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-4">
          <div
            className="mx-auto max-w-md rounded-xl border-2 p-4"
            style={{
              background: "rgba(0,0,0,0.92)",
              borderColor: isBoss ? "#f97316" : "#ffe66d",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs"
                  style={{
                    fontFamily: "var(--font-pixel, monospace)",
                    color: isBoss ? "#f97316" : "#ffe66d",
                  }}
                >
                  {isBoss
                    ? "⚡ BOSS LEVEL"
                    : isSelectedCompleted
                      ? "✅ COMPLETED"
                      : "📍 LEVEL 1"}
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  {selected.shortDescription}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-2 text-white/40 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onSelectCompany(selected.slug)}
                className="flex-1 rounded-lg py-2 text-sm font-bold transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "var(--font-pixel, monospace)",
                  background: isBoss ? "#f97316" : "#ffe66d",
                  color: isBoss ? "#fff" : "#1a1a2e",
                }}
              >
                {isBoss
                  ? "⚔️ ENTER BOSS"
                  : isSelectedCompleted
                    ? "🔄 PLAY AGAIN"
                    : "▶ ENTER LEVEL"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/60 hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Float animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              from { transform: translateY(0); }
              to { transform: translateY(-6px); }
            }
            .maplibregl-canvas {
              image-rendering: pixelated;
            }
          `,
        }}
      />
    </div>
  )
}
