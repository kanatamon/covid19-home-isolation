import { action } from '~/routes/login-as-admin'
import { getSession } from '~/utils/session.server'

describe('action', () => {
  it('should login successfully if provided an valid credential', async () => {
    const body = new URLSearchParams({
      username: 'admin',
      password: 'pass',
    })

    const request = new Request('https://can.be.anything', {
      method: 'POST',
      body,
    })

    const response = await action({ request, params: {}, context: {} })
    const cookie = response.headers.get('Set-Cookie')
    const session = await getSession(cookie)

    expect(session.get('role')).toEqual('admin')
  })

  it('should login failed if provided any invalid credential', async () => {
    const body = new URLSearchParams({
      username: 'INVALID_USERNAME',
      password: 'INVALID_PASSWORD',
    })

    const request = new Request('https://can.be.anything', {
      method: 'POST',
      body,
    })

    const response = (await action({ request, params: {}, context: {} })) as Response
    const cookie = response.headers.get('Set-Cookie')
    const errorInfo = await response.json()

    expect(cookie).toBeNull()
    expect(errorInfo).toMatchInlineSnapshot(`
      Object {
        "fields": Object {
          "password": "INVALID_PASSWORD",
          "username": "INVALID_USERNAME",
        },
        "formError": "Username/Password combination is incorrect",
      }
    `)
  })
})
