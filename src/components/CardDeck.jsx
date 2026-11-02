import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import VenueCard from './VenueCard'

const variants = {
  enter: { scale: 0.92, opacity: 0, y: 24 },
  center: { scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 },
  exit: (dir) => ({ x: dir * 420, rotate: dir * 14, opacity: 0, transition: { duration: 0.28 } }),
}

/** Swipeable stack: drag a card sideways (or use the arrows) to move to the next pick. */
export default function CardDeck({ items, index, direction, onStep }) {
  const n = items.length
  const current = items[((index % n) + n) % n]

  return (
    <div className="space-y-4">
      <div className="relative pb-6">
        {n > 1 &&
          [2, 1].map((depth) => (
            <div
              key={depth}
              className="absolute inset-x-0 top-0 h-full rounded-[24px] border border-white/10 bg-grape"
              style={{
                transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.045})`,
                opacity: 1 - depth * 0.28,
                zIndex: 0,
              }}
            />
          ))}

        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={n > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 600) {
                onStep(info.offset.x < 0 ? 1 : -1, info.offset.x < 0 ? -1 : 1)
              }
            }}
            whileDrag={{ scale: 1.02 }}
            className="relative z-10"
            style={{ touchAction: 'pan-y' }}
          >
            <VenueCard venue={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {n > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onStep(-1, 1)}
            className="glass flex h-11 w-11 items-center justify-center rounded-full active:scale-90"
            aria-label="Previous pick"
          >
            <ChevronLeft />
          </button>

          <div className="flex items-center gap-1.5" aria-label={`Pick ${(index % n) + 1} of ${n}`}>
            {items.map((v, i) => (
              <span
                key={v.id}
                className={`h-2 rounded-full transition-all ${i === ((index % n) + n) % n ? 'w-6 bg-zap' : 'w-2 bg-white/25'}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => onStep(1, -1)}
            className="glass flex h-11 w-11 items-center justify-center rounded-full active:scale-90"
            aria-label="Next pick"
          >
            <ChevronRight />
          </button>
        </div>
      )}
      {n > 1 && <p className="text-center text-xs text-white/40">Swipe the card or tap the arrows</p>}
    </div>
  )
}
