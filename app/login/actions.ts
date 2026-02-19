'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Hardcoded explicit single user
const ALLOWED_EMAIL = "thepaperbird@gmail.com"

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate inputs
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/login?message=Email and password are required')
    }

    // Strict check for the allowed user
    if (email !== ALLOWED_EMAIL) {
        redirect('/login?message=Unauthorized user')
    }

    // Attempt sign in
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // If sign in fails, it might be because the user doesn't exist yet in this new project.
    // We can try to sign up automatically if sign in fails?
    if (error) {
        console.log("Login failed, attempting auto-signup for owner...");
        // Try to sign up the owner automatically if login fails
        const origin = (await headers()).get('origin')
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
                // If using existing project, we might need to be careful. 
                // But user said "I am not going to share this app".
                // If data exists, fine. If not, create user.
            },
        })

        if (signUpError) {
            console.error("Auto-signup failed:", signUpError.message);
            redirect('/login?message=Could not authenticate: ' + error.message)
        }

        // After signup, we might be logged in, or need to verify email depending on Supabase settings.
        // If confirmation is disabled (dev mode), we might be good.
        // Let's retry sign in just in case, or redirect to home to let middleware handle it.
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
