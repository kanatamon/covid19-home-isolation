import React from 'react'
import { ClientOnly } from 'remix-utils'
import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { HomeIsolationForm, Patient, Prisma } from '@prisma/client'
import {
  json,
  LinksFunction,
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from 'remix'
import { zfd } from 'zod-form-data'
import { z } from 'zod'

import { LocationPinData } from '~/components/icons/location-pin'
import { db } from '~/utils/db.server'
import { requireAdminPermission } from '~/utils/session.server'
import { Map } from '~/components/map'
import { HomeIsolationFormSmartView } from '~/components/home-isolation-form-smart-view'
import { homeIsolationFormValuesSchema } from '~/components/home-isolation-form-editor'
import {
  calculateRecoveryDay,
  calculateTreatmentScale,
  hasRecoverySinceNow,
} from '~/domain/treatment'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
]

type HomeIsolationFormData = HomeIsolationForm & {
  patients: Omit<Patient, 'formOwnerId'>[]
}

type LoaderData = {
  homeIsolationForms: HomeIsolationFormData[]
}

const decimal = z.preprocess((val) => {
  if (Prisma.Decimal.isDecimal(val)) {
    return val
  }
  if (typeof val === 'string' || typeof val === 'number') {
    return new Prisma.Decimal(val)
  }
}, z.instanceof(Prisma.Decimal))

const schema = homeIsolationFormValuesSchema.extend({
  createdAt: z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) {
      return new Date(val)
    }
  }, z.date()),
  updatedAt: z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) {
      return new Date(val)
    }
  }, z.date()),
  lat: decimal.nullable(),
  lng: decimal.nullable(),
  treatmentDayCount: zfd.numeric(),
})
const parseManyToHomeIsolationFormData = (
  data: unknown
): HomeIsolationFormData[] => {
  return schema.array().parse(data)
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
  })
}

const DEFAULT_MAP_OPTIONS = {
  center: {
    lat: 8.0294121,
    lng: 99.6502966,
  },
  zoom: 13,
}

type Actions = 'add' | 'delete' | 'idle'

export default function AdminDashboardRoute() {
  const data = useLoaderData<LoaderData>()
  const homeIsolationForms = parseManyToHomeIsolationFormData(
    data.homeIsolationForms
  )

  const [spottedFormIds, setSpottedFormIds] = React.useState<{
    items: Set<string>
    lastAction: Actions
    lastActedItemId: string | undefined
  }>({
    items: new Set(),
    lastAction: 'idle',
    lastActedItemId: undefined,
  })

  const onToggleSpottedFormIdHandler = (formId: string) => {
    setSpottedFormIds((prev) => {
      const { items } = prev
      let lastAction: Actions | null = null

      if (items.has(formId)) {
        lastAction = 'delete'
        items.delete(formId)
      } else {
        lastAction = 'add'
        items.add(formId)
      }

      return {
        items: new Set(prev.items),
        lastAction,
        lastActedItemId: formId,
      }
    })
  }

  return (
    <div
      style={{
        fontSize: 12,
        display: 'flex',
        height: '100%',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <div
        style={{
          width: 'clamp(500px, 33%, 900px)',
          height: '100%',
          overflow: 'auto',
          padding: 12,
          backgroundColor: 'whitesmoke',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'sticky',
            margin: '-12px -12px 0px -12px',
            background: 'white',
            top: -12,
            left: 0,
            padding: 12,
            borderBottom: '1px solid darkgrey',
            isolation: 'isolate',
            zIndex: 10,
          }}
        >
          <NotifyPanel />
        </div>
        <ul
          style={{
            listStyle: 'none',
            padding: '12px 0px',
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            isolation: 'isolate',
            zIndex: 1,
          }}
        >
          {homeIsolationForms.map((form) => {
            return (
              <li
                key={form.id}
                style={{
                  borderRadius: 6,
                  border: '1px solid darkgrey',
                  padding: '24px 16px',
                  backgroundColor: 'white',
                  outlineOffset: 3,
                  outline:
                    spottedFormIds.lastActedItemId === form.id
                      ? '2px solid deeppink'
                      : 0,
                }}
              >
                <HomeIsolationFormSmartView
                  action={`/home-isolation-form/${form.id}`}
                  data={form}
                  onMapBtnClick={onToggleSpottedFormIdHandler}
                  isSpottedOnMap={spottedFormIds.items.has(form.id)}
                />
              </li>
            )
          })}
        </ul>
      </div>
      <div style={{ flexGrow: 1 }}>
        <ClientOnly>
          {() => (
            <Wrapper render={render} apiKey={window.ENV.GOOGLE_MAP_API_KEY}>
              <Map
                defaultOptions={DEFAULT_MAP_OPTIONS}
                style={{ width: '100%', height: '100%' }}
                fullscreenControl={false}
                streetViewControl={false}
                mapTypeControl={false}
                keyboardShortcuts={false}
                zoomControl={false}
              >
                {homeIsolationForms.map((form) =>
                  form.lat && form.lng ? (
                    <Marker
                      key={form.id}
                      position={{ lat: +form.lat, lng: +form.lng }}
                      data={form}
                      isSpotted={spottedFormIds.items.has(form.id)}
                      onClick={onToggleSpottedFormIdHandler}
                    />
                  ) : null
                )}
              </Map>
            </Wrapper>
          )}
        </ClientOnly>
      </div>
    </div>
  )
}

const render = (status: Status) => {
  return <div>{status}</div>
}

const PinIcon = {
  path: LocationPinData.svgPathData,
  width: LocationPinData.width,
  height: LocationPinData.height,
}

const Marker: React.FC<
  google.maps.MarkerOptions & {
    data: HomeIsolationFormData
    isSpotted?: boolean
    onClick?: (formId: string) => any
  }
> = ({ data, isSpotted = false, onClick, ...options }) => {
  const [marker, setMarker] = React.useState<google.maps.Marker>()
  const [infoWindow, setInfoWindow] = React.useState<google.maps.InfoWindow>()

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
    if (onClick && marker) {
      marker.addListener('click', () => {
        onClick(data.id)
      })
    }

    return () => {
      if (marker) {
        ;['click'].forEach((eventName) =>
          google.maps.event.clearListeners(marker, eventName)
        )
      }
    }
  }, [marker, data, onClick])

  React.useEffect(() => {
    if (!infoWindow) {
      setInfoWindow(new google.maps.InfoWindow())
    }

    // remove infoWindow element from DOM on unmount
    return () => {
      if (infoWindow) {
        infoWindow.close()
      }
    }
  }, [infoWindow])

  React.useEffect(() => {
    const { color } = calculateTreatmentScale(data.treatmentDayCount)

    marker?.setOptions({
      ...options,
      icon: {
        path: PinIcon.path,
        anchor: new google.maps.Point(PinIcon.width / 2, PinIcon.height),
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 0.065,
      },
    })
  }, [marker, infoWindow, options, data])

  React.useEffect(() => {
    if (!isSpotted || !marker || !infoWindow) {
      return
    }

    const patientsDisplay = `${data.patients?.[0].name}${
      data.patients.length > 1 ? ` และอีก ${data.patients.length - 1} คน` : ''
    }`

    const displayDateFormatter = new Intl.DateTimeFormat('th', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
    const admittedAt = new Date(data.admittedAt)

    const admittedAtDisplay = displayDateFormatter.format(admittedAt)
    const admittedAtMessageDisplay = `เริ่มรักษาเมื่อ : ${admittedAtDisplay}`

    const recoveryDateDisplay = displayDateFormatter.format(
      calculateRecoveryDay(admittedAt)
    )
    const recoveryMessageDisplay = hasRecoverySinceNow(admittedAt)
      ? `<span style="color: forestgreen;">สิ้นสุดการรักษาเมื่อ : ${recoveryDateDisplay}</span>`
      : `<span style="color: red;">จะสิ้นสุดการรักษาเมื่อ : ${recoveryDateDisplay}</span>`

    const content = [
      patientsDisplay,
      admittedAtMessageDisplay,
      recoveryMessageDisplay,
    ]
      .filter(Boolean)
      .join('<br />')

    infoWindow?.close()
    infoWindow?.setContent(content)
    infoWindow?.open(marker?.getMap(), marker)

    marker?.setAnimation(google.maps.Animation.BOUNCE)

    return () => {
      if (isSpotted) {
        infoWindow?.close()
        marker?.setAnimation(null)
      }
    }
  }, [isSpotted, data, infoWindow, marker])

  return null
}

const NotifyPanel: React.FC = () => {
  const askLocationFetcher = useFetcher()
  const treatmentStatusFetcher = useFetcher()
  const healthCheckFetcher = useFetcher()
  const preRecoveryFetcher = useFetcher()
  const recoveryFetcher = useFetcher()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <askLocationFetcher.Form
        method="post"
        action="/webhooks/notify-contact-location-submission"
      >
        <ActionBtn disabled={askLocationFetcher.state === 'submitting'}>
          Ask Location
        </ActionBtn>
      </askLocationFetcher.Form>
      <treatmentStatusFetcher.Form
        method="post"
        action="/webhooks/notify-daily-treatment-status"
      >
        <ActionBtn disabled={treatmentStatusFetcher.state === 'submitting'}>
          Treatment Status
        </ActionBtn>
      </treatmentStatusFetcher.Form>
      <healthCheckFetcher.Form
        method="post"
        action="/webhooks/notify-daily-health-check"
      >
        <ActionBtn disabled={healthCheckFetcher.state === 'submitting'}>
          Health Check
        </ActionBtn>
      </healthCheckFetcher.Form>
      <preRecoveryFetcher.Form
        method="post"
        action="/webhooks/notify-end-of-treatment?notifyType=PREPARE_TO_END_TREATMENT"
      >
        <ActionBtn disabled={preRecoveryFetcher.state === 'submitting'}>
          Pre-Recovery
        </ActionBtn>
      </preRecoveryFetcher.Form>
      <recoveryFetcher.Form
        method="post"
        action="/webhooks/notify-end-of-treatment?notifyType=END_TREATMENT"
      >
        <ActionBtn disabled={recoveryFetcher.state === 'submitting'}>
          Recovery
        </ActionBtn>
      </recoveryFetcher.Form>
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
        flex: '1 1 0',
        fontWeight: 'bold',
        padding: 'revert',
      }}
    >
      {children}
    </button>
  )
}
