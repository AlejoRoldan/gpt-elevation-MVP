# 1. Imagen base
FROM node:20-slim

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar archivos de dependencias
COPY backend/package*.json ./backend/

# 4. Instalar librerías
RUN cd backend && npm install

# 5. Copiar TODO el código (Ojo aquí: un solo espacio entre los puntos)
COPY . .

# 6. Exponer puerto 8080
EXPOSE 8080

# 7. Comando de arranque
CMD ["node", "backend/server.js"]