import { ConnectorInterface } from "./ConnectorInterface";
import Logger = require("bunyan");
import { Sequelize } from 'sequelize';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USERNAME } from "../config/mysqlConfig"
import { getLogger } from "../helpers/logger";

class MysqlConnector implements ConnectorInterface {
    private logger: Logger;
    private connection: Sequelize;

    constructor() {
        this.logger = getLogger('MysqlConnector');
    }
    async connect() {
        this.connection = new Sequelize(
            DB_NAME,
            DB_USERNAME,
            DB_PASSWORD,
            {
                host: DB_HOST,
                dialect: 'mysql'
            });
        await this.connection.authenticate();
        this.logger.info("DB connected successfully");
    }
    getConnection() {
        return this.connection;
    }
    async getDataByDate(collectionName: string, dateAt: string) {
        return [];
    }
}

export default MysqlConnector;