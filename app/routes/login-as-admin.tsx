import { ActionFunction, Form, json } from 'remix'
import {
  isValidAdminCredential,
  createAdminSession,
} from '~/utils/session.server'

type ActionData = {
  formError?: string
  fieldErrors?: {
    username: string | undefined
    password: string | undefined
  }
  fields?: {
    username: string
    password: string
  }
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()

  const username = form.get('username')
  const password = form.get('password')
  const redirectTo = form.get('redirectTo') || '/admin-dashboard'

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  const fields = { username, password }
  const fieldErrors = {
    username: undefined,
    password: undefined,
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  if (!isValidAdminCredential({ username, password })) {
    return badRequest({
      fields,
      formError: `Username/Password combination is incorrect`,
    })
  }

  return createAdminSession(redirectTo)
}

export default function LoginAsAdminRoute() {
  return (
    <div style={{ height: '100%', display: 'grid', placeContent: 'center' }}>
      <Form
        method="post"
        style={{
          padding: '32px 24px',
        }}
      >
        <div>
          <label htmlFor="username">USERNAME</label>
          <input type="text" id="username" name="username" />
        </div>
        <div style={{ height: 24 }} />
        <div>
          <label htmlFor="password">PASSWORD</label>
          <input type="password" id="password" name="password" />
        </div>
        <div style={{ height: 32 }} />
        <button type="submit" className="primary-btn">
          LOGIN
        </button>
      </Form>
    </div>
  )
}
