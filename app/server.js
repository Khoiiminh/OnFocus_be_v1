import './config/env.config.js';
import http from 'node:http';
import app from './app.js';
import mysqlConnection from '../infrastructure/database/connection.js';
import appConfig from './config/app.config.js';


const PORT = appConfig.port;

const server = http.createServer(app);

async function startServer() {
    try {
        await mysqlConnection.query('SELECT 1');
        console.log('Database connected successfully');

        server.listen(PORT, (request, response) => {
            console.log(`OnFocus API running on port: ${PORT}`);
        })
    } catch (error) {
        console.error('Failed on something!', error);
        process.exit(1);
    }
}

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

startServer();
process.on('SIGINT', () => { shutdown('SIGINT')});      // Internally killed with Ctrl + C
process.on('SIGTERM', () => { shutdown('SIGTERM')});    // Externally killed by process manager ( Docker, Kubernetes )