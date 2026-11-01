
FROM debian:bookworm-slim

# Install Java, Python and C++ compilers
RUN apt-get update && apt-get install -y --no-install-recommends \
   openjdk-17-jdk-headless \
    python3 \
    g++ \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root execution user
RUN useradd --create-home --uid 10001 runner \
    && mkdir -p /workspace \
    && chown runner:runner /workspace

WORKDIR /workspace

USER runner

CMD ["sh"]
