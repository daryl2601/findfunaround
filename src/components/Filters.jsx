import { motion } from 'framer-motion'
import { BUDGETS, GROUPS, RADII, VIBES } from '../lib/constants'

function Chip({ active, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      data-active={active}
      aria-pressed={active}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`chip ${className}`}
    >
      {children}
    </motion.button>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-widest text-white/50">{title}</h3>
      {children}
    </section>
  )
}

export default function Filters({ filters, onChange }) {
  return (
    <div className="space-y-5">
      <Section title="Budget">
        <div className="grid grid-cols-5 gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b.id} active={filters.budget === b.id} onClick={() => onChange('budget', b.id)} className="text-center">
              {b.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Vibe">
        <div className="grid grid-cols-2 gap-2">
          {VIBES.map((v) => (
            <Chip key={v.id} active={filters.vibe === v.id} onClick={() => onChange('vibe', v.id)} className="flex items-center gap-2">
              <span className="text-lg leading-none">{v.emoji}</span>
              <span>{v.label}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Who’s coming?">
        <div className="grid grid-cols-2 gap-2">
          {GROUPS.map((g) => (
            <Chip key={g.id} active={filters.group === g.id} onClick={() => onChange('group', g.id)} className="flex items-center justify-between">
              <span>{g.label}</span>
              <span className="text-xs opacity-60">{g.hint}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="How far?">
        <div className="grid grid-cols-3 gap-2">
          {RADII.map((r) => (
            <Chip key={r.id} active={filters.radius === r.id} onClick={() => onChange('radius', r.id)} className="text-center">
              <div>{r.label}</div>
              <div className="text-[11px] opacity-60">{r.hint}</div>
            </Chip>
          ))}
        </div>
      </Section>
    </div>
  )
}
