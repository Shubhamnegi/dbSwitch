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

    static async init() {
        Application.logger = getLogger('main');
        Application.sourceDB = DBFactory.getConnector(config.sourceDB)
        Application.destinationDB = DBFactory.getConnector(config.destinationDB)

        // Initiate connection
        await Application.sourceDB.connect();
        await Application.destinationDB.connect();
    }

    static start() {
        if (!Application.sourceDB || !Application.destinationDB) {
            throw new Error("Please initiate the connection first")
        }
        const sourceConnection = Application.sourceDB.getConnection();
        const destConnection = Application.destinationDB.getConnection();

        this.logger.info("Initiating migration");
        // for (let i = 0; i < config.schemas.length; i++) {
        //     let item = config.schemas[i];
        // }
        for (const item of config.schemas) {
            const data = this.sourceDB.getDataByDate(item.source, item.sourceDateField);
            this.logger.info(data, "data");
        }

    }
}

(async () => {
    await Application.init();
    Application.start();
})()


