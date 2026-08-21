-- Runs once, on first container init (docker-entrypoint-initdb.d convention) —
-- creates a second database on the same Postgres instance so tests never share
-- state with the dev database. flowra_dev itself comes from POSTGRES_DB.
CREATE DATABASE flowra_test;
