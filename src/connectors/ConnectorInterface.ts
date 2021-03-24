import { Mongoose } from "mongoose";
import { Sequelize } from "sequelize/types";

export interface ConnectorInterface {
    connect(): Promise<void>
    getConnection(): Mongoose | Sequelize
    getDataByDate(collectionName: string, dateAt: string): Promise<any[]>
}