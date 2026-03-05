# Kaitel Training Platform - TODO

## Base & Infraestructura
- [x] Esquema de base de datos completo (usuarios, roles, escenarios, simulaciones, evaluaciones, gamificación, biblioteca)
- [x] Migraciones y seeds iniciales de escenarios y recursos
- [x] Extensión de roles: Gerente, Supervisor, Coordinador, Analista, Agente
- [x] Middleware de autorización por rol
- [x] Tema visual dark corporativo (verde primario)
- [x] KaitelLayout con sidebar de navegación y perfil de usuario

## Backend - Routers tRPC
- [x] Router de escenarios (listar, filtrar, buscar, byId)
- [x] Router de simulaciones (crear, continuar, finalizar)
- [x] Router de evaluación automática con LLM
- [x] Router de gamificación (XP, niveles, badges, racha)
- [x] Router de dashboard (métricas personales)
- [x] Router de ranking (leaderboard)
- [x] Router de biblioteca (recursos, filtros, vistas)
- [x] Router de desempeño personal (5 dimensiones, actividad, consejos IA)
- [x] Router de administración (admin.users)

## Frontend - Páginas
- [x] Dashboard principal con métricas, racha, progreso semanal, simulación recomendada
- [x] Catálogo de simulaciones con filtros por categoría y dificultad
- [x] Motor de simulación conversacional (chat con cliente IA)
- [x] Página de resultados de simulación con evaluación detallada
- [x] Página de desempeño personal (5 dimensiones, radar chart, actividad reciente, consejos IA)
- [x] Ranking competitivo de agentes
- [x] Biblioteca de buenas prácticas con filtros y búsqueda
- [x] Modo práctica (sin evaluación)

## Gamificación
- [x] Sistema de XP por simulación completada
- [x] Niveles: Junior (0-999), Intermedio (1000-2999), Senior (3000-5999), Experto (6000+)
- [x] Racha diaria (streak tracker)
- [x] Sistema de medallas/badges (Primera Simulación, Racha 3 días, Score Perfecto, Top 10)
- [x] Progreso visual hacia siguiente nivel

## IA e Integraciones
- [x] Motor de simulación conversacional (LLM como cliente virtual)
- [x] Evaluación automática en 5 dimensiones con LLM
- [x] Consejos personalizados de IA por categoría de desempeño
- [x] Simulación recomendada basada en debilidades del agente
- [x] Modo práctica sin evaluación

## Testing
- [x] Tests de auth.logout (cookie clearing)
- [x] Tests de auth.me (autenticado y no autenticado)
- [x] Tests de scenarios.list (acceso público)
- [x] Tests de simulations (protección de rutas)
- [x] Tests de admin (guard de roles)
- [x] Tests de library.list (acceso público)
- [x] 10/10 tests pasando

## Pendiente / Mejoras Futuras
- [ ] Panel de administración completo (gestión de usuarios y equipos)
- [ ] Grabación de audio con transcripción automática (Whisper)
- [ ] Notificaciones push para rachas y logros
- [ ] Exportación de reportes de desempeño (PDF)
- [ ] Modo supervisor: ver desempeño de agentes del equipo
