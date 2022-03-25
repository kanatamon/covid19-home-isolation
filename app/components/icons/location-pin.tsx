/**
 * Font Awesome Free 6.1.1 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2022 Fonticons, Inc.
 */

const svgPathData =
  'M384 192C384 279.4 267 435 215.7 499.2C203.4 514.5 180.6 514.5 168.3 499.2C116.1 435 0 279.4 0 192C0 85.96 85.96 0 192 0C298 0 384 85.96 384 192H384z'
const width = 384
const height = 512

export const LocationPinData = {
  svgPathData,
  width,
  height,
}

export const LocationPin: React.FC<{
  size?: number | string
  color?: string
}> = ({ size = 24, color = '#000' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      fill={color}
    >
      <path d={svgPathData} />
    </svg>
  )
}
