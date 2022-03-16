import { badRequest, unauthorized } from 'remix-utils'
import {
  type ActionFunction,
  json,
  LoaderFunction,
  useCatch,
  LinksFunction,
} from 'remix'
import { validationError } from 'remix-validated-form'

import { useGetLineProfile } from '~/hooks/useLIFF'
import { requireUserLineId } from '~/utils/session.server'
import { db } from '~/utils/db.server'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import {
  homeIsolationFormValidator,
  NewHomeIsolationFormEditor,
} from '~/components/home-isolation-form-editor'
import { lineClient } from '~/utils/line-client.server'

import datePickerStyles from 'react-datepicker/dist/react-datepicker.css'

export const links: LinksFunction = () => [
  { href: datePickerStyles, rel: 'stylesheet' },
]

export const action: ActionFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)

  const result = await homeIsolationFormValidator.validate(
    await request.formData()
  )
  if (result.error) return validationError(result.error)

  const { data } = result

  if (userLineId !== data.lineId) {
    throw unauthorized(`You can't create new form of other user.`)
  }

  await db.homeIsolationForm.create({
    data: {
      ...data,
      treatmentDayCount: calculateTreatmentDayCount(data.admittedAt),
      patients: {
        create: data.patients.map(({ name }) => ({ name })),
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
  const userForm = await db.homeIsolationForm.findFirst({
    where: { lineId: userLineId },
  })
  if (userForm) {
    throw badRequest(`You've already create contact.`)
  }
  return json({ userLineId })
}

export default function NewHomeIsolationFormRoute() {
  const { profile } = useGetLineProfile()

  return (
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
  )
}

export function CatchBoundary() {
  const caught = useCatch()

  if (
    typeof caught.data === 'string' &&
    caught.data.match(/You've already create contact/i)
  ) {
    return (
      <div>
        <p>ท่านเคยลงทะเบียนเรียบร้อยแล้ว ไม่สามารถลงทะเบียนซ้ำได้</p>
      </div>
    )
  }
}
