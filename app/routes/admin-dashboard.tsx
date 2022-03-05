import * as React from 'react'
import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { HomeIsolationForm, Patient } from '@prisma/client'
import { json, LinksFunction, LoaderFunction, useLoaderData } from 'remix'

import { db } from '~/utils/db.server'
import { requireAdminPermission } from '~/utils/session.server'
import { Map } from '~/components/map'
import { HomeIsolationFormSmartView } from '~/components/home-isolation-form-smart-view'
import { calculateHealth } from '~/components/health-viz'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
]

type LoaderData = {
  homeIsolationForms: (HomeIsolationForm & { patients: Patient[] })[]
  ENV: { GOOGLE_MAP_API_KEY: string }
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
  return json<LoaderData>({
    homeIsolationForms,
    ENV: { GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY ?? '' },
  })
}

const USER_PREFERENCE = {
  center: {
    lat: 8.0294121,
    lng: 99.6502966,
  },
  zoom: 13,
}

export default function AdminDashboardRoute() {
  const data = useLoaderData<LoaderData>()

  // console.log(window.ENV)

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
          width: 'clamp(500px, 33%, 900px)',
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
        <Wrapper render={render} apiKey={data.ENV.GOOGLE_MAP_API_KEY}>
          <Map
            userPreference={USER_PREFERENCE}
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
                admittedAt={new Date(form.admittedAt)}
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

const PinIcon = {
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  width: 16,
  height: 20,
}

const Marker: React.FC<google.maps.MarkerOptions & { admittedAt: Date }> = ({
  admittedAt,
  ...options
}) => {
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
    const health = calculateHealth(admittedAt)

    marker?.setOptions({
      ...options,
      icon: {
        path: PinIcon.path,
        anchor: new google.maps.Point(PinIcon.width / 2, PinIcon.height),
        fillColor: health.color,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 1.5,
      },
    })
  }, [marker, options, admittedAt])

  return null
}
