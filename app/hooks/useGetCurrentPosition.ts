import React from 'react'

type GetCurrentPositionState = 'idle' | 'pending' | 'success' | 'error'

export const useGetCurrentPosition = () => {
  const [state, setState] = React.useState<GetCurrentPositionState>('idle')
  const [position, setPosition] = React.useState<google.maps.LatLngLiteral>()

  const fetch = () => {
    if (!navigator?.geolocation) {
      console.warn(
        `ERROR: 'window.navigator' is not supported on your browser.`
      )
      setState('error')
      return
    }
    setState('pending')
    navigator?.geolocation.getCurrentPosition(
      (pos) => {
        setState('success')
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (error) => {
        setState('error')
        console.warn(`ERROR(${error.code}): ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  return { state, position, fetch }
}
