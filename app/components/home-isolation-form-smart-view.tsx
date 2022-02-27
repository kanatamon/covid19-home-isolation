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

  return (
    <div>
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
