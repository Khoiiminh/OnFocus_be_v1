import rateLimit from "express-rate-limit";
import appConfig from "../../app/config/app.config.js";

export const globalRateLimit = rateLimit({
    windowMs: appConfig.windowMs,
    limit: appConfig.limit,
    message: 'You have exceeded the limit due to frequent requesting!',
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
})