# 🎯 Kaitel Training Platform

**Plataforma integral de entrenamiento y evaluación para agentes de contact center bancario**

Desarrollada para Kaitel Paraguay, esta plataforma permite entrenar y evaluar a agentes de contact center mediante simulaciones realistas de llamadas, análisis de voz con IA, y tableros de control para supervisores.

![Kaitel Training Platform](https://img.shields.io/badge/version-1.0.0-green) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-22.13.0-brightgreen) ![React](https://img.shields.io/badge/react-19.2.1-blue)

---

## ✨ Características Principales

### 🎭 Simulaciones Progresivas de Llamadas con Voz Realista
La plataforma ofrece escenarios de entrenamiento organizados por complejidad, desde consultas informativas básicas hasta casos complejos de fraude, lavado de activos y robo. Cada simulación genera respuestas dinámicas del cliente usando GPT-4o con **síntesis de voz realista** (OpenAI TTS), seleccionando automáticamente voces masculinas o femeninas según el perfil del cliente. El audio se reproduce automáticamente con indicador visual de "hablando".

### 🤖 Evaluación Automática con IA
Integración completa con OpenAI GPT-4o para evaluar automáticamente el desempeño del agente en cinco dimensiones críticas: empatía, claridad, protocolo, resolución de problemas y generación de confianza. El sistema proporciona feedback personalizado con fortalezas, debilidades y recomendaciones específicas.

### 🎙️ Análisis de Voz y Sentimiento
Transcripción automática con Whisper API y análisis completo del tono vocal del agente, incluyendo velocidad del habla, pausas, claridad, confianza, empatía, profesionalismo y entusiasmo. Genera una puntuación vocal global con insights personalizados.

### 🎬 Reproductor Sincronizado
Reproductor de audio profesional que sincroniza la transcripción con el audio en tiempo real, resalta palabras clave bancarias (cuenta, tarjeta, fraude, préstamo), permite navegación por clic, y ofrece controles completos de reproducción.

### 📍 Marcadores Temporales
Los supervisores pueden agregar marcadores durante la reproducción con categorías (Excelente, Bueno, Necesita Mejora, Error Crítico) y notas personalizadas. Los marcadores aparecen como banderas de colores en la línea de tiempo con tooltips informativos.

### 🏆 Sistema de Gamificación
Sistema completo de niveles (Junior, Intermediate, Senior, Expert), puntos de experiencia, badges desbloqueables, y progreso visual para motivar el aprendizaje continuo.

### 📊 Tableros de Control
Dashboards individuales por empleado con métricas de desempeño, historial de simulaciones, análisis de fortalezas y debilidades, y planes de mejora personalizados. Panel para supervisores con vista consolidada de equipos y estadísticas grupales.

### 🎨 Línea Visual de Itti
Diseño moderno y profesional siguiendo la identidad de marca de Itti Digital, con verde primario (#00D084), interfaz minimalista y experiencia de usuario optimizada.

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** con TypeScript para interfaces reactivas y type-safe
- **TailwindCSS 4** para estilos modernos y responsive
- **shadcn/ui** para componentes UI consistentes y accesibles
- **Wouter** para enrutamiento ligero del lado del cliente
- **tRPC** para comunicación type-safe con el backend
- **TanStack Query** para gestión de estado del servidor

### Backend
- **Node.js 22** con Express 4 para servidor HTTP
- **tRPC 11** para APIs type-safe end-to-end
- **Drizzle ORM** para interacciones con base de datos
- **MySQL/TiDB** para almacenamiento persistente
- **OpenAI API** (GPT-4o + Whisper + TTS) para evaluación, transcripción y síntesis de voz

### Infraestructura
- **AWS S3** para almacenamiento de grabaciones de audio
- **Manus Platform** para hosting y despliegue
- **Vitest** para testing unitario
- **TypeScript** en todo el stack para seguridad de tipos

---

## 🚀 Inicio Rápido

### Prerrequisitos
```bash
# Node.js 22.x o superior
node --version

# pnpm (gestor de paquetes)
npm install -g pnpm
```

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/[tu-usuario]/kaitel-training-platform.git
cd kaitel-training-platform
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# Base de datos
DATABASE_URL=mysql://user:password@host:port/database

# OpenAI API (opcional, usa LLM de Manus por defecto)
OPENAI_API_KEY=sk-...

# AWS S3 para almacenamiento de audio
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=kaitel-training-audio
```

4. **Ejecutar migraciones de base de datos**
```bash
pnpm db:push
```

5. **Poblar base de datos con escenarios de ejemplo**
```bash
node seed-scenarios.mjs
```

6. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
kaitel-training-platform/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ui/          # Componentes shadcn/ui
│   │   │   ├── TrainingDashboardLayout.tsx
│   │   │   └── SyncedAudioPlayer.tsx
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Scenarios.tsx
│   │   │   ├── SimulationSession.tsx
│   │   │   ├── SimulationDetail.tsx
│   │   │   ├── Simulations.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Gamification.tsx
│   │   │   └── Team.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilidades y configuración
│   │   └── App.tsx          # Componente raíz
│   ├── public/              # Assets estáticos
│   └── index.html
├── server/                   # Backend Node.js
│   ├── _core/               # Configuración del framework
│   ├── db.ts                # Helpers de base de datos
│   ├── routers.ts           # Definición de procedimientos tRPC
│   ├── evaluationService.ts # Servicio de evaluación con GPT
│   ├── voiceAnalysisService.ts # Análisis de voz y transcripción
│   ├── keywordDetectionService.ts # Detección de palabras clave
│   ├── openaiService.ts     # Cliente de OpenAI API
│   ├── storage.ts           # Helpers de S3
│   └── demoUser.ts          # Usuario demo (sin autenticación)
├── drizzle/                 # Esquema y migraciones de BD
│   ├── schema.ts            # Definición de tablas
│   └── [migrations]/        # Archivos SQL de migración
├── shared/                  # Código compartido
├── docs/                    # Documentación adicional
│   ├── ARCHITECTURE.md      # Arquitectura del sistema
│   ├── API.md               # Documentación de API
│   └── DEPLOYMENT.md        # Guía de despliegue
├── seed-scenarios.mjs       # Script para poblar escenarios
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎓 Uso de la Plataforma

### Para Agentes

1. **Explorar Escenarios**: Navega a la sección "Escenarios" para ver todos los casos de entrenamiento disponibles, organizados por categoría y complejidad.

2. **Iniciar Simulación**: Selecciona un escenario y haz clic en "Iniciar Simulación". La plataforma comenzará a grabar tu audio automáticamente.

3. **Interactuar con el Cliente**: Lee el perfil del cliente y responde a sus mensajes de forma natural. El sistema genera respuestas dinámicas basadas en tu interacción.

4. **Completar y Revisar**: Al finalizar, recibirás una evaluación automática con puntuaciones en cinco dimensiones, análisis de tu tono vocal, y recomendaciones personalizadas.

5. **Seguir tu Progreso**: Visita "Mi Progreso" para ver tu evolución, "Gamificación" para tus badges y nivel, y "Mis Simulaciones" para revisar el historial completo.

### Para Supervisores

1. **Vista de Equipo**: Accede a "Mi Equipo" para ver métricas consolidadas de todos los agentes bajo tu supervisión.

2. **Revisar Simulaciones**: Haz clic en cualquier simulación para ver la transcripción completa, escuchar el audio sincronizado, y revisar las métricas vocales.

3. **Agregar Marcadores**: Durante la reproducción, usa el botón "Agregar Marcador" para señalar momentos importantes con categorías y notas.

4. **Identificar Necesidades**: El dashboard destaca automáticamente agentes que necesitan atención según su desempeño.

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Ejecutar tests con coverage
pnpm test:coverage
```

Los tests cubren:
- Procedimientos tRPC (autenticación, escenarios, simulaciones)
- Lógica de evaluación y análisis de voz
- Integración con OpenAI API
- Helpers de base de datos

---

## 📦 Despliegue en Producción

### Opción 1: Manus Platform (Recomendado)

La plataforma está optimizada para despliegue en Manus con hosting integrado, custom domains, y SSL automático.

1. Crea un checkpoint desde el dashboard de Manus
2. Haz clic en "Publish" en el Management UI
3. Configura tu dominio personalizado en Settings → Domains

### Opción 2: Despliegue Manual

```bash
# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

Consulta `docs/DEPLOYMENT.md` para instrucciones detalladas de despliegue en AWS, Railway, Render, o Vercel.

---

## 🔐 Configuración de Seguridad

### Variables de Entorno Sensibles

**Nunca** commits archivos `.env` al repositorio. Usa el sistema de secrets de tu plataforma de hosting:

- **Manus**: Settings → Secrets en el Management UI
- **Vercel/Netlify**: Environment Variables en el dashboard
- **AWS**: AWS Secrets Manager o Parameter Store

### API Keys Requeridas

- `OPENAI_API_KEY`: Para evaluación con GPT-4o y transcripción con Whisper (opcional, usa LLM de Manus por defecto)
- `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`: Para almacenamiento de audio en S3
- `DATABASE_URL`: Conexión a MySQL/TiDB con SSL habilitado en producción

---

## 📈 Plan de Escalamiento

### Fase 1: MVP Actual (0-100 usuarios)
- Servidor único con base de datos MySQL
- Almacenamiento S3 para audio
- LLM de Manus o OpenAI API

### Fase 2: Escalamiento Horizontal (100-1000 usuarios)
- Load balancer con múltiples instancias del servidor
- Base de datos MySQL con réplicas de lectura
- CDN para assets estáticos
- Cache con Redis para sesiones y queries frecuentes

### Fase 3: Microservicios (1000+ usuarios)
- Separar servicios: API Gateway, Evaluation Service, Voice Analysis Service
- Base de datos distribuida (TiDB Cloud)
- Queue system (RabbitMQ/SQS) para procesamiento asíncrono de audio
- Kubernetes para orquestación de contenedores

### Consideraciones de Rendimiento
- Transcripción y análisis de voz se ejecutan de forma asíncrona
- Archivos de audio se comprimen antes de subir a S3
- Queries de base de datos optimizadas con índices en campos frecuentes
- Paginación en todas las listas (simulaciones, escenarios, equipos)

---

## 🤝 Contribución

Este es un proyecto privado de Kaitel. Para contribuir:

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y commits: `git commit -m "Agregar nueva funcionalidad"`
3. Push a tu rama: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request describiendo los cambios

### Estándares de Código
- TypeScript estricto en todo el proyecto
- Prettier para formateo automático: `pnpm format`
- Tests unitarios para nueva lógica de negocio
- Documentación inline para funciones complejas

---

## 📝 Licencia

Copyright © 2026 Kaitel Paraguay - Itti Digital

Este proyecto es propietario y confidencial. Todos los derechos reservados.

---

## 👥 Equipo

**Desarrollado por**: Manus AI  
**Cliente**: Kaitel Paraguay  
**Partner Tecnológico**: Itti Digital  
**Contacto**: alejo.roldan@gmail.com

---

## 🙏 Agradecimientos

- **Itti Digital** por la línea visual y branding
- **OpenAI** por GPT-4o y Whisper API
- **Manus Platform** por el hosting y herramientas de desarrollo
- **Equipo de Kaitel** por los requisitos y feedback continuo

---

## 📚 Documentación Adicional

- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Documentación de API](docs/API.md)
- [Guía de Despliegue](docs/DEPLOYMENT.md)
- [Changelog](CHANGELOG.md)

---

**¿Preguntas o problemas?** Abre un issue en este repositorio o contacta al equipo de desarrollo.
