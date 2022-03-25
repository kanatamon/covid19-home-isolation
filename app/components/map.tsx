import * as React from 'react'
import { createCustomEqual } from 'fast-equals'

interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string }
  onClick?: (e: google.maps.MapMouseEvent) => void
  markerPosition?: google.maps.LatLngLiteral
  canInteract?: boolean
  defaultOptions?: { center: google.maps.LatLngLiteral; zoom: number }
  onIdle?: (map: google.maps.Map) => void
  onDrag?: (map: google.maps.Map) => void
}

export const Map: React.FC<MapProps> = ({
  onIdle,
  onDrag,
  canInteract = true,
  onClick,
  markerPosition,
  children,
  style,
  defaultOptions = {},
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [map, setMap] = React.useState<google.maps.Map>()
  // TODO: Remove marker use mock pin-icon and stay at center instead
  const [marker, setMarker] = React.useState<google.maps.Marker>()

  React.useEffect(
    function manageMapExistence() {
      if (ref.current && !map) {
        const newMap = new window.google.maps.Map(ref.current, {
          ...options,
          ...defaultOptions,
          ...(markerPosition ? { center: markerPosition } : {}),
        })
        setMap(newMap)
      }
    },
    [map]
  )

  useDeepCompareEffectForMaps(
    function applyOptionsToMap() {
      map?.setOptions(options)
    },
    [map, options]
  )

  React.useEffect(
    function manageEventListeners() {
      if (map) {
        ;['drag', 'idle'].forEach((eventName) =>
          google.maps.event.clearListeners(map, eventName)
        )

        if (onIdle) {
          map.addListener('idle', () => onIdle(map))
        }

        if (onDrag) {
          map.addListener('drag', () => onDrag(map))
        }
      }
    },
    [map, onIdle, onDrag]
  )

  React.useEffect(
    function manageMarkerExistence() {
      if (!marker && markerPosition) {
        setMarker(new google.maps.Marker())
      }

      // remove marker from map on unmount
      return () => {
        !markerPosition && marker?.setMap(null)
      }
    },
    [marker, markerPosition]
  )

  useDeepCompareEffectForMaps(
    function bindMarkerToNewMapCenter() {
      if (marker && map) {
        marker.setMap(map)
        onDrag?.(map)
        onIdle?.(map)
      }
    },
    [map]
  )

  React.useEffect(
    function updateMarkerPositionOnMap() {
      if (markerPosition && marker) {
        marker.setPosition(markerPosition)
      }
    },
    [markerPosition, marker]
  )

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
