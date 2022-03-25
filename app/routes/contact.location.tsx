import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { Prisma } from '@prisma/client'
import React from 'react'
import { LoaderFunction } from 'remix'
import { ClientOnly, unprocessableEntity } from 'remix-utils'

import { useGetCurrentPosition } from '~/hooks/useGetCurrentPosition'
import { db } from '~/utils/db.server'
import { requireUserLineId } from '~/utils/session.server'
import { Map } from '~/components/map'

const INITIAL_ZOOM = 14
const INITIAL_LOCATION = {
  lat: 8.0294121,
  lng: 99.6502966,
}

export const loader: LoaderFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)

  const form = await db.homeIsolationForm.findFirst({
    where: { lineId: userLineId },
  })
  if (!form) {
    throw unprocessableEntity(`You must submit contact before submit location.`)
  }

  return new Response()
}

export default function ContactLocationRoute() {
  const [marker, setMarker] = React.useState<{
    location: google.maps.LatLngLiteral
    zoom: number
  }>({
    location: INITIAL_LOCATION,
    zoom: INITIAL_ZOOM,
  })

  const getCurrentPosition = useGetCurrentPosition()

  React.useEffect(
    function updateMarkerWhenGetCurrentPositionSuccess() {
      const { position } = getCurrentPosition
      position && setMarker({ location: position, zoom: 17 })
    },
    [getCurrentPosition.position]
  )

  const mapIdleHandler = (map: google.maps.Map) => {
    const zoom = map.getZoom()
    typeof zoom === 'number' && setMarker((prev) => ({ ...prev, zoom }))
  }

  const mapDragHandler = (map: google.maps.Map) => {
    const location = map.getCenter()?.toJSON()
    !!location && setMarker((prev) => ({ ...prev, location }))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <ClientOnly>
          {() => (
            <Wrapper apiKey={window.ENV.GOOGLE_MAP_API_KEY} render={render}>
              <Map
                canInteract={true}
                style={{ width: '100%', height: '100%' }}
                fullscreenControl={false}
                streetViewControl={false}
                mapTypeControl={false}
                keyboardShortcuts={false}
                zoomControl={false}
                onIdle={mapIdleHandler}
                onDrag={mapDragHandler}
                markerPosition={marker.location}
                zoom={marker.zoom}
              />
            </Wrapper>
          )}
        </ClientOnly>
      </div>
      <div
        style={{
          height: 'max-content',
          padding: '24px',
          position: 'relative',
          backgroundColor: 'white',
          overflow: 'auto',
        }}
      >
        <div style={{}}>
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
            // onClick={() => setEditingMode(EditingMode.EditForm)}
          >
            ยืนยันพิกัด
          </button>
        </div>
      </div>
    </div>
  )
}

const render = (status: Status) => {
  return <div>{status}</div>
}
