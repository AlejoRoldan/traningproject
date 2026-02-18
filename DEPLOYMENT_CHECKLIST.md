# 📋 Checklist de Deployment - Kaitel Training Platform

Este documento proporciona checklists detalladas para desplegar la aplicación en diferentes entornos.

---

## Pre-Deployment (Todos los Entornos)

### Preparación del Código

- [ ] Todas las ramas están mergeadas a `main`
- [ ] Tests pasan: `npm test`
- [ ] Compilación exitosa: `npm run build`
- [ ] No hay warnings de TypeScript: `npx tsc --noEmit`
- [ ] Linting pasa: `npm run lint` (si existe)
- [ ] Cambios documentados en CHANGELOG.md

### Preparación de Variables de Entorno

- [ ] Archivo `.env.{entorno}` está configurado
- [ ] Todas las variables requeridas están presentes
- [ ] Validación pasa: `NODE_ENV={entorno} node scripts/validate-env.mjs`
- [ ] Credenciales son únicas por entorno
- [ ] Credenciales cumplen requisitos de seguridad
- [ ] URLs usan HTTPS (excepto localhost en dev)

### Preparación de Base de Datos

- [ ] Base de datos está creada
- [ ] Usuario de BD tiene permisos correctos
- [ ] Conexión es accesible desde servidor
- [ ] SSL/TLS está habilitado (staging/prod)
- [ ] Backup está configurado (staging/prod)
- [ ] Migraciones están aplicadas: `npm run migrate`

### Preparación de Servicios Externos

- [ ] Cuenta de OpenAI está activa
- [ ] API key de OpenAI tiene límites de uso configurados
- [ ] Alertas de costos están configuradas
- [ ] Manus OAuth está configurado
- [ ] Manus Forge API está accesible
- [ ] Supabase está configurado (si se usa)

---

## Deployment a Desarrollo

### Pre-Deployment

- [ ] Completar "Pre-Deployment (Todos los Entornos)"
- [ ] Base de datos local está limpia (opcional)
- [ ] Puerto 3000 está disponible

### Durante Deployment

- [ ] Instalar dependencias: `npm install`
- [ ] Iniciar servidor: `npm run dev`
- [ ] Verificar logs en consola
- [ ] No hay errores de compilación

### Post-Deployment

- [ ] Servidor está corriendo en http://localhost:3000
- [ ] Página de inicio carga correctamente
- [ ] Login OAuth funciona
- [ ] Crear simulación funciona
- [ ] Evaluación con GPT-4o funciona
- [ ] Rate limiting funciona (probar múltiples requests)

### Verificación de Features

- [ ] Dashboard carga correctamente
- [ ] Escenarios se cargan
- [ ] Simulación inicia correctamente
- [ ] Mensajes se envían y reciben
- [ ] Audio se transcribe correctamente
- [ ] Evaluación se genera correctamente
- [ ] Coaching suggestions aparecen

---

## Deployment a Staging

### Pre-Deployment

- [ ] Completar "Pre-Deployment (Todos los Entornos)"
- [ ] Código está en rama `staging` o `develop`
- [ ] Cambios están documentados
- [ ] Equipo está notificado del deployment
- [ ] Ventana de deployment está confirmada

### Preparación de Infraestructura

- [ ] Servidor de staging está disponible
- [ ] Base de datos de staging está accesible
- [ ] SSL/TLS está configurado
- [ ] Firewall permite tráfico necesario
- [ ] Backups están configurados
- [ ] Monitoreo está configurado

### Durante Deployment

- [ ] Descargar código: `git pull origin staging`
- [ ] Instalar dependencias: `npm install`
- [ ] Ejecutar migraciones: `npm run migrate`
- [ ] Validar env: `NODE_ENV=staging node scripts/validate-env.mjs`
- [ ] Iniciar servidor: `NODE_ENV=staging npm run build && npm start`
- [ ] Verificar logs
- [ ] No hay errores de compilación

### Post-Deployment

- [ ] Servidor está corriendo
- [ ] Página de inicio carga correctamente
- [ ] HTTPS funciona correctamente
- [ ] Login OAuth funciona
- [ ] Base de datos está accesible
- [ ] OpenAI API funciona
- [ ] Rate limiting está activo

### Verificación de Features

- [ ] Dashboard carga correctamente
- [ ] Crear simulación funciona
- [ ] Evaluación con GPT-4o funciona
- [ ] Coaching suggestions aparecen
- [ ] Notificaciones se envían correctamente
- [ ] Logs se generan correctamente

### Pruebas de Carga

- [ ] Rate limiting rechaza requests después del límite
- [ ] Servidor maneja múltiples usuarios simultáneamente
- [ ] Base de datos no tiene bottlenecks
- [ ] Costos de OpenAI son razonables

### Rollback Plan

- [ ] Versión anterior está disponible
- [ ] Procedimiento de rollback está documentado
- [ ] Equipo sabe cómo ejecutar rollback
- [ ] Backups de BD están disponibles

---

## Deployment a Producción

### Pre-Deployment

- [ ] Completar "Pre-Deployment (Todos los Entornos)"
- [ ] Código está en rama `main` y etiquetado con versión
- [ ] Cambios están documentados en CHANGELOG.md
- [ ] Release notes están preparadas
- [ ] Equipo está notificado del deployment
- [ ] Ventana de deployment está confirmada (horario de bajo uso)
- [ ] Plan de rollback está documentado

### Preparación de Infraestructura

- [ ] Servidor de producción está disponible
- [ ] Base de datos de producción está accesible
- [ ] SSL/TLS está configurado y validado
- [ ] Certificados SSL no expiran pronto
- [ ] Firewall está configurado correctamente
- [ ] DDoS protection está habilitada
- [ ] WAF (Web Application Firewall) está configurado
- [ ] Backups están configurados (diarios)
- [ ] Monitoreo y alertas están configurados
- [ ] Logs están centralizados

### Preparación de Seguridad

- [ ] Credenciales de producción son muy seguras
- [ ] JWT_SECRET tiene mínimo 32 caracteres
- [ ] DATABASE_URL tiene SSL/TLS habilitado
- [ ] OPENAI_API_KEY tiene límites de uso configurados
- [ ] Todas las URLs usan HTTPS
- [ ] Headers de seguridad están configurados
- [ ] CORS está configurado correctamente
- [ ] Rate limiting está habilitado

### Preparación de Monitoreo

- [ ] Alertas de errores están configuradas
- [ ] Alertas de rendimiento están configuradas
- [ ] Alertas de costos de OpenAI están configuradas
- [ ] Dashboard de monitoreo está disponible
- [ ] Logs están siendo capturados
- [ ] Métricas están siendo recolectadas

### Durante Deployment

- [ ] Descargar código: `git pull origin main`
- [ ] Instalar dependencias: `npm install --production`
- [ ] Ejecutar migraciones: `npm run migrate`
- [ ] Validar env: `NODE_ENV=production node scripts/validate-env.mjs`
- [ ] Compilar: `npm run build`
- [ ] Iniciar servidor: `NODE_ENV=production npm start`
- [ ] Verificar logs
- [ ] No hay errores de compilación

### Post-Deployment Inmediato

- [ ] Servidor está corriendo
- [ ] Página de inicio carga correctamente
- [ ] HTTPS funciona correctamente
- [ ] Certificado SSL es válido
- [ ] Login OAuth funciona
- [ ] Base de datos está accesible
- [ ] OpenAI API funciona
- [ ] Rate limiting está activo
- [ ] Logs están siendo generados

### Post-Deployment - Verificación de Features (30 minutos)

- [ ] Dashboard carga correctamente
- [ ] Crear simulación funciona
- [ ] Enviar mensaje funciona
- [ ] Evaluación con GPT-4o funciona
- [ ] Coaching suggestions aparecen
- [ ] Notificaciones se envían correctamente
- [ ] Usuarios pueden hacer login
- [ ] Usuarios pueden crear simulaciones
- [ ] Usuarios pueden completar simulaciones

### Post-Deployment - Monitoreo (1 hora)

- [ ] No hay picos de errores
- [ ] Rendimiento es normal
- [ ] Costos de OpenAI son normales
- [ ] Usuarios no reportan problemas
- [ ] Logs no muestran warnings
- [ ] Alertas no se han disparado

### Post-Deployment - Comunicación

- [ ] Equipo está notificado del deployment exitoso
- [ ] Release notes se publican
- [ ] Usuarios están notificados (si hay cambios visibles)
- [ ] Documentación se actualiza
- [ ] Changelog se actualiza

### Post-Deployment - Documentación

- [ ] Versión de producción está documentada
- [ ] Cambios están documentados
- [ ] Problemas conocidos están documentados
- [ ] Procedimiento de rollback está actualizado

---

## Rollback Procedure

### Cuándo Hacer Rollback

- [ ] Errores críticos que afectan usuarios
- [ ] Pérdida de datos
- [ ] Seguridad comprometida
- [ ] Rendimiento degradado significativamente
- [ ] Servicios externos no accesibles

### Pasos de Rollback

1. [ ] Notificar al equipo
2. [ ] Detener servidor actual: `npm stop` o `Ctrl+C`
3. [ ] Descargar versión anterior: `git checkout <tag-anterior>`
4. [ ] Instalar dependencias: `npm install --production`
5. [ ] Ejecutar migraciones (si es necesario): `npm run migrate`
6. [ ] Iniciar servidor: `NODE_ENV=production npm start`
7. [ ] Verificar que aplicación funciona
8. [ ] Notificar al equipo que rollback completó
9. [ ] Investigar causa del problema
10. [ ] Documentar lecciones aprendidas

---

## Checklist de Rotación de Credenciales

### Cada 90 Días

- [ ] JWT_SECRET
- [ ] DATABASE_URL password
- [ ] OPENAI_API_KEY
- [ ] BUILT_IN_FORGE_API_KEY

### Cada 6 Meses

- [ ] Todas las credenciales
- [ ] Certificados SSL (verificar fecha de expiración)
- [ ] Contraseñas de acceso a servidores

### Procedimiento

1. [ ] Generar nueva credencial
2. [ ] Configurar en servidor de staging
3. [ ] Testar que funciona
4. [ ] Configurar en servidor de producción
5. [ ] Verificar que funciona
6. [ ] Esperar 24 horas (si es posible)
7. [ ] Eliminar credencial antigua
8. [ ] Documentar cambio

---

## Troubleshooting Rápido

### Servidor no inicia

```bash
# Verificar variables de entorno
NODE_ENV=production node scripts/validate-env.mjs

# Verificar logs
tail -f /var/log/kaitel/server.log

# Verificar puerto
lsof -i :3000
```

### Base de datos no accesible

```bash
# Verificar conexión
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -D $DB_NAME

# Verificar firewall
telnet $DB_HOST 3306

# Verificar credenciales en .env
echo $DATABASE_URL
```

### OpenAI API no funciona

```bash
# Verificar API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Verificar límites de uso
# Ir a https://platform.openai.com/account/billing/overview
```

### Alto uso de memoria

```bash
# Verificar procesos
ps aux | grep node

# Verificar memoria
free -h

# Reiniciar servidor
npm stop
npm start
```

---

## Contactos de Emergencia

- **Alejo Roldan (Tech Lead):** [email/teléfono]
- **Equipo de Infraestructura:** [email/teléfono]
- **Soporte de OpenAI:** https://help.openai.com

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0
