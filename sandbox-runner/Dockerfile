FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 g++ openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /usr/sbin/nologin runner

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --chown=runner:runner server.js ./server.js

USER runner
EXPOSE 10000
CMD ["node", "server.js"]
