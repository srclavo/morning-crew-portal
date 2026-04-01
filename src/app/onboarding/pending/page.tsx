export default function PendingPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-4xl">⏳</div>
        <h1 className="text-xl font-semibold">Tu cuenta está en revisión</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Recibimos tu solicitud. En cuanto confirmemos tu suscripción
          te avisamos por correo y tendrás acceso completo.
        </p>
        <p className="text-zinc-600 text-xs">
          ¿Preguntas? Escríbenos a hola@vortexagents.ai
        </p>
      </div>
    </main>
  )
}
