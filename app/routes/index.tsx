import * as React from 'react'
import { LinksFunction } from 'remix'
import { ClientOnly } from 'remix-utils'
import { Patient, Prisma } from '@prisma/client'
import { Status, Wrapper } from '@googlemaps/react-wrapper'

import { Map } from '~/components/map'
import { HomeIsolationFormView } from '~/components/home-isolation-form-view'
import { useGetCurrentPosition } from '~/hooks/useGetCurrentPosition'
import { useGetLineProfile } from '~/hooks/useLineLiff'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
]

const INITIAL_ZOOM = 14
const INITIAL_POSITION = {
  lat: 8.0294121,
  lng: 99.6502966,
}

enum EditingMode {
  PinMap,
  EditForm,
}

type PatientsEditorData = Omit<Patient, 'formOwnerId'>[]

export default function Index() {
  const [editingMode, setEditingMode] = React.useState<EditingMode>(
    EditingMode.PinMap
  )
  const [userMapPreference, setUserMapPreference] = React.useState<{
    center: google.maps.LatLngLiteral
    zoom: number
  }>({
    center: INITIAL_POSITION,
    zoom: INITIAL_ZOOM,
  })
  const [markerLatLng, setMarkerLatLng] =
    React.useState<google.maps.LatLngLiteral>(INITIAL_POSITION)
  const [patientsEditorData, setPatientsEditorData] =
    React.useState<PatientsEditorData>(() => {
      return [{ id: 'new', name: '' }]
    })

  const getLineProfile = useGetLineProfile()
  const getCurrentPosition = useGetCurrentPosition()

  React.useEffect(
    function useLineProfileNameAsDefaultPatients() {
      const { profile } = getLineProfile
      if (!profile) {
        return
      }

      setPatientsEditorData((prev) => [
        {
          id: profile.userId,
          name: profile.displayName,
        },
      ])
    },
    [getLineProfile.profile]
  )

  React.useEffect(
    function updateUserMapPreferencesWhenGetCurrentPositionSuccess() {
      const { position } = getCurrentPosition
      position && setUserMapPreference({ center: position, zoom: 17 })
    },
    [getCurrentPosition.position]
  )

  const mapMarkerSettledHandler = (
    markerLatLng: google.maps.LatLngLiteral | undefined
  ) => {
    markerLatLng && setMarkerLatLng(markerLatLng)
  }

  let action = null

  if (getLineProfile.shouldLoginManually) {
    action = (
      <button onClick={getLineProfile.login}>เข้าสู่ระบบด้วย LINE</button>
    )
  } else {
    const { profile } = getLineProfile
    const data = {
      lineId: profile?.userId,
      lineDisplayName: profile?.displayName,
      linePictureUrl: profile?.pictureUrl,
      lat: new Prisma.Decimal(markerLatLng.lat),
      lng: new Prisma.Decimal(markerLatLng.lng),
      patients: patientsEditorData,
    }

    action = (
      <>
        <div
          style={{
            display: editingMode === EditingMode.EditForm ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          <div>
            <button onClick={() => setEditingMode(EditingMode.PinMap)}>
              เปลี่ยนพิกัด
            </button>
          </div>
          <HomeIsolationFormView
            action="/home-isolation-form/new"
            data={data}
            isEditable
          />
        </div>
        <div
          style={{
            display: editingMode === EditingMode.PinMap ? 'block' : 'none',
          }}
        >
          <button
            onClick={getCurrentPosition.fetch}
            disabled={getCurrentPosition.state === 'pending'}
          >
            {getCurrentPosition.state === 'pending'
              ? 'กำลังระบุตำแหน่ง...'
              : 'ตำแหน่งปัจจุบัน'}
          </button>
          <div style={{ height: 24 }} />
          <button
            className="primary-btn"
            onClick={() => setEditingMode(EditingMode.EditForm)}
          >
            ยืนยันพิกัด
          </button>
        </div>
      </>
    )
  }

  const canPinMap = editingMode === EditingMode.PinMap

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          // @ts-ignore
          '--height': editingMode === EditingMode.PinMap ? '80%' : '20%',
          height: 'var(--height)',
        }}
      >
        <ClientOnly>
          {() => (
            <Wrapper apiKey={window.ENV.GOOGLE_MAP_API_KEY} render={render}>
              <Map
                canInteract={canPinMap}
                userPreference={userMapPreference}
                style={{ width: '100%', height: '100%' }}
                fullscreenControl={false}
                streetViewControl={false}
                mapTypeControl={false}
                keyboardShortcuts={false}
                zoomControl={false}
                onMarkerSettled={mapMarkerSettledHandler}
                markerPosition={markerLatLng}
              />
            </Wrapper>
          )}
        </ClientOnly>
      </div>
      <div
        style={{
          flexGrow: 1,
          padding: '32px 24px',
          position: 'relative',
          top: '-24px',
          backgroundColor: 'white',
          overflow: 'auto',
        }}
      >
        {action}
      </div>
    </div>
  )
}

const render = (status: Status) => {
  return <div>{status}</div>
}
