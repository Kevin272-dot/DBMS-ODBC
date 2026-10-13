-- ============================================================================
-- DisasterOS seed data for Oracle Cloud Autonomous Database
-- Run db/schema.sql first. Safe to re-run (clears and re-inserts).
-- ============================================================================

-- Clear existing rows (children before parents because of foreign keys)
DELETE FROM RELIEF_REQUESTS;
DELETE FROM RESOURCES;
DELETE FROM INCIDENTS;
DELETE FROM VOLUNTEERS;
DELETE FROM DISASTERS;
DELETE FROM USERS;

-- ----------------------------------------------------------------------------
-- Users (mirror the in-memory demo accounts; app passwords are plain text
-- for this lab application - the API compares them directly)
-- ----------------------------------------------------------------------------
INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, FULL_NAME, ROLE) VALUES
  (1, 'admin',    'admin123',    'Asha Menon',    'ADMIN');
INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, FULL_NAME, ROLE) VALUES
  (2, 'operator', 'operator123', 'Kiran Rao',     'OPERATOR');
INSERT INTO USERS (USER_ID, USERNAME, PASSWORD, FULL_NAME, ROLE) VALUES
  (3, 'viewer',   'viewer123',   'Demo Viewer',   'VIEWER');

-- ----------------------------------------------------------------------------
-- Disasters
-- ----------------------------------------------------------------------------
INSERT INTO DISASTERS (DISASTER_ID, DISASTER_NAME, DISASTER_TYPE, LOCATION, SEVERITY, START_DATE, STATUS) VALUES
  (4, 'Rajasthan Drought',     'Drought',   'Barmer, Rajasthan',       'Low',     TO_DATE('2024-03-02', 'YYYY-MM-DD'), 'Closed');
INSERT INTO DISASTERS (DISASTER_ID, DISASTER_NAME, DISASTER_TYPE, LOCATION, SEVERITY, START_DATE, STATUS) VALUES
  (3, 'Uttarakhand Landslide', 'Landslide', 'Chamoli, Uttarakhand',    'Medium',  TO_DATE('2025-08-11', 'YYYY-MM-DD'), 'Resolved');
INSERT INTO DISASTERS (DISASTER_ID, DISASTER_NAME, DISASTER_TYPE, LOCATION, SEVERITY, START_DATE, STATUS) VALUES
  (2, 'Cyclone Remal',         'Cyclone',   'Sundarbans, West Bengal', 'Critical', TO_DATE('2025-05-26', 'YYYY-MM-DD'), 'Ongoing');
INSERT INTO DISASTERS (DISASTER_ID, DISASTER_NAME, DISASTER_TYPE, LOCATION, SEVERITY, START_DATE, STATUS) VALUES
  (1, 'Kerala Floods',         'Flood',     'Wayanad, Kerala',         'High',    TO_DATE('2024-07-15', 'YYYY-MM-DD'), 'Active');

-- ----------------------------------------------------------------------------
-- Incidents
-- ----------------------------------------------------------------------------
INSERT INTO INCIDENTS (INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE) VALUES
  (5, 2, 'Power outage at cyclone shelter',                    'Namkhana, West Bengal',  3, 'Open',       TO_DATE('2025-05-28', 'YYYY-MM-DD'));
INSERT INTO INCIDENTS (INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE) VALUES
  (4, 3, 'Road blocked by debris at NH-7',                     'Chamoli',                1, 'Resolved',   TO_DATE('2025-08-12', 'YYYY-MM-DD'));
INSERT INTO INCIDENTS (INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE) VALUES
  (3, 1, 'Relief camp running low on drinking water',          'Kalpetta, Wayanad',      2, 'Reported',   TO_DATE('2024-08-01', 'YYYY-MM-DD'));
INSERT INTO INCIDENTS (INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE) VALUES
  (2, 2, 'Embankment breach flooding low-lying village',       'Sagar Island, West Bengal', 2, 'In Progress', TO_DATE('2025-05-27', 'YYYY-MM-DD'));
INSERT INTO INCIDENTS (INCIDENT_ID, DISASTER_ID, DESCRIPTION, LOCATION, REPORTED_BY, INCIDENT_STATUS, REPORTED_DATE) VALUES
  (1, 1, 'Bridge collapse near Meppadi, 12 people stranded',   'Meppadi, Wayanad',       1, 'Open',       TO_DATE('2024-07-30', 'YYYY-MM-DD'));

-- ----------------------------------------------------------------------------
-- Resources
-- ----------------------------------------------------------------------------
INSERT INTO RESOURCES (RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS) VALUES
  (5, 3, 'JCB excavator',            'Equipment', 2,    'Chamoli',          'In Stock');
INSERT INTO RESOURCES (RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS) VALUES
  (4, 2, 'First aid kits',           'Medical',   150,  'Sagar Island',     'Available');
INSERT INTO RESOURCES (RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS) VALUES
  (3, 2, 'Tents',                    'Shelter',   300,  'Kakdwip depot',    'Allocated');
INSERT INTO RESOURCES (RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS) VALUES
  (2, 1, 'Drinking water (1 litre)', 'Water',     1200, 'Kalpetta camp',    'In Stock');
INSERT INTO RESOURCES (RESOURCE_ID, DISASTER_ID, RESOURCE_NAME, RESOURCE_TYPE, QUANTITY, LOCATION, STATUS) VALUES
  (1, 1, 'Rice bags (25 kg)',        'Food',      500,  'Wayanad depot',    'Available');

-- ----------------------------------------------------------------------------
-- Volunteers
-- ----------------------------------------------------------------------------
INSERT INTO VOLUNTEERS (VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY) VALUES
  (5, 'Rohan Das',     '9874512345', 'Driving, transport',       'Sundarbans, West Bengal', 'Available');
INSERT INTO VOLUNTEERS (VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY) VALUES
  (4, 'Fatima Khan',   '9829012345', 'Medical assistant',        'Barmer, Rajasthan',       'Unavailable');
INSERT INTO VOLUNTEERS (VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY) VALUES
  (3, 'Vikram Singh',  '9412012345', 'Search and rescue',        'Chamoli, Uttarakhand',    'Available');
INSERT INTO VOLUNTEERS (VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY) VALUES
  (2, 'Priya Sharma',  '9831023456', 'Logistics',                'Kolkata, West Bengal',    'On Duty');
INSERT INTO VOLUNTEERS (VOLUNTEER_ID, NAME, PHONE, SKILL, LOCATION, AVAILABILITY) VALUES
  (1, 'Arjun Nair',    '9847012345', 'First aid, rescue',        'Wayanad, Kerala',         'Available');

-- ----------------------------------------------------------------------------
-- Relief requests
-- ----------------------------------------------------------------------------
INSERT INTO RELIEF_REQUESTS (REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE) VALUES
  (5, 2, 2, 'Rescue',  'Boat evacuation for 15 families',                     'Namkhana, West Bengal',     'Critical', 'In Progress', TO_DATE('2025-05-27', 'YYYY-MM-DD'));
INSERT INTO RELIEF_REQUESTS (REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE) VALUES
  (4, 3, 1, 'Food',    'Dry rations for 40 workers',                         'Chamoli',                   'Medium',   'Fulfilled',   TO_DATE('2025-08-13', 'YYYY-MM-DD'));
INSERT INTO RELIEF_REQUESTS (REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE) VALUES
  (3, 1, 3, 'Medical', 'Insulin and blood pressure medication',              'Kalpetta camp',             'High',     'Open',        TO_DATE('2024-08-02', 'YYYY-MM-DD'));
INSERT INTO RELIEF_REQUESTS (REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE) VALUES
  (2, 2, 2, 'Shelter', 'Tents and blankets for displaced families',          'Sagar Island, West Bengal', 'High',     'In Progress', TO_DATE('2025-05-28', 'YYYY-MM-DD'));
INSERT INTO RELIEF_REQUESTS (REQUEST_ID, DISASTER_ID, REQUESTED_BY, REQUEST_TYPE, DESCRIPTION, LOCATION, PRIORITY, STATUS, REQUEST_DATE) VALUES
  (1, 1, 1, 'Water',   'Drinking water for 300 people',                      'Meppadi, Wayanad',          'Critical', 'Pending',     TO_DATE('2024-08-01', 'YYYY-MM-DD'));

COMMIT;

-- ----------------------------------------------------------------------------
-- Expected counts after seeding:
--   USERS=3  DISASTERS=4  INCIDENTS=5  RESOURCES=5  VOLUNTEERS=5  RELIEF_REQUESTS=5
-- ----------------------------------------------------------------------------