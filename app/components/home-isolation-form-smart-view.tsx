import * as React from 'react'
import {
  HomeIsolationFormView,
  HomeIsolationFromViewProps,
} from './home-isolation-form-view'

type HomeIsolationFormSmartViewProps = Omit<
  HomeIsolationFromViewProps,
  'isEditable'
>

export const HomeIsolationFormSmartView: React.FC<
  HomeIsolationFormSmartViewProps
> = ({ data, action }) => {
  const [isEditable, setIsEditable] = React.useState(false)

  const isEditableChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { checked } = event.target
    setIsEditable(checked)
  }

  const copyToClipboardHandler = () => {
    if (!navigator.clipboard || !data.patients) {
      return
    }

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

    navigator.clipboard.writeText(lines).then(
      function () {
        console.log('Async: Copying to clipboard was successful!')
      },
      function (err) {
        console.error('Async: Could not copy text: ', err)
      }
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            style={{ width: 'revert' }}
            type="checkbox"
            name="isEditable"
            checked={isEditable}
            onChange={isEditableChangeHandler}
          />
          <label>edit?</label>
        </div>
        <button
          onClick={copyToClipboardHandler}
          style={{ fontSize: '1em', width: 'max-content' }}
        >
          Copy
        </button>
      </div>
      <hr style={{ margin: '0.75em 0 1.5em' }} />
      <p
        style={{
          backgroundColor: 'gainsboro',
          padding: '0.75em 1rem',
          margin: 0,
        }}
      >
        TODO: Add the nearest place from geolocation
      </p>
      <div style={{ height: '1.5em' }} />
      <HomeIsolationFormView
        action={action}
        data={data}
        isEditable={isEditable}
      />
    </div>
  )
}
