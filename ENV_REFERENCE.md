# Archivos de Referencia de Variables de Entorno

Este documento proporciona plantillas de referencia para los archivos `.env` en diferentes entornos.

## .env.development

```bash
# VARIABLES REQUERIDAS
NODE_ENV=development
DATABASE_URL=mysql://root:password@localhost:3306/kaitel_dev
JWT_SECRET=dev_jwt_secret_key_at_least_32_chars_long_12345
VITE_APP_ID=kaitel-training-dev
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=owner_dev_12345
OWNER_NAME=Alejo Roldan Dev
OPENAI_API_KEY=sk-dev-1234567890abcdefghijklmnopqrst
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=forge_dev_key_1234567890

# VARIABLES OPCIONALES
VITE_OAUTH_PORTAL_URL=https://login.dev.kaitel.example.com
VITE_APP_TITLE=Kaitel Training (Dev)
```

## .env.staging

```bash
# VARIABLES REQUERIDAS
NODE_ENV=staging
DATABASE_URL=mysql://kaitel_staging:SecurePass123!@staging-db.example.com:3306/kaitel_staging?ssl=true
JWT_SECRET=staging_jwt_secret_key_at_least_32_chars_long_67890
VITE_APP_ID=kaitel-training-staging
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=owner_staging_12345
OWNER_NAME=Alejo Roldan Staging
OPENAI_API_KEY=sk-staging-1234567890abcdefghijklmnopqrst
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=forge_staging_key_1234567890

# VARIABLES OPCIONALES
VITE_OAUTH_PORTAL_URL=https://login.staging.kaitel.example.com
VITE_ANALYTICS_ENDPOINT=https://analytics.staging.kaitel.example.com
VITE_ANALYTICS_WEBSITE_ID=kaitel-training-staging
VITE_APP_TITLE=Kaitel Training (Staging)
```

## .env.production

```bash
# VARIABLES REQUERIDAS
NODE_ENV=production
DATABASE_URL=mysql://kaitel_prod:VerySecurePass456!@prod-db.example.com:3306/kaitel_production?ssl=true
JWT_SECRET=prod_jwt_secret_key_at_least_32_chars_long_abcdef
VITE_APP_ID=kaitel-training-prod
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=owner_prod_12345
OWNER_NAME=Alejo Roldan
OPENAI_API_KEY=sk-prod-1234567890abcdefghijklmnopqrst
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=forge_prod_key_1234567890

# VARIABLES OPCIONALES
VITE_OAUTH_PORTAL_URL=https://login.kaitel.example.com
VITE_ANALYTICS_ENDPOINT=https://analytics.kaitel.example.com
VITE_ANALYTICS_WEBSITE_ID=kaitel-training-prod
VITE_APP_TITLE=Kaitel Training Platform
VITE_APP_LOGO=https://cdn.kaitel.example.com/logo.png

# Supabase (si se usa)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

## Instrucciones de Uso

1. **Crear archivo .env para tu entorno:**
   ```bash
   cp ENV_REFERENCE.md .env.development
   # O para staging/producción
   cp ENV_REFERENCE.md .env.staging
   cp ENV_REFERENCE.md .env.production
   ```

2. **Reemplazar valores de ejemplo con valores reales**

3. **Validar variables:**
   ```bash
   node scripts/validate-env.mjs
   ```

4. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

## Notas Importantes

- **NUNCA** commitear archivos `.env` con valores reales al repositorio
- Usar credenciales diferentes para cada entorno
- Rotar credenciales cada 90 días
- Usar SSL/TLS para todas las conexiones en producción
- Configurar alertas de errores y costos en producción
