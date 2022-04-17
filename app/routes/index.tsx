import { useRef } from 'react'
import { HomeIsolationForm, Patient } from '@prisma/client'
import {
  Form,
  json,
  Link,
  LoaderFunction,
  useLoaderData,
  useSubmit,
  useTransition,
} from 'remix'

import { db } from '~/utils/db.server'
import { requireUserLineId } from '~/utils/session.server'
import { useGetLINEProfile } from '~/hooks/useLIFF/useGetLineProfile'

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
  const { deviceEnv, logout } = useGetLINEProfile()
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
    <main
      style={{
        overflow: 'auto',
        padding: '24px',
        display: 'flex',
        gap: 16,
        flexDirection: 'column',
      }}
    >
      {!data.homeIsolationForms?.length ? (
        <button className="primary-btn">
          <Link to="/contact/new">ลงทะเบียน</Link>
        </button>
      ) : null}
      {data.homeIsolationForms?.[0]?.lat === null ? (
        <button className="primary-btn">
          <Link to="/contact/location">ลงทะเบียน</Link>
        </button>
      ) : null}
      {action}
    </main>
  )
}
