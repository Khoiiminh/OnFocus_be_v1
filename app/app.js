import express, { json } from 'express';
import { globalRateLimit } from '../shared/middleware/rate-limit.middleware.js';
import mysqlConnection from '../infrastructure/database/connection.js';
import cors from 'cors';

const app = express();

/**
 * Core middleware
 */
app.use(cors());
app.use(express.json());
app.use(globalRateLimit);

/**
 * Health check
 */
app.get('/health', (request, response) => {
    response.status(200).json({ status: 'OnFocus API OK'});
});

app.get('/test-db', async (request, response) => {
    try {
        const result = await mysqlConnection.query('SELECT NOW() as now;');
        response.status(200).json({ result });
    } catch (error) {
        console.error(error);
        next(error);
    }
});
app.get('/db-name', async (request, response) => {
    try {
        const result = await mysqlConnection.query('SELECT DATABASE() as \"database name\";')
        response.status(200).json({ result });
    } catch (error) {
        console.error(error);
        next(error);
    }
})

/**
 * Domain Routes
 */

/**
 * Global Error Handler
 */

export default app;