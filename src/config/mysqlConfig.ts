const env = process.env;

export const DB_NAME = env.MYSQL_DB_NAME || ""
export const DB_USERNAME = env.MYSQL_DB_USERNAME || ""
export const DB_PASSWORD = env.MYSQL_DB_PASSWORD || ""
export const DB_HOST = env.MYSQL_DB_HOST || ""