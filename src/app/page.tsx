import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">The Morning Crew</h1>
          <p className="mt-3 text-zinc-400 text-sm">
            Tu equipo de agentes trabajando mientras duermes.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/onboarding"
            className="w-full border border-zinc-700 text-white py-3 rounded-lg font-medium text-sm hover:border-zinc-500 transition-colors"
          >
            Comenzar — es gratis
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          Powered by VortexAgents.ai
        </p>
      </div>
    </main>
  )
}
