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

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setUser(session.user)
                    await fetchProfile(session.user.id)
                } else {
                    setUser(null)
                    setProfile(null)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setLoading(false)
            }

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (session?.user) {
                    setUser(session.user)
                    if (event === 'SIGNED_IN' || !profile) {
                        await fetchProfile(session.user.id)
                    }
                } else {
                    setUser(null)
                    setProfile(null)
                    setLoading(false)
                }
            })

            return () => {
                subscription.unsubscribe()
            }
        }

        initializeAuth()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
            } else {
                setProfile(data)
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
