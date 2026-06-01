# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Backend dependencies ----
FROM node:22-alpine AS backend-deps
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# ---- Production stage ----
FROM nginx:stable-alpine AS production
WORKDIR /app

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Frontend static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Backend
COPY --from=backend-deps /app/backend /app/backend
COPY backend/ /app/backend/

# Ensure node_modules from deps stage takes precedence
COPY --from=backend-deps /app/backend/node_modules /app/backend/node_modules

EXPOSE 80 443

# Start nginx and the backend API server
CMD sh -c "nginx && node /app/backend/server.js"
