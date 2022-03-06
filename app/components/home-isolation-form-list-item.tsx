import * as React from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'

import { HealthViz } from '~/components/health-viz'
import { useClipboard } from '~/hooks/useClipboard'

type Data = HomeIsolationForm & {
  patients: Patient[]
}

export const HomeIsolationFormListItem: React.FC<{
  data: Data
  onEditBtnClick?: () => any
  onMapBtnClick?: () => any
  mapBtnStyle?: React.CSSProperties
}> = ({ data, onEditBtnClick, onMapBtnClick, mapBtnStyle = {} }) => {
  const clipboard = useClipboard()

  const copyDataToClipboard = () => {
    const lines = [
      `${data.zone}, ${data.address}`,
      data.landmarkNote ? `จุดสังเกตุ ${data.landmarkNote}` : undefined,
      ``,
      `โทร. ${data.phone}`,
      ``,
      `รายชื่อผู้ป่วย`,
      ...data.patients.map((patient, idx) => `${idx + 1}. ${patient.name}`),
      ``,
      `+++จำนวน ${data.patients.length} กล่อง+++`,
      ``,
      `https://www.google.com/maps/dir//${data.lat},${data.lng}`,
    ]
      .filter((line) => typeof line !== 'undefined')
      .join('\n')

    clipboard.copy(lines)
  }

  const patientsDisplay = `${data.patients?.[0].name}${
    data.patients.length > 1 ? ` และอีก ${data.patients.length - 1} คน` : ''
  }`

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: '1 0 0' }}>
        <p style={{ margin: 0 }}>{patientsDisplay}</p>
      </div>
      <HealthViz
        style={{ flexBasis: '33%' }}
        admittedAt={new Date(data.admittedAt)}
      />
      <ActionsList style={{ width: 'max-content' }}>
        <ActionBtn onClick={onMapBtnClick} style={mapBtnStyle}>
          Map
        </ActionBtn>
        <ActionBtn onClick={onEditBtnClick}>Edit</ActionBtn>
        <ActionBtn
          onClick={copyDataToClipboard}
          disabled={clipboard.state !== 'support'}
        >
          Copy
        </ActionBtn>
      </ActionsList>
    </div>
  )
}
const ActionsList: React.FC<{ style?: React.CSSProperties }> = ({
  children,
  style = {},
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5em',
        // @ts-ignore
        '--btn-size': '44px',
        '--btn-font-size': '1em',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
const ActionBtn: React.FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({ children, style, ...other }) => {
  return (
    <button
      {...other}
      style={{
        ...style,
        fontSize: 'var(--btn-font-size)',
        minWidth: 'var(--btn-size)',
        fontWeight: 'bold',
      }}
    >
      {children}
    </button>
  )
}
