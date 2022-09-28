import { useHasMounted } from './useHasMounted'

export const useClipboard = () => {
  const hasMounted = useHasMounted()

  const state: 'support' | 'not-supported' | 'pending' = !hasMounted
    ? 'pending'
    : navigator?.clipboard
    ? 'support'
    : 'not-supported'

  const copy = (text: string) => {
    if (state !== 'support') {
      throw new Error(`Opp! 'navigator.clipboard' is NOT supported on your browser.`)
    }

    navigator.clipboard.writeText(text).then(
      () => {
        console.log('Async: Copying to clipboard was successful!')
      },
      (error) => {
        console.error('Async: Could not copy text: ', error)
      },
    )
  }

  return { state, copy }
}
