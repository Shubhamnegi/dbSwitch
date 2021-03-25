import { Mongoose } from "mongoose";
import { Sequelize } from "sequelize/types";

export interface ConnectorInterface {
    connect(): Promise<void>
    getConnection(): Mongoose | Sequelize
    getDataByDate(collectionName: string, dateAt: string, date: string): Promise<any[]>
    getLastDateAt(collectionName: string, dateAt: string): Promise<string>
    insertData(collectionName: string, data: any[]): Promise<boolean>
}