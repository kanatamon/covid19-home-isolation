import * as React from 'react'
import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { HomeIsolationForm, Patient } from '@prisma/client'
import { json, LoaderFunction, useLoaderData } from 'remix'

import { db } from '~/utils/db.server'
import { requireAdminPermission } from '~/utils/session.server'
import { Map } from '~/components/map'
import { HomeIsolationFormSmartView } from '~/components/home-isolation-form-smart-view'

type LoaderData = {
  homeIsolationForms: (HomeIsolationForm & { patients: Patient[] })[]
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminPermission(request)

  const homeIsolationForms = await db.homeIsolationForm.findMany({
    include: {
      patients: true,
    },
    orderBy: { admittedAt: 'desc' },
    take: 20,
  })
  return json<LoaderData>({ homeIsolationForms })
}

export default function AdminDashboardRoute() {
  const data = useLoaderData<LoaderData>()

  return (
    <div
      style={{
        fontSize: 12,
        display: 'flex',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 'clamp(350px, 33%, 500px)',
          height: '100%',
          overflow: 'auto',
          padding: 12,
          backgroundColor: 'whitesmoke',
        }}
      >
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {data.homeIsolationForms.map((form) => {
            return (
              <li
                key={form.id}
                style={{
                  borderRadius: 6,
                  border: '1px solid darkgrey',
                  padding: '24px 16px',
                  backgroundColor: 'white',
                }}
              >
                <HomeIsolationFormSmartView
                  action={`/home-isolation-form/${form.id}`}
                  data={form}
                />
              </li>
            )
          })}
        </ul>
      </div>
      <div style={{ flexGrow: 1 }}>
        <Wrapper
          apiKey={'AIzaSyBvzV8nKgqy1Ia3_gR3jJ1cv-F9d5J9Rzg'}
          render={render}
        >
          <Map
            initialLatLng={{
              lat: 8.0294121,
              lng: 99.6502966,
            }}
            initialZoom={13}
            style={{ width: '100%', height: '100%' }}
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
            keyboardShortcuts={false}
            zoomControl={false}
          >
            {data.homeIsolationForms.map((form) => (
              <Marker
                key={form.id}
                position={{ lat: +form.lat, lng: +form.lng }}
              />
            ))}
          </Map>
        </Wrapper>
      </div>
    </div>
  )
}

const render = (status: Status) => {
  return <h1>{status}</h1>
}

const Marker: React.FC<google.maps.MarkerOptions> = (options) => {
  const [marker, setMarker] = React.useState<google.maps.Marker>()

  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker())
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [marker])

  React.useEffect(() => {
    if (marker) {
      marker.setOptions(options)
    }
  }, [marker, options])

  return null
}
