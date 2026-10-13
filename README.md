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

The API expects these tables (column names in ALL_CAPS):

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
- **Backend** — the Express API can be deployed to Render, Railway or Fly.io,
  but Oracle over ODBC only works on a machine with the Oracle client/DSN
  (typically your college lab Windows PC). On cloud hosts it will run in
  **demo mode** automatically unless you configure a reachable Oracle
  database and the ODBC driver.