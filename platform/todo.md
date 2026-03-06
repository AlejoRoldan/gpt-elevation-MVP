# Elevation Platform - TODO

## Fase 1: Base y Configuración
- [x] Inicializar proyecto web-db-user
- [x] Configurar tema visual contemplativo (azul profundo + dorado)
- [x] Esquema de base de datos ético (users, profiles, sessions, messages, reflections, consent_log, crisis_flags)
- [x] Migraciones aplicadas en base de datos

## Fase 2: Autenticación y Onboarding
- [x] Landing page contemplativa con CTA de acceso
- [x] Flujo de autenticación (OAuth + email/password via Manus Auth)
- [x] Onboarding con consentimiento granular en lenguaje claro (5 tipos de consentimiento)
- [x] Guardar versión y timestamp de consentimiento por usuario

## Fase 3: Chat de IA
- [x] Proxy seguro hacia LLM (API key solo en servidor)
- [x] Anonimización de datos sensibles antes de enviar al LLM
- [x] Sistema de sesiones con mood pre/post y metadatos
- [x] Protocolo de detección de crisis con recursos de ayuda
- [x] Historial de conversaciones guardado en BD
- [x] Indicador de typing animado (3 puntos)

## Fase 4: Reflexiones e Insights
- [x] Sistema de reflexiones guardadas con etiquetas temáticas
- [x] Panel de insights con visualizaciones de evolución emocional (recharts)
- [x] Gráfico de mood a lo largo del tiempo
- [x] Estadísticas de sesiones (frecuencia, duración, temas)

## Fase 5: Perfil y Gestión de Datos
- [x] Panel de perfil con preferencias de comunicación
- [x] Gestión granular de consentimientos (revocar/otorgar)
- [x] Exportación de datos (JSON)
- [x] Derecho al olvido (borrado permanente de cuenta y datos)
- [x] Historial de consentimientos auditables

## Fase 6: UX/UI y Calidad
- [x] Microinteracciones empáticas (animaciones suaves con framer-motion)
- [x] Diseño responsive (mobile-first)
- [x] Estados de carga serenos (typing indicator, loading states)
- [x] Accesibilidad (contraste WCAG AA)
- [x] Tests con vitest (13/13 pasando)

## Sistema de Recordatorios
- [x] Tabla `reminders` en esquema de BD (horario, días, mensaje, activo)
- [x] Procedimientos tRPC: crear, listar, actualizar, eliminar recordatorios
- [x] Página de gestión de recordatorios con selector de días y hora
- [x] Mensajes motivacionales predefinidos seleccionables
- [x] Enlace desde perfil hacia página de recordatorios
- [x] Tests de vitest para el módulo de recordatorios (12/12 pasando)

## Exportación de Reflexiones
- [x] Procedimiento tRPC `export.reflections` que devuelve datos completos del usuario
- [x] Generación de CSV con título, contenido, etiquetas y fecha (con BOM UTF-8 para Excel)
- [x] Generación de PDF con diseño contemplativo (portada, paleta azul+dorado, etiquetas)
- [x] Botón de exportación en la página de Reflexiones con selector de formato
- [x] Descarga directa en el navegador sin pasar por almacenamiento externo
- [x] Tests de vitest para el módulo de exportación (9/9 pasando)

## Marco Psicológico ACT del Acompañante
- [x] Diseñar system prompt completo basado en ACT (6 procesos hexaflex)
- [x] Definir voz, tono y patrones de respuesta del acompañante
- [x] Protocolo de crisis integrado en el system prompt
- [x] Límites éticos explícitos (qué hace y qué no hace el acompañante)
- [x] Implementar system prompt ACT en el servidor con contexto dinámico del usuario
- [x] Panel de configuración del acompañante (admin) con 4 tabs: Hexaflex, Voz, Ética, Crisis
- [x] Tests de validación del nuevo sistema (13/13 pasando)

## Pantalla de Cierre Ritual de Sesión
- [x] Procedimiento tRPC `sessionClose.close` que genera frase ACT con el LLM
- [x] Selector de mood post-sesión (1–5) con lunas y etiquetas emocionales
- [x] Visualización del cambio de mood (pre → post) con animación y delta
- [x] Frase de cierre generada por IA contextualizada en la sesión (con fallback)
- [x] CTA para guardar una reflexión desde el cierre (navega a /reflections con prefill)
- [x] Botón para iniciar nueva sesión o cerrar
- [x] Animación contemplativa de cierre (fade, partículas flotantes)
- [x] Tests de vitest para el procedimiento de cierre (9/9 pasando)
