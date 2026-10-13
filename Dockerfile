# Build stage
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-bookworm-slim
WORKDIR /app

# Oracle ODBC driver (Instant Client + unixODBC) — REQUIRED for real Oracle mode
RUN apt-get update && apt-get install -y --no-install-recommends \
    unixodbc \
    libaio1 \
    curl \
    && rm -rf /var/lib/apt/lists/*
# Optionally download Oracle Instant Client + ODBC here if not using a DSN:
#   ENV ORACLE_BASE /opt/oracle
#   (download instantclient-basic-linux.x64 and instantclient-odbc-linux.x64,
#    extract to /opt/oracle, then register the driver in /etc/odbcinst.ini)

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/eslint.config.js ./

# Provide the ODBC driver config; adjust driver name to match your install.
ENV ORACLE_DRIVER_NAME="Oracle ODBC Driver"

EXPOSE 5000
ENV PORT=5000
# Set these at deploy time:
#   REQUIRE_ORACLE=1
#   ORACLE_CONNECTION_STRING='Driver={Oracle ODBC Driver};Dbq=//db-host:1521/ORCL;Uid=user;Pwd=secret;'
CMD ["node", "src/server/server.js"]