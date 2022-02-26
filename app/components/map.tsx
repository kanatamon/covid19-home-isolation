import * as React from 'react'
import { createCustomEqual } from 'fast-equals'

interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string }
  isRenderCenterMarker?: boolean
  onClick?: (e: google.maps.MapMouseEvent) => void
  onIdle?: (map: google.maps.Map) => void
  canInteract?: boolean
  initialLatLng: { lat: number; lng: number }
  initialZoom: number
}

export const Map: React.FC<MapProps> = ({
  isRenderCenterMarker = false,
  canInteract = true,
  onClick,
  onIdle,
  children,
  style,
  initialLatLng,
  initialZoom,
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [map, setMap] = React.useState<google.maps.Map>()
  const [marker, setMarker] = React.useState<google.maps.Marker>()

  React.useEffect(() => {
    if (!isRenderCenterMarker) {
      return
    }

    if (!marker) {
      setMarker(new google.maps.Marker())
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [marker, isRenderCenterMarker])

  React.useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        ...options,
        center: initialLatLng,
        zoom: initialZoom,
      })
      setMap(newMap)
    }
  }, [map])

  React.useEffect(() => {
    marker?.setMap(map ?? null)
    setMarkerAtMapCenter()
  }, [map, options?.zoom])

  useDeepCompareEffectForMaps(() => {
    map?.setOptions(options)
  }, [map, options])

  React.useEffect(() => {
    if (map) {
      ;['idle', 'drag'].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
      )

      if (onIdle) {
        map.addListener('idle', () => onIdle(map))
      }

      if (isRenderCenterMarker) {
        map.addListener('drag', setMarkerAtMapCenter)
      }
    }
  }, [map, onIdle, isRenderCenterMarker])

  const setMarkerAtMapCenter = () => {
    marker?.setPosition(map?.getCenter())
  }

  const smartInteractGuard = !canInteract ? (
    <div
      style={{
        position: 'absolute',
        background: 'transparent',
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    />
  ) : null

  return (
    <div style={style}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          isolation: 'isolate',
        }}
      >
        {smartInteractGuard}
        <div ref={ref} style={{ width: '100%', height: '100%' }} />
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // set the map prop on the child component
            return React.cloneElement(child, { map })
          }
        })}
      </div>
    </div>
  )
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize))
}

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef()

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value
  }

  return ref.current
}

const deepCompareEqualsForMaps = createCustomEqual(
  (deepEqual) => (a: any, b: any) => {
    if (
      isLatLngLiteral(a) ||
      a instanceof google.maps.LatLng ||
      isLatLngLiteral(b) ||
      b instanceof google.maps.LatLng
    ) {
      return new google.maps.LatLng(a).equals(new google.maps.LatLng(b))
    }

    // use fast-equals for other objects
    return deepEqual(a, b)
  }
)

const isLatLngLiteral = (obj: any) =>
  obj != null &&
  typeof obj === 'object' &&
  Number.isFinite(obj.lat) &&
  Number.isFinite(obj.lng)
