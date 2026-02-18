# 🔐 Guía Completa: Variables de Entorno para Kaitel Training Platform

## Introducción

Este documento proporciona una referencia exhaustiva de todas las variables de entorno necesarias para ejecutar Kaitel Training Platform en diferentes entornos (desarrollo, staging y producción). Cada variable está documentada con su propósito, validación, valores de ejemplo y consideraciones de seguridad.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Variables Requeridas](#variables-requeridas)
3. [Variables Opcionales](#variables-opcionales)
4. [Configuración por Entorno](#configuración-por-entorno)
5. [Validación y Testing](#validación-y-testing)
6. [Mejores Prácticas de Seguridad](#mejores-prácticas-de-seguridad)
7. [Troubleshooting](#troubleshooting)

---

## Descripción General

Kaitel Training Platform utiliza variables de entorno para configurar comportamientos críticos del servidor, acceso a APIs externas, y parámetros de seguridad. El sistema implementa validación temprana con Zod que garantiza que todas las variables requeridas estén presentes antes de que el servidor inicie.

### Niveles de Criticidad

Las variables se clasifican en tres niveles:

| Nivel | Descripción | Impacto | Ejemplo |
|-------|-------------|--------|---------|
| **CRÍTICA** | Requerida para que el servidor funcione | Servidor no inicia sin ella | DATABASE_URL, OPENAI_API_KEY |
| **IMPORTANTE** | Requerida para funcionalidad específica | Feature no funciona sin ella | SUPABASE_SERVICE_ROLE_KEY |
| **OPCIONAL** | Mejora funcionalidad pero no es obligatoria | Degradación elegante | VITE_ANALYTICS_ENDPOINT |

---

## Variables Requeridas

Estas variables **DEBEN** estar presentes en todos los entornos. El servidor fallará con un mensaje claro si alguna falta.

### 1. NODE_ENV

**Propósito:** Define el entorno de ejecución del servidor

**Valores permitidos:** `development`, `staging`, `production`

**Validación:** Enum estricto

**Ejemplos por entorno:**

```bash
# Desarrollo
NODE_ENV=development

# Staging
NODE_ENV=staging

# Producción
NODE_ENV=production
```

**Impacto:**
- En `development`: Logs detallados, validación de env visible, hot reload habilitado
- En `staging`: Logs moderados, validación silenciosa, comportamiento similar a producción
- En `production`: Logs mínimos, validación silenciosa, optimizaciones de rendimiento

---

### 2. DATABASE_URL

**Propósito:** Conexión a la base de datos MySQL/TiDB

**Formato:** URL de conexión JDBC estándar

**Validación:** URL válida con protocolo `mysql://`

**Estructura:**

```
mysql://[usuario]:[contraseña]@[host]:[puerto]/[base_datos]
```

**Ejemplos:**

```bash
# Desarrollo (local)
DATABASE_URL=mysql://root:password@localhost:3306/kaitel_dev

# Staging
DATABASE_URL=mysql://kaitel_staging:SecurePass123!@staging-db.example.com:3306/kaitel_staging

# Producción
DATABASE_URL=mysql://kaitel_prod:VerySecurePass456!@prod-db.example.com:3306/kaitel_production
```

**Consideraciones de seguridad:**
- Nunca usar credenciales débiles en staging/producción
- Usar conexiones SSL/TLS (agregar `?ssl=true` al final de la URL)
- Limitar permisos de usuario de BD a solo las tablas necesarias
- Rotar credenciales cada 90 días

---

### 3. JWT_SECRET

**Propósito:** Clave para firmar y verificar tokens JWT de sesión

**Requisitos:**
- Mínimo 32 caracteres
- Caracteres alfanuméricos + símbolos especiales
- Único por entorno
- Nunca reutilizar entre entornos

**Validación:** Mínimo 32 caracteres

**Generación segura:**

```bash
# Linux/Mac
openssl rand -base64 32

# Resultado ejemplo
dGhpcyBpcyBhIHNlY3VyZSBqd3Qgc2VjcmV0IGtleSBmb3IgdGVzdGluZ2c=
```

**Ejemplos:**

```bash
# Desarrollo
JWT_SECRET=dev_jwt_secret_key_at_least_32_chars_long_12345

# Staging
JWT_SECRET=staging_jwt_secret_key_at_least_32_chars_long_67890

# Producción
JWT_SECRET=prod_jwt_secret_key_at_least_32_chars_long_abcdef
```

**Impacto de cambios:**
- Cambiar JWT_SECRET invalida todas las sesiones activas
- Planificar cambios en horarios de bajo uso
- Notificar a usuarios sobre logout requerido

---

### 4. VITE_APP_ID

**Propósito:** Identificador único de la aplicación en el sistema Manus OAuth

**Formato:** String alfanumérico

**Validación:** Mínimo 1 carácter

**Obtención:** Proporcionado por Manus durante setup inicial

**Ejemplos:**

```bash
# Desarrollo
VITE_APP_ID=kaitel-training-dev

# Staging
VITE_APP_ID=kaitel-training-staging

# Producción
VITE_APP_ID=kaitel-training-prod
```

---

### 5. OAUTH_SERVER_URL

**Propósito:** URL base del servidor OAuth de Manus

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS

**Valor estándar:** Proporcionado por Manus

**Ejemplos:**

```bash
# Todos los entornos (típicamente el mismo)
OAUTH_SERVER_URL=https://api.manus.im

# O para instancias personalizadas
OAUTH_SERVER_URL=https://oauth.kaitel.example.com
```

---

### 6. OWNER_OPEN_ID

**Propósito:** Identificador único del propietario de la aplicación en Manus

**Formato:** String alfanumérico

**Validación:** Mínimo 1 carácter

**Obtención:** Proporcionado por Manus durante setup

**Ejemplos:**

```bash
OWNER_OPEN_ID=owner_12345678901234567890
```

---

### 7. OWNER_NAME

**Propósito:** Nombre legible del propietario para logs y notificaciones

**Formato:** String de texto

**Validación:** Mínimo 1 carácter

**Ejemplos:**

```bash
# Desarrollo
OWNER_NAME=Alejo Roldan Dev

# Staging
OWNER_NAME=Alejo Roldan Staging

# Producción
OWNER_NAME=Alejo Roldan
```

---

### 8. OPENAI_API_KEY

**Propósito:** Clave de API para acceso a GPT-4o y otros modelos de OpenAI

**Formato:** String que comienza con `sk-`

**Validación:** Mínimo 1 carácter (validación de formato en runtime)

**Obtención:** [OpenAI API Keys](https://platform.openai.com/api-keys)

**Consideraciones de seguridad:**
- Crear claves separadas por entorno
- Usar claves con límites de uso (rate limits)
- Rotar claves cada 6 meses
- Monitorear uso para detectar abuso
- Nunca commitear en repositorio

**Ejemplos:**

```bash
# Desarrollo (clave con límite bajo)
OPENAI_API_KEY=sk-dev-1234567890abcdefghijklmnopqrst

# Staging (clave con límite medio)
OPENAI_API_KEY=sk-staging-1234567890abcdefghijklmnopqrst

# Producción (clave con límite alto)
OPENAI_API_KEY=sk-prod-1234567890abcdefghijklmnopqrst
```

**Monitoreo de costos:**
- Configurar alertas en OpenAI dashboard
- Revisar uso mensual
- Implementar rate limiting (ya incluido en el proyecto)

---

### 9. BUILT_IN_FORGE_API_URL

**Propósito:** URL base de la API Forge de Manus (LLM, Storage, Notifications, etc.)

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS

**Valor estándar:** Proporcionado por Manus

**Ejemplos:**

```bash
# Todos los entornos (típicamente el mismo)
BUILT_IN_FORGE_API_URL=https://forge.manus.im

# O para instancias personalizadas
BUILT_IN_FORGE_API_URL=https://forge-api.kaitel.example.com
```

---

### 10. BUILT_IN_FORGE_API_KEY

**Propósito:** Clave de autenticación para acceder a APIs Forge de Manus

**Formato:** String alfanumérico

**Validación:** Mínimo 1 carácter

**Obtención:** Proporcionado por Manus durante setup

**Consideraciones de seguridad:**
- Usar claves separadas por entorno
- Rotar cada 6 meses
- Monitorear accesos anómalos

**Ejemplos:**

```bash
# Desarrollo
BUILT_IN_FORGE_API_KEY=forge_dev_key_1234567890

# Staging
BUILT_IN_FORGE_API_KEY=forge_staging_key_1234567890

# Producción
BUILT_IN_FORGE_API_KEY=forge_prod_key_1234567890
```

---

## Variables Opcionales

Estas variables mejoran funcionalidad pero no son requeridas. El servidor inicia correctamente sin ellas.

### 1. VITE_OAUTH_PORTAL_URL

**Propósito:** URL del portal de login OAuth para redirecciones frontend

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS (opcional)

**Ejemplos:**

```bash
VITE_OAUTH_PORTAL_URL=https://login.kaitel.example.com
```

---

### 2. VITE_FRONTEND_FORGE_API_URL

**Propósito:** URL de Forge API accesible desde el navegador (puede ser diferente de backend)

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS (opcional)

**Ejemplos:**

```bash
VITE_FRONTEND_FORGE_API_URL=https://forge-public.manus.im
```

---

### 3. VITE_FRONTEND_FORGE_API_KEY

**Propósito:** Clave de API Forge para llamadas desde el frontend (con permisos limitados)

**Formato:** String alfanumérico

**Validación:** String (opcional)

**Consideraciones de seguridad:**
- Usar clave diferente a la del backend con permisos más restrictivos
- Expuesta en el navegador, por lo que debe tener límites estrictos

**Ejemplos:**

```bash
VITE_FRONTEND_FORGE_API_KEY=forge_frontend_key_limited_perms
```

---

### 4. NEXT_PUBLIC_SUPABASE_URL

**Propósito:** URL de la instancia Supabase (si se usa para datos adicionales)

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS (opcional)

**Ejemplos:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

### 5. SUPABASE_SERVICE_ROLE_KEY

**Propósito:** Clave de servicio para Supabase (acceso backend sin restricciones RLS)

**Formato:** String JWT

**Validación:** String (opcional)

**Consideraciones de seguridad:**
- Nunca exponer en frontend
- Usar solo en servidor
- Rotar cada 6 meses

---

### 6. SUPABASE_ANON_KEY

**Propósito:** Clave anónima de Supabase (acceso frontend con RLS)

**Formato:** String JWT

**Validación:** String (opcional)

**Consideraciones de seguridad:**
- Segura para exponer en frontend
- Respeta políticas RLS de Supabase

---

### 7. VITE_ANALYTICS_ENDPOINT

**Propósito:** URL del servicio de analytics (ej: Plausible, Umami)

**Formato:** URL HTTPS válida

**Validación:** URL válida con protocolo HTTPS (opcional)

**Ejemplos:**

```bash
VITE_ANALYTICS_ENDPOINT=https://analytics.kaitel.example.com
```

---

### 8. VITE_ANALYTICS_WEBSITE_ID

**Propósito:** Identificador del sitio web en el servicio de analytics

**Formato:** String alfanumérico

**Validación:** String (opcional)

**Ejemplos:**

```bash
VITE_ANALYTICS_WEBSITE_ID=kaitel-training-prod
```

---

### 9. VITE_APP_TITLE

**Propósito:** Título de la aplicación mostrado en navegador y metadatos

**Formato:** String de texto

**Validación:** String (opcional)

**Ejemplos:**

```bash
VITE_APP_TITLE=Kaitel Training Platform
```

---

### 10. VITE_APP_LOGO

**Propósito:** URL del logo de la aplicación

**Formato:** URL o ruta relativa

**Validación:** String (opcional)

**Ejemplos:**

```bash
VITE_APP_LOGO=/logo.png
VITE_APP_LOGO=https://cdn.kaitel.example.com/logo.png
```

---

## Configuración por Entorno

### Desarrollo

El entorno de desarrollo tiene requisitos mínimos y permite credenciales débiles para facilitar testing local.

**Características:**
- Validación verbose de variables
- Logs detallados
- Hot reload habilitado
- Rate limiting deshabilitado (opcional)

**Archivo `.env.development`:**

```bash
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

# Opcionales
VITE_OAUTH_PORTAL_URL=https://login.dev.kaitel.example.com
VITE_APP_TITLE=Kaitel Training (Dev)
```

**Notas:**
- Cambiar `localhost` a IP local si accedes desde otra máquina
- Usar credenciales débiles es aceptable
- Resetear base de datos frecuentemente es normal

---

### Staging

El entorno de staging replica la configuración de producción pero con datos de prueba y límites de costo más bajos.

**Características:**
- Comportamiento idéntico a producción
- Logs moderados
- Rate limiting habilitado
- Credenciales seguras requeridas
- Datos de prueba (no datos reales)

**Archivo `.env.staging`:**

```bash
NODE_ENV=staging
DATABASE_URL=mysql://kaitel_staging:SecurePass123!@staging-db.example.com:3306/kaitel_staging
JWT_SECRET=staging_jwt_secret_key_at_least_32_chars_long_67890
VITE_APP_ID=kaitel-training-staging
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=owner_staging_12345
OWNER_NAME=Alejo Roldan Staging
OPENAI_API_KEY=sk-staging-1234567890abcdefghijklmnopqrst
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=forge_staging_key_1234567890

# Opcionales
VITE_OAUTH_PORTAL_URL=https://login.staging.kaitel.example.com
VITE_ANALYTICS_ENDPOINT=https://analytics.staging.kaitel.example.com
VITE_ANALYTICS_WEBSITE_ID=kaitel-training-staging
VITE_APP_TITLE=Kaitel Training (Staging)
```

**Notas:**
- Usar credenciales seguras (mínimo 16 caracteres)
- Implementar SSL/TLS en base de datos
- Usar claves de OpenAI con límites de uso bajos
- Resetear datos de prueba regularmente

---

### Producción

El entorno de producción requiere máxima seguridad, monitoreo y credenciales robustas.

**Características:**
- Comportamiento optimizado
- Logs mínimos (solo errores)
- Rate limiting estricto
- Credenciales muy seguras obligatorias
- Datos reales (protección crítica)
- Monitoreo y alertas habilitadas

**Archivo `.env.production`:**

```bash
NODE_ENV=production
DATABASE_URL=mysql://kaitel_prod:VerySecurePass456!@prod-db.example.com:3306/kaitel_production
JWT_SECRET=prod_jwt_secret_key_at_least_32_chars_long_abcdef
VITE_APP_ID=kaitel-training-prod
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=owner_prod_12345
OWNER_NAME=Alejo Roldan
OPENAI_API_KEY=sk-prod-1234567890abcdefghijklmnopqrst
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=forge_prod_key_1234567890

# Opcionales pero recomendados
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

**Notas:**
- Usar credenciales muy seguras (mínimo 32 caracteres, símbolos especiales)
- Implementar SSL/TLS en todas las conexiones
- Usar claves de OpenAI con límites de uso altos
- Configurar alertas de costos
- Realizar backups diarios de base de datos
- Rotar credenciales cada 90 días

---

## Validación y Testing

### Validación Automática

El servidor implementa validación temprana usando Zod. Si falta alguna variable requerida, el servidor falla con un mensaje claro:

```
❌ Environment Variables Validation Failed

The following environment variables are missing or invalid:
  • DATABASE_URL: DATABASE_URL must be a valid URL
  • OPENAI_API_KEY: OPENAI_API_KEY is required for AI features

Please check your .env file or environment configuration and ensure all required variables are set.
```

### Testing de Variables

Ejecutar los tests de validación:

```bash
# Ejecutar solo tests de env
npm test -- env.test.ts

# Resultado esperado
✓ server/_core/env.test.ts (16 tests) 42ms
  Test Files  1 passed (1)
       Tests  16 passed (16)
```

### Validación Manual

Verificar que las variables están correctas:

```bash
# Verificar que NODE_ENV está correcto
echo $NODE_ENV

# Verificar que DATABASE_URL está configurada
echo $DATABASE_URL

# Verificar que OPENAI_API_KEY está configurada (sin mostrar valor)
if [ -z "$OPENAI_API_KEY" ]; then echo "OPENAI_API_KEY no está configurada"; fi
```

---

## Mejores Prácticas de Seguridad

### 1. Nunca Commitear Archivos `.env`

```bash
# Agregar a .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 2. Usar `.env.example` como Referencia

```bash
# Crear archivo de ejemplo sin valores sensibles
cp .env.production .env.example
# Reemplazar valores sensibles con placeholders
sed -i 's/sk-[^/]*/sk-YOUR_OPENAI_API_KEY_HERE/g' .env.example
```

### 3. Rotación de Credenciales

| Credencial | Frecuencia | Procedimiento |
|------------|-----------|--------------|
| JWT_SECRET | 90 días | Cambiar y notificar logout a usuarios |
| OPENAI_API_KEY | 6 meses | Crear nueva clave, migrar, eliminar antigua |
| DATABASE_URL password | 90 días | Cambiar en BD, actualizar variable |
| FORGE_API_KEY | 6 meses | Crear nueva clave, migrar, eliminar antigua |

### 4. Monitoreo de Acceso

```bash
# Auditar acceso a variables sensibles
grep -r "OPENAI_API_KEY\|JWT_SECRET\|DATABASE_URL" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v ".env"
```

### 5. Protección en Diferentes Plataformas

**Manus Platform:**
- Usar el panel de Secrets para almacenar variables
- Las variables se inyectan automáticamente en runtime
- No se guardan en el repositorio

**Docker:**
```dockerfile
# NO hacer esto
ENV OPENAI_API_KEY=sk-xxx

# Hacer esto en su lugar
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: kaitel-secrets
type: Opaque
stringData:
  OPENAI_API_KEY: sk-xxx
  DATABASE_URL: mysql://...
```

---

## Troubleshooting

### Error: "DATABASE_URL must be a valid URL"

**Causa:** URL de base de datos mal formada

**Solución:**
```bash
# Verificar formato
# Correcto: mysql://user:pass@host:port/database
# Incorrecto: mysql://user:pass@host/database (falta puerto)

# Agregar puerto 3306 si falta
DATABASE_URL=mysql://user:pass@host:3306/database
```

### Error: "JWT_SECRET must be at least 32 characters"

**Causa:** JWT_SECRET muy corto

**Solución:**
```bash
# Generar nueva clave segura
openssl rand -base64 32

# Copiar resultado a JWT_SECRET
JWT_SECRET=dGhpcyBpcyBhIHNlY3VyZSBqd3Qgc2VjcmV0IGtleSBmb3IgdGVzdGluZ2c=
```

### Error: "OPENAI_API_KEY is required for AI features"

**Causa:** OPENAI_API_KEY no está configurada

**Solución:**
```bash
# Obtener clave de https://platform.openai.com/api-keys
# Agregar a .env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Error: "Cannot connect to database"

**Causa:** DATABASE_URL correcta pero servidor no accesible

**Solución:**
```bash
# Verificar conectividad
mysql -h host -u user -p -D database

# Verificar firewall
telnet host 3306

# Verificar credenciales
# Usuario debe tener permisos en la base de datos
```

### Servidor inicia pero features no funcionan

**Causa:** Variables opcionales faltantes

**Solución:**
```bash
# Verificar qué features están disponibles
# En logs de desarrollo verás:
# 🔐 OpenAI: ✓
# 📊 Supabase: ✗
# 📈 Analytics: ✗

# Agregar variables faltantes según necesidad
```

---

## Checklist de Deployment

### Pre-Deployment

- [ ] Todas las variables requeridas están configuradas
- [ ] Variables opcionales están configuradas según necesidad
- [ ] Credenciales son únicas por entorno
- [ ] Credenciales son seguras (mínimo 32 caracteres)
- [ ] URLs usan HTTPS
- [ ] Base de datos está accesible desde servidor
- [ ] OpenAI API key tiene límites de uso configurados
- [ ] Backups de base de datos están configurados

### Deployment

- [ ] Ejecutar `npm test -- env.test.ts` para validar
- [ ] Verificar logs al iniciar servidor
- [ ] Probar login OAuth
- [ ] Probar evaluación con GPT-4o
- [ ] Verificar que rate limiting funciona
- [ ] Monitorear costos de OpenAI

### Post-Deployment

- [ ] Configurar alertas de errores
- [ ] Configurar alertas de costos de OpenAI
- [ ] Configurar rotación de credenciales
- [ ] Documentar ubicación de variables
- [ ] Entrenar equipo en procedimientos

---

## Referencias y Recursos

- [OpenAI API Keys Documentation](https://platform.openai.com/docs/api-reference/authentication)
- [Zod Validation Library](https://zod.dev/)
- [MySQL Connection Strings](https://dev.mysql.com/doc/connector-net/en/connector-net-connection-string.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Environment Variables Security](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0  
**Autor:** Manus AI
