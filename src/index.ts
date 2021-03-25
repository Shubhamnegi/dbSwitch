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

    static async start() {
        if (!Application.sourceDB || !Application.destinationDB) {
            throw new Error("Please initiate the connection first")
        }

        this.logger.info("Initiating migration");
        for (let i = 0; i < config.schemas.length; i++) {
            const item = config.schemas[i];

            const mapperPath = path.join(__dirname, this.mapperPath, `${config.sourceDB}${config.destinationDB}.json`)
            const mapperJson = await import(mapperPath);
            const mapper = mapperJson[item.mapper]

            while (true) {
                const lastUpdateDate = await this.destinationDB.getLastDateAt(
                    item.destination,
                    item.destinationDateField
                );
                this.logger.info("get data from last date: " + lastUpdateDate);
                const toUpate = await this.sourceDB.getDataByDate(
                    item.source,
                    item.sourceDateField,
                    lastUpdateDate
                );
                if (toUpate.length === 0) {
                    this.logger.info("No record found for " + item.source + " greater than " + lastUpdateDate);
                    // Break while
                    break;
                }
                const toInsert: any[] = [];
                toUpate.forEach(x => {
                    const mappedData: any = {};
                    const keys = Object.keys(x);
                    keys.forEach(k => {
                        if (mapper[k]) {
                            mappedData[mapper[k]] = x[k];
                        }
                    });
                    toInsert.push(mappedData);
                });
                const res = await this.destinationDB.insertData(item.destination, toInsert);
                if (!res) {
                    this.logger.info("Failed to execute insert Data table:" + item.destination + " last update date:" + lastUpdateDate);
                    process.exit(0);
                }
            }
        }
        process.exit(0);
    }
}

(async () => {
    await Application.init();
    await Application.start();
})()


