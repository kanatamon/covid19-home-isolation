import * as React from 'react'

const MILLISECONDS_IN_A_DAY = 1000 * 3600 * 24

const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max)

export const HealthViz: React.FC<{
  admittedAt: Date
  style?: React.CSSProperties
}> = ({ style, admittedAt }) => {
  const timeDiff = new Date().getTime() - admittedAt.getTime()
  const daysDiff = Math.floor(timeDiff / MILLISECONDS_IN_A_DAY)
  const healthVal = clamp(daysDiff, 0, 10) / 10

  const admittedAtDisplay = new Intl.DateTimeFormat('th', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(admittedAt)

  return (
    <div style={{ ...style }}>
      <div
        style={{
          width: '100%',
          height: '1em',
          borderRadius: '3px',
          background: 'linear-gradient(90deg,#f7797d, #fbd786, #c6ffdd)',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginLeft: 'auto',
            width: `${(1 - healthVal) * 100}%`,
            height: '100%',
            backgroundColor: '#e1e4e8',
          }}
        >
          <span
            style={{
              // @ts-ignore
              '--size': '1.75em',
              '--healthPct': `${healthVal * 100}%`,
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
              background: 'linear-gradient(90deg,#f7797d, #fbd786, #c6ffdd)',
              backgroundSize: '1000% 100%',
              backgroundPosition: 'var(--healthPct)',
            }}
          >
            {daysDiff}
          </span>
        </div>
      </div>
      <div style={{ height: '0.5em' }} />
      <p style={{ margin: 0 }}>{admittedAtDisplay}</p>
    </div>
  )
}
