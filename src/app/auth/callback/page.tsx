'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      const fullUrl = window.location.href
      const hash = window.location.hash.substring(1)
      const code = searchParams.get('code')

      console.log('[auth/callback] URL:', fullUrl)
      console.log('[auth/callback] code:', code)
      console.log('[auth/callback] hash:', hash)

      // Try existing session first (SSR client may have already set it)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { router.replace('/dashboard'); return }

      // PKCE flow: ?code=
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[auth/callback] PKCE error:', error)
        if (!error) { router.replace('/dashboard'); return }
      }

      // Implicit flow: #access_token=...&refresh_token=...
      if (hash) {
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const error_desc = params.get('error_description')
        console.log('[auth/callback] access_token:', !!access_token, 'refresh_token:', !!refresh_token, 'error:', error_desc)
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          console.log('[auth/callback] setSession error:', error)
          if (!error) { router.replace('/dashboard'); return }
        }
      }

      router.replace('/login?error=auth_failed')
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-400 text-sm">Iniciando sesión...</p>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Iniciando sesión...</p>
      </main>
    }>
      <AuthCallback />
    </Suspense>
  )
}
