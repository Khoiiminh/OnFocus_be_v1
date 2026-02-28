import envVars from "./env.config.js";

const dbConfig = {
    mysql_service_url: envVars.MYSQL_SERVICE_URL,
    mysql_host: envVars.MYSQL_HOST,
    mysql_port: envVars.MYSQL_PORT,
    mysql_user: envVars.MYSQL_USER,
    mysql_password: envVars.MYSQL_PASSWORD,
    mysql_ssl_ca: envVars.MYSQL_SSL_CA,
    mysql_database: envVars.MYSQL_DB_NAME,
};

export default dbConfig;