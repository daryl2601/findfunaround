import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useMousePosition from '../hooks/useMousePosition'

const BODY = '#ff4fd8'
const INK = '#1b0b33'
const EYES = [
  { cx: 70, cy: 90 },
  { cx: 130, cy: 90 },
]

const SPIRAL = (() => {
  let d = 'M0 0'
  for (let i = 1; i <= 70; i++) {
    const t = (i / 70) * Math.PI * 6
    const r = t * 1.2
    d += ` L${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`
  }
  return d
})()

const loop = (duration, ease = 'easeInOut') => ({ repeat: Infinity, duration, ease })
const settle = { type: 'spring', stiffness: 220, damping: 14 }

/** Whole-body motion for every mood: [animate, transition] */
const BODY_MOTION = {
  idle: [{ y: [0, -5, 0], rotate: 0, scale: 1 }, { y: loop(3), default: settle }],
  chill: [{ y: [0, -3, 0], rotate: [-2, 2, -2], scale: 1 }, { y: loop(4.5), rotate: loop(6), default: settle }],
  party: [
    { y: [0, -14, 0], rotate: [-6, 6, -6], scale: [1, 1.05, 1] },
    { y: loop(0.5, 'easeOut'), rotate: loop(0.5), scale: loop(0.5), default: settle },
  ],
  outdoor: [{ y: [0, -6, 0], rotate: 0, scale: 1 }, { y: loop(2), default: settle }],
  foodie: [{ y: 0, rotate: [-3, 3, -3], scale: [1, 1.06, 1] }, { rotate: loop(1.2), scale: loop(0.8), default: settle }],
  family: [{ y: [0, -9, 0], rotate: 0, scale: 1 }, { y: loop(1.1, 'easeOut'), default: settle }],
  date: [{ y: 0, rotate: 0, scale: [1, 1.06, 1] }, { scale: loop(0.9), default: settle }],
  wow: [{ y: -4, rotate: 0, scale: 1.1 }, settle],
  sad: [{ y: 4, rotate: 0, scale: [1, 0.97, 1] }, { scale: loop(2), default: settle }],
  dizzy: [{ y: 0, rotate: [-12, 12, -12], scale: 1 }, { rotate: loop(0.35), default: settle }],
  loading: [
    { y: [0, -18, 0], rotate: [0, 360], scale: [1, 0.94, 1] },
    { y: loop(0.45, 'easeOut'), rotate: { repeat: Infinity, duration: 0.9, ease: 'linear' }, scale: loop(0.45), default: settle },
  ],
  celebrate: [
    { y: [0, -34, 0, -22, 0, -10, 0], rotate: [0, -8, 8, -4, 0], scale: [1, 1.1, 0.96, 1.06, 1] },
    { duration: 1.3, ease: 'easeOut' },
  ],
}

const EYE_POP = {
  party: { s: 1.4, y: -12 },
  celebrate: { s: 1.3, y: -8 },
  wow: { s: 1.22, y: -3 },
  loading: { s: 1, y: 0 },
}

function Eye({ cx, cy, mood, pointer, svgRef, blink }) {
  const pop = EYE_POP[mood] || { s: 1, y: 0 }
  const spiral = mood === 'dizzy' || mood === 'loading'

  let dx = 0
  let dy = 3
  if (pointer.x != null && svgRef.current) {
    const rect = svgRef.current.getBoundingClientRect()
    const s = rect.width / 200
    const vx = pointer.x - (rect.left + cx * s)
    const vy = pointer.y - (rect.top + cy * s)
    const angle = Math.atan2(vy, vx)
    const travel = Math.min(11, Math.hypot(vx, vy) / (s * 8))
    dx = Math.cos(angle) * travel
    dy = Math.sin(angle) * travel
  }

  const pupilR = mood === 'wow' ? 6 : mood === 'party' || mood === 'celebrate' ? 9 : 11

  return (
    <motion.g
      animate={{ scaleX: pop.s, scaleY: pop.s * (blink ? 0.08 : 1), y: pop.y }}
      transition={blink ? { duration: 0.08 } : { type: 'spring', stiffness: 380, damping: 11 }}
    >
      <circle cx={cx} cy={cy} r="24" fill="#fff" stroke={INK} strokeWidth="3" />
      {spiral ? (
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: mood === 'loading' ? 0.5 : 1.1, ease: 'linear' }}
        >
          <path d={SPIRAL} transform={`translate(${cx} ${cy})`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      ) : (
        <motion.g animate={{ x: dx, y: dy }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
          {mood === 'date' ? (
            <path
              transform={`translate(${cx} ${cy + 2}) scale(1.35)`}
              d="M0 8 C-14 -2 -12 -13 -5 -13 C-2 -13 0 -11 0 -9 C0 -11 2 -13 5 -13 C12 -13 14 -2 0 8 Z"
              fill="#ff2d55"
            />
          ) : (
            <>
              <circle cx={cx} cy={cy} r={pupilR} fill={INK} />
              <circle cx={cx - 4} cy={cy - 4} r="3.4" fill="#fff" />
            </>
          )}
        </motion.g>
      )}
      {mood === 'chill' && (
        <g>
          <path d={`M${cx - 25} ${cy + 1} a25 25 0 0 1 50 0 Z`} fill={BODY} />
          <line x1={cx - 25} y1={cy + 1} x2={cx + 25} y2={cy + 1} stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </motion.g>
  )
}

function Mouth({ mood }) {
  const stroke = { stroke: INK, strokeWidth: 5, strokeLinecap: 'round', fill: 'none' }
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 } }

  switch (mood) {
    case 'party':
    case 'celebrate':
    case 'family':
      return (
        <motion.g key="open" {...fade}>
          <path d="M74 128 Q100 178 126 128 Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <ellipse cx="100" cy="154" rx="12" ry="7" fill="#ff7a9c" />
        </motion.g>
      )
    case 'wow':
    case 'dizzy':
    case 'loading':
      return (
        <motion.ellipse
          key="o"
          cx="100"
          cy="144"
          rx="8"
          ry="10"
          fill={INK}
          animate={mood === 'loading' ? { ry: [10, 5, 10] } : { ry: 10 }}
          transition={mood === 'loading' ? loop(0.45) : undefined}
        />
      )
    case 'foodie':
      return (
        <motion.g key="yum" {...fade}>
          <path d="M78 132 Q100 156 122 132" {...stroke} />
          <motion.ellipse cx="112" cy="148" rx="7" ry="10" fill="#ff7a9c" animate={{ y: [0, 3, 0] }} transition={loop(0.6)} />
        </motion.g>
      )
    case 'chill':
      return <motion.path key="chill" d="M86 140 Q100 146 114 138" {...stroke} {...fade} />
    case 'outdoor':
      return <motion.path key="cool" d="M78 134 Q104 158 126 128" {...stroke} {...fade} />
    case 'sad':
      return <motion.path key="sad" d="M82 146 Q100 130 118 146" {...stroke} {...fade} />
    case 'date':
      return <motion.path key="date" d="M84 136 Q100 152 116 136" {...stroke} {...fade} />
    default:
      return <motion.path key="idle" d="M80 136 Q100 154 120 136" {...stroke} {...fade} />
  }
}

function Sunglasses() {
  return (
    <motion.g
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
    >
      <rect x="42" y="66" width="56" height="48" rx="16" fill="#0b0614" stroke="#facc15" strokeWidth="3" />
      <rect x="102" y="66" width="56" height="48" rx="16" fill="#0b0614" stroke="#facc15" strokeWidth="3" />
      <path d="M98 86 L102 86" stroke="#facc15" strokeWidth="4" />
      <path d="M42 80 L22 74 M158 80 L178 74" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
      <path d="M52 76 L68 76 M112 76 L128 76" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </motion.g>
  )
}

function Confetti() {
  const bits = [
    { x: 24, c: '#facc15', d: 0 },
    { x: 60, c: '#5eead4', d: 0.2 },
    { x: 100, c: '#ffffff', d: 0.1 },
    { x: 140, c: '#facc15', d: 0.3 },
    { x: 176, c: '#5eead4', d: 0.15 },
  ]
  return (
    <g>
      {bits.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          y="10"
          width="7"
          height="7"
          rx="1.5"
          fill={b.c}
          initial={{ opacity: 0 }}
          animate={{ y: [0, 70, 150], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 1.4, delay: b.d, ease: 'easeIn' }}
        />
      ))}
    </g>
  )
}

function Radar() {
  return (
    <g>
      {[0, 0.45, 0.9].map((delay) => (
        <motion.circle
          key={delay}
          cx="100"
          cy="105"
          fill="none"
          stroke="#5eead4"
          strokeWidth="3"
          initial={{ r: 70, opacity: 0 }}
          animate={{ r: [70, 130], opacity: [0.8, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, delay, ease: 'easeOut' }}
        />
      ))}
    </g>
  )
}

export default function Mascot({ mood = 'idle', size = 190, className = '' }) {
  const svgRef = useRef(null)
  const pointer = useMousePosition()
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    let timeout
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 130)
        schedule()
      }, 2200 + Math.random() * 2800)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])

  const [animate, transition] = BODY_MOTION[mood] || BODY_MOTION.idle

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 210"
      width={size}
      height={size * 1.05}
      className={className}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Find Fun mascot"
    >
      <defs>
        <radialGradient id="blobShine" cx="32%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blobShade" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#7c1fa8" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#7c1fa8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {mood === 'loading' && <Radar />}
      <ellipse cx="100" cy="201" rx="52" ry="6" fill="#000" opacity="0.28" />

      <motion.g animate={animate} transition={transition}>
        {/* feet */}
        <ellipse cx="68" cy="188" rx="17" ry="9" fill="#d12fb0" />
        <ellipse cx="132" cy="188" rx="17" ry="9" fill="#d12fb0" />

        {/* antenna */}
        <line x1="100" y1="22" x2="100" y2="4" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <motion.circle cx="100" cy="2" r="7" fill="#facc15" stroke={INK} strokeWidth="3" animate={{ y: [0, -3, 0] }} transition={loop(1.2)} />

        {/* body */}
        <path
          d="M100 18 C152 14 190 54 186 106 C183 156 148 190 100 190 C52 190 17 156 14 106 C10 54 48 22 100 18 Z"
          fill={BODY}
          stroke={INK}
          strokeWidth="4"
        />
        <path
          d="M100 18 C152 14 190 54 186 106 C183 156 148 190 100 190 C52 190 17 156 14 106 C10 54 48 22 100 18 Z"
          fill="url(#blobShine)"
        />
        <path
          d="M100 18 C152 14 190 54 186 106 C183 156 148 190 100 190 C52 190 17 156 14 106 C10 54 48 22 100 18 Z"
          fill="url(#blobShade)"
        />

        {/* blush */}
        {(mood === 'date' || mood === 'family') && (
          <g fill="#ff2d55" opacity="0.4">
            <circle cx="46" cy="122" r="10" />
            <circle cx="154" cy="122" r="10" />
          </g>
        )}

        {EYES.map((e) => (
          <Eye key={e.cx} {...e} mood={mood} pointer={pointer} svgRef={svgRef} blink={blink} />
        ))}

        <Mouth mood={mood} />

        <AnimatePresence>{mood === 'outdoor' && <Sunglasses key="shades" />}</AnimatePresence>
        {(mood === 'party' || mood === 'celebrate') && <Confetti />}
      </motion.g>
    </svg>
  )
}

/** Tiny pair of tracking googly eyes — used in the CTA button and logo. */
export function GooglyEyes({ size = 26, className = '' }) {
  const pointer = useMousePosition()
  const refs = [useRef(null), useRef(null)]

  const offsets = refs.map((r) => {
    if (!r.current || pointer.x == null) return { x: 0, y: size * 0.08 }
    const b = r.current.getBoundingClientRect()
    const vx = pointer.x - (b.left + b.width / 2)
    const vy = pointer.y - (b.top + b.height / 2)
    const angle = Math.atan2(vy, vx)
    const d = Math.min(size * 0.22, Math.hypot(vx, vy) / 18)
    return { x: Math.cos(angle) * d, y: Math.sin(angle) * d }
  })

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden="true">
      {refs.map((r, i) => (
        <span
          key={i}
          ref={r}
          className="relative block rounded-full border-2 border-night bg-white"
          style={{ width: size, height: size }}
        >
          <span
            className="absolute left-1/2 top-1/2 block rounded-full bg-night"
            style={{
              width: size * 0.45,
              height: size * 0.45,
              transform: `translate(calc(-50% + ${offsets[i].x}px), calc(-50% + ${offsets[i].y}px))`,
              transition: 'transform 80ms linear',
            }}
          />
        </span>
      ))}
    </span>
  )
}
