import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env first and then start the application
dotenv.config({
    path: path.join(__dirname, "./.env")
})

import config from "./migrationJob.json"
import DBFactory from './factory/DBFactory';
import { ConnectorInterface } from './connectors/ConnectorInterface';
import { getLogger } from "./helpers/logger";
import Logger from 'bunyan';
import moment from "moment";

class Application {
    private static sourceDB: ConnectorInterface;
    private static destinationDB: ConnectorInterface;
    private static logger: Logger;
    private static mapperPath = "mappers";

    static async init() {
        Application.logger = getLogger('main');
        Application.sourceDB = DBFactory.getConnector(config.sourceDB)
        Application.destinationDB = DBFactory.getConnector(config.destinationDB)

        // Initiate connection
        await Application.sourceDB.connect();
        await Application.destinationDB.connect();
    }

    /**
     * To get data by date
     * @param item 
     */
    static async getToUpdateByDate(item: Schema): Promise<any[]> {
        // Get last inserted date time
        const lastUpdateDate = await this.destinationDB.getLastDateAt(
            item.destination,
            item.destinationDateField
        );
        this.logger.info("get data from last date: " + lastUpdateDate);
        // Get data not synced from last date time
        const toUpate = await this.sourceDB.getDataByDate(
            item.source,
            item.sourceDateField,
            lastUpdateDate
        );
        if (toUpate.length === 0) {
            this.logger.info("No record found for " + item.source + " greater than " + lastUpdateDate);
        }
        return toUpate
    }

    /**
     * To get date by last id
     * @param collectionName 
     * @param val 
     */
    static async getToUpdateByPk(collectionName: string, val: any) {
        this.logger.info("fetching data greater than " + val)
        // Get data not synced from last synced id
        const toUpate = await this.sourceDB.getToUpdateByPk(collectionName, val);
        if (toUpate.length === 0) {
            this.logger.info("No record found for " + collectionName + " greater than " + val);
        }
        return toUpate;
    }

    static async start() {
        if (!Application.sourceDB || !Application.destinationDB) {
            throw new Error("Please initiate the connection first")
        }

        this.logger.info("Initiating migration");
        for (let i = 0; i < config.schemas.length; i++) {
            const item = config.schemas[i] as Schema;

            const mapperPath = path.join(__dirname, this.mapperPath, `${config.sourceDB}${config.destinationDB}.json`)
            const mapperJson = await import(mapperPath) as Mapper;
            const mapperFields = mapperJson[item.mapper].fields
            const mapperConversions = mapperJson[item.mapper].conversions; // To convert into specific data type 
            let lastInsertedId = item.lastpk;

            while (true) {
                let toUpate: any[] = [];
                // If date  field is mentined
                if (item.destinationDateField && item.destinationDateField != "") {
                    toUpate = await this.getToUpdateByDate(item);
                } else {
                    toUpate = await this.getToUpdateByPk(item.source, lastInsertedId);
                    if (toUpate.length > 0) {
                        lastInsertedId = toUpate[toUpate.length - 1][this.sourceDB.getDefaultPk()]
                        this.logger.info(item.source+" new lastInsertedId for inserting is:" + lastInsertedId);
                    }
                }

                if (toUpate.length === 0) {
                    // Break while
                    // Will to swithing to next schema
                    break;
                }
                const toInsert: any[] = [];
                toUpate.forEach(x => {
                    const mappedData: any = {};
                    const keys = Object.keys(x);
                    keys.forEach(k => {
                        if (mapperFields[k]) {
                            mappedData[mapperFields[k]] = x[k];
                            // Check for conversion
                            if (mapperConversions[k]) {
                                if (mapperConversions[k] === "object") {
                                    // If source has object
                                    mappedData[mapperFields[k]] = JSON.stringify(mappedData[mapperFields[k]]);
                                } else if (mapperConversions[k] === "array") {
                                    mappedData[mapperFields[k]] = mappedData[mapperFields[k]].join(",");
                                }
                                else if (mapperConversions[k] === "boolean") {
                                    if (typeof mappedData[mapperFields[k]] === "string") {
                                        mappedData[mapperFields[k]] = JSON.parse(mappedData[mapperFields[k]]);
                                    }
                                }
                                else if (mapperConversions[k] === "date") {
                                    mappedData[mapperFields[k]] = moment(mappedData[mapperFields[k]]).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                        }
                    });
                    toInsert.push(mappedData);
                });
                const res = await this.destinationDB.insertData(item.destination, toInsert);
                if (!res) {
                    this.logger.info("Failed to execute insert Data table:" + item.destination);
                    process.exit(0);
                }
            }
        }
        await this.sourceDB.disconnect();
        await this.destinationDB.disconnect();
    }
}

(async () => {
    await Application.init();
    await Application.start();
})()


