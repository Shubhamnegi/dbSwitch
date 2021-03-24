const env = process.env;

export const DB_NAME = env.MONGO_DB_NAME || ""
export const DB_USERNAME = env.MONGO_DB_USERNAME || ""
export const DB_PASSWORD = env.MONGO_DB_PASSWORD || ""
export const DB_HOST = env.MONGO_DB_HOST || ""
export const DB_PORT = env.MONGO_DB_PORT || ""