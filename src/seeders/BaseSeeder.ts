import mongoose from 'mongoose';

export abstract class BaseSeeder {
    abstract seed(): Promise<void>;
    abstract clear(): Promise<void>;

    async run(): Promise<void> {
        try {
            console.log(`Starting ${this.constructor.name}...`);
            await this.clear();
            await this.seed();
            console.log(`✅ ${this.constructor.name} completed successfully`);
        } catch (error) {
            console.error(`❌ ${this.constructor.name} failed:`, error);
            throw error;
        }
    }

    protected async connect(): Promise<void> {
        if (mongoose.connection.readyState === 0) {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pick-me';
            await mongoose.connect(mongoUri);
            console.log('Connected to MongoDB');
        }
    }

    protected async disconnect(): Promise<void> {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

