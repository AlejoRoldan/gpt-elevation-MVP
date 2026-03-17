# Arquitectura del Sistema - Elevation

## Visión General

Elevation implementa una arquitectura limpia (Clean Architecture) orientada a features, diseñada para maximizar la seguridad, la privacidad y la escalabilidad. La plataforma se compone de un cliente web React y un servidor Node.js que actúa como "Bóveda Segura" o Proxy Inverso.

## Capas de la Aplicación

### 1. Frontend (Presentation Layer)
La capa de presentación está diseñada bajo los principios de Trauma-Informed Design y Minimalismo Japonés.

*   **Tecnología Principal**: React 19, Vite, Tailwind CSS v4.
*   **Gestión de Estado**: Minimizada. Se utiliza tRPC (React Query) para la sincronización de datos con el servidor, garantizando tipado estricto end-to-end.
*   **Componentes UI**: Basados en Shadcn UI, adaptados para ofrecer una experiencia visual calmada (fondo `FAFAF9`, sin bordes agresivos).
*   **Enrutamiento**: Wouter para un routing ligero y rápido.

### 2. Backend (Application & Domain Layers)
El servidor Node.js es el corazón de la plataforma y actúa como intermediario absoluto entre el usuario y los servicios externos (IA).

*   **Capa de Dominio (Domain)**:
    Contiene la lógica de negocio pura, sin dependencias de infraestructura o base de datos.
    *   `piiAnonymizer`: Motor de expresiones regulares y tokenización que enmascara datos personales (nombres, correos, teléfonos, empresas, IDs) antes de que el texto salga del servidor.
    *   `crisisDetector`: Analizador heurístico que evalúa el nivel de riesgo (alto, medio, nulo) de los mensajes del usuario para proveer recursos de ayuda inmediata.

*   **Capa de Aplicación (Features/Routers)**:
    Orquesta los casos de uso utilizando tRPC. Los routers están agrupados por feature (ej. `auth`, `chat`, `reflections`, `onboarding`).

### 3. Persistencia (Infrastructure Layer)
Gestiona el almacenamiento de datos y la integración con servicios externos.

*   **Base de Datos**: MySQL / TiDB.
*   **ORM**: Drizzle ORM, proporcionando esquemas tipados y migraciones seguras.
*   **Servicios Externos**:
    *   **IA**: Integración con Claude (Anthropic) a través del SDK interno.
    *   **Criptografía**: Módulos dedicados para hashing de contraseñas (`bcrypt`) y encriptación de datos sensibles en reposo (`AES-256-GCM`).

## Flujo de Datos (Data Flow)

1.  El usuario envía un mensaje desde el cliente React.
2.  El mensaje llega al servidor Node.js a través del router tRPC correspondiente.
3.  El servidor invoca el `crisisDetector` (Dominio) para evaluar riesgos.
4.  Si no hay crisis inminente, el servidor invoca el `piiAnonymizer` (Dominio) para enmascarar datos personales.
5.  El texto anonimizado se envía al motor de IA (Claude).
6.  La respuesta de la IA se recibe en el servidor.
7.  El servidor guarda el mensaje original encriptado en la base de datos y envía la respuesta de la IA al cliente.

## Estructura de Directorios

```text
platform/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── _core/          # Hooks y utilidades base (auth, hooks)
│   │   ├── components/     # Componentes UI reutilizables (Shadcn)
│   │   ├── pages/          # Vistas principales (Chat, Profile, Login)
│   │   └── lib/            # Configuración de cliente (tRPC)
├── server/                 # Backend Node.js
│   ├── _core/              # Configuración de servidor (Express, tRPC, SDK)
│   ├── domain/             # Reglas de negocio puras (PII, Crisis)
│   ├── features/           # Módulos agrupados por dominio (Auth, Chat)
│   ├── infrastructure/     # Servicios externos (Criptografía, LLM)
│   └── db.ts               # Acceso a base de datos
├── shared/                 # Tipos y constantes compartidas
└── drizzle/                # Esquema de base de datos y migraciones
```
