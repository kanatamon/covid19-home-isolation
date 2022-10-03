import { useState, useCallback } from 'react'
import { unauthorized, unprocessableEntity } from 'remix-utils'
import type { ActionFunction, LinksFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useCatch } from '@remix-run/react'
import { validationError } from 'remix-validated-form'

import { requireUserLineId } from '~/utils/session.server'
import { db } from '~/utils/db.server'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import {
  homeIsolationFormValidator,
  NewHomeIsolationFormEditor,
} from '~/components/home-isolation-form-editor'
import { lineClient } from '~/utils/line-client.server'
import { AlertDialog } from '~/components/alert-dialog'
import { useGetLINEProfile } from '~/hooks/useLIFF/useGetLineProfile'
import { useLIFFUtilsBeforeInit } from '~/hooks/useLIFF/useLIFFUtilsBeforeInit'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'
import dialogStyles from '@reach/dialog/styles.css'
import moment from 'moment'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
  { href: dialogStyles, rel: 'stylesheet' },
]

export const action: ActionFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)
  await requireNewUserOnly(userLineId)

  const result = await homeIsolationFormValidator.validate(await request.formData())
  if (result.error) return validationError(result.error)

  const { data } = result

  if (userLineId !== data.lineId) {
    throw unauthorized(`You can't create new form of other user.`)
  }

  const { id, ...contact } = data

  const officialAdmittedDate = moment(contact.admittedAt)
    .add(1, 'days')
    .startOf('day')
    .hours(6)
    .toDate()

  await db.homeIsolationForm.create({
    data: {
      ...contact,
      admittedAt: officialAdmittedDate,
      treatmentDayCount: calculateTreatmentDayCount(contact.admittedAt),
      patients: {
        create: contact.patients.map(({ name }) => ({ name })),
      },
    },
  })

  lineClient.pushMessage(userLineId, {
    type: 'text',
    text: [
      'ท่านได้ลง ทะเบียน ข้อมูล ระบุตัวตน สำเร็จ',
      'ขอให้ท่าน กลับไป ที่พัก เพื่อ รอรับยา และ อาหาร ในวันถัดไป',
      '',
      'เวลา 18.00 น ของวันนี้ จะมี link ให้ ท่าน กดยืนยัน ตำแหน่งพิกัดที่พัก เพื่อความสะดวก ของทาง รพ. ในการจัดส่ง ยา และ อาหาร เป็นลำดับต่อไป',
    ].join('\n'),
  })

  return json({}, 201)
}

export const loader: LoaderFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)
  await requireNewUserOnly(userLineId)

  return new Response()
}

export default function NewContactRoute() {
  const [isOpenSuccessDialog, setIsOpenSuccessDialog] = useState(false)
  const { profile } = useGetLINEProfile()

  const onNewFormSubmittedSuccessfullyHandler = useCallback(() => {
    setIsOpenSuccessDialog(true)
  }, [])

  return (
    <>
      <main
        style={{
          minHeight: '100%',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {profile ? (
          <div style={{ padding: '32px 24px', width: '100%', maxWidth: '500px' }}>
            <NewHomeIsolationFormEditor
              action="."
              onSuccess={onNewFormSubmittedSuccessfullyHandler}
              defaultValues={{
                lineId: profile.userId,
                lineDisplayName: profile.displayName,
                linePictureUrl: profile.pictureUrl,
                patients: [
                  {
                    id: 'draft',
                    name: profile.displayName,
                  },
                ],
              }}
            />
          </div>
        ) : (
          <p>กำลังโหลดข้อมูลกรุณารอสักครู่...</p>
        )}
      </main>
      <SuccessNewFormDialog isOpen={isOpenSuccessDialog} />
    </>
  )
}

export function CatchBoundary() {
  const { deviceEnv, closeApp } = useLIFFUtilsBeforeInit()
  const caught = useCatch()

  if (typeof caught.data === 'string' && caught.data.match(/You've already create contact/i)) {
    const id = 'error-alert'
    return (
      <AlertDialog isOpen={true} ariaLabelledBy={id}>
        <p id={id}>ท่านเคยลงทะเบียนเรียบร้อยแล้ว ไม่สามารถลงทะเบียนซ้ำได้</p>
        <div style={{ height: '24px' }} />
        {deviceEnv === 'liff' ? <button onClick={closeApp}>ปิดหน้านี้</button> : null}
      </AlertDialog>
    )
  }
}

const SuccessNewFormDialog: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const { deviceEnv, closeApp } = useLIFFUtilsBeforeInit()

  const id = 'success-alert'

  return (
    <AlertDialog isOpen={isOpen} ariaLabelledBy={id}>
      {/* TODO: Add wizard visualizing number of the registration progress */}
      <h1 style={{ fontSize: '1.5rem' }} id={id}>
        ขั้นตอนลงทะเบียนสำเร็จ
      </h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum, cum accusantium quo vero,
        eaque aliquam quam optio, dolores doloribus sunt ullam doloremque consequuntur mollitia
        animi nisi dolorum maiores labore molestias?
      </p>
      <div style={{ height: '24px' }} />
      {deviceEnv === 'liff' ? <button onClick={closeApp}>ปิดหน้านี้</button> : null}
    </AlertDialog>
  )
}

async function requireNewUserOnly(userLineId: string) {
  const userForm = await db.homeIsolationForm.findFirst({
    where: { lineId: userLineId },
  })
  if (userForm) {
    throw unprocessableEntity(`You've already create contact.`)
  }
}
