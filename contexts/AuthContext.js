'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (!error && data) setProfile(data)
        } catch (err) {
            console.error('Error in fetchProfile:', err)
        }
    }

    useEffect(() => {
        let mounted = true

        // 1. Get the existing session immediately
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return
            if (session?.user) {
                setUser(session.user)
                await fetchProfile(session.user.id)
            }
            // Always clear the loading flag after the first resolution
            if (mounted) setLoading(false)
        }).catch((err) => {
            console.error('Error getting session:', err)
            if (mounted) setLoading(false)
        })

        // 2. Subscribe to future auth changes (sign-in, sign-out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            if (session?.user) {
                setUser(session.user)
                // Fetch profile on sign-in or if we somehow missed it
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    await fetchProfile(session.user.id)
                }
            } else {
                setUser(null)
                setProfile(null)
            }

            // Ensure loading is false once auth state settles
            if (mounted) setLoading(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/')
    }

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id)
    }

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
