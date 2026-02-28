import dotenvx from '@dotenvx/dotenvx';
import Joi from 'joi';

dotenvx.config({ path: '.env.development'});

const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test', 'local', 'staging', 'template', 'example')
        .default('development'),
    
    PORT: Joi.number().default(3000),
    URL: Joi.string().required(),

    // Database
    MYSQL_SERVICE_URL: Joi.string().required(),
    MYSQL_HOST: Joi.string().required(),
    MYSQL_PORT: Joi.number().required(),
    MYSQL_USER: Joi.string().required(),
    MYSQL_PASSWORD: Joi.string().required(),
    MYSQL_SSL_CA: Joi.string().required(),
    MYSQL_DB_NAME: Joi.string().required(),

    // Session Auth
    SESSION_SECRET: Joi.string().min(32).required(),

    // Google Client Credentials
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_REDIRECT_URL: Joi.string().required(),

    // LinkedIn Client Credentials
    LINKEDIN_CLIENT_ID: Joi.string().required(),
    LINKEDIN_PRIM_CLIENT_SECRET: Joi.string().required(),

}).unknown();       //overrides the handling of unknown keys for the scope of the current object only. (does not apply to children)

const { value: envVars, error } = schema.validate(process.env);

if ( error ) {
    throw new Error(`Environment validation error: ${error.message}`);
}

export default envVars;