// In-memory fallback store used when the Oracle ODBC connection is
// unavailable. It mirrors the behaviour of the Oracle tables so the whole
// application can still be demonstrated (create, update, delete, login,
// dashboard statistics). Data is kept in memory only and resets on restart.

const SEED_USERS = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    name: "L Kevin Daniel",
    role: "ADMIN",
  },
  {
    id: 2,
    username: "operator",
    password: "operator123",
    name: "Kiran Rao",
    role: "OPERATOR",
  },
  {
    id: 3,
    username: "viewer",
    password: "viewer123",
    name: "Demo Viewer",
    role: "VIEWER",
  },
];

const SEED_DATA = {
  disasters: [
    {
      id: 4,
      disasterName: "Rajasthan Drought",
      disasterType: "Drought",
      location: "Barmer, Rajasthan",
      severity: "Low",
      startDate: "2024-03-02",
      status: "Closed",
    },
    {
      id: 3,
      disasterName: "Uttarakhand Landslide",
      disasterType: "Landslide",
      location: "Chamoli, Uttarakhand",
      severity: "Medium",
      startDate: "2025-08-11",
      status: "Resolved",
    },
    {
      id: 2,
      disasterName: "Cyclone Remal",
      disasterType: "Cyclone",
      location: "Sundarbans, West Bengal",
      severity: "Critical",
      startDate: "2025-05-26",
      status: "Ongoing",
    },
    {
      id: 1,
      disasterName: "Kerala Floods",
      disasterType: "Flood",
      location: "Wayanad, Kerala",
      severity: "High",
      startDate: "2024-07-15",
      status: "Active",
    },
  ],

  incidents: [
    {
      id: 5,
      disasterId: 2,
      description: "Power outage at cyclone shelter",
      location: "Namkhana, West Bengal",
      reportedBy: 3,
      incidentStatus: "Open",
      reportedDate: "2025-05-28",
    },
    {
      id: 4,
      disasterId: 3,
      description: "Road blocked by debris at NH-7",
      location: "Chamoli",
      reportedBy: 1,
      incidentStatus: "Resolved",
      reportedDate: "2025-08-12",
    },
    {
      id: 3,
      disasterId: 1,
      description: "Relief camp running low on drinking water",
      location: "Kalpetta, Wayanad",
      reportedBy: 2,
      incidentStatus: "Reported",
      reportedDate: "2024-08-01",
    },
    {
      id: 2,
      disasterId: 2,
      description: "Embankment breach flooding low-lying village",
      location: "Sagar Island, West Bengal",
      reportedBy: 2,
      incidentStatus: "In Progress",
      reportedDate: "2025-05-27",
    },
    {
      id: 1,
      disasterId: 1,
      description: "Bridge collapse near Meppadi, 12 people stranded",
      location: "Meppadi, Wayanad",
      reportedBy: 1,
      incidentStatus: "Open",
      reportedDate: "2024-07-30",
    },
  ],

  resources: [
    {
      id: 5,
      disasterId: 3,
      resourceName: "JCB excavator",
      resourceType: "Equipment",
      quantity: 2,
      location: "Chamoli",
      status: "In Stock",
    },
    {
      id: 4,
      disasterId: 2,
      resourceName: "First aid kits",
      resourceType: "Medical",
      quantity: 150,
      location: "Sagar Island",
      status: "Available",
    },
    {
      id: 3,
      disasterId: 2,
      resourceName: "Tents",
      resourceType: "Shelter",
      quantity: 300,
      location: "Kakdwip depot",
      status: "Allocated",
    },
    {
      id: 2,
      disasterId: 1,
      resourceName: "Drinking water (1 litre)",
      resourceType: "Water",
      quantity: 1200,
      location: "Kalpetta camp",
      status: "In Stock",
    },
    {
      id: 1,
      disasterId: 1,
      resourceName: "Rice bags (25 kg)",
      resourceType: "Food",
      quantity: 500,
      location: "Wayanad depot",
      status: "Available",
    },
  ],

  volunteers: [
    {
      id: 5,
      name: "Rohan Das",
      phone: "9874512345",
      skill: "Driving, transport",
      location: "Sundarbans, West Bengal",
      availability: "Available",
    },
    {
      id: 4,
      name: "Fatima Khan",
      phone: "9829012345",
      skill: "Medical assistant",
      location: "Barmer, Rajasthan",
      availability: "Unavailable",
    },
    {
      id: 3,
      name: "Vikram Singh",
      phone: "9412012345",
      skill: "Search and rescue",
      location: "Chamoli, Uttarakhand",
      availability: "Available",
    },
    {
      id: 2,
      name: "Priya Sharma",
      phone: "9831023456",
      skill: "Logistics",
      location: "Kolkata, West Bengal",
      availability: "On Duty",
    },
    {
      id: 1,
      name: "Arjun Nair",
      phone: "9847012345",
      skill: "First aid, rescue",
      location: "Wayanad, Kerala",
      availability: "Available",
    },
  ],

  "relief-requests": [
    {
      id: 5,
      disasterId: 2,
      requestedBy: 2,
      requestType: "Rescue",
      description: "Boat evacuation for 15 families",
      location: "Namkhana, West Bengal",
      priority: "Critical",
      status: "In Progress",
      requestDate: "2025-05-27",
    },
    {
      id: 4,
      disasterId: 3,
      requestedBy: 1,
      requestType: "Food",
      description: "Dry rations for 40 workers",
      location: "Chamoli",
      priority: "Medium",
      status: "Fulfilled",
      requestDate: "2025-08-13",
    },
    {
      id: 3,
      disasterId: 1,
      requestedBy: 3,
      requestType: "Medical",
      description: "Insulin and blood pressure medication",
      location: "Kalpetta camp",
      priority: "High",
      status: "Open",
      requestDate: "2024-08-02",
    },
    {
      id: 2,
      disasterId: 2,
      requestedBy: 2,
      requestType: "Shelter",
      description: "Tents and blankets for displaced families",
      location: "Sagar Island, West Bengal",
      priority: "High",
      status: "In Progress",
      requestDate: "2025-05-28",
    },
    {
      id: 1,
      disasterId: 1,
      requestedBy: 1,
      requestType: "Water",
      description: "Drinking water for 300 people",
      location: "Meppadi, Wayanad",
      priority: "Critical",
      status: "Pending",
      requestDate: "2024-08-01",
    },
  ],
};

const REFERENCING = {
  disasters: [
    ["incidents", "disasterId"],
    ["resources", "disasterId"],
    ["relief-requests", "disasterId"],
  ],
};

const LABELS = {
  disasters: "disaster",
  incidents: "incident",
  resources: "resource",
  volunteers: "volunteer",
  "relief-requests": "relief request",
};

function upper(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function createDemoStore() {
  // Structured clone keeps the seed constants untouched between runs.
  const data = Object.fromEntries(
    Object.entries(SEED_DATA).map(([key, rows]) => [
      key,
      rows.map((row) => ({ ...row })),
    ]),
  );

  const users = SEED_USERS.map((user) => ({ ...user }));

  function getRows(moduleName) {
    const rows = data[moduleName];
    if (!rows) {
      const error = new Error("Unknown module.");
      error.status = 404;
      throw error;
    }
    return rows;
  }

  function disasterNameFor(disasterId) {
    const disaster = data.disasters.find((row) => row.id === disasterId);
    return disaster ? disaster.disasterName : null;
  }

  function decorate(moduleName, rows) {
    if (moduleName !== "incidents" && moduleName !== "relief-requests") {
      return rows;
    }

    return rows.map((row) => ({
      ...row,
      disasterName: disasterNameFor(row.disasterId),
    }));
  }

  function nextId(rows) {
    return rows.reduce((max, row) => Math.max(max, toNumber(row.id)), 0) + 1;
  }

  function recordFromValues(config, id, values) {
    const record = { id };
    config.columns.forEach((column, index) => {
      const value = values[index];
      record[column.key] =
        value === null || value === undefined
          ? column.type === "number"
            ? null
            : value
          : value;
    });
    return record;
  }

  return {
    kind: "demo",

    login(username, password) {
      const user = users.find(
        (candidate) =>
          candidate.username === username && candidate.password === password,
      );

      return user
        ? {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          }
        : null;
    },

    list(moduleName) {
      const rows = [...getRows(moduleName)].sort(
        (a, b) => toNumber(b.id) - toNumber(a.id),
      );
      return decorate(moduleName, rows);
    },

    create(moduleName, config, values) {
      const rows = getRows(moduleName);
      const record = recordFromValues(config, nextId(rows), values);
      rows.push(record);
      return record;
    },

    update(moduleName, config, id, values) {
      const rows = getRows(moduleName);
      const index = rows.findIndex((row) => toNumber(row.id) === id);

      if (index === -1) {
        const error = new Error("Record not found.");
        error.status = 404;
        throw error;
      }

      const record = recordFromValues(config, id, values);
      rows[index] = record;
      return record;
    },

    remove(moduleName, id) {
      const rows = getRows(moduleName);
      const index = rows.findIndex((row) => toNumber(row.id) === id);

      if (index === -1) {
        const error = new Error("Record not found.");
        error.status = 404;
        throw error;
      }

      const references = REFERENCING[moduleName] || [];
      for (const [childModule, foreignKey] of references) {
        const dependent = data[childModule].find(
          (row) => toNumber(row[foreignKey]) === id,
        );

        if (dependent) {
          const error = new Error(
            `Cannot delete this ${LABELS[moduleName]}: one or more ${childModule.replace("-", " ")} still reference it.`,
          );
          error.status = 409;
          throw error;
        }
      }

      rows.splice(index, 1);
    },

    stats() {
      const count = (moduleName) => data[moduleName].length;

      const sumWhere = (moduleName, key, predicate) =>
        data[moduleName].reduce(
          (total, row) => total + (predicate(upper(row[key])) ? 1 : 0),
          0,
        );

      const quantityTotal = data.resources.reduce(
        (total, row) => total + toNumber(row.quantity),
        0,
      );

      return {
        disasters: {
          total: count("disasters"),
          active: sumWhere("disasters", "status", (value) =>
            ["ACTIVE", "ONGOING", "IN PROGRESS"].includes(value),
          ),
        },
        incidents: {
          total: count("incidents"),
          open: sumWhere("incidents", "incidentStatus", (value) =>
            ["OPEN", "PENDING", "REPORTED"].includes(value),
          ),
        },
        resources: {
          total: count("resources"),
          quantity: quantityTotal,
          available: sumWhere("resources", "status", (value) =>
            ["AVAILABLE", "IN STOCK", "READY"].includes(value),
          ),
        },
        volunteers: {
          total: count("volunteers"),
          available: sumWhere("volunteers", "availability", (value) =>
            ["AVAILABLE", "YES", "ACTIVE"].includes(value),
          ),
        },
        reliefRequests: {
          total: count("relief-requests"),
          pending: sumWhere("relief-requests", "status", (value) =>
            ["PENDING", "OPEN", "REQUESTED"].includes(value),
          ),
        },
      };
    },

    recentIncidents(limit = 10) {
      return decorate("incidents", [...data.incidents])
        .sort((a, b) => {
          const dateA = a.reportedDate || "";
          const dateB = b.reportedDate || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return toNumber(b.id) - toNumber(a.id);
        })
        .slice(0, limit)
        .map(({ id, description, location, incidentStatus, reportedDate, disasterName }) => ({
          id,
          description,
          location,
          incidentStatus,
          reportedDate,
          disasterName,
        }));
    },
  };
}
