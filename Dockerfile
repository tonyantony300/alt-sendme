# Multi-stage Dockerfile for AltSendme Tauri Application
# Stage 1: Builder - Build the Tauri application
FROM rust:latest AS builder

# Install system dependencies required for Tauri Linux builds
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    curl \
    wget \
    file \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY web-app/package*.json ./web-app/
COPY src-tauri/package.json ./src-tauri/

# Install frontend dependencies
RUN cd web-app && npm ci

# Copy the entire project
COPY . .

# Build the frontend
RUN cd web-app && npm run build

# Install Tauri CLI and build the application (creates bundles for installers)
WORKDIR /app/src-tauri
RUN cargo install tauri-cli --locked
RUN cargo tauri build --bundles deb,appimage

# Stage 2: Runtime - Create a minimal runtime image
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies for running Tauri GUI apps
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-0 \
    libappindicator3-1 \
    librsvg2-2 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy the built application from builder stage
COPY --from=builder /app/src-tauri/target/release/alt-sendme /app/alt-sendme
# Note: bundle directory is only created by `cargo tauri build`, not `cargo build`
# For runtime image, we only need the binary

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV DISPLAY=:0
ENV RUST_LOG=info

# The application binary
CMD ["/app/alt-sendme"]

