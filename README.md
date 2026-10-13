# DisasterOS — DBMS-ODBC

### 🚀 Live demo: **https://dbms-odbc.vercel.app/**

**Sign in with:** `admin` / `admin123`

> A full-stack disaster management system: **React (Vite)** frontend hosted on
> Vercel, **Node.js + Express** API hosted on Render, and a real
> **Oracle Autonomous Database (26ai)** in Oracle Cloud, accessed through
> **ODBC** (Oracle Instant Client + unixODBC).

---

## Features

- **Command-center dashboard** — live situation summary from Oracle: disasters,
  incidents, resources, volunteers and relief requests, plus recent incidents
  and quick actions
- **Five CRUD modules** — disasters, incidents, resources, volunteers and
  relief requests with search, create, edit and delete
- **Database-backed login** — authenticates against the Oracle `USERS` table
- **Referential integrity** — foreign keys enforced (e.g. a disaster that has
  incidents cannot be deleted)
- **Connection-aware UI** — sidebar/topbar show `Oracle connected`, `Demo mode`
  or `API offline` in real time
- **Auto demo mode** — if Oracle is unreachable, the API falls back to an
  in-memory store so the app always runs (used for local development)
- **Responsive layout** — works from phones to wide desktop screens

## Architecture

```
Browser (React SPA)
   │
   ▼
Vercel  ──  /api/* proxied via vercel.json
   │
   ▼
Render (Docker)  ──  Express API + Oracle Instant Client ODBC driver
   │  TLS (tcps 1522)
   ▼
Oracle Cloud Autonomous Database 26ai (Always Free)
```

- **Frontend:** React 19, Vite 8, plain CSS (no UI framework)
- **Backend:** Node.js, Express 5, `odbc` npm package (unixODBC)
- **Database:** Oracle Autonomous Database (26ai), ODBC driver
  (Instant Client 23.26 `libsqora`)

## Project structure

```text
├── index.html               # Vite entry
├── vite.config.js           # Dev proxy /api -> http://localhost:5000
├── Dockerfile               # Deployable API image (Oracle Instant Client ODBC)
├── docker-entrypoint.sh     # Registers the ODBC driver at container start
├── render.yaml              # Render Blueprint (API hosting)
├── vercel.json              # Vercel frontend + /api proxy to Render
├── db/
│   ├── schema.sql           # Oracle tables, keys, constraints, indexes
│   └── seed.sql             # Sample data (users + all 5 modules)
├── src/
│   ├── App.jsx              # React application (single page)
│   ├── index.css            # Styles
│   └── server/
│       ├── server.js        # Express API (Oracle ODBC or demo mode)
│       └── demo-store.js    # In-memory fallback used when Oracle is down
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

Open http://localhost:5173. Vite proxies `/api` to `http://localhost:5000`,
so no CORS setup is needed in development.

### Backend modes

1. **Oracle mode** — used when the `odbc` package loads, the ODBC driver is
   registered and Oracle is reachable. See the environment variables below.
2. **Demo mode (automatic fallback)** — when Oracle cannot be reached, the API
   logs a loud warning and serves an in-memory store seeded with the same data
   as `db/seed.sql`. Changes reset on restart. Sample accounts:

   | Username   | Password      | Role     |
   | ---------- | ------------- | -------- |
   | `admin`    | `admin123`    | ADMIN    |
   | `operator` | `operator123` | OPERATOR |
   | `viewer`   | `viewer123`   | VIEWER   |

   Set `REQUIRE_ORACLE=1` to make the server **fail to start** instead of
   falling back to demo mode (recommended in production).

### Backend environment variables

| Variable                   | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `ORACLE_CONNECTION_STRING` | Full ODBC connection string, bypasses the DSN (see below)            |
| `ORACLE_DSN` / `ORACLE_UID` / `ORACLE_PASSWORD` | DSN-based connection (default: `OracleLab` / `25BCE1823` / `25bce1823`) |
| `TNS_ADMIN`                | Folder with `tnsnames.ora` / `sqlnet.ora` (wallet-based connections) |
| `REQUIRE_ORACLE=1`         | Fail instead of demo fallback                                        |
| `PORT`                     | API port (default `5000`; Render sets this automatically)            |

Example connection string (Oracle Cloud, mTLS **not required**):

```
Driver={Oracle ODBC Driver};Dbq=(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.<region>.oraclecloud.com))(connect_data=(service_name=<db>_low.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)));Uid=admin;Pwd=<ADMIN_PASSWORD>;
```

Check the mode at any time: `GET /api/health` →
`{"database":"oracle","demo":false}` or `{"database":"demo","demo":true}`.

## Database (Oracle)

Ready-to-run scripts:

- [`db/schema.sql`](db/schema.sql) — 6 tables with primary keys, foreign keys,
  `CHECK` constraints matching the UI options, and FK indexes
- [`db/seed.sql`](db/seed.sql) — sample data identical to the demo store
  (re-runnable: it clears the tables first)

Tables (columns ALL_CAPS):

| Table | Columns |
| ----- | ------- |
| `USERS` | `USER_ID`, `USERNAME`, `PASSWORD`, `FULL_NAME`, `ROLE` |
| `DISASTERS` | `DISASTER_ID`, `DISASTER_NAME`, `DISASTER_TYPE`, `LOCATION`, `SEVERITY`, `START_DATE`, `STATUS` |
| `INCIDENTS` | `INCIDENT_ID`, `DISASTER_ID` → DISASTERS, `DESCRIPTION`, `LOCATION`, `REPORTED_BY` → USERS, `INCIDENT_STATUS`, `REPORTED_DATE` |
| `RESOURCES` | `RESOURCE_ID`, `DISASTER_ID` → DISASTERS, `RESOURCE_NAME`, `RESOURCE_TYPE`, `QUANTITY`, `LOCATION`, `STATUS` |
| `VOLUNTEERS` | `VOLUNTEER_ID`, `NAME`, `PHONE`, `SKILL`, `LOCATION`, `AVAILABILITY` |
| `RELIEF_REQUESTS` | `REQUEST_ID`, `DISASTER_ID` → DISASTERS, `REQUESTED_BY` → USERS, `REQUEST_TYPE`, `DESCRIPTION`, `LOCATION`, `PRIORITY`, `STATUS`, `REQUEST_DATE` |

## API endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/` , `/api/health` | Health check + current database mode |
| `GET` | `/api/connect` | Database connectivity test |
| `POST` | `/api/login` | Login (`username`, `password`) |
| `GET` | `/api/:module` | List records (module = `disasters`, `incidents`, `resources`, `volunteers`, `relief-requests`) |
| `POST` | `/api/:module` | Create a record |
| `PUT` | `/api/:module/:id` | Update a record |
| `DELETE` | `/api/:module/:id` | Delete a record (blocked when referenced) |
| `GET` | `/api/dashboard/stats` | Aggregated dashboard counters |
| `GET` | `/api/dashboard/recent-incidents` | Latest 10 incidents |

## Deployment

### Where it is currently deployed

| Piece | Host | Config |
| ----- | ---- | ------ |
| Frontend | Vercel | auto-detected Vite build; `vercel.json` proxies `/api/*` to Render |
| API | Render (Docker, free plan) | `render.yaml` Blueprint; `REQUIRE_ORACLE=1` |
| Database | Oracle Cloud Always Free Autonomous DB (26ai) | tables from `db/schema.sql` + `db/seed.sql` |

### Redeploying the API (Render)

1. Render → New → **Blueprint** → select this repo (grant GitHub App access to
   the repo first if it is not listed)
2. Provide `ORACLE_CONNECTION_STRING` when prompted (it is a secret; not stored
   in `render.yaml`)
3. Push to `main` to auto-deploy. Free instances sleep after inactivity — the
   first request can take ~30–60 s

The Docker image downloads the Oracle Instant Client 23.26 (basiclite + ODBC)
from `download.oracle.com`, registers the driver at container start, and runs
the API with `LD_LIBRARY_PATH` pointing at the driver libraries.

### Redeploying the frontend (Vercel)

1. Vercel → Add New → Project → import this repo (grant GitHub access if the
   repo is not listed) → framework auto-detects Vite → Deploy
2. No environment variables are needed: `vercel.json` rewrites `/api/*` to the
   Render service. If your Render service has a different name, update the
   `destination` URL in `vercel.json`.

### Setting up the Oracle Cloud database from scratch

1. Create a free account at https://signup.oraclecloud.com
2. Create an **Always Free** Autonomous Database (Transaction Processing),
   note the ADMIN password
3. Open **Database Actions → SQL** and run `db/schema.sql`, then `db/seed.sql`
4. Network settings (Edit network access): ACL `0.0.0.0/0`, mutual TLS
   **Not required** (required for non-wallet clients such as cloud hosts)
5. Database connection → copy the `_low` connection string → build the
   `ORACLE_CONNECTION_STRING` shown above

## Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| Sidebar shows **Demo mode** | Oracle unreachable; check `/api/health`, Render logs, ACL/mTLS settings |
| `Can't open lib ... libsqora.so` | Driver dependencies not found — the container sets `LD_LIBRARY_PATH` for this; rebuild the image |
| `ORA-01017` | Wrong username/password in `ORACLE_CONNECTION_STRING` |
| `ORA-12545` / connection reset | Wrong service name, or ACL blocking the host / mTLS still required |
| First request very slow | Render free instance waking from sleep (~30–60 s) |
| Login page shows **API offline** | API not running or still cold-starting; the indicator refreshes every 30 s |

## License

College DBMS lab project (experiment 10 — ODBC). Use freely for learning.
