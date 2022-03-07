import * as React from 'react'

import { calculateTreatmentScale, HEALTH_SHADES } from '~/domain/treatment'

export const HealthViz: React.FC<{
  admittedAt: Date
  treatmentDayCount: number
  style?: React.CSSProperties
}> = ({ style, admittedAt, treatmentDayCount }) => {
  const treatmentScale = calculateTreatmentScale(treatmentDayCount)

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
            width: `${(1 - treatmentScale.value) * 100}%`,
            height: '100%',
            backgroundColor: '#e1e4e8',
          }}
        >
          <span
            style={{
              // @ts-ignore
              '--size': '1.75em',
              '--healthPct': `${treatmentScale.value * 100}%`,
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
            {treatmentDayCount}
          </span>
        </div>
      </div>
      <div style={{ height: '0.5em' }} />
      <p style={{ margin: 0 }}>{admittedAtDisplay}</p>
    </div>
  )
}
