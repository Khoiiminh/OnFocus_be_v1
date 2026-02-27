import rateLimit from "express-rate-limit";

export const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: 'You have exceeded the limit due to frequent requesting!',
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
})