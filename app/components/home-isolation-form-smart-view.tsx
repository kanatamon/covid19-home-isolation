import * as React from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'

import { HomeIsolationFormView } from '~/components/home-isolation-form-view'
import { HomeIsolationFormListItem } from '~/components/home-isolation-form-list-item'

type Data = HomeIsolationForm & {
  patients: Patient[]
}

type Props = {
  action: string
  data: Data
  isSpottedOnMap?: boolean
  onMapBtnClick?: (formId: string) => any
}

export const HomeIsolationFormSmartView: React.FC<Props> = ({
  data,
  action,
  onMapBtnClick,
  isSpottedOnMap = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(false)

  const toggleIsEditing = () => setIsEditing((prev) => !prev)

  const emitFormId = () => onMapBtnClick?.(data.id)

  return (
    <div>
      <HomeIsolationFormListItem
        data={data}
        onEditBtnClick={toggleIsEditing}
        onMapBtnClick={emitFormId}
        mapBtnStyle={{
          backgroundColor: isSpottedOnMap ? 'black' : 'revert',
          color: isSpottedOnMap ? 'white' : 'black',
        }}
      />
      {isEditing ? (
        <>
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
          <HomeIsolationFormView action={action} data={data} isEditable />
        </>
      ) : null}
    </div>
  )
}
