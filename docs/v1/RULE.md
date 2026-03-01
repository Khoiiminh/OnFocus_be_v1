# CODING RULES

- [CODING RULES](#coding-rules)
  - [1️⃣ config/ — Application Configuration Layer](#1️⃣-config--application-configuration-layer)
    - [Purpose:](#purpose)
    - [What belongs here:](#what-belongs-here)
    - [What should NOT go here:](#what-should-not-go-here)
  - [2️⃣ database/ — Data Access Layer (DAL)](#2️⃣-database--data-access-layer-dal)
    - [Purpose:](#purpose-1)
    - [What belongs here:](#what-belongs-here-1)
    - [What should NOT go here:](#what-should-not-go-here-1)
  - [3️⃣ ssl/ or certs/ — Security Assets](#3️⃣-ssl-or-certs--security-assets)
    - [Purpose:](#purpose-2)
    - [What belongs here:](#what-belongs-here-2)
    - [What should NOT go here:](#what-should-not-go-here-2)
  - [Database Migration](#database-migration)
    - [Naming Files](#naming-files)
    - [Inside each migration:](#inside-each-migration)
  - [MySQL connection and transaction for SQL queries](#mysql-connection-and-transaction-for-sql-queries)
    - [**___Let take a simple order flow as an example___**](#let-take-a-simple-order-flow-as-an-example)
    - [**1️⃣ connection.js (Singleton Pool)**](#1️⃣-connectionjs-singleton-pool)
    - [**2️⃣ transaction.js**](#2️⃣-transactionjs)
    - [**3️⃣ order.repository.js (RAW SQL ONLY)**](#3️⃣-orderrepositoryjs-raw-sql-only)
    - [**4️⃣ order.service.js (Business Logic + Transaction)**](#4️⃣-orderservicejs-business-logic--transaction)


## 1️⃣ config/ — Application Configuration Layer
### Purpose:

Holds configuration logic, not business logic.

This is where you:

    - Read environment variables

    - Validate required env values

    - Build configuration objects

    - Initialize infrastructure services (DB, Redis, mail, etc.)

### What belongs here:
```bash
/config
  env.ts
  database.ts
  redis.ts
  app.ts
```

Example:
```bash
// config/database.ts
export const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
};
```
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
```bash
/database
  connection.ts
  migrations/
  seeds/
  repositories/
  models/
```

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
```bash
/certs
  ca.pem
  server.key
  server.crt
```
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

    - ✔ Explicit engine
    - ✔ Explicit charset
    - ✔ Explicit indexes
    - ✔ Explicit foreign keys

Example:
```bash
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

    **- Be explicit. Always.**

## MySQL connection and transaction for SQL queries

### **___Let take a simple order flow as an example___**

    - connection.js → pool singleton
    - transaction.js → transaction wrapper
    - order.repository.js → raw SQL only
    - order.service.js → business logic + transaction boundary

```bash
📁 Folder Structure (consistent)
src/
 ├── infrastructure/
 │    └── database/
 │         ├── connection.js
 │         └── transaction.js
 │
 ├── modules/
 │    └── order/
 │         ├── order.repository.js
 │         ├── order.service.js
 │         └── order.controller.js
 ```
 
### **1️⃣ connection.js (Singleton Pool)**
```bash
// src/infrastructure/database/connection.js
import mysql from 'mysql2/promise';
import fs from 'fs';

class MySQLConnection {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB_NAME,
            ssl: process.env.MYSQL_SSL_CA
                ? { ca: fs.readFileSync(process.env.MYSQL_SSL_CA) }
                : undefined,
            waitForConnections: true,
            connectionLimit: 10,
        });
    }

    async query(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    async getConnection() {
        return this.pool.getConnection();
    }
}

const mysqlConnection = new MySQLConnection();
export default mysqlConnection;
```

```bash
✔ Pool is singleton
✔ query() for non-transaction queries
✔ getConnection() for transactions
```

### **2️⃣ transaction.js**
```bash
// src/infrastructure/database/transaction.js
import db from './connection.js';

export async function withTransaction(callback) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();
        return result;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}
```

    --> Transaction logic stays OUTSIDE repository.

### **3️⃣ order.repository.js (RAW SQL ONLY)**

Repository does not know if it's inside a transaction or not.

It accepts a connection optionally.

```bash
// src/modules/order/order.repository.js
import db from '../../infrastructure/database/connection.js';

class OrderRepository {

    async findProductById(productId, conn = null) {
        const executor = conn || db;
        const sql = `SELECT id, name, price, stock FROM products WHERE id = ?`;
        const [rows] = conn
            ? await executor.execute(sql, [productId])
            : [await executor.query(sql, [productId])];

        return rows[0];
    }

    async decreaseStock(productId, quantity, conn = null) {
        const executor = conn || db;
        const sql = `
            UPDATE products 
            SET stock = stock - ? 
            WHERE id = ? AND stock >= ?
        `;

        if (conn) {
            const [result] = await executor.execute(sql, [quantity, productId, quantity]);
            return result.affectedRows > 0;
        }

        const result = await executor.query(sql, [quantity, productId, quantity]);
        return result.affectedRows > 0;
    }

    async createOrder(userId, productId, quantity, totalPrice, conn = null) {
        const executor = conn || db;
        const sql = `
            INSERT INTO orders (user_id, product_id, quantity, total_price)
            VALUES (?, ?, ?, ?)
        `;

        if (conn) {
            const [result] = await executor.execute(sql, [
                userId,
                productId,
                quantity,
                totalPrice
            ]);
            return result.insertId;
        }

        const result = await executor.query(sql, [
            userId,
            productId,
            quantity,
            totalPrice
        ]);

        return result.insertId;
    }
}

export default new OrderRepository();
```

🔎 Notice:

If conn exists → use conn.execute
Otherwise → use pool (db.query)
Repository does NOT handle transactions

This is clean separation.

### **4️⃣ order.service.js (Business Logic + Transaction)**

Now the important part.

Buying something must be atomic:

    - Check product
    - Check stock
    - Decrease stock
    - Create order

All must succeed or fail together.

```bash
// src/modules/order/order.service.js
import orderRepository from './order.repository.js';
import { withTransaction } from '../../infrastructure/database/transaction.js';

class OrderService {

    async buyProduct(userId, productId, quantity) {

        return withTransaction(async (conn) => {

            const product = await orderRepository.findProductById(productId, conn);

            if (!product) {
                throw new Error('Product not found');
            }

            if (product.stock < quantity) {
                throw new Error('Insufficient stock');
            }

            const success = await orderRepository.decreaseStock(
                productId,
                quantity,
                conn
            );

            if (!success) {
                throw new Error('Failed to update stock');
            }

            const totalPrice = product.price * quantity;

            const orderId = await orderRepository.createOrder(
                userId,
                productId,
                quantity,
                totalPrice,
                conn
            );

            return { orderId };
        });
    }
}

export default new OrderService();
```

Now:

    - If any step fails → rollback
    - If everything succeeds → commit
    - Repository is reusable inside or outside transaction