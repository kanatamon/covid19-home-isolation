import * as React from 'react'
import { liff } from './liff.client'

type State =
  | 'idle'
  | 'initializing'
  | 'initialized'
  | 'failed'
  | 'pending'
  | 'fulfilled'

type Profile = {
  userId: string
  displayName: string
  pictureUrl?: string
}

export function useGetLineProfile() {
  const [state, setState] = React.useState<State>('idle')
  const [profile, setProfile] = React.useState<Profile>()
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [isInClient, setIsInClient] = React.useState<boolean>()

  React.useEffect(function initialize() {
    setState('initializing')

    let isCanceled = false

    // TODO: handle if failed
    liff
      .init({
        liffId: window.ENV.LIFF_ID,
        withLoginOnExternalBrowser: true,
      })
      .then(() => {
        if (isCanceled) {
          return
        }
        setState('initialized')
      })
      .catch((reason) => {
        console.warn(`[liff-sdk]: ${reason.code} - ${reason.message}`)

        if (isCanceled) {
          return
        }

        setState('failed')
      })

    return () => {
      isCanceled = true
    }
  }, [])

  React.useEffect(function autoLogoutOnUnmount() {
    return () => {
      if (liff.isLoggedIn()) {
        liff.logout()
      }
    }
  }, [])

  React.useEffect(function detectClientDevice() {
    setIsInClient(liff.isInClient())
  }, [])

  React.useEffect(
    function getProfileAfterInitialized() {
      if (state !== 'initialized') {
        return
      }

      setState('pending')

      liff
        .getProfile()
        .then((profile) => {
          setState('fulfilled')
          setProfile(profile)
        })
        .catch((reason) => {
          console.warn(`[liff-sdk]: ${reason.code} - ${reason.message}`)
          setState('failed')
        })
    },
    [state]
  )

  React.useEffect(
    function updateLoggedInState() {
      if (state === 'initialized') {
        setIsLoggedIn(liff.isLoggedIn())
      }
    },
    [state]
  )

  const login = () => {
    if (!liff.isLoggedIn() && !liff.isInClient()) {
      liff.login()
    }
  }

  const shouldLoginManually =
    typeof isInClient === 'undefined' ? false : !isInClient && !isLoggedIn

  return {
    state,
    profile,
    login,
    shouldLoginManually,
  }
}
