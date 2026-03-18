# 1. Imagen base
FROM node:20-slim

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiamos TODOS los archivos de tu proyecto (backend y frontend)
COPY . .

# 4. Magia del Frontend: Inyectamos la variable directo en la orden de build
RUN cd frontend && npm install --legacy-peer-deps && VITE_API_URL="https://elevation-ia-747531656650.us-central1.run.app" npm run build

# 5. Magia del Backend: Instalamos sus herramientas
RUN cd backend && npm install

# 6. Exponemos el puerto
EXPOSE 8080

# 7. Encendemos los motores
CMD ["node", "backend/server.js"]