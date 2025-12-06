import mongoose from 'mongoose';
import { UserSeeder } from './UserSeeder';
import { VehicleSeeder } from './VehicleSeeder';
import { RideSeeder } from './RideSeeder';
import { BookingSeeder } from './BookingSeeder';
import { connectToDatabase } from '@/lib/mongoose';

class DatabaseSeeder {
    private seeders = [
        new UserSeeder(),
        new VehicleSeeder(),
        new RideSeeder(),
        new BookingSeeder()
    ];

    async run(): Promise<void> {
        try {
            await connectToDatabase();

            console.log('🎉 Database seeding completed successfully!');
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            process.exit(1);
        } finally {
            await mongoose.disconnect();
            console.log('👋 Disconnected from MongoDB');
            process.exit(0);
        }
    }

    async clear(): Promise<void> {
        try {
            console.log('🧹 Clearing database...\n');

            // Connect to MongoDB
            await connectToDatabase();

            // Run clear methods in reverse order to respect foreign key constraints
            for (let i = this.seeders.length - 1; i >= 0; i--) {
                await this.seeders[i].clear();
            }

            console.log('🎉 Database cleared successfully!');
        } catch (error) {
            console.error('❌ Database clearing failed:', error);
            process.exit(1);
        } finally {
            await mongoose.disconnect();
            console.log('👋 Disconnected from MongoDB');
            process.exit(0);
        }
    }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'clear') {
    new DatabaseSeeder().clear();
} else {
    new DatabaseSeeder().run();
}

