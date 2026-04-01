'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = [
  'Logistics / Freight',
  'Real Estate',
  'E-commerce',
  'Tech / SaaS',
  'Finance',
  'Healthcare',
  'Marketing Agency',
  'Other',
]

const TOPICS_BY_INDUSTRY: Record<string, string[]> = {
  'Logistics / Freight': ['fuel prices', 'port congestion', 'freight rates', 'nearshoring', 'customs regulation', 'supply chain disruptions'],
  'Real Estate': ['interest rates', 'construction costs', 'permits & regulation', 'market trends', 'mortgage rates', 'housing inventory'],
  'E-commerce': ['consumer trends', 'logistics costs', 'competitor pricing', 'ad platform updates', 'returns & fulfillment', 'marketplace fees'],
  'Tech / SaaS': ['AI news', 'funding rounds', 'product launches', 'tech regulation', 'developer tools', 'cloud pricing'],
  'Finance': ['stock markets', 'interest rates', 'crypto', 'macro economics', 'earnings reports', 'banking regulation'],
  'Healthcare': ['FDA regulation', 'pharma news', 'insurance changes', 'clinical trials', 'digital health', 'medical devices'],
  'Marketing Agency': ['platform algorithm updates', 'ad costs', 'content trends', 'SEO changes', 'influencer marketing', 'brand safety'],
  'Other': ['industry news', 'competitor activity', 'regulation', 'market trends', 'technology', 'economics'],
}

const AGENTS = [
  { id: 'dario', name: 'Dario', role: 'Inteligencia de mercado', description: 'Monitorea noticias e intel de tu industria 2x al día' },
  { id: 'sofia', name: 'Sofia', role: 'Chief of Staff', description: 'Brief matutino con prioridades del día' },
  { id: 'marco', name: 'Marco', role: 'Learning digest', description: 'Artículos y aprendizajes relevantes cada mañana' },
  { id: 'kelly', name: 'Kelly', role: 'Contenido para X', description: 'Genera posts para Twitter/X basados en intel' },
  { id: 'neil', name: 'Neil', role: 'SEO · Blog + GMB', description: 'Contenido SEO semanal para tu negocio' },
]

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [ownerName, setOwnerName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [agents, setAgents] = useState<string[]>(['dario'])
  const [channel, setChannel] = useState<'telegram' | 'whatsapp'>('telegram')
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  function selectIndustry(ind: string) {
    setIndustry(ind)
    setTopics(TOPICS_BY_INDUSTRY[ind] ?? [])
  }

  function toggleTopic(topic: string) {
    setTopics(t => t.includes(topic) ? t.filter(x => x !== topic) : [...t, topic])
  }

  function toggleAgent(id: string) {
    setAgents(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const agentsMap = Object.fromEntries(AGENTS.map(a => [a.id, agents.includes(a.id)]))

    const { error } = await supabase.from('client_configs').upsert({
      user_id: user.id,
      owner_name: ownerName,
      company_name: companyName,
      industry,
      topics,
      agents: agentsMap,
      channel,
      telegram_bot_token: botToken || null,
      telegram_chat_id: chatId || null,
      whatsapp_number: whatsappNumber || null,
      status: 'pending_setup',
    })

    if (error) {
      setError('Error guardando configuración. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.replace('/dashboard?onboarded=1')
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full space-y-8">

        {/* Progress */}
        <div className="flex gap-2">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* Step 1 — Nombre y empresa */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Cuéntanos sobre ti</h1>
              <p className="text-zinc-400 text-sm mt-1">Solo toma 2 minutos configurar tu equipo.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Tu nombre</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Rafael Vargas"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="ABStorage Logistics"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!ownerName || !companyName}
              className="w-full bg-white text-black py-3 rounded-lg font-medium text-sm disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2 — Industria y temas */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">¿En qué industria operas?</h1>
              <p className="text-zinc-400 text-sm mt-1">Sugerimos temas de inteligencia según tu sector.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind}
                  onClick={() => selectIndustry(ind)}
                  className={`px-4 py-3 rounded-lg text-sm text-left border transition-colors ${
                    industry === ind
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>

            {industry && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Temas sugeridos — ajusta los que quieras:</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS_BY_INDUSTRY[industry]?.map(topic => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        topics.includes(topic)
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-zinc-700 text-white py-3 rounded-lg text-sm">
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!industry || topics.length === 0}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium text-sm disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Agentes */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Elige tus agentes</h1>
              <p className="text-zinc-400 text-sm mt-1">Puedes cambiar esto después.</p>
            </div>
            <div className="space-y-3">
              {AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-colors ${
                    agents.includes(agent.id)
                      ? 'bg-zinc-800 border-zinc-500'
                      : 'bg-zinc-900 border-zinc-800 opacity-60'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    agents.includes(agent.id) ? 'bg-white border-white' : 'border-zinc-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{agent.name} — {agent.role}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{agent.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-zinc-700 text-white py-3 rounded-lg text-sm">
                Atrás
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={agents.length === 0}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium text-sm disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Canal */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">¿Cómo recibir los reportes?</h1>
              <p className="text-zinc-400 text-sm mt-1">Tus agentes te escriben directo aquí.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['telegram', 'whatsapp'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`py-4 rounded-xl border text-sm font-medium transition-colors capitalize ${
                    channel === ch
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-white border-zinc-700'
                  }`}
                >
                  {ch === 'telegram' ? 'Telegram' : 'WhatsApp'}
                </button>
              ))}
            </div>

            {channel === 'telegram' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Bot Token</label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="8279510808:AAEvr_..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Chat ID</label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={e => setChatId(e.target.value)}
                    placeholder="6355374753"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>
            )}

            {channel === 'whatsapp' && (
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Número WhatsApp</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-zinc-700 text-white py-3 rounded-lg text-sm">
                Atrás
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={channel === 'telegram' ? (!botToken || !chatId) : !whatsappNumber}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium text-sm disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Confirmación */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Todo listo</h1>
              <p className="text-zinc-400 text-sm mt-1">Revisa tu configuración antes de confirmar.</p>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Empresa</span>
                <span>{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Industria</span>
                <span>{industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Temas</span>
                <span>{topics.length} seleccionados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Agentes</span>
                <span>{agents.length} activos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Canal</span>
                <span className="capitalize">{channel}</span>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 border border-zinc-700 text-white py-3 rounded-lg text-sm">
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-white text-black py-3 rounded-lg font-medium text-sm disabled:opacity-40"
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
