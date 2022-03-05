import * as React from 'react'
import chroma from 'chroma-js'

const MILLISECONDS_IN_A_DAY = 1000 * 3600 * 24
const TREATMENT_DAYS = 10
const HEALTH_SHADES = ['#f7797d', '#fbd786', '#c6ffdd']
const healthScale = chroma.scale(HEALTH_SHADES)

export const calculateHealth = (admittedAt: Date) => {
  const timeDiff = new Date().getTime() - admittedAt.getTime()
  const day = clamp(
    Math.floor(timeDiff / MILLISECONDS_IN_A_DAY),
    0,
    TREATMENT_DAYS
  )
  const value = day / TREATMENT_DAYS

  return { day, value, color: healthScale(value).hex() }
}

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)

export const HealthViz: React.FC<{
  admittedAt: Date
  style?: React.CSSProperties
}> = ({ style, admittedAt }) => {
  const treatment = calculateHealth(admittedAt)

  const admittedAtDisplay = new Intl.DateTimeFormat('th', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(admittedAt)

  return (
    <div style={{ ...style }}>
      <div
        style={{
          // @ts-ignore
          '--health-bg': `linear-gradient(90deg, ${HEALTH_SHADES.join(',')})`,
          width: '100%',
          height: '1em',
          borderRadius: '3px',
          background: 'var(--health-bg)',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginLeft: 'auto',
            width: `${(1 - treatment.value) * 100}%`,
            height: '100%',
            backgroundColor: '#e1e4e8',
          }}
        >
          <span
            style={{
              // @ts-ignore
              '--size': '1.75em',
              '--healthPct': `${treatment.value * 100}%`,
              position: 'absolute',
              top: '50%',
              right: '100%',
              transform: 'translate(50%, -50%)',
              width: 'var(--size)',
              height: 'var(--size)',
              borderRadius: 999,
              display: 'grid',
              placeContent: 'center',
              fontWeight: 'bold',
              background: 'var(--health-bg)',
              backgroundSize: '1000% 100%',
              backgroundPosition: 'var(--healthPct)',
            }}
          >
            {treatment.day}
          </span>
        </div>
      </div>
      <div style={{ height: '0.5em' }} />
      <p style={{ margin: 0 }}>{admittedAtDisplay}</p>
    </div>
  )
}
