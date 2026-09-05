import { useState, useEffect } from 'react'

/** Default 3.5s so search runs ~3–4 seconds after typing stops. */
export function useDebounce(value, delay = 3500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
