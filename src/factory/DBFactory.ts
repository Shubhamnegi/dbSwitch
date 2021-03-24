import { ConnectorInterface } from "../connectors/ConnectorInterface";
import MongoConnector from "../connectors/MongoConnector";
import MysqlConnector from "../connectors/MysqlConnector";

class DBFactory {
    static getConnector(db: string): ConnectorInterface {
        let connector: ConnectorInterface;
        switch (db.toLowerCase()) {
            case "mongo":
                connector = new MongoConnector();
                break;
            case "mysql":
                connector = new MysqlConnector();
                break;
            default:
                throw new Error("DB not supported");
        }
        return connector;
    }
}

export default DBFactory;