export function isStringArray(array: unknown[]): array is string[] {
  return array.every((item) => typeof item === 'string')
}
