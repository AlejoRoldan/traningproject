# 🚀 Guía de Despliegue

Esta guía cubre el despliegue de Kaitel Training Platform en diferentes entornos de producción.

---

## Prerrequisitos

Antes de desplegar, asegúrate de tener:

- **Node.js 22.x** o superior instalado
- **Base de datos MySQL 8.0+** o TiDB configurada
- **Cuenta de AWS** con acceso a S3
- **API Key de OpenAI** (opcional, usa LLM de Manus por defecto)
- **Dominio personalizado** (opcional)

---

## Opción 1: Manus Platform (Recomendado)

Manus Platform ofrece hosting integrado con SSL automático, custom domains, y despliegue con un clic.

### Paso 1: Crear Checkpoint

1. Abre el proyecto en Manus
2. Verifica que todos los cambios estén guardados
3. Haz clic en "Save Checkpoint" en el Management UI
4. Agrega un mensaje descriptivo (ej: "Release v1.0.0")

### Paso 2: Configurar Secrets

1. Ve a **Settings → Secrets** en el Management UI
2. Agrega las siguientes variables:

```
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kaitel-training-audio
```

### Paso 3: Publicar

1. Haz clic en **"Publish"** en el header del Management UI
2. Espera a que el despliegue se complete (2-5 minutos)
3. Tu aplicación estará disponible en `https://[tu-proyecto].manus.space`

### Paso 4: Configurar Dominio Personalizado (Opcional)

1. Ve a **Settings → Domains**
2. Opciones:
   - **Modificar subdominio**: Cambia el prefijo de `xxx.manus.space`
   - **Comprar dominio**: Adquiere un dominio directamente en Manus
   - **Bind dominio existente**: Conecta tu dominio personalizado

3. Sigue las instrucciones para configurar DNS
4. Espera a que se propague (5-30 minutos)
5. SSL se configura automáticamente

### Paso 5: Monitoreo

1. Ve a **Dashboard** en el Management UI
2. Revisa métricas de tráfico (UV/PV)
3. Configura notificaciones en **Settings → Notifications**

---

## Opción 2: Railway

Railway ofrece despliegue rápido con base de datos MySQL incluida.

### Paso 1: Preparar Proyecto

1. Asegúrate de tener un repositorio Git
2. Agrega `.env.example` con las variables necesarias

### Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio

### Paso 3: Agregar Base de Datos

1. En el proyecto, haz clic en "New"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente `DATABASE_URL`

### Paso 4: Configurar Variables de Entorno

1. Ve a tu servicio → "Variables"
2. Agrega:

```
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kaitel-training-audio
NODE_ENV=production
```

### Paso 5: Configurar Build

Railway detecta automáticamente Node.js. Si necesitas personalizar:

1. Crea `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Paso 6: Desplegar

1. Railway despliega automáticamente en cada push a `main`
2. Monitorea logs en tiempo real desde el dashboard
3. Tu aplicación estará en `https://[tu-proyecto].up.railway.app`

### Paso 7: Dominio Personalizado

1. Ve a "Settings" → "Domains"
2. Haz clic en "Add Domain"
3. Configura CNAME en tu proveedor de DNS
4. Railway genera SSL automáticamente

---

## Opción 3: Render

Render ofrece tier gratuito y despliegue continuo.

### Paso 1: Crear Web Service

1. Ve a [render.com](https://render.com)
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub

### Paso 2: Configurar Servicio

```
Name: kaitel-training-platform
Environment: Node
Region: Oregon (US West)
Branch: main
Build Command: pnpm install && pnpm build
Start Command: pnpm start
```

### Paso 3: Agregar Base de Datos

1. Crea un nuevo "PostgreSQL" o usa MySQL externo
2. Copia la `DATABASE_URL` interna

### Paso 4: Variables de Entorno

En "Environment" tab:

```
DATABASE_URL=[internal_connection_string]
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kaitel-training-audio
NODE_ENV=production
```

### Paso 5: Desplegar

1. Haz clic en "Create Web Service"
2. Render despliega automáticamente
3. Monitorea logs en tiempo real
4. Tu aplicación estará en `https://[tu-servicio].onrender.com`

### Paso 6: Dominio Personalizado

1. Ve a "Settings" → "Custom Domain"
2. Agrega tu dominio
3. Configura CNAME en tu DNS
4. Render genera SSL automáticamente

---

## Opción 4: AWS (EC2 + RDS + S3)

Despliegue completo en AWS para máximo control.

### Paso 1: Crear Instancia EC2

1. Lanza instancia Ubuntu 22.04 LTS
2. Tipo: `t3.medium` (2 vCPU, 4 GB RAM)
3. Configura Security Group:
   - SSH (22) desde tu IP
   - HTTP (80) desde 0.0.0.0/0
   - HTTPS (443) desde 0.0.0.0/0

### Paso 2: Configurar Base de Datos RDS

1. Crea instancia MySQL 8.0
2. Tipo: `db.t3.micro` (1 vCPU, 1 GB RAM)
3. Habilita "Public accessibility"
4. Configura Security Group para permitir conexiones desde EC2
5. Copia endpoint y credenciales

### Paso 3: Configurar S3

1. Crea bucket `kaitel-training-audio`
2. Habilita "Public access" para lectura
3. Configura CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://tu-dominio.com"],
    "ExposeHeaders": []
  }
]
```

4. Crea usuario IAM con permisos S3
5. Genera Access Key y Secret Key

### Paso 4: Instalar Dependencias en EC2

```bash
# Conectar via SSH
ssh -i tu-key.pem ubuntu@[ec2-ip]

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
sudo npm install -g pnpm

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

### Paso 5: Clonar y Configurar Proyecto

```bash
# Clonar repositorio
git clone https://github.com/[tu-usuario]/kaitel-training-platform.git
cd kaitel-training-platform

# Instalar dependencias
pnpm install

# Crear archivo .env
nano .env
```

Contenido de `.env`:

```env
DATABASE_URL=mysql://user:password@[rds-endpoint]:3306/kaitel
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kaitel-training-audio
NODE_ENV=production
PORT=3000
```

### Paso 6: Build y Ejecutar Migraciones

```bash
# Build de producción
pnpm build

# Ejecutar migraciones
pnpm db:push

# Poblar escenarios
node seed-scenarios.mjs
```

### Paso 7: Configurar PM2

```bash
# Iniciar aplicación con PM2
pm2 start dist/index.js --name kaitel-training

# Configurar inicio automático
pm2 startup
pm2 save

# Monitorear
pm2 logs kaitel-training
pm2 monit
```

### Paso 8: Configurar Nginx como Reverse Proxy

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/kaitel
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/kaitel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 9: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo certbot renew --dry-run
```

### Paso 10: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Opción 5: Vercel (Frontend) + Railway (Backend)

Separar frontend y backend para escalabilidad.

### Paso 1: Preparar Monorepo

Reestructura el proyecto:

```
kaitel-training-platform/
├── apps/
│   ├── web/          # Frontend (Vercel)
│   └── api/          # Backend (Railway)
├── packages/
│   └── shared/       # Código compartido
└── package.json
```

### Paso 2: Desplegar Backend en Railway

Sigue los pasos de "Opción 2: Railway" para el directorio `apps/api`.

### Paso 3: Desplegar Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Importa repositorio
3. Configura:

```
Framework Preset: Vite
Root Directory: apps/web
Build Command: pnpm build
Output Directory: dist
```

4. Agrega variables de entorno:

```
VITE_API_URL=https://[tu-backend].up.railway.app
```

5. Despliega

### Paso 4: Configurar CORS en Backend

En `server/_core/index.ts`:

```typescript
app.use(cors({
  origin: 'https://tu-dominio.vercel.app',
  credentials: true
}));
```

---

## Checklist de Despliegue

Antes de ir a producción, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] Base de datos con SSL habilitado
- [ ] Migraciones ejecutadas
- [ ] Escenarios de ejemplo poblados
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado para dominio de producción
- [ ] Rate limiting habilitado (recomendado)
- [ ] Logs estructurados configurados
- [ ] Monitoreo de errores (Sentry, opcional)
- [ ] Backups automáticos de base de datos
- [ ] Dominio personalizado configurado
- [ ] Tests ejecutados y pasando
- [ ] Documentación actualizada

---

## Rollback

Si necesitas revertir un despliegue:

### Manus Platform
1. Ve a Management UI → Checkpoints
2. Selecciona checkpoint anterior
3. Haz clic en "Rollback"

### Railway/Render
1. Ve a "Deployments"
2. Selecciona deployment anterior
3. Haz clic en "Redeploy"

### AWS EC2
```bash
# Conectar via SSH
ssh -i tu-key.pem ubuntu@[ec2-ip]

# Revertir código
cd kaitel-training-platform
git checkout [commit-anterior]
pnpm install
pnpm build
pm2 restart kaitel-training
```

---

## Monitoreo Post-Despliegue

### Métricas Clave

1. **Uptime**: Usa [UptimeRobot](https://uptimerobot.com) o [Pingdom](https://www.pingdom.com)
2. **Logs**: Centraliza con [Logtail](https://logtail.com) o [Papertrail](https://www.papertrail.com)
3. **Errores**: Integra [Sentry](https://sentry.io) para tracking de errores
4. **Performance**: Usa [New Relic](https://newrelic.com) o [Datadog](https://www.datadoghq.com)

### Alertas

Configura alertas para:
- Downtime > 5 minutos
- Tasa de error > 5%
- Latencia p95 > 2 segundos
- Uso de CPU > 80%
- Uso de memoria > 90%
- Costo de OpenAI API > presupuesto mensual

---

## Troubleshooting

### Error: "Cannot connect to database"

**Causa**: Credenciales incorrectas o firewall bloqueando conexión

**Solución**:
1. Verifica `DATABASE_URL` en variables de entorno
2. Asegúrate de que la base de datos permite conexiones desde la IP del servidor
3. Habilita SSL si es requerido: `DATABASE_URL=mysql://...?ssl=true`

### Error: "OpenAI API key invalid"

**Causa**: API key expirada o incorrecta

**Solución**:
1. Verifica que `OPENAI_API_KEY` comience con `sk-`
2. Genera una nueva key en [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Actualiza la variable de entorno
4. Reinicia el servidor

### Error: "Cannot upload to S3"

**Causa**: Permisos insuficientes o bucket no existe

**Solución**:
1. Verifica que el bucket existe en AWS S3
2. Asegúrate de que el usuario IAM tiene permisos `s3:PutObject` y `s3:GetObject`
3. Verifica `AWS_REGION` y `AWS_S3_BUCKET` en variables de entorno

### Error: "Port already in use"

**Causa**: Otro proceso usando el puerto 3000

**Solución**:
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 [PID]

# O cambiar puerto
PORT=3001 pnpm start
```

---

## Mantenimiento

### Backups de Base de Datos

**Manus Platform**: Automático

**Railway**: Automático (plan Pro)

**AWS RDS**:
```bash
# Backup manual
mysqldump -h [rds-endpoint] -u [user] -p kaitel > backup-$(date +%Y%m%d).sql

# Restaurar
mysql -h [rds-endpoint] -u [user] -p kaitel < backup-20260202.sql
```

### Actualización de Dependencias

```bash
# Ver dependencias desactualizadas
pnpm outdated

# Actualizar todas (cuidado con breaking changes)
pnpm update

# Actualizar específica
pnpm update react@latest

# Ejecutar tests después de actualizar
pnpm test
```

### Limpieza de S3

```bash
# Listar archivos antiguos (>90 días)
aws s3 ls s3://kaitel-training-audio/simulations/ --recursive | awk '$1 < "'$(date -d '90 days ago' +%Y-%m-%d)'"'

# Archivar a Glacier (configurar lifecycle policy en AWS Console)
```

---

**Autor**: Manus AI  
**Última actualización**: Febrero 2026  
**Versión**: 1.0.0
