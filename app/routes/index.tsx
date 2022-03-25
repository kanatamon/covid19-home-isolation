import { useRef } from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'
import {
  Form,
  json,
  LoaderFunction,
  useLoaderData,
  useSubmit,
  useTransition,
} from 'remix'

import { db } from '~/utils/db.server'
import { requireUserLineId } from '~/utils/session.server'
import { useGetLineProfile } from '~/hooks/useLIFF'

type LoaderData = {
  homeIsolationForms: (HomeIsolationForm & { patients: Patient[] })[]
}

export const loader: LoaderFunction = async ({ request }) => {
  const userLineId = await requireUserLineId(request)
  const homeIsolationForms = await db.homeIsolationForm.findMany({
    where: { lineId: userLineId },
    include: { patients: true },
  })
  return json<LoaderData>({ homeIsolationForms })
}

export default function Index() {
  const submit = useSubmit()
  const transition = useTransition()
  const data = useLoaderData<LoaderData>()
  const { deviceEnv, logout } = useGetLineProfile()
  const formRef = useRef<HTMLFormElement>(null)

  const logoutHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    submit(formRef.current)
    logout()
  }

  const action =
    deviceEnv === 'browser' ? (
      <Form ref={formRef} action="/logout" method="post">
        <button
          type="submit"
          style={{ maxWidth: 'max-content' }}
          onClick={logoutHandler}
          disabled={transition.state === 'submitting'}
        >
          {transition.state === 'submitting'
            ? 'กำลังออกจากระบบ...'
            : 'ออกจากระบบ'}
        </button>
      </Form>
    ) : null

  return (
    <main style={{ overflow: 'auto' }}>
      <p>TODO: Implement user-profile</p>
      {action}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
