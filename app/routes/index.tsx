import * as React from 'react'
import { ActionFunction, Form, json, redirect, useTransition } from 'remix'
import { createCustomEqual } from 'fast-equals'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import { Prisma } from '@prisma/client'
import { db } from '~/utils/db.server'

type ActionData = {
  formError?: string
  fieldErrors?: {
    lat: string | undefined
    lng: string | undefined
    zone: string | undefined
    address: string | undefined
    landmarkNote: string | undefined
    phone: string | undefined
    names: string | undefined
  }
  fields?: {
    lat: number
    lng: number
    zone: string
    address: string
    landmarkNote: string
    phone: string
    names: string[]
  }
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()

  const lat = Number(form.get('lat'))
  const lng = Number(form.get('lng'))
  const zone = form.get('zone')
  const address = form.get('address')
  const landmarkNote = form.get('landmarkNote')
  const phone = form.get('phone')
  const names = form.getAll('name')

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    typeof zone !== 'string' ||
    typeof address !== 'string' ||
    typeof landmarkNote !== 'string' ||
    typeof phone !== 'string' ||
    !isStringArray(names)
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  // TODO: validate fields
  const fieldErrors = {
    lat: undefined,
    lng: undefined,
    zone: undefined,
    address: undefined,
    landmarkNote: undefined,
    phone: undefined,
    names: undefined,
  }
  const fields = {
    lat,
    lng,
    zone,
    address,
    landmarkNote,
    phone,
    names,
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  await db.homeIsolationForm.create({
    data: {
      lat: new Prisma.Decimal(lat),
      lng: new Prisma.Decimal(lng),
      zone,
      address,
      landmarkNote: !!landmarkNote ? landmarkNote : null,
      phone,
      patients: {
        create: names.map((name) => ({ name })),
      },
    },
  })

  return redirect(`/form-response`)
}

function isStringArray(array: unknown[]): array is string[] {
  return array.every((item) => typeof item === 'string')
}

const ZONES = ['รพ.ค่าย', 'มทบ.43', 'กองพล ร.5', 'บชร.4', 'พัน.ขส']

const initialId = 0
const genId = (): number => Date.now()

enum EditingMode {
  PinMap,
  EditForm,
}

export default function Index() {
  const transition = useTransition()
  const [editingMode, setEditingMode] = React.useState<EditingMode>(
    EditingMode.PinMap
  )
  const [patientIds, setPatientIds] = React.useState<number[]>(() => {
    return [initialId]
  })
  const [zoom, setZoom] = React.useState(14) // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 8.0294121,
    lng: 99.6502966,
  })

  const onIdle = (m: google.maps.Map) => {
    setZoom(m.getZoom()!)
    setCenter(m.getCenter()!.toJSON())
  }

  const addNewPatient = () => {
    setPatientIds((prev) => [...prev, genId()])
  }
  const deletePatient = (patientId: number) => {
    setPatientIds((prev) => prev.filter((id) => id !== patientId))
  }

  const geolocationPlace = (
    <p
      style={{
        backgroundColor: 'gainsboro',
        padding: '12px 16px',
        margin: 0,
      }}
    >
      TODO: Add the nearest place from geolocation
    </p>
  )

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
          {geolocationPlace}
          <div style={{ height: 24 }} />
          <button onClick={() => setEditingMode(EditingMode.PinMap)}>
            เปลี่ยนพิกัด
          </button>
        </div>
        <Form
          method="post"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ display: 'none' }}>
            <input type="hidden" id="lat" name="lat" value={center.lat} />
            <br />
            <input type="hidden" id="lng" name="lng" value={center.lng} />
          </div>
          <div>
            <label htmlFor="zone">โซนบริเวณบ้านพัก</label>
            <select name="zone" id="zone">
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="address">พิกัดที่อยู่</label>
            <input
              name="address"
              id="address"
              placeholder="เช่น ***บชร4 ส2 ห้องที่ 2"
            />
          </div>
          <div>
            <label htmlFor="landmarkNote">จุดสังเกตุ </label>
            <input
              name="landmarkNote"
              id="landmarkNote"
              placeholder="เช่น ป้ายชื่อห้องที่กักตัว"
            />
          </div>
          <div>
            <label htmlFor="phone">โทรฯ</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="เช่น 089-123-1234, 077-123-123"
            />
          </div>
          {patientIds.map((patientId, idx) => {
            const noDisplay = idx + 1
            const htmlId = `name[${idx}]`
            return (
              <div key={patientId}>
                <label htmlFor={htmlId}>
                  ชื่อ-สกุล ผู้ป่วยคนที่ {noDisplay}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input name="name" id={htmlId} />
                  <button
                    style={{ width: 44 }}
                    onClick={(event) => {
                      event.preventDefault()
                      deletePatient(patientId)
                    }}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )
          })}
          <button
            onClick={(event) => {
              event.preventDefault()
              addNewPatient()
            }}
          >
            {`เพิ่มรายชื่อผู้ป่วยคนที่ ${patientIds.length + 1}`}
          </button>
          <button
            type="submit"
            style={{
              marginTop: '32px',
              transition: '250ms opacity',
              opacity: transition.state === 'submitting' ? 0.5 : 1,
            }}
            className="primary-btn"
            disabled={transition.state === 'submitting'}
          >
            {transition.state === 'submitting'
              ? 'กำลังส่งแบบฟอร์ม...'
              : 'ส่งแบบฟอร์ม'}
          </button>
        </Form>
      </div>
    )
  } else if (editingMode === EditingMode.PinMap) {
    editor = (
      <div>
        {geolocationPlace}
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
            canInteract={canPinMap}
            center={center}
            zoom={zoom}
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

interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string }
  isRenderCenterMarker?: boolean
  onClick?: (e: google.maps.MapMouseEvent) => void
  onIdle?: (map: google.maps.Map) => void
  canInteract?: boolean
}

const Map: React.FC<MapProps> = ({
  isRenderCenterMarker = false,
  canInteract = true,
  onClick,
  onIdle,
  children,
  style,
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [map, setMap] = React.useState<google.maps.Map>()
  const [marker, setMarker] = React.useState<google.maps.Marker>()

  React.useEffect(() => {
    if (!isRenderCenterMarker) {
      return
    }

    if (!marker) {
      setMarker(new google.maps.Marker())
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [marker, isRenderCenterMarker])

  React.useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, options)
      setMap(newMap)
    }
  }, [map])

  React.useEffect(() => {
    marker?.setMap(map ?? null)
    setMarkerAtMapCenter()
  }, [map, options?.zoom])

  useDeepCompareEffectForMaps(() => {
    map?.setOptions(options)
  }, [map, options])

  React.useEffect(() => {
    if (map) {
      ;['idle', 'drag'].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
      )

      if (onIdle) {
        map.addListener('idle', () => onIdle(map))
      }

      if (isRenderCenterMarker) {
        map.addListener('drag', setMarkerAtMapCenter)
      }
    }
  }, [map, onIdle, isRenderCenterMarker])

  const setMarkerAtMapCenter = () => {
    marker?.setPosition(map?.getCenter())
  }

  const smartInteractGuard = !canInteract ? (
    <div
      style={{
        position: 'absolute',
        background: 'transparent',
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    />
  ) : null

  return (
    <div style={style}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          isolation: 'isolate',
        }}
      >
        {smartInteractGuard}
        <div ref={ref} style={{ width: '100%', height: '100%' }} />
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // set the map prop on the child component
            return React.cloneElement(child, { map })
          }
        })}
      </div>
    </div>
  )
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize))
}

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef()

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

const deepCompareEqualsForMaps = createCustomEqual(
  (deepEqual) => (a: any, b: any) => {
    if (
      isLatLngLiteral(a) ||
      a instanceof google.maps.LatLng ||
      isLatLngLiteral(b) ||
      b instanceof google.maps.LatLng
    ) {
      return new google.maps.LatLng(a).equals(new google.maps.LatLng(b))
    }

    // use fast-equals for other objects
    return deepEqual(a, b)
  }
)

const isLatLngLiteral = (obj: any) =>
  obj != null &&
  typeof obj === 'object' &&
  Number.isFinite(obj.lat) &&
  Number.isFinite(obj.lng)

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
