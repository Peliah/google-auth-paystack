import { BaseSeeder } from './BaseSeeder';
import Vehicle, { IVehicle } from '../models/vehicle';
import User from '../models/user';
import { Types } from 'mongoose';

export class VehicleSeeder extends BaseSeeder {
    async seed(): Promise<void> {
        // Get driver users
        const drivers = await User.find({ isDriver: true });

        if (drivers.length === 0) {
            console.log('No drivers found. Please run UserSeeder first.');
            return;
        }

        const vehicles: Partial<IVehicle>[] = [
            {
                ownerId: drivers[0]._id,
                model: 'Toyota Camry',
                color: 'Silver',
                license_plate: 'ABC123',
                year: 2020,
                capacity: 4,
                is_default: true
            },
            {
                ownerId: drivers[1]._id,
                model: 'Honda Civic',
                color: 'Blue',
                license_plate: 'XYZ789',
                year: 2019,
                capacity: 4,
                is_default: true
            },
            {
                ownerId: drivers[2]._id,
                model: 'Nissan Altima',
                color: 'White',
                license_plate: 'DEF456',
                year: 2021,
                capacity: 5,
                is_default: true
            },
            {
                ownerId: drivers[3]._id,
                model: 'Ford Focus',
                color: 'Red',
                license_plate: 'GHI789',
                year: 2018,
                capacity: 4,
                is_default: true
            },
            // Additional vehicles for some drivers
            {
                ownerId: drivers[0]._id,
                model: 'Toyota Prius',
                color: 'Green',
                license_plate: 'JKL012',
                year: 2022,
                capacity: 4,
                is_default: false
            },
            {
                ownerId: drivers[1]._id,
                model: 'Honda Accord',
                color: 'Black',
                license_plate: 'MNO345',
                year: 2020,
                capacity: 5,
                is_default: false
            }
        ];

        for (const vehicleData of vehicles) {
            const vehicle = new Vehicle(vehicleData);
            await vehicle.save();
            console.log(`Created vehicle: ${vehicle.model} (${vehicle.license_plate}) for owner ${vehicle.ownerId}`);
        }
    }

    async clear(): Promise<void> {
        await Vehicle.deleteMany({});
        console.log('Cleared all vehicles');
    }
}

