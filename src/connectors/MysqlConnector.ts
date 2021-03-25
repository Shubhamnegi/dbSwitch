import { ConnectorInterface } from "./ConnectorInterface";
import Logger = require("bunyan");
import { Sequelize, QueryTypes } from 'sequelize';
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USERNAME } from "../config/mysqlConfig"
import { getLogger } from "../helpers/logger";
import moment from 'moment';


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
    async getDataByDate(tableName: string, dateAt: string, date: string) {
        return [];
    }

    async getLastDateAt(tableName: string, dateAt: string) {
        let date;
        const result: any[] = await this.connection.query(`select ${dateAt} from ${tableName} order by ${dateAt} DESC LIMIT 1`, {
            type: QueryTypes.SELECT
        })
        if (result && result.length > 0) {
            if (result[0][dateAt] instanceof Date) {
                date = result[0][dateAt].toISOString();
            } else {
                date = result[0][dateAt];
            }
        }
        return date
    }

    async getToUpdateByPk(collectionName: string, val: string) {
        return []
    }

    async insertData(tableName: String, data: any[]) {
        if (!Array.isArray(data) || data.length === 0) {
            this.logger.error({ error: "Incorrect lenght provided fir insertData, table: " + tableName });
            return false;
        }
        try {
            const keys = Object.keys(data[0]);
            if (keys.indexOf("created_at") < 0) {
                keys.push("created_at");
            }
            if (keys.indexOf("updated_at") < 0) {
                keys.push("updated_at");
            }

            let query = `insert into \`${tableName}\` (\`${keys.join("\`,\`")}\`) values `;
            data.forEach((item, index) => {
                if (!item.created_at) {
                    item.created_at = moment(new Date().setFullYear(2015, 1, 1)).format("YYYY-MM-DD HH:mm:ss")
                } else {
                    item.created_at = moment(item.created_at).format("YYYY-MM-DD HH:mm:ss")
                }
                if (!item.updated_at) {
                    item.updated_at = moment(new Date().setFullYear(2015, 1, 1)).format("YYYY-MM-DD HH:mm:ss")
                } else {
                    item.updated_at = moment(item.updated_at).format("YYYY-MM-DD HH:mm:ss")
                }
                let values = JSON.stringify(keys.map(k => item[k]));
                values = values.substr(1, values.length - 2);
                const val = `(${values})${index === data.length - 1 ? ';' : ','}`
                query = query + val;
            });
            await this.connection.query(query, { type: QueryTypes.INSERT })
            return true;
        } catch (error) {
            this.logger.error({ error })
            return false;
        }
    }

    async disconnect() {
        await this.connection.close()
    }

    getDefaultPk() {
        return "id"
    }
}

export default MysqlConnector;