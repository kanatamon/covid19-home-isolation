import * as React from 'react'
import { Prisma } from '@prisma/client'
import { LinksFunction } from 'remix'
import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { ClientOnly } from 'remix-utils'

import { Map } from '~/components/map'
import { HomeIsolationFormView } from '~/components/home-isolation-form-view'
import { useGetCurrentPosition } from '~/hooks/useGetCurrentPosition'
import { useHasMounted } from '~/hooks/useHasMounted'

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

  const getCurrentPosition = useGetCurrentPosition()

  React.useEffect(
    function updateUserMapPreferencesWhenGetCurrentPositionSuccess() {
      const { position } = getCurrentPosition
      position && setUserMapPreference({ center: position, zoom: 17 })
    },
    [getCurrentPosition.position]
  )

  const hasMounted = useHasMounted()
  React.useEffect(
    function () {
      if (!hasMounted) {
        return
      }
    },
    [hasMounted]
  )

  const mapMarkerSettledHandler = (
    markerLatLng: google.maps.LatLngLiteral | undefined
  ) => {
    markerLatLng && setMarkerLatLng(markerLatLng)
  }

  // const geolocationPlace = (
  //   <p
  //     style={{
  //       backgroundColor: 'gainsboro',
  //       padding: '12px 16px',
  //       margin: 0,
  //     }}
  //   >
  //     TODO: Add the nearest place from geolocation
  //   </p>
  // )

  let editor = null

  if (editingMode === EditingMode.EditForm) {
    editor = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <div>
          {/* {geolocationPlace}
          <div style={{ height: 24 }} /> */}
          <button onClick={() => setEditingMode(EditingMode.PinMap)}>
            เปลี่ยนพิกัด
          </button>
        </div>
        <HomeIsolationFormView
          action="/home-isolation-form/new"
          data={{
            lat: new Prisma.Decimal(markerLatLng.lat),
            lng: new Prisma.Decimal(markerLatLng.lng),
          }}
          isEditable
        />
      </div>
    )
  } else if (editingMode === EditingMode.PinMap) {
    editor = (
      <div>
        {/* {geolocationPlace}
        <div style={{ height: 24 }} /> */}
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
                // isRenderCenterMarker
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
        {editor}
      </div>
    </div>
  )
}

const render = (status: Status) => {
  return <div>{status}</div>
}
