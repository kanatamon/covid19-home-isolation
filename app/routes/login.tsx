import * as React from 'react'
import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  redirect,
  useLoaderData,
  useSubmit,
  useTransition,
} from 'remix'
import { badRequest } from 'remix-utils'
import { useGetLINEProfile } from '~/hooks/useLIFF'
import { createUserSession, getUserLineId } from '~/utils/session.server'

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()
  const redirectTo = form.get('redirectTo') || '/'
  const idToken = form.get('idToken')

  if (typeof idToken !== 'string' || typeof redirectTo !== 'string') {
    throw badRequest('Invalid form')
  }

  const chanelId = process.env.CHANEL_ID
  if (typeof chanelId !== 'string') {
    throw new Error('CHANEL_ID must be set')
  }

  const verifyUrlencoded = new URLSearchParams()
  verifyUrlencoded.append('id_token', idToken)
  verifyUrlencoded.append('client_id', chanelId)

  const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    body: verifyUrlencoded,
  })
  const verifyResultData = await verifyResponse.json()
  if (!verifyResponse.ok) {
    throw badRequest(verifyResultData)
  }

  const { sub: userLineId } = verifyResultData
  return createUserSession(userLineId, redirectTo)
}

type LoaderData = {
  searchParams: Record<string, string>
}

function redirectToWhereLIFFStateRequireToVisit(request: Request) {
  const url = new URL(request.url)
  const liffState = url.searchParams.get('liff.state')
  if (!liffState) {
    return
  }

  const searchParams = new URLSearchParams(liffState)
  const visitTo = searchParams.get('visitTo')
  if (visitTo) {
    throw redirect(visitTo)
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  redirectToWhereLIFFStateRequireToVisit(request)

  const userLineId = await getUserLineId(request)
  if (userLineId) {
    return redirect('/')
  }

  const url = new URL(request.url)
  const data = {
    searchParams: Object.fromEntries(url.searchParams.entries()),
  }

  return json<LoaderData>(data)
}

export default function LoginRoute() {
  const data = useLoaderData<LoaderData>()
  const submit = useSubmit()
  const transition = useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)
  const { shouldLoginManually, login, idToken } = useGetLINEProfile()

  React.useEffect(
    function autoLogin() {
      if (idToken && formRef.current) {
        submit(formRef.current)
      }
    },
    [idToken]
  )

  const searchParamsField = Object.entries(data.searchParams).map(
    ([name, value]) => (
      <input
        key={`${name}:${value}`}
        type="hidden"
        name={name}
        value={String(value)}
      />
    )
  )

  return (
    <main style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      {shouldLoginManually ? (
        <button
          className="line-login-btn"
          style={{
            maxWidth: 'max-content',
            padding: '0.5em 1em',
          }}
          onClick={login}
        >
          ล็อกอินด้วย LINE
        </button>
      ) : transition.state !== 'idle' ? (
        <p>กำลังเข้าสู่ระบบกรุณารอสักครู่...</p>
      ) : (
        <p>กำลังเตรียมความพร้อมเพื่อเข้าสู่ระบบกรุณารอสักครู่...</p>
      )}
      <Form method="post" ref={formRef} style={{ display: 'none' }}>
        <input type="hidden" name="idToken" value={idToken ?? ''} />
        {searchParamsField}
      </Form>
    </main>
  )
}
