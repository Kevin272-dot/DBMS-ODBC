import express from "express";
import cors from "cors";

import { createDemoStore } from "./demo-store.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Set REQUIRE_ORACLE=1 to refuse starting the API when Oracle is unreachable.
const REQUIRE_ORACLE = process.env.REQUIRE_ORACLE === "1";

// Oracle network configuration (Windows lab machines).
process.env.TNS_ADMIN =
  process.env.TNS_ADMIN ||
  String.raw`C:\oracle\app\oracle\product\11.2.0\server\network\admin`;

// Full ODBC connection string (overrides the DSN-based connection below).
// Example for a Linux host with the Oracle Instant Client ODBC driver:
//   ORACLE_CONNECTION_STRING='Driver={Oracle ODBC Driver};Dbq=//db.example.com:1521/ORCL;Uid=user;Pwd=pass;'
const directConnectionString = process.env.ORACLE_CONNECTION_STRING;

// For this college lab, OracleLab is configured as a 64-bit User DSN.
// You can override these credentials with environment variables.
const connectionString =
  directConnectionString ||
  `DSN=${process.env.ORACLE_DSN || "OracleLab"};UID=${
    process.env.ORACLE_UID || "25BCE1823"
  };PWD=${process.env.ORACLE_PASSWORD || "25bce1823"};`;

app.use(cors({ origin: true }));
app.use(express.json());

let db = null;
let store = null;

const TABLES = {
  disasters: {
    table: "DISASTERS",
    id: "DISASTER_ID",
    columns: [
      { key: "disasterName", column: "DISASTER_NAME", type: "text" },
      { key: "disasterType", column: "DISASTER_TYPE", type: "text" },
      { key: "location", column: "LOCATION", type: "text" },
      { key: "severity", column: "SEVERITY", type: "text" },
      { key: "startDate", column: "START_DATE", type: "date" },
      { key: "status", column: "STATUS", type: "text" },
    ],
    select: `
      SELECT
        DISASTER_ID AS "id",
        DISASTER_NAME AS "disasterName",
        DISASTER_TYPE AS "disasterType",
        LOCATION AS "location",
        SEVERITY AS "severity",
        TO_CHAR(START_DATE, 'YYYY-MM-DD') AS "startDate",
        STATUS AS "status"
      FROM DISASTERS
    `,
  },

  incidents: {
    table: "INCIDENTS",
    id: "INCIDENT_ID",
    columns: [
      { key: "disasterId", column: "DISASTER_ID", type: "number" },
      { key: "description", column: "DESCRIPTION", type: "text" },
      { key: "location", column: "LOCATION", type: "text" },
      { key: "reportedBy", column: "REPORTED_BY", type: "number" },
      { key: "incidentStatus", column: "INCIDENT_STATUS", type: "text" },
      { key: "reportedDate", column: "REPORTED_DATE", type: "date" },
    ],
    select: `
      SELECT
        i.INCIDENT_ID AS "id",
        i.DISASTER_ID AS "disasterId",
        i.DESCRIPTION AS "description",
        i.LOCATION AS "location",
        i.REPORTED_BY AS "reportedBy",
        i.INCIDENT_STATUS AS "incidentStatus",
        TO_CHAR(i.REPORTED_DATE, 'YYYY-MM-DD') AS "reportedDate",
        d.DISASTER_NAME AS "disasterName"
      FROM INCIDENTS i
      LEFT JOIN DISASTERS d ON i.DISASTER_ID = d.DISASTER_ID
    `,
  },

  resources: {
    table: "RESOURCES",
    id: "RESOURCE_ID",
    columns: [
      { key: "disasterId", column: "DISASTER_ID", type: "number" },
      { key: "resourceName", column: "RESOURCE_NAME", type: "text" },
      { key: "resourceType", column: "RESOURCE_TYPE", type: "text" },
      { key: "quantity", column: "QUANTITY", type: "number" },
      { key: "location", column: "LOCATION", type: "text" },
      { key: "status", column: "STATUS", type: "text" },
    ],
    select: `
      SELECT
        RESOURCE_ID AS "id",
        DISASTER_ID AS "disasterId",
        RESOURCE_NAME AS "resourceName",
        RESOURCE_TYPE AS "resourceType",
        QUANTITY AS "quantity",
        LOCATION AS "location",
        STATUS AS "status"
      FROM RESOURCES
    `,
  },

  volunteers: {
    table: "VOLUNTEERS",
    id: "VOLUNTEER_ID",
    columns: [
      { key: "name", column: "NAME", type: "text" },
      { key: "phone", column: "PHONE", type: "text" },
      { key: "skill", column: "SKILL", type: "text" },
      { key: "location", column: "LOCATION", type: "text" },
      { key: "availability", column: "AVAILABILITY", type: "text" },
    ],
    select: `
      SELECT
        VOLUNTEER_ID AS "id",
        NAME AS "name",
        PHONE AS "phone",
        SKILL AS "skill",
        LOCATION AS "location",
        AVAILABILITY AS "availability"
      FROM VOLUNTEERS
    `,
  },

  "relief-requests": {
    table: "RELIEF_REQUESTS",
    id: "REQUEST_ID",
    columns: [
      { key: "disasterId", column: "DISASTER_ID", type: "number" },
      { key: "requestedBy", column: "REQUESTED_BY", type: "number" },
      { key: "requestType", column: "REQUEST_TYPE", type: "text" },
      { key: "description", column: "DESCRIPTION", type: "text" },
      { key: "location", column: "LOCATION", type: "text" },
      { key: "priority", column: "PRIORITY", type: "text" },
      { key: "status", column: "STATUS", type: "text" },
      { key: "requestDate", column: "REQUEST_DATE", type: "date" },
    ],
    select: `
      SELECT
        r.REQUEST_ID AS "id",
        r.DISASTER_ID AS "disasterId",
        r.REQUESTED_BY AS "requestedBy",
        r.REQUEST_TYPE AS "requestType",
        r.DESCRIPTION AS "description",
        r.LOCATION AS "location",
        r.PRIORITY AS "priority",
        r.STATUS AS "status",
        TO_CHAR(r.REQUEST_DATE, 'YYYY-MM-DD') AS "requestDate",
        d.DISASTER_NAME AS "disasterName"
      FROM RELIEF_REQUESTS r
      LEFT JOIN DISASTERS d ON r.DISASTER_ID = d.DISASTER_ID
    `,
  },
};

function parseValue(value, type) {
  if (value === "" || value === undefined) return null;
  if (value === null) return null;

  if (type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error("A numeric field contains an invalid value.");
    }
    return number;
  }

  if (type === "date") {
    const date = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Dates must use YYYY-MM-DD format.");
    }
    return date;
  }

  return String(value).trim();
}

function expressionFor(column) {
  return column.type === "date" ? "TO_DATE(?, 'YYYY-MM-DD')" : "?";
}

function valuesFromBody(config, body) {
  return config.columns.map((column) =>
    parseValue(body[column.key], column.type),
  );
}

function getConfig(moduleName) {
  const config = TABLES[moduleName];
  if (!config) {
    const error = new Error("Unknown module.");
    error.status = 404;
    throw error;
  }
  return config;
}

function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Invalid record ID.");
    error.status = 400;
    throw error;
  }
  return id;
}

async function connectOracle() {
  const { default: odbc } = await import("odbc");
  const connection = await odbc.connect(connectionString);
  const result = await connection.query(
    "SELECT SYSDATE AS CURRENT_TIME FROM DUAL",
  );

  return { connection, currentTime: result[0]?.CURRENT_TIME ?? null };
}

async function initDatabase() {
  try {
    const { connection, currentTime } = await connectOracle();
    db = connection;
    console.log("Connected to Oracle through ODBC.");
    console.log(
      `Target: ${
        directConnectionString
          ? "ORACLE_CONNECTION_STRING"
          : process.env.ORACLE_DSN || "OracleLab"
      }`,
    );
    console.log(`Oracle time: ${currentTime ?? "unknown"}`);
  } catch (error) {
    if (REQUIRE_ORACLE) {
      console.error("Failed to start backend:", error.message);
      console.error(
        "Check the OracleLab DSN, Oracle credentials, and TNS_ADMIN path, " +
          "or unset REQUIRE_ORACLE to run in demo mode.",
      );
      process.exit(1);
    }

    store = createDemoStore();
    console.warn("--------------------------------------------------------");
    console.warn("  Oracle is not reachable: " + error.message);
    console.warn("  Running in DEMO MODE with in-memory sample data.");
    console.warn("  Log in with admin / admin123 (see README).");
    console.warn("  Changes are NOT saved to Oracle and reset on restart.");
    console.warn("--------------------------------------------------------");
  }
}

// Health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Disaster Management System API is running.",
    database: store ? "demo (in-memory)" : "Oracle ODBC",
    demo: Boolean(store),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "online",
    database: store ? "demo" : "oracle",
    demo: Boolean(store),
    time: new Date().toISOString(),
  });
});

app.get("/api/connect", async (_req, res) => {
  try {
    if (store) {
      return res.json({
        success: true,
        message: "Demo mode: Oracle is not connected.",
        currentTime: new Date().toISOString(),
      });
    }

    const result = await db.query("SELECT SYSDATE AS CURRENT_TIME FROM DUAL");

    res.json({
      success: true,
      message: "Oracle database connection successful.",
      currentTime: result[0]?.CURRENT_TIME ?? result[0]?.current_time ?? null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection check failed.",
      error: error.message,
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Enter both username and password.",
      });
    }

    if (store) {
      const user = store.login(String(username).trim(), String(password));

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      return res.json({ success: true, user });
    }

    const rows = await db.query(
      `SELECT USER_ID, USERNAME, FULL_NAME, ROLE
       FROM USERS
       WHERE USERNAME = ? AND PASSWORD = ?`,
      [String(username).trim(), String(password)],
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const row = rows[0];

    res.json({
      success: true,
      user: {
        id: row.USER_ID ?? row.user_id,
        username: row.USERNAME ?? row.username,
        name: row.FULL_NAME ?? row.full_name ?? row.USERNAME ?? row.username,
        role: row.ROLE ?? row.role ?? "USER",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to log in.",
      error: error.message,
    });
  }
});

// Generic GET, POST, PUT and DELETE endpoints for all five modules.
app.get("/api/:module", async (req, res) => {
  try {
    const config = getConfig(req.params.module);

    if (store) {
      return res.json(store.list(req.params.module));
    }

    const rows = await db.query(`${config.select} ORDER BY ${config.id} DESC`);
    res.json(rows);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Could not fetch records.",
    });
  }
});

app.post("/api/:module", async (req, res) => {
  try {
    const config = getConfig(req.params.module);
    const values = valuesFromBody(config, req.body);

    if (store) {
      store.create(req.params.module, config, values);
      return res.status(201).json({
        success: true,
        message: "Record created successfully.",
      });
    }

    const columns = config.columns.map((column) => column.column).join(", ");
    const expressions = config.columns
      .map((column) => expressionFor(column))
      .join(", ");

    // MAX + 1 is sufficient for a simple lab/demo database.
    // Use sequences or identity columns for concurrent production inserts.
    const sql = `
      INSERT INTO ${config.table}
        (${config.id}, ${columns})
      VALUES
        ((SELECT NVL(MAX(${config.id}), 0) + 1 FROM ${config.table}),
         ${expressions})
    `;

    await db.query(sql, values);

    res.status(201).json({
      success: true,
      message: "Record created successfully.",
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(error.status || 400).json({
      message: error.message || "Could not create record.",
    });
  }
});

app.put("/api/:module/:id", async (req, res) => {
  try {
    const config = getConfig(req.params.module);
    const id = parseId(req.params.id);
    const values = valuesFromBody(config, req.body);

    if (store) {
      store.update(req.params.module, config, id, values);
      return res.json({
        success: true,
        message: "Record updated successfully.",
        affectedRows: 1,
      });
    }

    const assignments = config.columns
      .map((column) => `${column.column} = ${expressionFor(column)}`)
      .join(", ");

    const result = await db.query(
      `UPDATE ${config.table}
       SET ${assignments}
       WHERE ${config.id} = ?`,
      [...values, id],
    );

    res.json({
      success: true,
      message: "Record updated successfully.",
      affectedRows: result.count ?? result.rowCount ?? null,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(error.status || 400).json({
      message: error.message || "Could not update record.",
    });
  }
});

app.delete("/api/:module/:id", async (req, res) => {
  try {
    const config = getConfig(req.params.module);
    const id = parseId(req.params.id);

    if (store) {
      store.remove(req.params.module, id);
      return res.json({
        success: true,
        message: "Record deleted successfully.",
      });
    }

    await db.query(`DELETE FROM ${config.table} WHERE ${config.id} = ?`, [id]);

    res.json({
      success: true,
      message: "Record deleted successfully.",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(error.status || 500).json({
      message:
        error.message ||
        "Could not delete record. Check whether another record references it.",
    });
  }
});

// Dashboard statistics
app.get("/api/dashboard/stats", async (_req, res) => {
  try {
    if (store) {
      return res.json(store.stats());
    }

    const [disasters, incidents, resources, volunteers, requests] =
      await Promise.all([
        db.query(`
        SELECT
          COUNT(*) AS TOTAL,
          NVL(SUM(CASE
            WHEN UPPER(STATUS) IN ('ACTIVE', 'ONGOING', 'IN PROGRESS')
            THEN 1 ELSE 0 END), 0) AS ACTIVE
        FROM DISASTERS
      `),
        db.query(`
        SELECT
          COUNT(*) AS TOTAL,
          NVL(SUM(CASE
            WHEN UPPER(INCIDENT_STATUS) IN ('OPEN', 'PENDING', 'REPORTED')
            THEN 1 ELSE 0 END), 0) AS OPEN_COUNT
        FROM INCIDENTS
      `),
        db.query(`
        SELECT
          COUNT(*) AS TOTAL,
          NVL(SUM(QUANTITY), 0) AS QUANTITY,
          NVL(SUM(CASE
            WHEN UPPER(STATUS) IN ('AVAILABLE', 'IN STOCK', 'READY')
            THEN 1 ELSE 0 END), 0) AS AVAILABLE
        FROM RESOURCES
      `),
        db.query(`
        SELECT
          COUNT(*) AS TOTAL,
          NVL(SUM(CASE
            WHEN UPPER(AVAILABILITY) IN ('AVAILABLE', 'YES', 'ACTIVE')
            THEN 1 ELSE 0 END), 0) AS AVAILABLE
        FROM VOLUNTEERS
      `),
        db.query(`
        SELECT
          COUNT(*) AS TOTAL,
          NVL(SUM(CASE
            WHEN UPPER(STATUS) IN ('PENDING', 'OPEN', 'REQUESTED')
            THEN 1 ELSE 0 END), 0) AS PENDING
        FROM RELIEF_REQUESTS
      `),
      ]);

    const first = (rows) => rows[0] || {};
    const value = (row, key) => row[key] ?? row[key.toLowerCase()] ?? 0;

    res.json({
      disasters: {
        total: value(first(disasters), "TOTAL"),
        active: value(first(disasters), "ACTIVE"),
      },
      incidents: {
        total: value(first(incidents), "TOTAL"),
        open: value(first(incidents), "OPEN_COUNT"),
      },
      resources: {
        total: value(first(resources), "TOTAL"),
        quantity: value(first(resources), "QUANTITY"),
        available: value(first(resources), "AVAILABLE"),
      },
      volunteers: {
        total: value(first(volunteers), "TOTAL"),
        available: value(first(volunteers), "AVAILABLE"),
      },
      reliefRequests: {
        total: value(first(requests), "TOTAL"),
        pending: value(first(requests), "PENDING"),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      message:
        "Could not load dashboard statistics. Verify that all six database tables exist.",
      error: error.message,
    });
  }
});

// Most recent incidents (Oracle 11g-compatible pagination)
app.get("/api/dashboard/recent-incidents", async (_req, res) => {
  try {
    if (store) {
      return res.json(store.recentIncidents(10));
    }

    const rows = await db.query(`
      SELECT *
      FROM (
        SELECT
          i.INCIDENT_ID AS "id",
          i.DESCRIPTION AS "description",
          i.LOCATION AS "location",
          i.INCIDENT_STATUS AS "incidentStatus",
          TO_CHAR(i.REPORTED_DATE, 'YYYY-MM-DD') AS "reportedDate",
          d.DISASTER_NAME AS "disasterName"
        FROM INCIDENTS i
        LEFT JOIN DISASTERS d ON i.DISASTER_ID = d.DISASTER_ID
        ORDER BY i.REPORTED_DATE DESC NULLS LAST, i.INCIDENT_ID DESC
      )
      WHERE ROWNUM <= 10
    `);

    res.json(rows);
  } catch (error) {
    console.error("Recent incidents error:", error);
    res.status(500).json({
      message: "Could not load recent incidents.",
      error: error.message,
    });
  }
});

// JSON parsing and general error handling
app.use((error, _req, res, _next) => {
  console.error("Server error:", error);
  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
    if (store) {
      console.log("Mode: DEMO (in-memory). Start Oracle to use real data.");
    }
  });
}

startServer();
