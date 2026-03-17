# Seguridad y Cumplimiento (OWASP) - Elevation

Elevation ha sido diseñado con la seguridad y la privacidad como pilares fundamentales (Privacy by Design). Este documento detalla cómo se han mitigado las vulnerabilidades más críticas según el estándar OWASP Top 10.

## Controles Implementados (OWASP Top 10)

### A01:2021 - Broken Access Control
*   **Implementación**: Todas las rutas de la API están protegidas mediante el middleware `protectedProcedure` de tRPC, que verifica la validez del token JWT en cada solicitud.
*   **Aislamiento de Datos**: Las consultas a la base de datos (Drizzle ORM) siempre filtran por `userId` extraído del token JWT verificado, impidiendo que un usuario acceda a datos de otro (IDOR mitigado).

### A02:2021 - Cryptographic Failures
*   **Contraseñas**: Las contraseñas de los usuarios manuales se hashean utilizando **bcrypt** con un factor de costo de 12. Nunca se almacenan ni se registran en texto plano.
*   **Protección contra Timing Attacks**: El endpoint de login ejecuta comparaciones de hash ficticias incluso cuando el usuario no existe, asegurando que el tiempo de respuesta sea constante.
*   **Datos en Reposo**: Los correos electrónicos se encriptan en la base de datos utilizando **AES-256-GCM** con un vector de inicialización (IV) aleatorio para cada registro, previniendo el análisis de patrones.
*   **Datos en Tránsito**: Se fuerza el uso de HTTPS mediante la cabecera `Strict-Transport-Security` (HSTS) configurada en Helmet.

### A03:2021 - Injection
*   **SQL Injection**: Mitigado por diseño al utilizar **Drizzle ORM**, que emplea consultas preparadas (parameterized queries) para todas las operaciones de base de datos.
*   **XSS / Command Injection**: Todas las entradas del usuario (inputs) se validan y sanean estrictamente utilizando **Zod** antes de ser procesadas por la lógica de negocio.

### A04:2021 - Insecure Design
*   **Proxy Seguro**: El cliente frontend nunca se conecta directamente a la API de IA (Claude). Todas las peticiones pasan por el servidor backend.
*   **Rate Limiting**: Se han implementado dos niveles de limitación de tasa (Rate Limiting) en Express:
    *   *Auth Limiter*: Máximo 10 intentos fallidos por IP cada 15 minutos en los endpoints de registro y login (protección contra fuerza bruta).
    *   *General Limiter*: Máximo 120 peticiones por minuto para la API en general (protección contra DoS).

### A05:2021 - Security Misconfiguration
*   **Cabeceras de Seguridad**: Se utiliza el middleware **Helmet** para configurar cabeceras HTTP seguras:
    *   `Content-Security-Policy` (CSP): Restringe las fuentes de scripts, estilos e imágenes.
    *   `X-Content-Type-Options: nosniff`: Previene el MIME-sniffing.
    *   `X-Frame-Options: DENY`: Previene ataques de Clickjacking.
    *   `X-Powered-By`: Oculto para no revelar información del stack tecnológico.
*   **Manejo de Errores**: Los errores internos del servidor no se exponen al cliente. tRPC está configurado para devolver mensajes genéricos, registrando los detalles solo en los logs del servidor.

### A07:2021 - Identification and Authentication Failures
*   **Gestión de Sesiones**: Las sesiones se gestionan mediante tokens **JWT** almacenados en **Cookies**.
*   **Seguridad de Cookies**: Las cookies de sesión están configuradas con los flags `HttpOnly` (inaccesibles vía JavaScript), `Secure` (solo se envían por HTTPS) y `SameSite=Strict` (protección contra CSRF).
*   **Anti-Enumeración de Usuarios**: Los endpoints de registro y login devuelven mensajes de error genéricos (ej. "Correo o contraseña incorrectos") independientemente de si el fallo fue por el correo o por la contraseña.

## Privacidad: Bóveda de Identidad Cero-Conocimiento

Para garantizar que los datos personales de los usuarios nunca lleguen a proveedores externos de IA, Elevation implementa un **Anonimizador de PII (Personally Identifiable Information)** en la capa de dominio.

Este módulo intercepta los mensajes antes de enviarlos a Claude y reemplaza los datos sensibles mediante expresiones regulares avanzadas:

1.  **Correos Electrónicos**: `juan@ejemplo.com` -> `[EMAIL_1]`
2.  **Teléfonos**: `+52 55 1234 5678` -> `[TELÉFONO_1]`
3.  **Nombres Propios**: `María Gómez` -> `[NOMBRE_1]` (Ignora palabras comunes a inicio de frase).
4.  **Empresas**: `trabajo en Microsoft` -> `trabajo en [EMPRESA_1]`
5.  **Identificaciones (IDs)**: `1020304050` -> `[ID_1]`

El servidor mantiene un mapa temporal de reemplazos en memoria solo durante la duración de la petición, permitiendo rehidratar la respuesta de la IA si es necesario, sin almacenar nunca los datos originales en texto plano en la base de datos de conversaciones.
