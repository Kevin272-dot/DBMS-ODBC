# DBMS-ODBC — DisasterOS

A disaster management web application built with **React (Vite)** on the frontend
and a **Node.js + Express** API backed by **Oracle 11g through ODBC** on the
backend. It covers five modules: disasters, incidents, resources, volunteers
and relief requests, plus a command-center dashboard with live statistics.

## Features

- Login against the `USERS` table (Oracle) or built-in demo accounts
- Dashboard with situation summary metrics and recent incidents
- Full CRUD for all five modules with search, edit and delete
- Responsive sidebar layout for desktop and mobile
- Auto demo mode: if Oracle is unavailable, the API falls back to an in-memory
  store seeded with sample data so the app can always run

## Project structure

```
├── index.html               # Vite entry
├── vite.config.js           # Dev proxy /api -> http://localhost:5000
├── Dockerfile               # Deployable API image (Oracle Instant Client ODBC)
├── render.yaml              # Render Blueprint (API hosting)
├── vercel.json              # Vercel frontend + /api proxy to Render
├── db/
│   ├── schema.sql           # Oracle tables, keys, constraints
│   └── seed.sql             # Sample data
├── src/
│   ├── App.jsx              # React application (single page, no router)
│   ├── index.css            # Styles
│   └── server/
│       ├── server.js        # Express API (Oracle ODBC or demo mode)
│       └── demo-store.js    # In-memory fallback store with sample data
```

## Running locally

Requirements: Node 18+ and npm.

```bash
npm install

# Terminal 1 — backend API (port 5000)
npm run server

# Terminal 2 — frontend dev server (port 5173)
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` requests to
`http://localhost:5000`, so no CORS setup is needed in development.

### Backend modes

1. **Oracle mode (default)** — the API tries to connect to the `OracleLab`
   ODBC DSN using the credentials below. Override with environment variables:

   | Variable         | Default      |
   | ---------------- | ------------ |
   | `ORACLE_DSN`     | `OracleLab`  |
   | `ORACLE_UID`     | `25BCE1823`  |
   | `ORACLE_PASSWORD`| `25bce1823`  |
   | `TNS_ADMIN`      | Windows Oracle 11g network admin path |

   Set `REQUIRE_ORACLE=1` if the server must fail (instead of falling back)
   when Oracle cannot be reached.

2. **Demo mode (automatic fallback)** — when the ODBC driver is missing or the
   connection fails, the server logs a warning and starts with an in-memory
   store seeded with sample data. Everything works (login, CRUD, dashboard)
   but changes are lost on restart. Sample accounts:

   | Username   | Password      | Role     |
   | ---------- | ------------- | -------- |
   | `admin`    | `admin123`    | ADMIN    |
   | `operator` | `operator123` | OPERATOR |
   | `viewer`   | `viewer123`   | VIEWER   |

## Database schema (Oracle)

Ready-to-run scripts: [`db/schema.sql`](db/schema.sql) (tables, keys, checks)
and [`db/seed.sql`](db/seed.sql) (sample data identical to the demo store).
They run on 11g, 19c and 23ai. The API expects these tables (ALL_CAPS):

- `USERS(USER_ID, USERNAME, PASSWORD, FULL_NAME, ROLE)`
- `DISASTERS(DISASTER_ID, DISASTER_NAME, DISASTER_TYPE, LOCATION, SEVERITY, START_DATE, STATUS)`
- `INCIDENTS(INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE)`
- `RESOURCES(RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS)`
- `VOLUNTEERS(VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY)`
- `RELIEF_REQUESTS(REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE)`

> The `odbc` package is an optional dependency: `npm install` succeeds even on
> machines without unixODBC/Oracle drivers, and the API then runs in demo mode.

## Deployment

- **Frontend** — a static build (`npm run build`) can be hosted on Vercel,
  Netlify or GitHub Pages. Point it at a hosted API with
  `VITE_API_URL=https://your-api.example.com/api` (the API enables CORS).
- **Backend** — the Express API can be deployed to Render, Railway or Fly.io.
  It connects to Oracle through the `odbc` package, which needs the **Oracle
  ODBC driver** (Instant Client + unixODBC) installed on the host. Without
  that, the API falls back to demo mode. See `Dockerfile` for a container
  that installs the required system packages.

### Running with a real Oracle database (outside demo mode)

The server uses Oracle instead of demo data when all three of these are true:

1. The `odbc` npm package can be loaded (installed as an optional dependency —
   if it failed to build, the host is missing the Oracle client/driver).
2. The Oracle ODBC driver is registered (a DSN like `OracleLab` on Windows, or
   a driver entry in `/etc/odbcinst.ini` on Linux).
3. Oracle itself is reachable over the network from the host.

Deploy-time environment variables:

| Variable                   | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `ORACLE_CONNECTION_STRING` | Full ODBC connection string, bypasses DSN. Example: `Driver={Oracle ODBC Driver};Dbq=//db-host:1521/ORCL;Uid=user;Pwd=pass;` |
| `ORACLE_DSN` / `UID` / `PWD` | DSN-based connection (default `OracleLab` / `25BCE1823` / `25bce1823`) |
| `TNS_ADMIN`                | Directory with `tnsnames.ora` / `sqlnet.ora` (for wallet-based connects) |
| `REQUIRE_ORACLE=1`         | **Fail to start** instead of falling back to demo mode (recommended in production so a silent demo never hides a broken DB) |
| `PORT`                     | API port (default 5000)                                            |

Check it really connected via `GET /api/health` → `{"database":"oracle",...}`.

### Setting up Oracle Cloud (Always Free Autonomous DB)

1. **Create your account** at https://signup.oraclecloud.com (free tier, never
   billed). You need a card for identity verification only; Always Free
   services cost nothing.
2. **Create an Autonomous Database**: Console → Oracle Database →
   Autonomous Database → Create. Choose **Always Free**, workload type
   **Transaction Processing**, database version 23ai (or 19c), and generate a
   strong **ADMIN password** (keep it). Wait for "Available".
3. **Run the migrations**: on the DB page → Database Actions → SQL, then run
   [`db/schema.sql`](db/schema.sql) followed by [`db/seed.sql`](db/seed.sql).
   Alternatively use SQL Developer / SQLcl connected as ADMIN.
4. **Download the connection wallet** (DB banner → Database connection →
   Download wallet, set a wallet password). Every environment that connects
   needs it; on the server set `TNS_ADMIN` to the folder you extract it into.
5. **Point the API at it**:

   ```bash
   npm install odbc  # needs unixODBC + Oracle Instant Client on the host
   export TNS_ADMIN=/opt/oracle/wallet
   export ORACLE_CONNECTION_STRING='Driver={Oracle ODBC Driver};Dbq=YOURDB_low;Uid=admin;Pwd=YOUR_ADMIN_PASSWORD;'
   export REQUIRE_ORACLE=1
   npm run server
   ```

   `YOURDB_low` is the service alias from the wallet's `tnsnames.ora`
   (e.g. `disasteros_low`). Verify with `curl http://localhost:5000/api/health`
   → `"database":"oracle"`. If the ODBC driver cannot load the wallet's
   `tnsnames.ora`, connect without the wallet by disabling mutual TLS for the
   DB and using easy-connect syntax:
   `Dbq=//adb.yourregion.oraclecloud.com:1522/YOURDB_low`.

### Deploying to Render (API) + Vercel (frontend)

The repository ships with `Dockerfile` (Oracle Instant Client ODBC registered
at container start), `render.yaml` and `vercel.json`, so both deploys are
dashboard clicks:

1. **Render** — Dashboard → New → **Blueprint** → select this GitHub repo.
   Render reads `render.yaml` and asks for `ORACLE_CONNECTION_STRING`; paste:

   ```
   Driver={Oracle ODBC Driver};Dbq=//adb.<region>.oraclecloud.com:1522/<dbname>_low.adb.oraclecloud.com;Uid=admin;Pwd=<ADMIN_PASSWORD>;
   ```

   Deploy. Check `https://<service>.onrender.com/api/health` →
   `{"database":"oracle","demo":false}`. If the service name is not
   `disasteros-api`, either rename it or update the URL in `vercel.json`.
   (Free instances sleep after inactivity — the first request can take ~1 min.)
2. **Vercel** — Dashboard → Add New → Project → import this repo → framework
   auto-detects Vite → Deploy. `vercel.json` proxies `/api/*` to the Render
   API, so no environment variables are needed. If you prefer a direct API
   URL instead of the proxy, set `VITE_API_URL=https://<service>.onrender.com/api`
   (the API sends permissive CORS headers) and delete the rewrite.
3. Open the Vercel URL, sign in (`admin` / `admin123`), and confirm the sidebar
   says **Oracle connected**.

### Where to host Oracle (free / cheap)

If the college lab Oracle 11g is not reachable from the internet, host Oracle
yourself:

1. **Oracle Cloud Always Free Autonomous DB** (recommended, $0, unlimited
   time) — sign up at oracle.com/cloud/free. You get 2 Always Free Autonomous
   Database instances (20 GB storage each, 30 sessions). It runs Oracle 19c/
   23ai/26ai, is publicly reachable (TLS), and accepts ODBC via the Instant
   Client ODBC driver with the connection wallet. Create the six tables from
   the schema section above, then use `ORACLE_CONNECTION_STRING` +
   `TNS_ADMIN`.
2. **Oracle AI Database Free on any VPS** — Oracle AI Database Free (formerly
   XE) is free to install on Ubuntu (Hetzner, Contabo, DigitalOcean VPS from
   ~€4/month). Full control, closest to your 11g lab setup; requires Linux
   sysadmin work (install DB, register ODBC driver, open port 1521).
3. **Tunnel from the lab PC** — if you must keep using the lab Oracle 11g
   machine, expose port 1521 with a Cloudflare Tunnel or ngrok. Zero cloud
   cost and no schema migration, but the PC must stay on and you must secure
   the tunnel (IP allow-list, strong credentials). Only for demos/presentations.

> Your app's SQL is Oracle 11g-flavoured (TO_DATE, NVL, ROWNUM pagination)
> and runs unmodified on 19c/23ai/26ai and Oracle AI Database Free.