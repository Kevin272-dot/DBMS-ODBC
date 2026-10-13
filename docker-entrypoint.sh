#!/bin/sh
# Registers the Oracle Instant Client ODBC driver (ZIP or RPM install) with
# unixODBC at container start, then runs the API server.
set -e

DRIVER_LIB=$(find /opt/oracle /usr/lib/oracle -name "libsqora.so*" 2>/dev/null | head -n 1 || true)

if [ -n "$DRIVER_LIB" ]; then
  DRIVER_DIR=$(dirname "$DRIVER_LIB")
  export LD_LIBRARY_PATH="$DRIVER_DIR:${LD_LIBRARY_PATH:-}"

  {
    echo "[Oracle ODBC Driver]"
    echo "Description=Oracle Instant Client ODBC driver"
    echo "Driver=$DRIVER_LIB"
    echo "Threading=2"
  } > /etc/odbcinst.ini

  echo "ODBC driver registered: $DRIVER_LIB"
  echo "LD_LIBRARY_PATH: $LD_LIBRARY_PATH"

  MISSING=$(ldd "$DRIVER_LIB" 2>/dev/null | grep "not found" || true)
  if [ -n "$MISSING" ]; then
    echo "WARNING: missing driver dependencies:"
    echo "$MISSING"
  fi
else
  echo "WARNING: Oracle ODBC driver not found; the API will run in demo mode."
fi

exec "$@"
