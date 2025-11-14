import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client: MongoClient;
let dB: Db;
const dbName = "practica_3";

export const connectMongoDB = async (): Promise<void> => {
    try {

        const MONGO_URL = `mongodb+srv://${process.env.USER_MONGO}:${process.env.PASSWORD_MONGO}@${process.env.MONGO_CLUSTER}.mrnz9ou.mongodb.net/?appName=${process.env.MONGO_APP_NAME}`;
        client = new MongoClient(MONGO_URL);
        await client.connect();
        dB = client.db(dbName);
        console.log("Connected to MongoDB at db: " + dbName);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export const getDb = (): Db => dB;