import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Report = {
  id: string
  agent: string
  client_id: string
  content: string
  created_at: string
}

const agentMeta: Record<string, { name: string; role: string; schedule: string }> = {
  dario: { name: 'Dario', role: 'Inteligencia de mercado', schedule: '6 AM y 6 PM · L-V' },
  sofia: { name: 'Sofia', role: 'Chief of Staff', schedule: '8 AM · L-V' },
  marco: { name: 'Marco', role: 'Learning digest', schedule: '7 AM · L-V' },
  kelly: { name: 'Kelly', role: 'Contenido para X', schedule: '10 PM · L/M/V' },
  neil:  { name: 'Neil',  role: 'SEO · Blog + GMB', schedule: '11 PM · L-V' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `hace ${d}d`
  if (h > 0) return `hace ${h}h`
  return 'hace un momento'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const lastRunByAgent = (reports ?? []).reduce<Record<string, string>>((acc, r) => {
    if (!acc[r.agent]) acc[r.agent] = r.created_at
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold">The Morning Crew</h1>
            <p className="text-zinc-400 text-sm mt-1">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-zinc-500 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>

        {/* Agent status grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {Object.entries(agentMeta).map(([id, agent]) => {
            const lastRun = lastRunByAgent[id]
            return (
              <div key={id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{agent.role}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lastRun ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {lastRun ? 'Activo' : 'Sin datos'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs">{agent.schedule}</p>
                {lastRun && (
                  <p className="text-zinc-600 text-xs mt-1">Último: {timeAgo(lastRun)}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Reports */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-medium text-sm mb-4">Últimos reportes</h2>
          {!reports || reports.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              Los reportes aparecerán aquí una vez que tus agentes corran.
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((r: Report) => (
                <div key={r.id} className="border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white capitalize">
                      {agentMeta[r.agent]?.name ?? r.agent}
                    </span>
                    <span className="text-xs text-zinc-500">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                    {r.content.slice(0, 300)}{r.content.length > 300 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
