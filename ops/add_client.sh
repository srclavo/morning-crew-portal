#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# add_client.sh — Provisionar nuevo cliente en Morning Crew Portal
# Vortex AI Agents | VortexAgents.ai
#
# USO:
#   bash ops/add_client.sh <email> [plan]
#
# EJEMPLOS:
#   bash ops/add_client.sh rafael@abstorage.com
#   bash ops/add_client.sh rafael@abstorage.com trial
#
# REQUISITOS:
#   - .env.local en la raíz del proyecto (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY)
#   - curl, python3
# ─────────────────────────────────────────────────────────────────

set -e

# ── Args ─────────────────────────────────────────────────────────
EMAIL="${1}"
PLAN="${2:-trial}"

if [[ -z "$EMAIL" ]]; then
  echo "❌ Uso: bash ops/add_client.sh <email> [plan]"
  echo "   Ejemplo: bash ops/add_client.sh cliente@empresa.com trial"
  exit 1
fi

# ── Load env ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No se encontró .env.local en $(dirname $ENV_FILE)"
  exit 1
fi

source "$ENV_FILE"

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SECRET_KEY}"
PORTAL_URL="https://portal.vortexagents.ai"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY no están en .env.local"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Morning Crew — Nuevo Cliente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Email : $EMAIL"
echo "  Plan  : $PLAN"
echo ""

# ── PASO 1 — Crear usuario en Supabase Auth ───────────────────────
echo "▸ Paso 1/3 — Creando usuario en Supabase Auth..."

CREATE_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"email_confirm\":true}")

# Check for existing user error
if echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('id') else 1)" 2>/dev/null; then
  USER_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "  ✓ Usuario creado — ID: $USER_ID"
else
  # Try to fetch existing user
  ERROR_MSG=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('msg',''))" 2>/dev/null)
  if echo "$ERROR_MSG" | grep -qi "already"; then
    echo "  ℹ Usuario ya existe — buscando ID..."
    USER_ID=$(curl -s \
      "${SUPABASE_URL}/auth/v1/admin/users?email=${EMAIL}" \
      -H "apikey: ${SUPABASE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_KEY}" | \
      python3 -c "import sys,json; users=json.load(sys.stdin).get('users',[]); print(users[0]['id'] if users else '')" 2>/dev/null)
    if [[ -z "$USER_ID" ]]; then
      echo "  ❌ No se pudo obtener el ID del usuario existente"
      exit 1
    fi
    echo "  ✓ Usuario encontrado — ID: $USER_ID"
  else
    echo "  ❌ Error creando usuario: $ERROR_MSG"
    echo "  Respuesta completa: $CREATE_RESPONSE"
    exit 1
  fi
fi

# ── PASO 2 — Crear user_profiles ─────────────────────────────────
echo ""
echo "▸ Paso 2/3 — Activando perfil..."

PROFILE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${SUPABASE_URL}/rest/v1/user_profiles" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal,resolution=ignore-duplicates" \
  -d "{\"id\":\"${USER_ID}\",\"active\":true,\"plan\":\"${PLAN}\"}")

if [[ "$PROFILE_RESPONSE" == "201" || "$PROFILE_RESPONSE" == "200" ]]; then
  echo "  ✓ Perfil activado (plan: $PLAN)"
else
  # Try upsert if insert failed
  UPSERT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "${SUPABASE_URL}/rest/v1/user_profiles" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal,resolution=merge-duplicates" \
    -d "{\"id\":\"${USER_ID}\",\"active\":true,\"plan\":\"${PLAN}\"}")
  if [[ "$UPSERT_RESPONSE" == "201" || "$UPSERT_RESPONSE" == "200" ]]; then
    echo "  ✓ Perfil actualizado (plan: $PLAN)"
  else
    echo "  ❌ Error creando perfil (HTTP $PROFILE_RESPONSE / $UPSERT_RESPONSE)"
    exit 1
  fi
fi

# ── PASO 3 — Generar magic link ───────────────────────────────────
echo ""
echo "▸ Paso 3/3 — Generando magic link..."

LINK_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/generate_link" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"magiclink\",\"email\":\"${EMAIL}\",\"options\":{\"redirect_to\":\"${PORTAL_URL}/auth/callback\"}}")

ACTION_LINK=$(echo "$LINK_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('action_link',''))" 2>/dev/null)

if [[ -z "$ACTION_LINK" ]]; then
  echo "  ❌ Error generando magic link"
  echo "  Respuesta: $LINK_RESPONSE"
  exit 1
fi

# Fix redirect path if Supabase stripped /auth/callback
FIXED_LINK=$(echo "$ACTION_LINK" | sed "s|redirect_to=${PORTAL_URL}$|redirect_to=${PORTAL_URL}/auth/callback|")

echo "  ✓ Link generado"

# ── OUTPUT ────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Cliente listo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Email : $EMAIL"
echo "  Plan  : $PLAN"
echo "  ID    : $USER_ID"
echo ""
echo "  📎 Magic link (válido por 1h):"
echo ""
echo "  $FIXED_LINK"
echo ""
echo "  Próximos pasos:"
echo "  1. Manda este link al cliente para que acceda al portal"
echo "  2. El cliente completa el onboarding en $PORTAL_URL/onboarding"
echo "  3. client_sync.py provisiona la Pi automáticamente (< 5 min)"
echo "  4. Agrega el cron de Dario para este cliente en la Pi:"
echo ""
echo "     ssh dgom@trade-agent.local"
echo "     crontab -e"
echo "     # Agrega (reemplaza CLIENT_ID con el slug de la empresa):"
echo "     # 0 6 * * 1-5 cd /home/dgom/vortex-os && /home/dgom/.npm-global/bin/claude --dangerously-skip-permissions -p \"CLIENT=CLIENT_ID \$(cat agents/dario/prompts/orchestrator.md)\" >> logs/intel/CLIENT_ID/cron.log 2>&1"
echo "     # 0 18 * * 1-5 cd /home/dgom/vortex-os && /home/dgom/.npm-global/bin/claude --dangerously-skip-permissions -p \"CLIENT=CLIENT_ID \$(cat agents/dario/prompts/orchestrator.md)\" >> logs/intel/CLIENT_ID/cron.log 2>&1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
