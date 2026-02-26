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
            ssl: {
                ca: fs.readFileSync(process.env.MYSQL_SSL_CA),
            },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000
        });
    }

    /**
     *  Execute a query with automatic connection management
     */
    async query(sql, params) {
        try {
            const [rows, fields] = await this.pool.execute(sql, params);
            return rows
        } catch (error) {
            console.error('Database query error: ', error);
            throw error;
        }
    }

    /**
     *  Execute a connection pool
     */
    async getConnection() {
        return await this.pool.getConnection(); // returns a connection
    }

    /**
     *  Close a connection pool
     */
    async closeConnection() {
        try {
            await this.pool.end();
            console.log('MySQL connection pool closed');
        } catch (error) {
            console.error('A connection pool is unable to close: ', error);
            throw error;
        }
    }

}

const mysqlConnection = new MySQLConnection();
export default mysqlConnection;