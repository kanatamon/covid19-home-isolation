import React from 'react'
import { useFetcher } from '@remix-run/react'
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  type UseFormReturn,
  type FieldError,
} from 'react-hook-form'
import type { ReactDatePickerCustomHeaderProps } from 'react-datepicker'
import DatePicker from 'react-datepicker'
import th from 'date-fns/locale/th'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { withZod } from '@remix-validated-form/with-zod'

const ZONES = ['รพ.ค่าย', 'มทบ.43', 'กองพล ร.5', 'บชร.4', 'พัน.ขส'] as const

export const homeIsolationFormValuesSchema = z.object({
  id: z.string(),
  admittedAt: z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) {
      return new Date(val)
    }
  }, z.date()),
  zone: z.enum(ZONES),
  address: z.string().nonempty('Address is required!'),
  landmarkNote: z.string().nonempty('Landmark is required!'),
  phone: z.string().nonempty('Phone is required!'),
  lineId: z.string(),
  lineDisplayName: z.string(),
  linePictureUrl: z.string().nullable(),
  patients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().nonempty('Name is required!'),
      }),
    )
    .min(1),
  // TODO: should limit max patients?
})

export type HomeIsolationFormValues = z.infer<typeof homeIsolationFormValuesSchema>

export const homeIsolationFormValidator = withZod(homeIsolationFormValuesSchema)
export const homeIsolationFormResolver = zodResolver(homeIsolationFormValuesSchema)
export const parseToHomeIsolationFormValues = (data: unknown): HomeIsolationFormValues => {
  return homeIsolationFormValuesSchema.parse(data)
}

const genDefaultNewFormValues = (): HomeIsolationFormValues => ({
  id: 'draft',
  // TODO: date should be define on loader to prevent markup mismatch issue?
  admittedAt: new Date(),
  landmarkNote: '',
  address: '',
  phone: '',
  lineId: '',
  lineDisplayName: '',
  patients: [
    {
      id: genId(true),
      name: '',
    },
  ],
  // @ts-ignore
  zone: '',
})

export function useHomeIsolationFormValues({
  defaultValues,
}: {
  defaultValues: HomeIsolationFormValues
}) {
  const methods = useForm<HomeIsolationFormValues>({
    mode: 'onChange',
    resolver: homeIsolationFormResolver,
    defaultValues,
  })

  return methods
}

export const NewHomeIsolationFormEditor: React.FC<{
  action: string
  onSuccess?: () => any
  defaultValues?: Partial<HomeIsolationFormValues>
}> = ({ action, onSuccess, defaultValues = {} }) => {
  const fetcher = useFetcher()
  const methods = useHomeIsolationFormValues({
    defaultValues: {
      ...genDefaultNewFormValues(),
      ...defaultValues,
    },
  })
  const { isValid } = useFormState({ control: methods.control })

  const hasSuccessfullySubmitted = JSON.stringify(fetcher.data) === '{}'

  React.useEffect(
    function emitOnSuccess() {
      hasSuccessfullySubmitted && onSuccess?.()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasSuccessfullySubmitted],
  )

  const canEdit = fetcher.state !== 'submitting' && !hasSuccessfullySubmitted

  return (
    <fetcher.Form
      replace
      method="post"
      action={action}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap)',
        // @ts-ignore
        '--gap': '1.5em',
      }}
    >
      <HomeIsolationFormCommon methods={methods} canEdit={canEdit} />
      <section>
        {hasSuccessfullySubmitted ? (
          <button disabled>ส่งแบบฟอร์มสำเร็จแล้ว</button>
        ) : (
          <>
            <input type="hidden" name="_method" value="create" />
            <button
              type="submit"
              className="primary-btn"
              disabled={fetcher.state === 'submitting' || !isValid}
            >
              {fetcher.state === 'submitting' ? 'กำลังส่งแบบฟอร์ม...' : 'ส่งแบบฟอร์ม'}
            </button>
          </>
        )}
      </section>
    </fetcher.Form>
  )
}

export const HomeIsolationFormEditor: React.FC<{
  methods: UseFormReturn<HomeIsolationFormValues>
}> = ({ methods }) => {
  const updateFetcher = useFetcher()
  const deleteFetcher = useFetcher()
  const { isValid, isDirty } = useFormState({ control: methods.control })

  const resetHandler = () => {
    methods.reset()
  }

  const isNeedToUpdate = isDirty
  const canEdit = updateFetcher.state !== 'submitting' && deleteFetcher.state !== 'submitting'
  const actionUrl = `/home-isolation-form/${methods.getValues('id')}`

  return (
    <>
      <updateFetcher.Form
        method="post"
        action={actionUrl}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap)',
          // @ts-ignore
          '--gap': '1.5em',
        }}
      >
        <HomeIsolationFormCommon methods={methods} canEdit={canEdit} />
        <section
          style={{
            marginTop: 0,
            display: 'flex',
            flexDirection: 'row-reverse',
            gap: '0.75em',
          }}
        >
          <input type="hidden" name="_method" value="update" />
          {isNeedToUpdate ? (
            <button
              type="submit"
              className="primary-btn"
              disabled={!canEdit || !isNeedToUpdate || !isValid}
            >
              {updateFetcher.state === 'submitting' ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          ) : (
            <button disabled>บันทึกแล้ว</button>
          )}
          <button type="reset" disabled={!canEdit} onClick={resetHandler}>
            ยกเลิก
          </button>
        </section>
      </updateFetcher.Form>

      <div style={{ height: '1.5em' }} />

      <deleteFetcher.Form method="post" action={actionUrl}>
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
          disabled={!canEdit}
        >
          {deleteFetcher.state === 'submitting' ? 'กำลังลบข้อมูล...' : 'ลบข้อมูล'}
        </button>
      </deleteFetcher.Form>
    </>
  )
}

const HomeIsolationFormCommon: React.FC<{
  methods: UseFormReturn<HomeIsolationFormValues>
  canEdit?: boolean
}> = ({ methods, canEdit = true }) => {
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'patients',
  })

  const isMinPatientCount = fields.length === 1

  const removePatientHandler = (index: number) => {
    if (!isMinPatientCount) {
      remove(index)
    }
  }

  return (
    <>
      <section aria-hidden={true} style={{ display: 'none' }}>
        <Controller
          control={methods.control}
          name="id"
          render={({ field }) => <input {...field} type="hidden" />}
        />
        <Controller
          control={methods.control}
          name="lineId"
          render={({ field }) => <input {...field} type="hidden" />}
        />
        <Controller
          control={methods.control}
          name="lineDisplayName"
          render={({ field }) => <input {...field} type="hidden" />}
        />
        <Controller
          control={methods.control}
          name="linePictureUrl"
          render={({ field }) =>
            field.value ? (
              // @ts-ignore
              <input {...field} type="hidden" />
            ) : (
              <></>
            )
          }
        />
      </section>

      <section>
        <label>วันเวลาเริ่มเข้าการรักษา</label>
        <Controller
          control={methods.control}
          name="admittedAt"
          render={({ field }) => {
            return (
              <>
                <input type="hidden" name={field.name} value={field.value.toISOString()} />
                <DatePicker
                  {...field}
                  required
                  disabled={!canEdit}
                  locale={th}
                  selected={field.value}
                  value={field.value.toISOString()}
                  maxDate={new Date()}
                  showTimeSelect
                  dateFormat="Pp"
                  customInput={<DisplayDateInBuddhistEra />}
                  renderCustomHeader={DatePickerHeader}
                />
              </>
            )
          }}
        />
      </section>

      <section>
        <label>โซนบริเวณบ้านพัก</label>
        <Controller
          control={methods.control}
          name="zone"
          render={({ field, fieldState }) => (
            <>
              {/* <input type="hidden" name="zone" value={field.value} /> */}
              <select {...field} disabled={!canEdit}>
                <option value="">โปรดเลือกโซนต่อไปนี้</option>
                {ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <FieldErrorMessage error={fieldState.error} />
            </>
          )}
        />
      </section>

      <section>
        <label>พิกัดที่อยู่</label>
        <LightMessage>เช่น บชร4 ส.2 ห้องที่ 2</LightMessage>
        <Controller
          control={methods.control}
          name="address"
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                // placeholder="เช่น ***บชร4 ส2 ห้องที่ 2"
                readOnly={!canEdit}
              />
              <FieldErrorMessage error={fieldState.error} />
            </>
          )}
        />
      </section>

      <section>
        <label>ป้ายชื่อ บ้านพักที่อยู่รักษาตัว</label>
        <LightMessage style={{ color: 'red' }}>
          ***สำคัญมาก เพื่อระบุ การส่งยาและอาหาร***
        </LightMessage>
        <LightMessage>เช่น ป้ายชื่อห้องที่กักตัว</LightMessage>
        <Controller
          control={methods.control}
          name="landmarkNote"
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                // placeholder="เช่น ป้ายชื่อห้องที่กักตัว"
                readOnly={!canEdit}
              />
              <FieldErrorMessage error={fieldState.error} />
            </>
          )}
        />
      </section>

      <section>
        <label>โทรฯ</label>
        <LightMessage>เช่น 089-1234567</LightMessage>
        <Controller
          control={methods.control}
          name="phone"
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                type="tel"
                // placeholder="เช่น 089-1234567"
                readOnly={!canEdit}
              />
              <FieldErrorMessage error={fieldState.error} />
            </>
          )}
        />
      </section>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap)',
        }}
      >
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap)',
          }}
        >
          {fields.map((field, idx) => {
            const noDisplay = idx + 1

            return (
              <li key={field.id}>
                <Controller
                  control={methods.control}
                  name={`patients.${idx}.id` as const}
                  render={({ field }) => {
                    return <input {...field} type="hidden" />
                  }}
                />
                <label>ชื่อ-สกุล ผู้ป่วยคนที่ {noDisplay}</label>
                <Controller
                  control={methods.control}
                  name={`patients.${idx}.name` as const}
                  render={({ field, fieldState }) => (
                    <>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input {...field} readOnly={!canEdit} />
                        <button
                          style={{
                            width: 'calc(2px + var(--fontSize) + 2 * var(--verticalPadding))',
                          }}
                          onClick={() => removePatientHandler(idx)}
                          disabled={!canEdit || isMinPatientCount}
                        >
                          &times;
                        </button>
                      </div>
                      <FieldErrorMessage error={fieldState.error} />
                    </>
                  )}
                />
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            append({
              id: genId(),
              name: '',
            })
          }}
        >
          {`เพิ่มรายชื่อผู้ป่วยคนที่ ${fields.length + 1}`}
        </button>
      </section>
    </>
  )
}

const DatePickerHeader: React.FC<ReactDatePickerCustomHeaderProps> = ({
  date,
  increaseMonth,
  decreaseMonth,
  nextMonthButtonDisabled,
  prevMonthButtonDisabled,
}) => {
  return (
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
  )
}

const LightMessage: React.FC<{ style?: React.CSSProperties }> = ({ children, style = {} }) => {
  return (
    <p
      style={{
        color: '#999',
        margin: '0.25em 0',
        fontStyle: 'italic',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

const FieldErrorMessage: React.FC<{ error: FieldError | undefined }> = ({ error }) => {
  return typeof error?.message === 'string' ? (
    <p style={{ color: '#bf1650' }}>{`⚠ ${error.message}`}</p>
  ) : null
}

let counterId = 0

const genId = (isInitial: boolean = false): string => {
  return isInitial ? counterId.toString() : (++counterId).toString()
}

type DisplayDateInputInBuddhistEraProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>

const DisplayDateInBuddhistEra = React.forwardRef<
  HTMLButtonElement,
  DisplayDateInputInBuddhistEraProps
>(({ value, onClick, ...delegated }, ref) => {
  if (typeof value !== 'string') {
    throw new Error(`Value must be string.`)
  }

  const displayDate = new Intl.DateTimeFormat('th', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

  return (
    <button
      {...delegated}
      type="button"
      ref={ref}
      onClick={onClick}
      style={{
        borderRadius: 'var(--inputBorderRadius)',
        border: 'var(--inputBorder)',
        backgroundColor: 'var(--inputBgColor)',
        textAlign: 'left',
      }}
    >
      {displayDate}
    </button>
  )
})
DisplayDateInBuddhistEra.displayName = 'DisplayDateInBuddhistEra'
