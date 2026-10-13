# DisasterOS API container with Oracle Instant Client ODBC (Debian Bookworm).
# The frontend is deployed separately (Vercel); this image only runs the API.
#
# Build:  docker build -t disasteros-api .
# Run:    docker run -p 5000:5000 \
#           -e REQUIRE_ORACLE=1 \
#           -e ORACLE_CONNECTION_STRING='Driver={Oracle ODBC Driver};Dbq=//host:1522/service;Uid=admin;Pwd=...;' \
#           disasteros-api

# ---------------------------------------------------------------------------
# Stage 1: install production dependencies and compile the native `odbc` module
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      unixodbc-dev \
      gcc \
      g++ \
      make \
      python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# ---------------------------------------------------------------------------
# Stage 2: runtime with unixODBC and Oracle Instant Client (ODBC driver)
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      unixodbc \
      unzip \
      curl \
      ca-certificates \
      libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Oracle Instant Client 23.26 (basiclite) + ODBC driver. Versioned URLs keep
# the ODBC driver and its libraries in sync; direct download needs no login.
RUN mkdir -p /opt/oracle \
    && curl -fSL -o /tmp/ic-basic.zip \
       https://download.oracle.com/otn_software/linux/instantclient/2326200/instantclient-basiclite-linux.x64-23.26.2.0.0.zip \
    && curl -fSL -o /tmp/ic-odbc.zip \
       https://download.oracle.com/otn_software/linux/instantclient/2326200/instantclient-odbc-linux.x64-23.26.2.0.0.zip \
    && unzip -oq /tmp/ic-basic.zip -d /opt/oracle \
    && unzip -oq /tmp/ic-odbc.zip -d /opt/oracle \
    && rm -f /tmp/ic-basic.zip /tmp/ic-odbc.zip \
    && echo "/opt/oracle/instantclient_*" > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src/server ./src/server
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server/server.js"]
