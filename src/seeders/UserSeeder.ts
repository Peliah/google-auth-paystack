import { BaseSeeder } from './BaseSeeder';
import User, { IUser } from '../models/user';

export class UserSeeder extends BaseSeeder {
    async seed(): Promise<void> {
        const users: Partial<IUser>[] = [
            {
                username: 'admin',
                email: 'admin@pickme.com',
                password: 'admin123',
                role: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                phone: '+1234567890',
                bio: 'System administrator',
                rating: 5.0
            },
            {
                username: 'john_doe',
                email: 'john.doe@email.com',
                password: 'password123',
                role: 'user',
                isDriver: true,
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567891',
                bio: 'Friendly driver with 5 years experience',
                rating: 4.8,
                car: {
                    model: 'Toyota Camry',
                    color: 'Silver',
                    licensePlate: 'ABC123'
                }
            },
            {
                username: 'jane_smith',
                email: 'jane.smith@email.com',
                password: 'password123',
                role: 'user',
                isDriver: true,
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '+1234567892',
                bio: 'Safe and reliable driver',
                rating: 4.9,
                car: {
                    model: 'Honda Civic',
                    color: 'Blue',
                    licensePlate: 'XYZ789'
                }
            },
            {
                username: 'mike_wilson',
                email: 'mike.wilson@email.com',
                password: 'password123',
                role: 'user',
                isDriver: false,
                firstName: 'Mike',
                lastName: 'Wilson',
                phone: '+1234567893',
                bio: 'Regular commuter',
                rating: 4.5
            },
            {
                username: 'sarah_jones',
                email: 'sarah.jones@email.com',
                password: 'password123',
                role: 'user',
                isDriver: true,
                firstName: 'Sarah',
                lastName: 'Jones',
                phone: '+1234567894',
                bio: 'Professional driver with clean record',
                rating: 4.7,
                car: {
                    model: 'Nissan Altima',
                    color: 'White',
                    licensePlate: 'DEF456'
                }
            },
            {
                username: 'alex_brown',
                email: 'alex.brown@email.com',
                password: 'password123',
                role: 'user',
                isDriver: false,
                firstName: 'Alex',
                lastName: 'Brown',
                phone: '+1234567895',
                bio: 'Student looking for rides',
                rating: 4.2
            },
            {
                username: 'emma_davis',
                email: 'emma.davis@email.com',
                password: 'password123',
                role: 'user',
                isDriver: true,
                firstName: 'Emma',
                lastName: 'Davis',
                phone: '+1234567896',
                bio: 'Experienced driver, loves music',
                rating: 4.6,
                car: {
                    model: 'Ford Focus',
                    color: 'Red',
                    licensePlate: 'GHI789'
                }
            },
            {
                username: 'david_miller',
                email: 'david.miller@email.com',
                password: 'password123',
                role: 'user',
                isDriver: false,
                firstName: 'David',
                lastName: 'Miller',
                phone: '+1234567897',
                bio: 'Business professional',
                rating: 4.4
            }
        ];

        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`Created user: ${user.username}`);
        }
    }

    async clear(): Promise<void> {
        await User.deleteMany({});
        console.log('Cleared all users');
    }
}

