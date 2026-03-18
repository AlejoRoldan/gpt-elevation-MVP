# 1. Imagen base
FROM node:20-slim

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiamos TODOS los archivos de tu proyecto
COPY . .

# 4. LA ORDEN SUPREMA: Tatuamos la URL en la memoria global de la máquina
ENV VITE_API_URL="https://elevation-ia-747531656650.us-central1.run.app"

# 5. Magia del Frontend: Instalamos y horneamos (Vite absorberá la variable global)
RUN cd frontend && npm install --legacy-peer-deps && npm run build

# 6. Magia del Backend: Instalamos sus herramientas
RUN cd backend && npm install

# 7. Exponemos el puerto
EXPOSE 8080

# 8. Encendemos los motores
CMD ["node", "backend/server.js"]