import * as React from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'
import { useFetcher } from 'remix'
import DatePicker from 'react-datepicker'
import { registerLocale } from 'react-datepicker'
import th from 'date-fns/locale/th'

const ZONES = ['รพ.ค่าย', 'มทบ.43', 'กองพล ร.5', 'บชร.4', 'พัน.ขส']

type Data = Partial<HomeIsolationForm & { patients: Patient[] }>

export type HomeIsolationFromViewProps = {
  action: string
  data: Data
  isEditable?: boolean
}

export const HomeIsolationFormView: React.FC<HomeIsolationFromViewProps> = ({
  action,
  data,
  isEditable = false,
}) => {
  registerLocale('th', th)

  const dataFetcher = useFetcher()
  const deleteFetcher = useFetcher()

  const [admittedAt, setAdmittedAt] = React.useState<Date | null>(
    new Date(data?.admittedAt ?? Date.now())
  )
  const [isNeedToUpdate, setIsNeedToUpdate] = React.useState(true)
  const [formPatientIds, setFormPatientIds] = React.useState<string[]>(() => {
    if (data.patients) {
      return data.patients.map((patient) => patient.id)
    }
    return [genId()]
  })

  const formRef = React.useRef<HTMLFormElement>(null)
  React.useEffect(
    function resetFormAfterDisabledEditor() {
      if (!isEditable) {
        formRef.current?.reset()
      }
    },
    [isEditable]
  )

  React.useEffect(
    function syncPatientIdsOnFormIdsToData() {
      if (data?.patients) {
        setFormPatientIds(data.patients.map((patient) => patient.id))
      }
    },
    [data?.patients]
  )

  React.useEffect(() => {
    watchFormChangedHandler()
  }, [data, formPatientIds])

  const addNewPatient = () => {
    setFormPatientIds((prev) => [...prev, genId()])
  }

  const deletePatient = (patientId: string) => {
    setFormPatientIds((prev) => prev.filter((id) => id !== patientId))
  }
  const formResetHandler = () => {
    if (data?.patients) {
      setFormPatientIds(data.patients.map((item) => item.id))
    }
  }
  /**
   * DESIGN NOTE: Due to usage of this functionality, it's designed to be called
   * manually. The implementation is hight coupling to a existing of HTMLFormElement
   * referred by `formRef`.
   *
   * And the form's values must be readable, even we're intentionally to prevent
   * any user to edit the form. So, we introduced the implementation of using
   * `readOnly`'s prop instead of `disabled`. Which the later will disable the form
   * to be read.
   */
  const watchFormChangedHandler = () => {
    if (!formRef.current) {
      return false
    }

    const form = new FormData(formRef.current)
    setIsNeedToUpdate(isEqual(form, data))
  }

  const isCreated = typeof data.id === 'string'

  const canUserEdit =
    isEditable &&
    dataFetcher.state !== 'submitting' &&
    deleteFetcher.state !== 'submitting'

  return (
    <div>
      <dataFetcher.Form
        ref={formRef}
        action={action}
        onChange={watchFormChangedHandler}
        onReset={formResetHandler}
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
        </div>

        <div>
          <label htmlFor="admittedAt">วันเวลาเริ่มเข้าการรักษา</label>
          <input
            name="admittedAt"
            id="admittedAt"
            type="hidden"
            value={admittedAt?.toISOString()}
          />
          <DatePicker
            disabled={!canUserEdit}
            locale={th}
            selected={admittedAt}
            maxDate={new Date()}
            onChange={setAdmittedAt}
            showTimeSelect
            dateFormat="Pp"
            customInput={<DisplayDateInputInBuddhistEra />}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div
                style={{
                  margin: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <button
                  style={{
                    width: 24,
                    aspectRatio: '1 / 1',
                    padding: 0,
                  }}
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                >
                  {'<'}
                </button>
                <div style={{ flex: 1, fontWeight: 'bold' }}>
                  {new Intl.DateTimeFormat('th', {
                    month: 'long',
                    year: 'numeric',
                  }).format(date)}
                </div>
                <button
                  style={{
                    width: 24,
                    aspectRatio: '1 / 1',
                    padding: 0,
                  }}
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                >
                  {'>'}
                </button>
              </div>
            )}
          />
        </div>

        <div>
          <label htmlFor="zone">โซนบริเวณบ้านพัก</label>
          <input
            type="hidden"
            name="zone"
            value={data?.zone}
            disabled={canUserEdit}
          />
          <select
            // NOTE: We're using `key` here, this is VERY IMPORTANT! to force
            // composition of using <select> and <option> to be re-mounted.
            // Due to a change on `data.zone` to the `defaultValue` on <select>.
            // This won't affect to its <option>, and then caused <option>'s
            // selected-value to the old value as previous `defaultValue` is
            // provided.
            key={data?.zone}
            defaultValue={data?.zone}
            name="zone"
            id="zone"
            // NOTE: the `readOnly` on <select> is deprecated in HTML5.
            // Then we introduce to use combination of `disabled` and
            // <input type="hidden" /> above instead.
            disabled={!canUserEdit}
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
            readOnly={!canUserEdit}
          />
        </div>

        <div>
          <label htmlFor="landmarkNote">ป้ายชื่อหน้าบ้าน/จุดสังเกตุ </label>
          <input
            defaultValue={data?.landmarkNote ?? undefined}
            name="landmarkNote"
            id="landmarkNote"
            placeholder="เช่น ป้ายชื่อห้องที่กักตัว"
            readOnly={!canUserEdit}
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
            readOnly={!canUserEdit}
          />
        </div>

        {formPatientIds.map((serverOrClientPatientId, idx) => {
          const noDisplay = idx + 1
          const htmlId = `name[${idx}]`
          const serverPatient = data?.patients?.find(
            (patient) => patient.id === serverOrClientPatientId
          )
          return (
            <div key={serverOrClientPatientId}>
              <label htmlFor={htmlId}>ชื่อ-สกุล ผู้ป่วยคนที่ {noDisplay}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="hidden"
                  name="patientId"
                  value={serverPatient?.id ?? serverOrClientPatientId}
                />
                <input
                  defaultValue={serverPatient?.name}
                  name="name"
                  id={htmlId}
                  readOnly={!canUserEdit}
                />
                {isEditable ? (
                  <button
                    style={{ width: 44 }}
                    onClick={(event) => {
                      event.preventDefault()
                      deletePatient(serverOrClientPatientId)
                    }}
                    disabled={!canUserEdit}
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
            disabled={!canUserEdit}
            onClick={(event) => {
              event.preventDefault()
              addNewPatient()
            }}
          >
            {`เพิ่มรายชื่อผู้ป่วยคนที่ ${formPatientIds.length + 1}`}
          </button>
        ) : null}

        {isEditable ? (
          <>
            <hr style={{ margin: 0 }} />
            <div style={{ marginTop: 0, display: 'flex', gap: '0.75em' }}>
              {isCreated ? (
                <>
                  <input type="hidden" name="_method" value="update" />
                  {isNeedToUpdate ? (
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={!canUserEdit}
                    >
                      {dataFetcher.state === 'submitting'
                        ? 'กำลังบันทึก...'
                        : 'บันทึก'}
                    </button>
                  ) : (
                    <button disabled>บันทึกแล้ว</button>
                  )}
                  <button type="reset" disabled={!canUserEdit}>
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
              disabled={!canUserEdit}
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

const isEqual = (form: FormData, data: Data): boolean => {
  const formAdmittedAt = form.get('admittedAt')
  const formAdmittedTz = form.get('admittedTzOffsetInISO')
  const dataAdmittedAtDate = new Date(data?.admittedAt ?? Date.now())
  if (
    toLocaleDateTime(dataAdmittedAtDate) !== formAdmittedAt ||
    getTimezoneOffsetInISO(dataAdmittedAtDate) !== formAdmittedTz
  ) {
    return true
  }

  const formPatientIds = form.getAll('patientId').join()
  const dataPatientIds = data?.patients?.map((item) => item.id).join()
  if (formPatientIds !== dataPatientIds) {
    return true
  }

  const formNames = form.getAll('name').join()
  const dataNames = data?.patients?.map((item) => item.name).join()
  if (formNames !== dataNames) {
    return true
  }

  const formZone = form.get('zone')
  if (formZone !== data?.zone) {
    return true
  }

  const formAddress = form.get('address')
  if (formAddress !== data?.address) {
    return true
  }

  const formLandmarkNote = form.get('landmarkNote')
  if (formLandmarkNote !== data?.landmarkNote) {
    return true
  }

  const formPhone = form.get('phone')
  if (formPhone !== data?.phone) {
    return true
  }

  return false
}

type DisplayDateInputInBuddhistEraProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>

const DisplayDateInputInBuddhistEra = React.forwardRef<
  HTMLInputElement,
  DisplayDateInputInBuddhistEraProps
>(({ value, ...other }, ref) => {
  if (typeof value !== 'string') {
    throw new Error(`Value must be string.`)
  }
  const customValue = value.replace(
    /(\d{2}\/\d{2}\/)(\d{4})(.*)/,
    (_str, ddmm, yyyy, rest) => {
      const yyyyInBuddhist = Number(yyyy) + 543
      return `${ddmm}${yyyyInBuddhist}${rest}`
    }
  )
  return <input ref={ref} {...other} value={customValue} />
})
