import { level } from "winston";
import envVars from "./env.config";

const loggerConfig = {
    level: envVars.NODE_ENV === 'development' ? 'info' : 'debug'
};

export default loggerConfig;