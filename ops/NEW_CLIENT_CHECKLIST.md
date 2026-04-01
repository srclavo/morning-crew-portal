# New Client Checklist — Morning Crew
> Vortex AI Agents | VortexAgents.ai
> Tiempo estimado: ~15 minutos

---

## FASE 1 — CIERRE

- [ ] Cliente completó el modal en `vortexagents.ai/morning-crew`
- [ ] Llamada / demo realizada
- [ ] Acordaron plan (Trial / Solo / Full Crew)
- [ ] Cliente tiene Telegram instalado y listo
- [ ] Cliente te dio su Bot Token y Chat ID de Telegram
  - Bot Token: `__________________________`
  - Chat ID: `__________________________`

---

## FASE 2 — CREAR CUENTA EN PORTAL

Desde tu Mac, en el directorio del portal:

```bash
cd ~/Documents/Proyectos/morning-crew-portal
bash ops/add_client.sh EMAIL_DEL_CLIENTE trial
```

El script:
- Crea el usuario en Supabase Auth
- Activa el perfil (`user_profiles.active = true`)
- Genera el magic link de acceso

Guarda el output:
- User ID: `__________________________`
- Magic link: `__________________________`

---

## FASE 3 — ENVIAR ACCESO AL CLIENTE

Manda este mensaje por WhatsApp o Telegram:

> Hola [nombre], aquí está tu acceso al Morning Crew Portal.
> Haz click en este link para entrar (válido por 1 hora):
>
> [pegar magic link]
>
> Una vez dentro, completa el formulario de configuración.
> Toma menos de 2 minutos.

- [ ] Magic link enviado al cliente

---

## FASE 4 — CLIENTE COMPLETA EL ONBOARDING

El cliente entra al portal y llena el wizard en `portal.vortexagents.ai/onboarding`:

- [ ] Paso 1 — Nombre y empresa
- [ ] Paso 2 — Industria y temas de inteligencia
- [ ] Paso 3 — Agentes activos (Dario, Sofia, Marco, Kelly, Neil)
- [ ] Paso 4 — Canal de entrega (Telegram: Bot Token + Chat ID)
- [ ] Paso 5 — Confirmación y submit

Cuando el cliente confirma → `client_configs` se guarda en Supabase con `status = pending_setup`.

---

## FASE 5 — PI PROVISIONA AUTOMÁTICAMENTE

En menos de 5 minutos, `client_sync.py` (cron en la Pi) detecta el registro y:

- Genera `agents/dario/clients/{client_id}/config.md`
- Crea los directorios `shared/intel/{client_id}/` y `logs/intel/{client_id}/`
- Guarda el Telegram Bot Token en `.env` de la Pi
- Cambia `client_configs.status` → `active`
- Te manda un Telegram de notificación

- [ ] Recibiste el Telegram de notificación con los datos del cliente
  - `client_id` generado: `__________________________`

Verifica en la Pi:
```bash
ssh dgom@trade-agent.local
ls /home/dgom/vortex-os/agents/dario/clients/
cat /home/dgom/vortex-os/agents/dario/clients/{client_id}/config.md
```

- [ ] `config.md` generado correctamente

---

## FASE 6 — AGREGAR CRON EN LA PI

```bash
ssh dgom@trade-agent.local
crontab -e
```

Agrega las siguientes líneas (reemplaza `CLIENT_ID` con el slug del cliente):

```
# DARIO — {EMPRESA} Morning sweep 6 AM
0 6 * * 1-5 cd /home/dgom/vortex-os && /home/dgom/.npm-global/bin/claude --dangerously-skip-permissions -p "CLIENT=CLIENT_ID $(cat agents/dario/prompts/orchestrator.md)" >> logs/intel/CLIENT_ID/cron.log 2>&1
# DARIO — {EMPRESA} Evening sweep 6 PM
0 18 * * 1-5 cd /home/dgom/vortex-os && /home/dgom/.npm-global/bin/claude --dangerously-skip-permissions -p "CLIENT=CLIENT_ID $(cat agents/dario/prompts/orchestrator.md)" >> logs/intel/CLIENT_ID/cron.log 2>&1
```

Si el cliente tiene Sofia activa (brief matutino):
```
# SOFIA — {EMPRESA} 8 AM
0 8 * * 1-5 cd /home/dgom/vortex-os && /home/dgom/.npm-global/bin/claude --dangerously-skip-permissions -p "CLIENT=CLIENT_ID $(cat agents/sofia/prompts/orchestrator.md)" >> logs/sofia/CLIENT_ID.log 2>&1
```

- [ ] Cron de Dario agregado (mañana y tarde)
- [ ] Cron de Sofia agregado (si aplica)
- [ ] Cron de Marco, Kelly, Neil agregados (si aplica)

---

## FASE 7 — VERIFICAR PRIMER SWEEP

Al día siguiente, después de las 6 AM:

- [ ] Cliente recibió su primer intel en Telegram
- [ ] El reporte aparece en `portal.vortexagents.ai` (dashboard del cliente)
- [ ] No hay errores en `logs/intel/CLIENT_ID/cron.log`

```bash
ssh dgom@trade-agent.local
tail -50 /home/dgom/vortex-os/logs/intel/{client_id}/cron.log
```

---

## RESUMEN DEL CLIENTE

| Campo | Valor |
|---|---|
| Nombre | |
| Empresa | |
| Email | |
| Plan | |
| client_id (Pi) | |
| Telegram Chat ID | |
| Fecha de inicio | |
| Agentes activos | |

---

## NOTAS

_Usa este espacio para apuntar cualquier configuración especial, preferencias del cliente, o contexto relevante._

