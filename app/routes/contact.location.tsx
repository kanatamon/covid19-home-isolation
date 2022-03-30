import { Status, Wrapper } from '@googlemaps/react-wrapper'
import { Prisma } from '@prisma/client'
import React from 'react'
import {
  ActionFunction,
  Form,
  json,
  Link,
  LinksFunction,
  LoaderFunction,
  useActionData,
  useCatch,
  useLoaderData,
  useTransition,
} from 'remix'
import { ClientOnly, unauthorized, unprocessableEntity } from 'remix-utils'
import { z } from 'zod'
import { withZod } from '@remix-validated-form/with-zod'

import { LocationPin } from '~/components/icons/location-pin'
import { useGetCurrentPosition } from '~/hooks/useGetCurrentPosition'
import { db } from '~/utils/db.server'
import { requireUserLineId } from '~/utils/session.server'
import { Map } from '~/components/map'
import { homeIsolationFormValuesSchema } from '~/components/home-isolation-form-editor'
import { validationError } from 'remix-validated-form'
import { useLIFFUtilsBeforeInit } from '~/hooks/useLIFF'
import { AlertDialog } from '~/components/alert-dialog'

import dialogStyles from '@reach/dialog/styles.css'
import { lineClient } from '~/utils/line-client.server'

const DEFAULT_ZOOM = 14
const DEFAULT_LOCATION = {
  lat: 8.0294121,
  lng: 99.6502966,
}

export const links: LinksFunction = () => [
  { href: dialogStyles, rel: 'stylesheet' },
]

const numericPosition = z.preprocess((val) => {
  if (typeof val === 'string' || typeof val === 'number') {
    return +val
  }
  if (Prisma.Decimal.isDecimal(val)) {
    return (val as Prisma.Decimal).toNumber()
  }
}, z.number())
const locationFormValuesSchema = homeIsolationFormValuesSchema
  .pick({
    id: true,
  })
  .extend({
    lat: numericPosition.nullable(),
    lng: numericPosition.nullable(),
  })
const locationFormValuesValidator = withZod(locationFormValuesSchema)

type LocationFormValues = z.infer<typeof locationFormValuesSchema>

type LoaderData = {
  locationFormValues: LocationFormValues
}

export const loader: LoaderFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)

  const form = await db.homeIsolationForm.findFirst({
    select: {
      id: true,
      lat: true,
      lng: true,
    },
    where: { lineId: userLineId },
  })
  if (!form) {
    throw unprocessableEntity(`You must submit contact before submit location.`)
  }

  return json<LoaderData>({
    locationFormValues: locationFormValuesSchema.parse(form),
  })
}

export const action: ActionFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)

  const form = await request.formData()
  const result = await locationFormValuesValidator.validate(form)
  if (result.error) {
    return validationError(result.error)
  }

  const { data } = result
  const toUpdateForm = await db.homeIsolationForm.findUnique({
    where: { id: data.id },
  })

  if (!toUpdateForm) {
    throw unprocessableEntity(`You must submit contact before submit location.`)
  }
  if (toUpdateForm.lineId !== userLineId) {
    throw unauthorized(`Can't access formId: '${data.id}'.`)
  }

  await db.homeIsolationForm.update({
    data: {
      lat: data.lat,
      lng: data.lng,
    },
    where: {
      id: data.id,
    },
  })

  const displayName = toUpdateForm.lineDisplayName

  lineClient.pushMessage(userLineId, {
    type: 'text',
    text: [
      `ขอบคุณ ${displayName} ท่านได้ลงทะเบียน สำเร็จแล้ว!!`,
      '',
      `กรุณา ${displayName} อย่าลืม ส่งรูป วัดอุณหภูมิ / ค่า ออกซิเจน`,
      'ของเวลา 07.00 น  และ  15.00 น เป็นประจำทุกวันน่ะครับ',
    ].join('\n'),
  })

  return json({})
}

type MapControl = {
  center: google.maps.LatLngLiteral
  zoom: number
}

const initializeMapControl = (data: LoaderData): MapControl => {
  const { lat, lng } = data.locationFormValues
  const center =
    typeof lat === 'number' && typeof lng === 'number'
      ? {
          lat,
          lng,
        }
      : DEFAULT_LOCATION

  return {
    center,
    zoom: DEFAULT_ZOOM,
  }
}

export default function ContactLocationRoute() {
  const data = useLoaderData<LoaderData>()
  const transition = useTransition()
  const actionData = useActionData()

  // TODO: Refactor both of these state into reducer?
  const [isOpenSuccessDialog, setIsOpenSuccessDialog] = React.useState(() => {
    const { lat, lng } = data.locationFormValues
    return typeof lat === 'number' && typeof lng === 'number'
  })
  const [mapControl, setMapControl] = React.useState<MapControl>(() => {
    return initializeMapControl(data)
  })

  const getCurrentPosition = useGetCurrentPosition()

  React.useEffect(
    function openSuccessDialogOnSubmitSuccessfully() {
      if (JSON.stringify(actionData) === '{}') {
        setIsOpenSuccessDialog(true)
      }
    },
    [actionData]
  )

  React.useEffect(
    function emitOnGetCurrentPositionSuccess() {
      const { position } = getCurrentPosition
      position && setMapControl({ center: position, zoom: 17 })
    },
    [getCurrentPosition.position]
  )

  const mapIdleHandler = (map: google.maps.Map) => {
    const zoom = map.getZoom()
    const center = map.getCenter()?.toJSON()

    setMapControl((prev) => ({
      zoom: typeof zoom === 'number' ? zoom : prev.zoom,
      center: typeof center !== 'undefined' ? center : prev.center,
    }))
  }

  const closeSuccessDialogHandler = () => {
    setIsOpenSuccessDialog(false)
  }

  const canEdit = transition.state === 'idle' && !isOpenSuccessDialog

  return (
    <>
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
                  canInteract={canEdit}
                  style={{ width: '100%', height: '100%' }}
                  fullscreenControl={false}
                  streetViewControl={false}
                  mapTypeControl={false}
                  keyboardShortcuts={false}
                  zoomControl={false}
                  onIdle={mapIdleHandler}
                  center={mapControl.center}
                  zoom={mapControl.zoom}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <LocationPin size="38" color="#de5246" />
                  </div>
                </Map>
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
          <div>
            <button
              onClick={getCurrentPosition.fetch}
              disabled={getCurrentPosition.state === 'pending' || !canEdit}
            >
              {getCurrentPosition.state === 'pending'
                ? 'กำลังระบุตำแหน่ง...'
                : 'ตำแหน่งปัจจุบัน'}
            </button>
            <div style={{ height: 24 }} />
            <Form method="post">
              <input
                type="hidden"
                name="id"
                value={data.locationFormValues.id}
              />
              <input type="hidden" name="lat" value={mapControl.center.lat} />
              <input type="hidden" name="lng" value={mapControl.center.lng} />
              <button type="submit" className="primary-btn" disabled={!canEdit}>
                {transition.state === 'submitting'
                  ? 'กำลังยืนยันพิกัด...'
                  : 'ยืนยันพิกัด'}
              </button>
            </Form>
          </div>
        </div>
      </div>
      <SuccessDialog
        isOpen={isOpenSuccessDialog}
        onDismiss={closeSuccessDialogHandler}
      />
    </>
  )
}

export function CatchBoundary() {
  const { deviceEnv, closeApp } = useLIFFUtilsBeforeInit()
  const caught = useCatch()

  if (
    typeof caught.data === 'string' &&
    caught.data.match(/You must submit contact before submit location/i)
  ) {
    const id = 'error-alert'
    return (
      <AlertDialog isOpen={true} ariaLabelledBy={id}>
        <p id={id}>
          ท่านยังไม่เคยลงทะเบียนข้อมูลส่วนตัว
          ไม่สามารถดำเนินการเพื่อบันทึกพิกัดได้ กรุณาลงทะเบียนข้อมูลส่วนตัว
        </p>
        <div style={{ height: '24px' }} />
        <Link to="/contact/new">
          <button className="primary-btn">ลงทะเบียนข้อมูลส่วนตัว</button>
        </Link>
        {deviceEnv === 'liff' ? (
          <button onClick={closeApp}>ปิดหน้านี้</button>
        ) : null}
      </AlertDialog>
    )
  }
  if (caught.status === 401) {
    const id = 'error-alert'
    return (
      <AlertDialog isOpen={true} ariaLabelledBy={id}>
        <p id={id}>ท่านไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้!</p>
        <div style={{ height: '24px' }} />
        {deviceEnv === 'liff' ? (
          <button onClick={closeApp}>ปิดหน้านี้</button>
        ) : null}
      </AlertDialog>
    )
  }
}

const render = (status: Status) => {
  return <div>{status}</div>
}

const SuccessDialog: React.FC<{ isOpen: boolean; onDismiss?: () => any }> = ({
  isOpen,
  onDismiss,
}) => {
  const { deviceEnv, closeApp } = useLIFFUtilsBeforeInit()

  const id = 'success-alert'

  return (
    <AlertDialog isOpen={isOpen} ariaLabelledBy={id}>
      {/* TODO: Add wizard visualizing number of the registration progress */}
      <h1 style={{ fontSize: '1.5rem' }} id={id}>
        ขั้นตอนลงทะเบียนสำเร็จ
      </h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum, cum
        accusantium quo vero, eaque aliquam quam optio, dolores doloribus sunt
        ullam doloremque consequuntur mollitia animi nisi dolorum maiores labore
        molestias?
      </p>
      <div style={{ height: '24px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {deviceEnv === 'liff' ? (
          <button className="primary-btn" onClick={closeApp}>
            ปิดหน้านี้
          </button>
        ) : null}
        <button type="button" onClick={onDismiss}>
          แก้ไขพิกัด
        </button>
      </div>
    </AlertDialog>
  )
}
