FROM rust:1.85-bookworm AS builder

WORKDIR /src

# 1) copy manifests first for better layer caching
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY web-server/Cargo.toml web-server/Cargo.lock ./web-server/
COPY web-server/src ./web-server/src

# 2) build deps (will be cached when code changes but deps don't)
RUN cargo build --release --locked --manifest-path web-server/Cargo.toml

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /src/web-server/target/release/altsendme-web-server /app/altsendme-web-server
COPY web-server/static /app/static

ENV BIND_ADDR=0.0.0.0:8080
ENV STATIC_DIR=/app/static
ENV DATA_DIR=/app/data

EXPOSE 8080

VOLUME ["/app/data"]

CMD ["/app/altsendme-web-server"]
