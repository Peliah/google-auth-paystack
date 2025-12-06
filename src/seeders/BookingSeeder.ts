import { BaseSeeder } from './BaseSeeder';
import Booking, { IBooking } from '../models/booking';
import Ride from '../models/ride';
import User from '../models/user';
import { Types } from 'mongoose';

export class BookingSeeder extends BaseSeeder {
    async seed(): Promise<void> {
        // Get rides and passengers
        const rides = await Ride.find({ status: { $in: ['active', 'upcoming'] } });
        const passengers = await User.find({ isDriver: false });
        
        if (rides.length === 0 || passengers.length === 0) {
            console.log('No rides or passengers found. Please run RideSeeder and UserSeeder first.');
            return;
        }

        const bookings: Partial<IBooking>[] = [
            {
                rideId: rides[0]._id,
                passengerId: passengers[0]._id,
                seats: 1,
                pricePerSeatSnapshot: rides[0].pricePerSeat,
                totalAmount: rides[0].pricePerSeat * 1,
                status: 'confirmed',
                message: 'Looking forward to the ride!',
                acceptedAt: new Date(),
                audit: [
                    {
                        at: new Date(),
                        actorId: passengers[0]._id,
                        action: 'booking_created',
                        from: 'pending',
                        to: 'pending'
                    },
                    {
                        at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes later
                        actorId: rides[0].driverId,
                        action: 'booking_accepted',
                        from: 'pending',
                        to: 'accepted'
                    },
                    {
                        at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes later
                        actorId: passengers[0]._id,
                        action: 'payment_authorized',
                        from: 'accepted',
                        to: 'confirmed'
                    }
                ]
            },
            {
                rideId: rides[1]._id,
                passengerId: passengers[1]._id,
                seats: 2,
                pricePerSeatSnapshot: rides[1].pricePerSeat,
                totalAmount: rides[1].pricePerSeat * 2,
                status: 'accepted',
                message: 'Need 2 seats for me and my friend',
                acceptedAt: new Date(),
                audit: [
                    {
                        at: new Date(),
                        actorId: passengers[1]._id,
                        action: 'booking_created',
                        from: 'pending',
                        to: 'pending'
                    },
                    {
                        at: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes later
                        actorId: rides[1].driverId,
                        action: 'booking_accepted',
                        from: 'pending',
                        to: 'accepted'
                    }
                ]
            },
            {
                rideId: rides[2]._id,
                passengerId: passengers[2]._id,
                seats: 1,
                pricePerSeatSnapshot: rides[2].pricePerSeat,
                totalAmount: rides[2].pricePerSeat * 1,
                status: 'pending',
                message: 'Regular commuter, very reliable',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
                audit: [
                    {
                        at: new Date(),
                        actorId: passengers[2]._id,
                        action: 'booking_created',
                        from: 'pending',
                        to: 'pending'
                    }
                ]
            },
            {
                rideId: rides[0]._id,
                passengerId: passengers[3]._id,
                seats: 1,
                pricePerSeatSnapshot: rides[0].pricePerSeat,
                totalAmount: rides[0].pricePerSeat * 1,
                status: 'declined',
                message: 'Sorry, I need to cancel',
                declinedAt: new Date(),
                audit: [
                    {
                        at: new Date(),
                        actorId: passengers[3]._id,
                        action: 'booking_created',
                        from: 'pending',
                        to: 'pending'
                    },
                    {
                        at: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes later
                        actorId: rides[0].driverId,
                        action: 'booking_declined',
                        from: 'pending',
                        to: 'declined',
                        reason: 'Driver declined'
                    }
                ]
            },
            {
                rideId: rides[3]._id,
                passengerId: passengers[0]._id,
                seats: 1,
                pricePerSeatSnapshot: rides[3].pricePerSeat,
                totalAmount: rides[3].pricePerSeat * 1,
                status: 'cancelled_by_passenger',
                message: 'Change of plans',
                cancelledAt: new Date(),
                audit: [
                    {
                        at: new Date(),
                        actorId: passengers[0]._id,
                        action: 'booking_created',
                        from: 'pending',
                        to: 'pending'
                    },
                    {
                        at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes later
                        actorId: passengers[0]._id,
                        action: 'booking_cancelled',
                        from: 'pending',
                        to: 'cancelled_by_passenger',
                        reason: 'Passenger cancelled'
                    }
                ]
            }
        ];

        for (const bookingData of bookings) {
            const booking = new Booking(bookingData);
            await booking.save();
            console.log(`Created booking for ride ${booking.rideId} by passenger ${booking.passengerId} with status ${booking.status}`);
        }
    }

    async clear(): Promise<void> {
        await Booking.deleteMany({});
        console.log('Cleared all bookings');
    }
}

