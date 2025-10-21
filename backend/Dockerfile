# ============================
# Stage 1 — Build Frontend
# ============================
FROM node:18-alpine AS build-frontend

# Set working directory
WORKDIR /frontend

# Copy and install dependencies
COPY ../frontend/package*.json ./
RUN npm ci

# Copy source and build the frontend
COPY ../frontend .
RUN npm run build


# ============================
# Stage 2 — Build Backend
# ============================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001

# Copy backend package files first
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY . .

# Copy frontend build output from previous stage
COPY --from=build-frontend /frontend/build ./public

# Create data directory
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app && \
    chmod 755 /app/data

# Set volume for persistent data
VOLUME ["/app/data"]

# Use non-root user
USER nodejs

# Expose backend port
EXPOSE 5000

# Start app
CMD ["npm", "start"]
