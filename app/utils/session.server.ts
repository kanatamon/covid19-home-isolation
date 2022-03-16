import { createCookieSessionStorage, redirect } from 'remix'

type LoginForm = {
  username: string
  password: string
}

export function isValidAdminCredential({ username, password }: LoginForm) {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  )
}

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'AM_session',
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function requireAdminPermission(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request)
  const userRole = session.get('role')
  if (!userRole || typeof userRole !== 'string' || userRole !== 'admin') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login-as-admin?${searchParams}`)
  }

  return userRole
}

export async function getUserLineId(request: Request) {
  const session = await getUserSession(request)
  const userLineId = session.get('userLineId')
  return !userLineId || typeof userLineId !== 'string' ? null : userLineId
}

export async function requireUserLineId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request)
  const userLineId = session.get('userLineId')
  if (!userLineId || typeof userLineId !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return userLineId
}

export async function createAdminSession(redirectTo: string) {
  const session = await storage.getSession()
  session.set('role', 'admin')

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}

export async function createUserSession(
  userLineId: string,
  redirectTo: string
) {
  const session = await storage.getSession()
  session.set('role', 'user')
  session.set('userLineId', userLineId)
  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await storage.commitSession(session) },
  })
}

export async function logout(request: Request, redirectTo: string = '/login') {
  const session = await getUserSession(request)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  })
}
