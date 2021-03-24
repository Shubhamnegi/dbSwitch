/**
 * Responsible to create mongo connection
 * Usses mongoose as ODM
 */

import mongoose, { Mongoose } from "mongoose";
import { ConnectorInterface } from "./ConnectorInterface";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USERNAME, DB_PORT } from '../config/mongoConfig'
import { getLogger } from "../helpers/logger";
import Logger = require("bunyan");
import moment from "moment"

class MongoConnector implements ConnectorInterface {
    private connectionString: string;
    private logger: Logger;
    private connection: Mongoose;

    constructor() {
        this.logger = getLogger("MongoConnector")
        this.connectionString = `mongodb://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
        this.logger.debug("Connection String: " + this.connectionString);
    }

    async connect() {
        try {
            this.connection = await mongoose.connect(
                this.connectionString,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
            this.logger.info("Connected to database");
        } catch (error) {
            this.logger.info("Error occured connecting to database");
            this.logger.error(error);
        }
    }

    getConnection() {
        return this.connection;
    }

    async getDataByDate(collectionName: string, dateAt: string, date?: string) {
        const conn = this.connection.connection;
        const query: any = {
        };

        if (date) {
            const now = moment(date).toDate()
            query[dateAt] = { $gt: now }
        }

        const result = await conn.db
            .collection(collectionName)
            .find(query)
            .limit(10).toArray();

        return result;
    }
}

export default MongoConnector;