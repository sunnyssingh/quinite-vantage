'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const SubscriptionContext = createContext({
  isExpired: false,
  subscriptionStatus: null,
  loading: true,
  refresh: () => {}
})

export function SubscriptionProvider({ children }) {
  const [state, setState] = useState({ isExpired: false, subscriptionStatus: null, loading: true })

  async function load() {
    try {
      const res = await fetch('/api/subscriptions/current')
      if (!res.ok) { setState(s => ({ ...s, loading: false })); return }
      const data = await res.json()
      const status = data?.subscription?.status ?? null
      const isExpired = status === 'past_due' || status === 'cancelled' || status === 'suspended'
      setState({ isExpired, subscriptionStatus: status, loading: false })
    } catch {
      setState(s => ({ ...s, loading: false }))
    }
  }

  useEffect(() => { load() }, [])

  return (
    <SubscriptionContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  return useContext(SubscriptionContext)
}
