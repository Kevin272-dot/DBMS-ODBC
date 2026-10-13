#!/bin/sh
# Registers the Oracle Instant Client ODBC driver (installed via RPM) with
# unixODBC at container start, then runs the API server.
set -e

DRIVER_LIB=$(find /usr/lib/oracle -name "libsqora.so*" 2>/dev/null | head -n 1 || true)

if [ -n "$DRIVER_LIB" ]; then
  {
    echo "[Oracle ODBC Driver]"
    echo "Description=Oracle Instant Client ODBC driver"
    echo "Driver=$DRIVER_LIB"
    echo "Threading=2"
  } > /etc/odbcinst.ini
  echo "ODBC driver registered: $DRIVER_LIB"
else
  echo "WARNING: Oracle ODBC driver not found; the API will run in demo mode."
fi

exec "$@"
