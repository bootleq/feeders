-- Migration number: 0001 	 2024-07-06T07:42:53.263Z

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT,
  state TEXT,
  desc TEXT,
  created_at TEXT,
  created_by INTEGER
);

DROP TABLE IF EXISTS spots;
CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY,
  state TEXT,
  desc TEXT,
  created_at TEXT,
  created_by INTEGER,
  lat TEXT,
  lon TEXT,
  user_id INTEGER
);

DROP TABLE IF EXISTS followups;
CREATE TABLE IF NOT EXISTS followups (
  id INTEGER PRIMARY KEY,
  type TEXT,
  user_id INTEGER,
  spot_id INTEGER,
  desc TEXT,
  created_at TEXT,
  created_by INTEGER
);
