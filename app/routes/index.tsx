import * as React from 'react'
import { Prisma } from '@prisma/client'
import { Status, Wrapper } from '@googlemaps/react-wrapper'

import { Map } from '~/components/map'
import { HomeIsolationFormView } from '~/components/home-isolation-form-view'

const INITIAL_ZOOM = 14
const INITIAL_LAT_LNG = {
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

  const [getCurrentPositionState, setGetCurrentPositionState] =
    React.useState('idle')

  const [userMapPreferences, setUserMapPreferences] = React.useState<
    google.maps.LatLngLiteral & { zoom: number }
  >({
    ...INITIAL_LAT_LNG,
    zoom: INITIAL_ZOOM,
  })
  const [markerLatLng, setMarkerLatLng] =
    React.useState<google.maps.LatLngLiteral>(INITIAL_LAT_LNG)

  const onIdle = (markerLatLng: google.maps.LatLngLiteral | undefined) => {
    if (markerLatLng) {
      setMarkerLatLng(markerLatLng)
    }
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
    const getCurrentPositionHandler = () => {
      setGetCurrentPositionState('pending')
      navigator?.geolocation.getCurrentPosition(
        (pos) => {
          setGetCurrentPositionState('success')
          setUserMapPreferences({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            zoom: 18,
          })
        },
        (error) => {
          setGetCurrentPositionState('error')
          console.warn(`ERROR(${error.code}): ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      )
    }

    editor = (
      <div>
        {/* {geolocationPlace}
        <div style={{ height: 24 }} /> */}
        <button
          onClick={getCurrentPositionHandler}
          disabled={getCurrentPositionState === 'pending'}
        >
          {getCurrentPositionState === 'pending'
            ? 'กำลังค้นหา...'
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
        <Wrapper
          apiKey={'AIzaSyBvzV8nKgqy1Ia3_gR3jJ1cv-F9d5J9Rzg'}
          render={render}
        >
          <Map
            // center={center}
            canInteract={canPinMap}
            userPreferences={userMapPreferences}
            // initialLatLng={INITIAL_LAT_LNG}
            // initialZoom={INITIAL_ZOOM}
            onIdle={onIdle}
            style={{ width: '100%', height: '100%' }}
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
            keyboardShortcuts={false}
            zoomControl={false}
            isRenderCenterMarker
          />
        </Wrapper>
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
  return <h1>{status}</h1>
}
