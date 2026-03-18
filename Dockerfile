# 1. Imagen base
FROM node:20-slim

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiamos TODOS los archivos de tu proyecto (backend y frontend)
COPY . .

# 4. Magia del Frontend: Instalamos y "horneamos" React directo en la nube
RUN cd frontend && npm install --legacy-peer-deps && npm run build

# 5. Magia del Backend: Instalamos sus herramientas
RUN cd backend && npm install

# 6. Exponemos el puerto
EXPOSE 8080

# 7. Encendemos los motores
CMD ["node", "backend/server.js"]