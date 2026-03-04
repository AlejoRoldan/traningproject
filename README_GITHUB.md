# 🎯 Contact Center Training Platform - Paraguay SaaS

## 📱 Plataforma de Entrenamiento para Agentes de Contact Center

Una **solución empresarial completa** para entrenar y evaluar agentes de contact center en Paraguay, con simulaciones de IA, evaluación multi-dimensional y gamificación.

---

## 🚀 Características Principales

### 🎬 **Simulaciones en Tiempo Real**
- Audio en vivo bidireccional
- Cliente IA con 4 personalidades diferentes (Enfadado, Confundido, Amigable, Exigente)
- Transcripción automática (Whisper STT)
- Respuestas generadas por GPT-4o
- Análisis de audio en tiempo real (decibeles, frecuencia)

### 📊 **Evaluación Multi-Dimensional**
- 5 dimensiones de evaluación:
  - 😊 **Empatía** - Conexión emocional
  - 🗣️ **Claridad** - Comunicación efectiva
  - 📋 **Protocolo** - Adherencia a estándares
  - ✅ **Resolución** - Solución del problema
  - 💪 **Confianza** - Seguridad del agente
- Puntuación general 1-10
- Retroalimentación automática

### 🏆 **Gamificación**
- Tabla de clasificación de agentes
- Sistema de niveles (1-100)
- Puntos de experiencia (XP)
- Logros desbloqueables
- Medallas para top 3

### 📈 **Analytics & Reporting**
- Dashboard con estadísticas
- Progreso de desempeño
- Sesiones recientes
- Recomendaciones personalizadas
- Exportación de reportes

### 🔐 **Autenticación & Seguridad**
- JWT con tokens refresh
- Contraseñas hasheadas (bcrypt 12 rounds)
- Rol basado en acceso (RBAC)
- Rate limiting
- Validación de entrada

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: NestJS con Fastify adapter
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **Real-time**: WebSocket (Socket.io)
- **AI Services**:
  - OpenAI GPT-4o (Generación de respuestas)
  - Whisper (Speech-to-Text)
  - ElevenLabs/VAPI/OpenAI (Text-to-Speech)

### **Frontend**
- **Framework**: React 19 + Next.js 14+
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State**: Context API
- **Audio**: Web Audio API + MediaRecorder
- **HTTP**: Fetch API con JWT

### **DevOps**
- **Containerización**: Docker + Docker Compose
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **Admin Panel**: PgAdmin
- **Email Testing**: Mailhog

---

## 📁 Estructura del Proyecto

```
traningproject/
├── server/                          # Backend NestJS
│   ├── modules/                     # 6 módulos (Auth, Session, etc.)
│   ├── controllers/                 # 6 controladores REST
│   ├── services/                    # 20+ servicios especializados
│   ├── dtos/                        # 24 DTOs con validación
│   ├── gateways/                    # WebSocket gateway
│   ├── _core/                       # Guards, estrategias, pipes
│   ├── database/                    # Prisma service
│   ├── cache/                       # Redis service
│   └── main.ts                      # Entry point
│
├── client/src/                      # Frontend React
│   ├── hooks/                       # Custom hooks (useSession, useAudio, etc.)
│   ├── services/                    # API client
│   ├── contexts/                    # Auth context global
│   ├── components/                  # React components
│   │   ├── SessionUI/              # Training interface
│   │   ├── Dashboard/              # Main dashboard
│   │   └── Gamification/           # Leaderboard, achievements
│   ├── App.tsx
│   └── main.tsx
│
├── prisma/
│   └── schema.prisma                # Database schema (25+ tables)
│
├── docker-compose.yaml              # Complete stack orchestration
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest testing configuration
├── package.json                     # Dependencies
│
├── PHASE_1_SUMMARY.md              # Backend Infrastructure
├── PHASE_2_SUMMARY.md              # AI Services
├── PHASE_3_SUMMARY.md              # REST Controllers
├── PHASE_4_SUMMARY.md              # Modules & Testing
├── PHASE_5_SUMMARY.md              # Frontend React
├── ARCHITECTURE.md                  # System design
├── PROJECT_STRUCTURE.md             # Directory guide
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clonar Repositorio
```bash
git clone https://github.com/AlejoRoldan/traningproject.git
cd traningproject
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Iniciar Stack Completo
```bash
docker-compose up -d
```

Esto inicia:
- PostgreSQL 16 (Puerto 5432)
- Redis 7 (Puerto 6379)
- NestJS Backend (Puerto 3001)
- React Frontend (Puerto 3000)
- PgAdmin (Puerto 5050)
- Mailhog (Puerto 1025/8025)

### 5. Acceder a la Aplicación
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **PgAdmin**: http://localhost:5050
- **Mailhog**: http://localhost:8025

---

## 📚 Documentación

### Arquitectura
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Diseño del sistema
- [VISUAL_ARCHITECTURE.md](./VISUAL_ARCHITECTURE.md) - Diagramas ASCII

### Implementación
- [PHASE_1_SUMMARY.md](./PHASE_1_SUMMARY.md) - Backend Infrastructure
- [PHASE_2_SUMMARY.md](./PHASE_2_SUMMARY.md) - AI Services
- [PHASE_3_SUMMARY.md](./PHASE_3_SUMMARY.md) - REST Controllers
- [PHASE_4_SUMMARY.md](./PHASE_4_SUMMARY.md) - Modules & Testing
- [PHASE_5_SUMMARY.md](./PHASE_5_SUMMARY.md) - Frontend React

### Guías
- [GITHUB_PUSH_GUIDE.md](./GITHUB_PUSH_GUIDE.md) - Instrucciones para GitHub

---

## 🔌 API Endpoints

### Autenticación
```
POST   /auth/register              # Registrar usuario
POST   /auth/login                 # Login
POST   /auth/refresh               # Refresh token
POST   /auth/logout                # Logout
GET    /auth/me                    # Perfil actual
POST   /auth/password/change       # Cambiar contraseña
```

### Sesiones de Entrenamiento
```
POST   /sessions                   # Crear sesión
GET    /sessions                   # Listar sesiones
GET    /sessions/:id               # Detalles de sesión
PUT    /sessions/:id/complete      # Finalizar sesión
GET    /sessions/:id/transcript    # Transcript de sesión
```

### Escenarios
```
GET    /scenarios                  # Listar escenarios
GET    /scenarios/:id              # Detalles de escenario
POST   /scenarios                  # Crear escenario
PUT    /scenarios/:id              # Actualizar escenario
DELETE /scenarios/:id              # Eliminar escenario
```

### Analytics
```
GET    /analytics/dashboard        # Dashboard stats
GET    /analytics/leaderboard      # Tabla de clasificación
GET    /analytics/metrics          # Métricas detalladas
GET    /analytics/scenarios/performance # Performance por escenario
```

**Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para documentación completa de endpoints**

---

## 🧪 Testing

### Ejecutar Tests
```bash
npm test                           # Todos los tests
npm test -- --coverage            # Con coverage report
npm test -- --watch               # Watch mode
```

### Tests Incluidos
- ✅ Unit tests para servicios
- ✅ Integration tests para controllers
- ✅ Jest configuration con TypeScript
- ✅ 40+ test cases

---

## 🐳 Docker

### Ver Logs
```bash
docker-compose logs -f backend     # Backend NestJS
docker-compose logs -f db          # PostgreSQL
docker-compose logs -f redis       # Redis
docker-compose logs -f frontend    # React (si se ejecuta en docker)
```

### Acceder a Servicios
```bash
# PostgreSQL
docker-compose exec db psql -U postgres

# Redis
docker-compose exec redis redis-cli

# Backend shell
docker-compose exec backend sh
```

---

## 📊 Estadísticas del Proyecto

| Componente | Líneas | Archivos | Estado |
|-----------|--------|----------|--------|
| Backend Infrastructure | 2,500 | 20+ | ✅ |
| AI Services | 4,432 | 8 | ✅ |
| REST Controllers | 1,553 | 6 | ✅ |
| Modules & DTOs | 3,202 | 18 | ✅ |
| Frontend React | 2,100+ | 10 | ✅ |
| **TOTAL** | **13,787** | **100+** | **✅** |

---

## 🎓 Características Educacionales

Este proyecto demuestra:

### 🏗️ **Patrones de Diseño**
- Service Layer Pattern
- Factory Pattern
- Strategy Pattern
- Observer Pattern
- Adapter Pattern

### 🎯 **Principios SOLID**
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### 🔒 **Seguridad**
- JWT Authentication
- Bcrypt Password Hashing
- SQL Injection Prevention (Prisma)
- XSS Protection
- CORS Configuration
- Rate Limiting
- Input Validation

### 📈 **Scalability**
- Docker containerization
- Redis caching
- Database indexing
- Connection pooling
- Stateless API design

---

## 🚀 Deployment

### Producción
```bash
# Build backend
npm run build:server

# Build frontend
npm run build:client

# Usar docker-compose en producción
docker-compose -f docker-compose.yml up -d
```

### Variables de Entorno Producción
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@hostname:5432/dbname
REDIS_URL=redis://hostname:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
CORS_ORIGIN=https://yourdomain.com
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para detalles.

---

## 👨‍💻 Autor

**Alejo Roldan**
Contact Center Training Platform - Paraguay SaaS

---

## 📞 Soporte

Para reportar bugs, sugerencias o preguntas:
- 📧 Email: [tu-email@example.com]
- 💬 Issues: [GitHub Issues](https://github.com/AlejoRoldan/traningproject/issues)
- 📖 Discussions: [GitHub Discussions](https://github.com/AlejoRoldan/traningproject/discussions)

---

## 🎉 Agradecimientos

- OpenAI por GPT-4o y Whisper API
- NestJS por el excelente framework
- PostgreSQL community
- React community

---

**Última actualización**: Marzo 4, 2026
**Versión**: 1.0.0 (Completo - 5 Fases)
