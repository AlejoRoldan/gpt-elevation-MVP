# Elevation - Plataforma de Acompañamiento Emocional con IA

## Visión del Producto
Elevation es un espacio seguro de apoyo en salud mental que combina frameworks psicológicos (como la Terapia de Aceptación y Compromiso) con inteligencia artificial ética. Su objetivo es brindar un acompañamiento empático y confidencial para la introspección.

## Arquitectura del Sistema Implementada (Fase 1: Conexión Base)
Hemos evolucionado del MVP estático a una arquitectura moderna de microservicios, priorizando la privacidad del usuario desde el día uno.

### 1. Frontend (La Interfaz de Usuario)
* **Tecnología:** React + Vite + Tailwind CSS v4.
* **Diseño Trauma-Informed:** Implementamos un diseño basado en el minimalismo japonés. Se eliminaron distracciones y bordes agresivos, utilizando una paleta de colores cálida (fondo `FAFAF9`) para reducir la carga cognitiva y generar calma.
* **Logros Técnicos:** Configuración de túneles de red (Network Bypass) para aislar la aplicación de bloqueos de firewalls o VPNs estrictas, garantizando una conexión ininterrumpida.

### 2. Backend (La Bóveda Segura)
* **Tecnología:** Node.js + Express.
* **Seguridad (Proxy Inverso):** El frontend nunca se conecta directamente a la IA. Todos los mensajes viajan primero a nuestra Bóveda Segura (Backend). Esto evita la exposición de credenciales y permite interceptar los datos.
* **Logros Técnicos:** API REST inicializada con políticas CORS configuradas. Comunicación bidireccional asíncrona establecida exitosamente entre el cliente (React) y el servidor (Node.js).

## Siguientes Fases (En Desarrollo)
- [ ] Construir el **Anonimizador PII** en Node.js para enmascarar nombres y datos sensibles antes de tocar la IA.
- [ ] Conectar la Bóveda Segura con el motor de IA.
- [ ] Implementar la Base de Datos y el esquema de "Autenticación de Cero-Conocimiento" (Bcrypt/AES-256).