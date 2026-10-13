# DisasterOS API container with Oracle Instant Client ODBC (Oracle Linux 9).
# Used for cloud deployment (Render/Railway/Fly/VPS). On a host without the
# Oracle driver installed, the API simply falls back to demo mode.
#
# Build:  docker build -t disasteros-api .
# Run:    docker run -p 5000:5000 \
#           -e REQUIRE_ORACLE=1 \
#           -e ORACLE_CONNECTION_STRING='Driver={Oracle ODBC Driver};Dbq=//host:1522/service;Uid=admin;Pwd=...;' \
#           disasteros-api

FROM container-registry.oracle.com/os/oraclelinux:9-slim

# unixODBC + Oracle Instant Client (ODBC driver), Node.js and native build
# toolchain (needed to compile the `odbc` npm package against unixODBC).
RUN dnf install -y oraclelinux-release-el9 \
    && dnf install -y \
        unixODBC \
        unixODBC-devel \
        oracle-instantclient-release-el9 \
        libaio \
        gcc-c++ \
        make \
        python3 \
    && dnf install -y \
        oracle-instantclient-basiclite \
        oracle-instantclient-odbc \
    && (dnf module enable -y nodejs:22 || dnf module enable -y nodejs:20 || true) \
    && dnf install -y nodejs npm \
    && dnf clean all \
    && rm -rf /var/cache/dnf

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server/server.js"]
