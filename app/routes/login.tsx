import * as React from 'react'
import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
  useSubmit,
} from 'remix'
import { badRequest } from 'remix-utils'
import { useGetLineProfile } from '~/hooks/useLIFF'
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

export const loader: LoaderFunction = async ({ request }) => {
  const userLineId = await getUserLineId(request)
  return userLineId ? redirect('/') : null
}

export default function LoginRoute() {
  const submit = useSubmit()
  const formRef = React.useRef<HTMLFormElement>(null)
  const { shouldLoginManually, login, idToken } = useGetLineProfile()

  React.useEffect(
    function () {
      if (idToken && formRef.current) {
        submit(formRef.current)
      }
    },
    [idToken]
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
      ) : (
        <p>กำลังเข้าสู่ระบบกรุณารอสักครู่...</p>
      )}
      <Form method="post" ref={formRef}>
        <input type="hidden" name="idToken" value={idToken ?? ''} />
      </Form>
    </main>
  )
}
