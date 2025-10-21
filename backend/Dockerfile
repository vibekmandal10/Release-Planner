# ============================
# Stage 1 — Build Frontend
# ============================
FROM node:18-alpine AS build-frontend

# Set working directory
WORKDIR /frontend

# Copy frontend package files and install deps
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and build
COPY frontend/ ./
RUN npm run build

# ============================
# Stage 2 — Build Backend
# ============================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001

# Copy backend package files and install deps
COPY backend/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy backend source code
COPY backend/ ./

# Copy frontend build from previous stage into backend
COPY --from=build-frontend /frontend/build ./build

# Create data directory
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app && \
    chmod 755 /app/data

# Set volume for persistence
VOLUME ["/app/data"]

# Switch to non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]

