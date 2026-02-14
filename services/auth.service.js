import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const AuthService = {
    async signIn(email, password) {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    },

    async signUp(email, password, metadata = {}) {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        })
        if (error) throw error
        return data
    },

    async signOut() {
        const supabase = createClientComponentClient()
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    async getUser() {
        const supabase = createClientComponentClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    },

    async getSession() {
        const supabase = createClientComponentClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return session
    }
}
