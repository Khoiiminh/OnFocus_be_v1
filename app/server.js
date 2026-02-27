import './config/env.config.js';
import http from 'node:http';
import app from './app.js';
import mysqlConnection from '../infrastructure/database/connection.js';


const PORT = process.env.PORT;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`OnFocus API running on port: ${PORT}`);
});

/**
 * Graceful Shutdown
 */
async function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
        try {
            await mysqlConnection.closeConnection();
            console.log('Database pool closed');
            process.exit(0);
        } catch (error) {
            console.error(`Error during shutdown`, error);
            process.exit(1);
        }
    });
}

process.on('SIGINT', () => { shutdown('SIGINT')});
process.on('SIGTERM', () => { shutdown('SIGTERM')});