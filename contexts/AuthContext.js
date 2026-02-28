'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { }
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const fetchProfile = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (!error && data) setProfile(data)
            else console.error('fetchProfile error:', error)
        } catch (err) {
            console.error('Error in fetchProfile:', err)
        }
    }, [supabase])

    useEffect(() => {
        let mounted = true

        // Safety timeout: if auth never resolves within 3s, force loading=false
        // This prevents infinite loading if onAuthStateChange fails to fire
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[AuthContext] Safety timeout — forcing loading=false')
                setLoading(false)
            }
        }, 3000)

        // Use onAuthStateChange as the SOLE mechanism.
        // It fires INITIAL_SESSION synchronously on subscribe,
        // then SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED later.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log('[AuthContext] Auth event:', event, session ? 'has session' : 'no session')

                if (session?.user) {
                    setUser(session.user)

                    // Fetch profile on initial load or sign-in
                    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        await fetchProfile(session.user.id)
                    }
                } else {
                    setUser(null)
                    setProfile(null)
                }

                // Loading is done once any auth event fires
                if (mounted) {
                    clearTimeout(safetyTimeout)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            clearTimeout(safetyTimeout)
            subscription.unsubscribe()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/')
    }

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id)
    }, [user, fetchProfile])

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
