-- ============================================================================
-- DisasterOS schema for Oracle Cloud Autonomous Database (19c / 23ai / 26ai)
-- Run this first on a fresh schema, then run seed.sql.
-- Recommend running via SQL Developer (Web) / Database Actions / SQLcl.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS (application login accounts used by /api/login)
-- ----------------------------------------------------------------------------
CREATE TABLE USERS (
  USER_ID    NUMBER(10)      NOT NULL,
  USERNAME   VARCHAR2(60)    NOT NULL,
  PASSWORD   VARCHAR2(120)   NOT NULL,
  FULL_NAME  VARCHAR2(255)   NOT NULL,
  ROLE       VARCHAR2(30)    DEFAULT 'USER' NOT NULL,
  CONSTRAINT PK_USERS PRIMARY KEY (USER_ID),
  CONSTRAINT UQ_USERS_USERNAME UNIQUE (USERNAME),
  CONSTRAINT CK_USERS_ROLE CHECK (ROLE IN ('ADMIN', 'OPERATOR', 'VIEWER', 'USER'))
);

-- ----------------------------------------------------------------------------
-- DISASTERS
-- ----------------------------------------------------------------------------
CREATE TABLE DISASTERS (
  DISASTER_ID    NUMBER(10)     NOT NULL,
  DISASTER_NAME  VARCHAR2(255)  NOT NULL,
  DISASTER_TYPE  VARCHAR2(40)   NOT NULL,
  LOCATION       VARCHAR2(255),
  SEVERITY       VARCHAR2(20)   DEFAULT 'Medium',
  START_DATE     DATE,
  STATUS         VARCHAR2(20)   DEFAULT 'Active',
  CONSTRAINT PK_DISASTERS PRIMARY KEY (DISASTER_ID),
  CONSTRAINT CK_DISASTERS_TYPE CHECK (DISASTER_TYPE IN
    ('Flood', 'Earthquake', 'Cyclone', 'Fire', 'Landslide', 'Drought', 'Other')),
  CONSTRAINT CK_DISASTERS_SEVERITY CHECK (SEVERITY IN
    ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT CK_DISASTERS_STATUS CHECK (STATUS IN
    ('Active', 'Ongoing', 'Resolved', 'Closed'))
);

-- ----------------------------------------------------------------------------
-- INCIDENTS
-- ----------------------------------------------------------------------------
CREATE TABLE INCIDENTS (
  INCIDENT_ID     NUMBER(10)     NOT NULL,
  DISASTER_ID     NUMBER(10),
  DESCRIPTION     VARCHAR2(1000) NOT NULL,
  LOCATION        VARCHAR2(255)  NOT NULL,
  REPORTED_BY     NUMBER(10),
  INCIDENT_STATUS VARCHAR2(30)   DEFAULT 'Reported',
  REPORTED_DATE   DATE,
  CONSTRAINT PK_INCIDENTS PRIMARY KEY (INCIDENT_ID),
  CONSTRAINT FK_INCIDENTS_DISASTER FOREIGN KEY (DISASTER_ID)
    REFERENCES DISASTERS (DISASTER_ID),
  CONSTRAINT FK_INCIDENTS_REPORTER FOREIGN KEY (REPORTED_BY)
    REFERENCES USERS (USER_ID),
  CONSTRAINT CK_INCIDENTS_STATUS CHECK (INCIDENT_STATUS IN
    ('Open', 'Reported', 'In Progress', 'Resolved', 'Closed'))
);

-- ----------------------------------------------------------------------------
-- RESOURCES
-- ----------------------------------------------------------------------------
CREATE TABLE RESOURCES (
  RESOURCE_ID    NUMBER(10)    NOT NULL,
  DISASTER_ID    NUMBER(10),
  RESOURCE_NAME  VARCHAR2(255) NOT NULL,
  RESOURCE_TYPE  VARCHAR2(40),
  QUANTITY       NUMBER(10)    DEFAULT 0,
  LOCATION       VARCHAR2(255),
  STATUS         VARCHAR2(30)  DEFAULT 'Available',
  CONSTRAINT PK_RESOURCES PRIMARY KEY (RESOURCE_ID),
  CONSTRAINT FK_RESOURCES_DISASTER FOREIGN KEY (DISASTER_ID)
    REFERENCES DISASTERS (DISASTER_ID),
  CONSTRAINT CK_RESOURCES_TYPE CHECK (RESOURCE_TYPE IN
    ('Food', 'Water', 'Medical', 'Shelter', 'Equipment', 'Transport', 'Other')),
  CONSTRAINT CK_RESOURCES_STATUS CHECK (STATUS IN
    ('Available', 'In Stock', 'Allocated', 'Unavailable')),
  CONSTRAINT CK_RESOURCES_QUANTITY CHECK (QUANTITY >= 0)
);

-- ----------------------------------------------------------------------------
-- VOLUNTEERS
-- ----------------------------------------------------------------------------
CREATE TABLE VOLUNTEERS (
  VOLUNTEER_ID  NUMBER(10)    NOT NULL,
  NAME          VARCHAR2(255) NOT NULL,
  PHONE         VARCHAR2(30),
  SKILL         VARCHAR2(255),
  LOCATION      VARCHAR2(255),
  AVAILABILITY  VARCHAR2(30)  DEFAULT 'Available',
  CONSTRAINT PK_VOLUNTEERS PRIMARY KEY (VOLUNTEER_ID),
  CONSTRAINT CK_VOLUNTEERS_AVAILABILITY CHECK (AVAILABILITY IN
    ('Available', 'Unavailable', 'On Duty', 'Inactive'))
);

-- ----------------------------------------------------------------------------
-- RELIEF_REQUESTS
-- ----------------------------------------------------------------------------
CREATE TABLE RELIEF_REQUESTS (
  REQUEST_ID   NUMBER(10)     NOT NULL,
  DISASTER_ID  NUMBER(10),
  REQUESTED_BY NUMBER(10),
  REQUEST_TYPE VARCHAR2(40)   NOT NULL,
  DESCRIPTION  VARCHAR2(1000) NOT NULL,
  LOCATION     VARCHAR2(255)  NOT NULL,
  PRIORITY     VARCHAR2(20)   DEFAULT 'Medium',
  STATUS       VARCHAR2(30)   DEFAULT 'Pending',
  REQUEST_DATE DATE,
  CONSTRAINT PK_RELIEF_REQUESTS PRIMARY KEY (REQUEST_ID),
  CONSTRAINT FK_REQUESTS_DISASTER FOREIGN KEY (DISASTER_ID)
    REFERENCES DISASTERS (DISASTER_ID),
  CONSTRAINT FK_REQUESTS_REQUESTER FOREIGN KEY (REQUESTED_BY)
    REFERENCES USERS (USER_ID),
  CONSTRAINT CK_REQUESTS_TYPE CHECK (REQUEST_TYPE IN
    ('Food', 'Water', 'Medical', 'Shelter', 'Rescue', 'Transport', 'Other')),
  CONSTRAINT CK_REQUESTS_PRIORITY CHECK (PRIORITY IN
    ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT CK_REQUESTS_STATUS CHECK (STATUS IN
    ('Pending', 'Open', 'In Progress', 'Fulfilled', 'Rejected'))
);

-- ----------------------------------------------------------------------------
-- Indexes for foreign keys (Oracle does not create these automatically)
-- ----------------------------------------------------------------------------
CREATE INDEX IDX_INCIDENTS_DISASTER  ON INCIDENTS (DISASTER_ID);
CREATE INDEX IDX_INCIDENTS_REPORTER  ON INCIDENTS (REPORTED_BY);
CREATE INDEX IDX_RESOURCES_DISASTER  ON RESOURCES (DISASTER_ID);
CREATE INDEX IDX_REQUESTS_DISASTER   ON RELIEF_REQUESTS (DISASTER_ID);
CREATE INDEX IDX_REQUESTS_REQUESTER  ON RELIEF_REQUESTS (REQUESTED_BY);

-- ----------------------------------------------------------------------------
-- Note: the API assigns IDs itself with (SELECT NVL(MAX(id), 0) + 1 ...),
-- which works with the primary keys above. For heavier concurrency you could
-- replace the app's ID logic with sequences/identity columns instead.
-- ----------------------------------------------------------------------------