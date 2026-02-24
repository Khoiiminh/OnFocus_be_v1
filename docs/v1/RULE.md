# CODING RULES

## 1️⃣ config/ — Application Configuration Layer
### Purpose:

Holds configuration logic, not business logic.

This is where you:

    - Read environment variables

    - Validate required env values

    - Build configuration objects

    - Initialize infrastructure services (DB, Redis, mail, etc.)

### What belongs here:
/config
  env.ts
  database.ts
  redis.ts
  app.ts

Example:

// config/database.ts
export const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
};
### What should NOT go here:

    - Models

    - Queries

    - Business rules

    - SSL certificates themselves

Think of config/ as:

“How the app is configured based on environment.”

## 2️⃣ database/ — Data Access Layer (DAL)
### Purpose:

Everything related to data persistence and querying.

This is where your app talks to MySQL, PostgreSQL, MongoDB, etc.

### What belongs here:
/database
  connection.ts
  migrations/
  seeds/
  repositories/
  models/

Examples:

    - ORM models (Sequelize, Prisma, TypeORM)

    - Raw SQL queries

    - Repository pattern implementations

    - Migration files

### What should NOT go here:

    - SSL certificates

    - Environment parsing

    - Business services

Think of database/ as:

“How the app interacts with stored data.”

## 3️⃣ ssl/ or certs/ — Security Assets
### Purpose:

Holds cryptographic material:

    - CA certificates

    - Private keys

    - Public keys

    - TLS certificates

### What belongs here:
/certs
  ca.pem
  server.key
  server.crt
### What should NOT go here:

    - Code

    - Database queries

    - Config parsing logic

Think of certs/ as:

“Infrastructure security materials.”

## Database Migration 

### Naming Files
**V{version}__{description}.sql**

    - ⚠️ Never rename old migrations.
    - ⚠️ Never edit old migrations after applied.

### Inside each migration:

✔ Explicit engine
✔ Explicit charset
✔ Explicit indexes
✔ Explicit foreign keys

Example:

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


    **- Be explicit. Always.**