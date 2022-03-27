import * as React from 'react'
import { liff } from './liff.client'

type DeviceEnv = 'undecided' | 'browser' | 'liff'

export function useLIFFUtilsBeforeInit() {
  const [deviceEnv, setDeviceEnv] = React.useState<DeviceEnv>('undecided')

  React.useEffect(function () {
    setDeviceEnv(liff.isInClient() ? 'liff' : 'browser')
  }, [])

  const closeApp = () => {
    if (deviceEnv === 'liff') {
      liff.closeWindow()
    }
  }

  return {
    deviceEnv,
    closeApp: closeApp,
  }
}
