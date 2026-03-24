'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({
    user: null,
    profile: null,
    loading: true,
    profileLoading: true,
    signOut: async () => { },
    refreshProfile: async () => { }
})

export function AuthProvider({ children, initialUser = null, initialProfile = null }) {
    // Start with server-provided data if available to avoid skeletons on refresh
    const [user, setUser] = useState(initialUser)
    const [profile, setProfile] = useState(initialProfile)
    
    // If we have initial data, we aren't "loading" on the first mount
    const [loading, setLoading] = useState(!initialUser)
    const [profileLoading, setProfileLoading] = useState(initialUser && !initialProfile)
    
    const router = useRouter()
    const initialized = useRef(false)
    const mountRef = useRef(true)
    
    // Store supabase client in state to prevent recreating it on every render
    const [supabase] = useState(() => createClient())

    const fetchProfile = useCallback(async (userId) => {
        if (!userId || !mountRef.current) {
            setProfileLoading(false)
            return null
        }
        
        try {
            setProfileLoading(true)
            console.log(`[AuthContext] 🔄 Fetching profile for ${userId}...`)
            
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
            )

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

            if (error) {
                console.error('[AuthContext] ❌ Profile fetch error:', error)
                if (mountRef.current) setProfile(null)
                return null
            }
            
            if (data && mountRef.current) {
                console.log('[AuthContext] ✅ Profile fetched successfully')
                setProfile(data)
                return data
            }
        } catch (err) {
            console.warn('[AuthContext] ⚠️ Error in fetchProfile:', err.message)
        } finally {
            if (mountRef.current) setProfileLoading(false)
        }
        return null
    }, [supabase])

    useEffect(() => {
        mountRef.current = true
        
        // If we already have server data, we skip the initial client-side getSession
        // but we STILL set up the listener for future changes.
        if (initialized.current) return
        initialized.current = true

        const handleAuthChange = async (event, session) => {
            if (!mountRef.current) return
            
            console.log(`[AuthContext] 🔑 Auth event: ${event}`, session ? 'User present' : 'No session')
            
            const currentUser = session?.user || null
            
            // Optimization: skip updates if user hasn't changed (prevents flickering)
            if (user?.id !== currentUser?.id) {
                setUser(currentUser)

                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    if (mountRef.current) {
                        setProfile(null)
                        setProfileLoading(false)
                    }
                }
            } else if (currentUser && !profile && !profileLoading) {
                // If user is same but profile is missing, try fetching
                await fetchProfile(currentUser.id)
            }

            if (mountRef.current) {
                setLoading(false)
                setProfileLoading(false)
            }
        }

        // 1. Initial Check (Only if server didn't provide data)
        if (!initialUser) {
            const init = async () => {
                try {
                    const sessionPromise = supabase.auth.getSession()
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Session check timeout')), 3000)
                    )

                    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
                    await handleAuthChange('INITIAL_CHECK', session)
                } catch (err) {
                    console.error('[AuthContext] ⚠️ Client init issue:', err.message)
                    if (mountRef.current) setLoading(false)
                }
            }
            init()
        } else if (initialUser && !initialProfile) {
            // Server provided user but no profile, fetch it now
            fetchProfile(initialUser.id)
        }

        // 2. Listen for subsequent changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'INITIAL_SESSION') return
                await handleAuthChange(event, session)
            }
        )

        return () => {
            mountRef.current = false
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile, initialUser, initialProfile, user, profile, profileLoading])


    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
            router.push('/')
        } catch (err) {
            console.error('[AuthContext] Sign out error:', err)
            setUser(null)
            setProfile(null)
            router.push('/')
        }
    }

    const refreshProfile = useCallback(async () => {
        if (user) await fetchProfile(user.id)
    }, [user, fetchProfile])

    return (
        <AuthContext.Provider value={{ 
            user, 
            profile, 
            loading, 
            profileLoading,
            signOut, 
            refreshProfile 
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}


