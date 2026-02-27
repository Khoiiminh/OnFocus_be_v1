import express, { json } from 'express';
import { globalRateLimit } from '../shared/middleware/rate-limit.middleware.js';

const app = express();

/**
 * Core middleware
 */
app.use(express.json());
app.use(globalRateLimit);

/**
 * Health check
 */
app.get('/health', (request, response) => {
    response.status(200).json({ status: 'OnFocus API OK'});
});

/**
 * Domain Routes
 */

/**
 * Global Error Handler
 */

export default app;