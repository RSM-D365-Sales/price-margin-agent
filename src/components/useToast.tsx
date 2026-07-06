import { useState, useCallback } from 'react'

export function useToast(): [string | null, (msg: string) => void, JSX.Element | null] {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg(null), 3200)
  }, [])
  const node = msg ? <div className="toast">{msg}</div> : null
  return [msg, show, node]
}
