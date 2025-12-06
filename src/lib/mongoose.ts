import mongoose from "mongoose";
import config from "@/config";
import { ConnectOptions } from "mongoose";
import { logger } from "./winston";


const clientOptions: ConnectOptions = {
    dbName: "auth-paystack-db",
    appName: "AUTH-PAYSTACK",
    serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
    },
}

export const connectToDatabase = async (): Promise<void> => {

    if (!config.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in the environment variables");
    }

    try {
        await mongoose.connect(config.MONGO_URI, clientOptions);
        logger.info("Connected to MongoDB successfully", {
            url: config.MONGO_URI,
            options: clientOptions,
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to connect to MongoDB: ${error.message}`);
        }
        logger.error("Error connecting to MongoDB:", error);
        if (config.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

export const disconnectFromDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info("Disconnected from MongoDB successfully", {
            url: config.MONGO_URI,
            options: clientOptions,
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to disconnect from MongoDB: ${error.message}`);
        }
        logger.error("Error disconnecting from MongoDB:", error);
    }
}