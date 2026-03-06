# GPT Elevation — Plataforma de Bienestar Emocional con IA Ética

> *Un espacio para encontrarte contigo mismo.*

Elevation es una plataforma de acompañamiento emocional que combina la profundidad de la psicología humanista con la disponibilidad de la inteligencia artificial, siempre desde la ética y el respeto a la privacidad.

---

## Estructura del Repositorio

```
/
├── platform/              ← Código fuente de la plataforma web (v2)
│   ├── client/            ← Frontend React 19 + Tailwind 4 + Framer Motion
│   ├── server/            ← Backend Express + tRPC + LLM proxy seguro
│   ├── drizzle/           ← Esquema de base de datos (MySQL/TiDB)
│   └── shared/            ← Tipos y constantes compartidas
├── MVP_original.html      ← MVP inicial HTML/JS (referencia histórica)
├── Elevation2             ← Prototipo contemplativo en React (referencia de diseño)
├── Flujo2                 ← Diagrama de flujo del acompañante
├── TelegramBot            ← Bot de Telegram n8n (MVP anterior)
├── healtech               ← Dashboard de bienestar organizacional
├── Initial MVP deployment ← Documentación del despliegue inicial
└── private policy         ← Política de privacidad
```

---

## Stack Técnico (Plataforma v2)

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | Express 4, tRPC 11, TypeScript |
| Base de datos | MySQL/TiDB con Drizzle ORM |
| IA | LLM via proxy seguro (API key solo en servidor) |
| Autenticación | Manus OAuth |
| Testing | Vitest (56 tests, 0 errores TypeScript) |

---

## Funcionalidades Implementadas

### Núcleo
- **Autenticación segura** con OAuth y gestión de sesiones
- **Onboarding con consentimiento granular** en lenguaje claro (5 tipos de consentimiento)
- **Chat con acompañante de IA** basado en Terapia de Aceptación y Compromiso (ACT)
- **Proxy seguro hacia LLM** — la API key nunca llega al cliente
- **Anonimización de datos sensibles** antes de enviar al modelo

### Bienestar y Reflexión
- **Sistema de sesiones** con mood pre/post y metadatos
- **Pantalla de cierre ritual** con frase ACT generada por IA y visualización del cambio de mood
- **Reflexiones guardadas** con etiquetas temáticas
- **Insights personales** con gráficos de evolución emocional (Recharts)
- **Recordatorios de práctica** con horarios y mensajes personalizados

### Privacidad y Ética
- **Gestión granular de consentimientos** (otorgar/revocar en cualquier momento)
- **Exportación de datos** en JSON (derecho de acceso)
- **Exportación de reflexiones** en CSV y PDF con diseño contemplativo
- **Derecho al olvido** — borrado permanente de cuenta y todos los datos
- **Protocolo de detección de crisis** con recursos de ayuda por región
- **Log de consentimientos** auditable

### Administración
- **Panel de configuración del acompañante** (admin) con documentación del Hexaflex ACT

---

## Marco Psicológico — Hexaflex ACT

El acompañante opera sobre los **6 procesos del Hexaflex ACT**:

| Proceso | Descripción |
|---------|-------------|
| **Aceptación** | Hacer espacio para emociones difíciles sin luchar contra ellas |
| **Defusión cognitiva** | Observar pensamientos sin fusionarse con ellos |
| **Momento presente** | Atención plena al aquí y ahora |
| **Yo como contexto** | El observador que no es sus pensamientos |
| **Clarificación de valores** | Lo que realmente importa |
| **Acción comprometida** | Pasos concretos hacia una vida con sentido |

---

## Esquema de Base de Datos (Ético)

```
users              ← Datos de autenticación (PII mínima)
user_profiles      ← Preferencias y configuración
sessions           ← Metadatos de sesiones (mood pre/post, duración)
chat_messages      ← Mensajes de conversación
reflections        ← Reflexiones guardadas con etiquetas
consent_log        ← Historial auditable de consentimientos
crisis_flags       ← Detecciones de crisis (anonimizadas)
reminders          ← Recordatorios de práctica
```

---

## Principios de Diseño

- **Trauma-Informed Design**: sin urgencia, sin juicio, sin notificaciones intrusivas
- **Paleta contemplativa**: azul profundo (`#0a0f1e`) + dorado (`#f5c842`)
- **Tipografía**: Cormorant Garamond (display) + Inter (cuerpo)
- **Microinteracciones empáticas** con Framer Motion
- **Mobile-first** y accesibilidad WCAG AA

---

## Instalación Local

```bash
cd platform
pnpm install
cp .env.example .env   # Configurar variables de entorno
pnpm dev               # Servidor en http://localhost:3000
```

## Tests

```bash
cd platform
pnpm test              # 56 tests, 0 errores TypeScript
```

---

## Licencia

Proyecto privado — Alejandro Roldán © 2025
