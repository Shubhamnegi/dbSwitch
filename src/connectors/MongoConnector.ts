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
    static LIMIT = 1;
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

    async getDataByDate(collectionName: string, dateAt: string, date: string) {
        const conn = this.connection.connection;
        const query: any = {
        };
        const sort: any = {}

        if (date) {
            const now = moment(date).toDate()
            query[dateAt] = { $gt: now }
        }

        if (dateAt) {
            sort[dateAt] = 1
        }

        const result = await conn.db
            .collection(collectionName)
            .find(query)
            .limit(MongoConnector.LIMIT)
            .sort(sort)
            .toArray();

        return result;
    }

    async getToUpdateByPk(collectionName: string, val: any) {
        const conn = this.connection.connection;
        const query: any = {};
        if (typeof val === "string" && val.length > 10) {
            val = new this.connection.mongo.ObjectID(val)
            this.logger.info("casting val to object id");
        }

        if (val || val === 0) {
            query._id = {
                $gt: val
            }
        }

        const result = await conn.db
            .collection(collectionName)
            .find(query)
            .sort({ _id: 1 })
            .limit(MongoConnector.LIMIT)
            .toArray();
        return result;
    }

    async getLastDateAt() {
        return ""
    }

    async insertData() {
        return false;
    }

    async disconnect() {
        await this.connection.disconnect();
    }

    getDefaultPk() {
        return "_id"
    }
}

export default MongoConnector;