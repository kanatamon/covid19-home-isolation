import * as React from 'react'
import { Prisma } from '@prisma/client'
import { ActionFunction, Form, json, redirect, useTransition } from 'remix'
import { Status, Wrapper } from '@googlemaps/react-wrapper'

import { db } from '~/utils/db.server'
import { Map } from '~/components/map'
import { HomeIsolationFormView } from '~/components/home-isolation-form-view'

const ZONES = ['รพ.ค่าย', 'มทบ.43', 'กองพล ร.5', 'บชร.4', 'พัน.ขส']

const INITIAL_ZOOM = 14
const INITIAL_LAT_LNG = {
  lat: 8.0294121,
  lng: 99.6502966,
}

enum EditingMode {
  PinMap,
  EditForm,
}

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

export default function Index() {
  // const transition = useTransition()
  const [editingMode, setEditingMode] = React.useState<EditingMode>(
    EditingMode.PinMap
  )
  // const [patientIds, setPatientIds] = React.useState<number[]>(() => {
  //   return [genId()]
  // })
  const [center, setCenter] =
    React.useState<google.maps.LatLngLiteral>(INITIAL_LAT_LNG)

  const onIdle = (m: google.maps.Map) => {
    setCenter(m.getCenter()!.toJSON())
  }

  // const addNewPatient = () => {
  //   setPatientIds((prev) => [...prev, genId()])
  // }
  // const deletePatient = (patientId: number) => {
  //   setPatientIds((prev) => prev.filter((id) => id !== patientId))
  // }

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
        <HomeIsolationFormView
          action="."
          data={{
            lat: new Prisma.Decimal(center.lat),
            lng: new Prisma.Decimal(center.lng),
          }}
          isEditable
        />
        {/* <Form
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
        </Form> */}
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
            initialLatLng={INITIAL_LAT_LNG}
            initialZoom={INITIAL_ZOOM}
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

const badRequest = (data: ActionData) => json(data, { status: 400 })

const initialId = 0
const genId = (isInitial: boolean = false): number => {
  return isInitial ? initialId : Date.now()
}

function isStringArray(array: unknown[]): array is string[] {
  return array.every((item) => typeof item === 'string')
}
