import envVars from "./env.config.js";

const appConfig = {
    port: envVars.PORT,
    base_url: envVars.URL,

    rateLimit: {
        windowMs: 15 * 60 * 1000,
        limit: 100,
    }
}

export default appConfig;