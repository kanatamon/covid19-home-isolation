import type { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'

import stylesUrl from '~/styles/index.css'

export const meta: MetaFunction = () => {
  return { title: 'ค่ายเทพสตรีฯ' }
}

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: stylesUrl },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;700&display=swap',
    },
  ]
}

type ENV = {
  GOOGLE_MAP_API_KEY: string
  LIFF_ID: string
}

declare global {
  interface Window {
    ENV: ENV
  }
}

export const loader: LoaderFunction = async () => {
  return json<{ ENV: ENV }>({
    ENV: {
      GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY ?? '',
      LIFF_ID: process.env.LIFF_ID ?? '',
    },
  })
}

export default function App() {
  const data = useLoaderData()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
