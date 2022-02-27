import * as React from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'
import { useFetcher } from 'remix'

const ZONES = ['รพ.ค่าย', 'มทบ.43', 'กองพล ร.5', 'บชร.4', 'พัน.ขส']

type FormData = Partial<HomeIsolationForm & { patients: Patient[] }>

export type HomeIsolationFromViewProps = {
  action: string
  data: FormData
  isEditable?: boolean
}

export const HomeIsolationFormView: React.FC<HomeIsolationFromViewProps> = ({
  action,
  data,
  isEditable = false,
}) => {
  const dataFetcher = useFetcher()
  const deleteFetcher = useFetcher()

  const [patientIds, setPatientIds] = React.useState<string[]>(() => {
    if (data.patients) {
      return data.patients.map((patient) => patient.id)
    }
    return [genId()]
  })

  React.useEffect(() => {
    if (Array.isArray(data?.patients)) {
      setPatientIds(data.patients.map((patient) => patient.id))
    }
  }, [data?.patients])

  const formRef = React.useRef<HTMLFormElement>(null)
  React.useEffect(
    function resetFormAfterDisabledEditor() {
      if (!isEditable) {
        formRef.current?.reset()
      }
    },
    [isEditable]
  )

  const addNewPatient = () => {
    setPatientIds((prev) => [...prev, genId()])
  }

  const deletePatient = (patientId: string) => {
    setPatientIds((prev) => prev.filter((id) => id !== patientId))
  }

  const isCreated = typeof data.id === 'string'

  const isDisabledAll =
    !isEditable ||
    dataFetcher.state === 'submitting' ||
    deleteFetcher.state === 'submitting'

  return (
    <div>
      <dataFetcher.Form
        ref={formRef}
        action={action}
        method="post"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5em',
        }}
      >
        <div style={{ display: 'none' }}>
          <input
            type="hidden"
            id="lat"
            name="lat"
            value={data?.lat?.toString()}
          />
          <input
            type="hidden"
            id="lng"
            name="lng"
            value={data?.lng?.toString()}
          />

          <input
            type="hidden"
            name="admittedTzOffsetInISO"
            value={getTimezoneOffsetInISO(
              new Date(data?.admittedAt ?? Date.now())
            )}
          />
        </div>

        <div>
          <label htmlFor="admittedAt">วันเวลาเริ่มเข้าการรักษา</label>
          <input
            type="datetime-local"
            defaultValue={toLocaleDateTime(
              new Date(data?.admittedAt ?? Date.now())
            )}
            name="admittedAt"
            id="admittedAt"
            disabled={isDisabledAll}
          />
        </div>

        <div>
          <label htmlFor="zone">โซนบริเวณบ้านพัก</label>
          <select
            defaultValue={data?.zone}
            name="zone"
            id="zone"
            disabled={isDisabledAll}
          >
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
            defaultValue={data?.address}
            name="address"
            id="address"
            placeholder="เช่น ***บชร4 ส2 ห้องที่ 2"
            disabled={isDisabledAll}
          />
        </div>

        <div>
          <label htmlFor="landmarkNote">จุดสังเกตุ </label>
          <input
            defaultValue={data?.landmarkNote ?? undefined}
            name="landmarkNote"
            id="landmarkNote"
            placeholder="เช่น ป้ายชื่อห้องที่กักตัว"
            disabled={isDisabledAll}
          />
        </div>

        <div>
          <label htmlFor="phone">โทรฯ</label>
          <input
            defaultValue={data?.phone}
            type="tel"
            id="phone"
            name="phone"
            placeholder="เช่น 089-123-1234, 077-123-123"
            disabled={isDisabledAll}
          />
        </div>

        {patientIds.map((patientId, idx) => {
          const noDisplay = idx + 1
          const htmlId = `name[${idx}]`
          const patient = data?.patients?.find(
            (patient) => patient.id === patientId
          )
          return (
            <div key={patientId}>
              <label htmlFor={htmlId}>ชื่อ-สกุล ผู้ป่วยคนที่ {noDisplay}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="hidden"
                  name="patientId"
                  value={patient?.id ?? 'new'}
                />
                <input
                  defaultValue={patient?.name}
                  name="name"
                  id={htmlId}
                  disabled={isDisabledAll}
                />
                {isEditable ? (
                  <button
                    style={{ width: 44 }}
                    onClick={(event) => {
                      event.preventDefault()
                      deletePatient(patientId)
                    }}
                    disabled={isDisabledAll}
                  >
                    &times;
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}

        {isEditable ? (
          <button
            disabled={isDisabledAll}
            onClick={(event) => {
              event.preventDefault()
              addNewPatient()
            }}
          >
            {`เพิ่มรายชื่อผู้ป่วยคนที่ ${patientIds.length + 1}`}
          </button>
        ) : null}

        {isEditable ? (
          <>
            <hr style={{ margin: 0 }} />
            <div style={{ marginTop: 0, display: 'flex', gap: '0.75em' }}>
              {isCreated ? (
                <>
                  <input type="hidden" name="_method" value="update" />
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={isDisabledAll}
                  >
                    {dataFetcher.state === 'submitting'
                      ? 'กำลังบันทึก...'
                      : 'บันทึก'}
                  </button>
                  <button type="reset" disabled={isDisabledAll}>
                    ยกเลิก
                  </button>
                </>
              ) : (
                <>
                  <input type="hidden" name="_method" value="create" />
                  <button
                    type="submit"
                    style={{
                      transition: '250ms opacity',
                      opacity: dataFetcher.state === 'submitting' ? 0.5 : 1,
                    }}
                    className="primary-btn"
                    disabled={dataFetcher.state === 'submitting'}
                  >
                    {dataFetcher.state === 'submitting'
                      ? 'กำลังส่งแบบฟอร์ม...'
                      : 'ส่งแบบฟอร์ม'}
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </dataFetcher.Form>

      {isEditable && isCreated ? (
        <>
          <div style={{ height: '1.5em' }} />
          <deleteFetcher.Form method="post" action={action}>
            <input type="hidden" name="_method" value="delete" />
            <button
              type="submit"
              style={{
                border: 0,
                background: 'transparent',
                fontSize: '1em',
                textDecoration: 'underline',
                color: 'black',
                fontWeight: 'bold',
                width: 'max-content',
              }}
              disabled={isDisabledAll}
            >
              {deleteFetcher.state === 'submitting'
                ? 'กำลังลบข้อมูล...'
                : 'ลบข้อมูล'}
            </button>
          </deleteFetcher.Form>
        </>
      ) : null}
    </div>
  )
}

const initialId = '0'

const genId = (isInitial: boolean = false): string => {
  return isInitial ? initialId : Date.now().toString()
}

const toLocaleDateTime = (date: Date): string => {
  const [month, day, year] = date.toLocaleDateString().split('/')
  const yyyy = year.padStart(4, '0')
  const MM = month.padStart(2, '0')
  const dd = day.padStart(2, '0')

  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

const getTimezoneOffsetInISO = (date: Date): string => {
  const tz = date.getTimezoneOffset()
  const sign = tz > 0 ? '-' : '+'
  const hh = Math.floor(Math.abs(tz) / 60)
    .toString()
    .padStart(2, '0')
  const mm = (Math.abs(tz) % 60).toString().padStart(2, '0')

  return `${sign}${hh}:${mm}`
}
