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
      // PKCE flow: ?code=
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { router.replace('/dashboard'); return }
      }

      // Implicit flow: #access_token=...&refresh_token=...
      const hash = window.location.hash.substring(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
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
