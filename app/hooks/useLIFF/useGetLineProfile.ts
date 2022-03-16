import * as React from 'react'
import { useLIFFUtilsBeforeInit } from '.'
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
  const { deviceEnv } = useLIFFUtilsBeforeInit()

  // TODO: Refactor to useReducer?
  // useReducer might be more simpler & enhance readability in DevTools
  const [state, setState] = React.useState<State>('idle')
  const [profile, setProfile] = React.useState<Profile>()
  const [idToken, setIdToken] = React.useState<string>()
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>()

  React.useEffect(function initialize() {
    setState('initializing')

    let isCanceled = false

    // TODO: handle if failed
    liff
      .init({
        liffId: window.ENV.LIFF_ID,
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

  // React.useEffect(function autoLogout() {
  //   const logoutHandler = () => {
  //     if (liff.isLoggedIn()) {
  //       liff.logout()
  //     }
  //   }
  //   window.addEventListener('beforeunload', logoutHandler)
  //   return () => {
  //     window.removeEventListener('beforeunload', logoutHandler)
  //     logoutHandler()
  //   }
  // }, [])

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
    function getIdTokenAfterInitialized() {
      if (state === 'initialized') {
        setIdToken(liff.getIDToken() ?? undefined)
      }
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
    if (deviceEnv === 'browser' && !isLoggedIn) {
      liff.login()
    }
  }

  const logout = () => {
    if (deviceEnv === 'browser' && isLoggedIn) {
      liff.logout()
    }
  }

  const shouldLoginManually =
    deviceEnv === 'browser' && typeof isLoggedIn === 'boolean' && !isLoggedIn

  return {
    state,
    profile,
    idToken,
    login,
    logout,
    shouldLoginManually,
    deviceEnv,
  }
}
