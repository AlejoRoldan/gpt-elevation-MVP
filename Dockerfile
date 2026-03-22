FROM node:20-slim

WORKDIR /app

COPY . .

# Instalar dependencias del backend
RUN cd backend && npm install

# Build del frontend
RUN cd frontend && npm install --legacy-peer-deps && npm run build

EXPOSE 8080

CMD ["node", "backend/server.js"]