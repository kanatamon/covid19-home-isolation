import { useState } from 'react'
import { badRequest, unauthorized, unprocessableEntity } from 'remix-utils'
import {
  type ActionFunction,
  json,
  LoaderFunction,
  useCatch,
  LinksFunction,
} from 'remix'
import { validationError } from 'remix-validated-form'

import { useGetLINEProfile, useLIFFUtilsBeforeInit } from '~/hooks/useLIFF'
import { requireUserLineId } from '~/utils/session.server'
import { db } from '~/utils/db.server'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import {
  homeIsolationFormValidator,
  NewHomeIsolationFormEditor,
} from '~/components/home-isolation-form-editor'
import { lineClient } from '~/utils/line-client.server'
import { AlertDialog } from '~/components/alert-dialog'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'
import dialogStyles from '@reach/dialog/styles.css'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
  { href: dialogStyles, rel: 'stylesheet' },
]

export const action: ActionFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)
  await requireNewUserOnly(userLineId)

  const result = await homeIsolationFormValidator.validate(
    await request.formData()
  )
  if (result.error) return validationError(result.error)

  const { data } = result

  if (userLineId !== data.lineId) {
    throw unauthorized(`You can't create new form of other user.`)
  }

  const { id, ...contact } = data

  await db.homeIsolationForm.create({
    data: {
      ...contact,
      treatmentDayCount: calculateTreatmentDayCount(contact.admittedAt),
      patients: {
        create: contact.patients.map(({ name }) => ({ name })),
      },
    },
  })

  lineClient.pushMessage(userLineId, {
    type: 'text',
    text: 'Hello, world',
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

  const onNewFormSubmittedSuccessfullyHandler = () => {
    setIsOpenSuccessDialog(true)
  }

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
          <div
            style={{ padding: '32px 24px', width: '100%', maxWidth: '500px' }}
          >
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

  if (
    typeof caught.data === 'string' &&
    caught.data.match(/You've already create contact/i)
  ) {
    return (
      <AlertDialog isOpen={true}>
        <p>ท่านเคยลงทะเบียนเรียบร้อยแล้ว ไม่สามารถลงทะเบียนซ้ำได้</p>
        <div style={{ height: '24px' }} />
        {deviceEnv === 'liff' ? (
          <button onClick={closeApp}>ปิดหน้านี้</button>
        ) : null}
      </AlertDialog>
    )
  }
}

const SuccessNewFormDialog: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const { deviceEnv, closeApp } = useLIFFUtilsBeforeInit()

  return (
    <AlertDialog isOpen={isOpen}>
      {/* TODO: Add wizard visualizing number of the registration progress */}
      <h1 style={{ fontSize: '1.5rem' }}>ขั้นตอนลงทะเบียนสำเร็จ</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum, cum
        accusantium quo vero, eaque aliquam quam optio, dolores doloribus sunt
        ullam doloremque consequuntur mollitia animi nisi dolorum maiores labore
        molestias?
      </p>
      <div style={{ height: '24px' }} />
      {deviceEnv === 'liff' ? (
        <button onClick={closeApp}>ปิดหน้านี้</button>
      ) : null}
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
