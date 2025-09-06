-- Create database if not exists
SELECT 'CREATE DATABASE synergysphere'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'synergysphere')\gexec

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'synergy_user') THEN

      CREATE ROLE synergy_user LOGIN PASSWORD 'synergy_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE synergysphere TO synergy_user;

ALTER USER synergy_user CREATEDB;