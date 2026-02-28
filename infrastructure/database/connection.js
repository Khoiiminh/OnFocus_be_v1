import mysql from 'mysql2/promise';
import fs from 'fs';
import dbConfig from '../../app/config/db.config.js';

class MySQLConnection {
    constructor() {
        this.pool = mysql.createPool({
            host: dbConfig.mysql_host,
            port: dbConfig.mysql_port,
            user: dbConfig.mysql_user,
            password: dbConfig.mysql_password,
            database: dbConfig.mysql_database,
            ssl: {
                ca: fs.readFileSync(dbConfig.mysql_ssl_ca),
            },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
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