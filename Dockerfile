# Builder stage
FROM node:22-bookworm-slim AS builder

# Set working directory
WORKDIR /app

# Install curl and unzip (required for Bun installation, as they are not included in the slim image)
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Install Bun (baseline version to avoid CPU instruction set issues like AVX2 requirements)
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:$PATH"

# Copy the entire source code
COPY . .

# Install all dependencies using npm
RUN npm install

# Run the build script (handles Turbo and Bun-dependent builds like in @hyperscape/hyperfy)
RUN npm run build

# Production stage
FROM node:22-bookworm-slim

# Set working directory
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app /app

# Expose the default port (assuming 3000 based on typical Node/Three.js/Hyperfy apps; adjust if your app uses a different port)
EXPOSE 3000

# Run the dev command (as per your repo's start-cmd; change to 'start' if you have a production script)
CMD ["npm", "run", "dev"]
