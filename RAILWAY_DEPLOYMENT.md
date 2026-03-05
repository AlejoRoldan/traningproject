# 🚀 Deployment en Railways - Kaitel Training Platform

## Preparación Previa

Este documento te guía para desplegar la aplicación en Railways.

### Requisitos:
- ✅ Cuenta en [Railway.app](https://railway.app)
- ✅ Variables de entorno configuradas
- ✅ Base de datos PostgreSQL en Railways

---

## Paso 1: Crear Proyecto en Railways

1. Ve a https://railway.app/dashboard
2. Click en "+ New Project"
3. Selecciona "Deploy from GitHub"
4. Conecta tu repositorio `AlejoRoldan/traningproject`
5. Selecciona la rama: `claude/contact-center-saas-platform-xwZyv`

---

## Paso 2: Configurar Base de Datos

1. En el proyecto Railway, click en "+ Add Service"
2. Selecciona "PostgreSQL"
3. Railways creará automáticamente:
   - `DATABASE_URL` - Variable de conexión
   - Usuario y contraseña

---

## Paso 3: Configurar Variables de Entorno

En la sección "Variables" del servicio principal, configura:

### ✅ Obligatorias

```
NODE_ENV=production
PORT=3001

# Database (Railways lo proporciona automáticamente)
DATABASE_URL=<proporcionado-por-railways>

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096

# JWT Security
JWT_SECRET=<generar-string-aleatorio-seguro>
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=https://tu-dominio.com

# AWS S3 (Audio storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=training-platform-audio

# Redis (opcional, para cache)
REDIS_URL=redis://...
```

### ⭐ Recomendadas

```
# Voice Synthesis - ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID_MALE=...
ELEVENLABS_VOICE_ID_FEMALE=...
TTS_PROVIDER=elevenlabs

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Paso 4: Generar JWT_SECRET Seguro

Si no tienes uno, ejecuta:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O usa: https://generate-secret.vercel.app/

---

## Paso 5: Deploy

Una vez configuradas todas las variables:

1. Railways detectará automáticamente el `Dockerfile`
2. Buildea el proyecto (puede tomar 3-5 minutos)
3. Inicia el servidor en `https://[tu-url-railways].up.railway.app`

---

## Paso 6: Migraciones de BD

Una vez deployed, ejecuta las migraciones:

En la consola de Railways o SSH:
```bash
npm run db:push
```

O manualmente:
```bash
drizzle-kit migrate
```

---

## Verificación Post-Deploy

```bash
# Health check
curl https://[tu-url-railways].up.railway.app/health

# API disponible en
https://[tu-url-railways].up.railway.app/api/trpc

# Frontend en
https://[tu-url-railways].up.railway.app/
```

---

## Solución de Problemas

### 500 Error al iniciar

**Causas comunes:**
- Variables de entorno incompletas
- BASE_URL incorrecta
- Permisos de BD

**Solución:**
```bash
# Ver logs en Railways
railway logs -s main

# Verificar variables
railway variables list
```

### Conexión a BD fallida

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión
psql $DATABASE_URL
```

### OpenAI no funciona

- Verifica que `OPENAI_API_KEY` es válido
- Cuenta con créditos/pago activo
- No hay límites de uso alcanzados

---

## Dominio Personalizado

1. En Railways: Settings → Domains
2. Agrega tu dominio
3. Configura DNS según instrucciones de Railways
4. Actualiza `CORS_ORIGIN` en variables de entorno

---

## Monitoreo

Railways proporciona:
- 📊 Métricas en tiempo real
- 📝 Logs centralizados
- 🔔 Alertas configurables
- 💰 Dashboard de costos

---

## Costos Estimados

La aplicación usa:
- **Compute**: ~$5-20/mes (según uso)
- **PostgreSQL**: ~$15/mes (starter)
- **Bandwidth**: Incluido hasta 100GB/mes
- **OpenAI**: Variable (según llamadas a GPT-4)

---

## Rollback

Si necesitas revertir a una versión anterior:

```bash
railway redeploy <deployment-id>
```

O en la UI:
1. Deployment History
2. Selecciona versión anterior
3. Click "Redeploy"

---

## Contacto

Para problemas con Railways: https://discord.gg/railway

Para problemas de aplicación: Ver logs en Railways o contactar al equipo de desarrollo.

---

**Última actualización:** Marzo 2026
**Versión:** 1.0
