import { BaseSeeder } from './BaseSeeder';
import Ride, { IRide } from '../models/ride';
import User from '../models/user';
import Vehicle from '../models/vehicle';
import { Types } from 'mongoose';

export class RideSeeder extends BaseSeeder {
    async seed(): Promise<void> {
        // Get driver users and their vehicles
        const drivers = await User.find({ isDriver: true });
        const vehicles = await Vehicle.find({ is_default: true });

        if (drivers.length === 0) {
            console.log('No drivers found. Please run UserSeeder first.');
            return;
        }

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const rides: Partial<IRide>[] = [
            {
                driverId: drivers[0]._id,
                vehicleId: vehicles[0]?._id,
                startPoint: {
                    name: 'Douala Central Station',
                    coordinates: [9.7031, 4.0483] // Douala, Cameroon
                },
                endPoint: {
                    name: 'Douala International Airport',
                    coordinates: [9.7194, 4.0061]
                },
                departureTime: tomorrow,
                estimatedDuration: 45,
                availableSeats: 3,
                pricePerSeat: 2500, // CFA francs
                rules: ['No smoking', 'No pets', 'Quiet ride preferred'],
                isActive: true,
                status: 'upcoming'
            },
            {
                driverId: drivers[1]._id,
                vehicleId: vehicles[1]?._id,
                startPoint: {
                    name: 'University of Yaoundé I',
                    coordinates: [11.5021, 3.8480] // Yaoundé, Cameroon
                },
                endPoint: {
                    name: 'Mfoundi Market',
                    coordinates: [11.5167, 3.8667]
                },
                departureTime: dayAfterTomorrow,
                estimatedDuration: 30,
                availableSeats: 2,
                pricePerSeat: 1500, // CFA francs
                rules: ['Student discount available'],
                isActive: true,
                status: 'upcoming'
            },
            {
                driverId: drivers[2]._id,
                vehicleId: vehicles[2]?._id,
                startPoint: {
                    name: 'Bastos Business District',
                    coordinates: [11.5167, 3.8667] // Yaoundé
                },
                endPoint: {
                    name: 'Melen Shopping Center',
                    coordinates: [11.5000, 3.8500]
                },
                departureTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
                estimatedDuration: 35,
                availableSeats: 4,
                pricePerSeat: 2000, // CFA francs
                rules: ['Business attire preferred', 'No eating'],
                isActive: true,
                status: 'active'
            },
            {
                driverId: drivers[3]._id,
                vehicleId: vehicles[3]?._id,
                startPoint: {
                    name: 'Emana Residential',
                    coordinates: [11.4833, 3.8333] // Yaoundé
                },
                endPoint: {
                    name: 'Mfoundi Market',
                    coordinates: [11.5167, 3.8667]
                },
                departureTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
                estimatedDuration: 25,
                availableSeats: 3,
                pricePerSeat: 1800, // CFA francs
                rules: ['Family friendly'],
                isActive: true,
                status: 'active'
            },
            {
                driverId: drivers[0]._id,
                vehicleId: vehicles[4]?._id,
                startPoint: {
                    name: 'Douala Railway Station',
                    coordinates: [9.7031, 4.0483] // Douala
                },
                endPoint: {
                    name: 'Limbe Beach Resort',
                    coordinates: [9.3167, 4.0167] // Limbe, Cameroon
                },
                departureTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
                estimatedDuration: 60,
                availableSeats: 2,
                pricePerSeat: 3500, // CFA francs
                rules: ['Weekend trip', 'Music allowed'],
                isActive: true,
                status: 'active'
            },
            {
                driverId: drivers[1]._id,
                vehicleId: vehicles[5]?._id,
                startPoint: {
                    name: 'Yaoundé Central Hospital',
                    coordinates: [11.5167, 3.8667] // Yaoundé
                },
                endPoint: {
                    name: 'Nlongkak Residential',
                    coordinates: [11.5000, 3.8500]
                },
                departureTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
                estimatedDuration: 20,
                availableSeats: 1,
                pricePerSeat: 1200, // CFA francs
                rules: ['Quiet ride', 'No strong scents'],
                isActive: true,
                status: 'active'
            }
        ];

        for (const rideData of rides) {
            const ride = new Ride(rideData);
            await ride.save();
            console.log(`Created ride from ${ride.startPoint.name} to ${ride.endPoint.name} at ${ride.departureTime.toISOString()}`);
        }
    }

    async clear(): Promise<void> {
        await Ride.deleteMany({});
        console.log('Cleared all rides');
    }
}