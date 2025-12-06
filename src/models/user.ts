import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
    username: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    isDriver?: boolean;
    car?: {
        model: string;
        color: string;
        licensePlate: string;
    };
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
    bio?: string;
    rating?: number;
    googleId?: string;
    authProvider: 'local' | 'google';
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'Username must be unique'],
        maxlength: [20, 'Username must be less than 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email must be unique']
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: '{VALUE} is not a valid role'
        },
        default: 'user',
        required: [true, 'Role is required']
    },
    isDriver: { type: Boolean, default: false },
    car: {
        model: { type: String },
        color: { type: String },
        licensePlate: { type: String },
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, unique: true, sparse: true },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
        required: true,
    },
}, {
    timestamps: true,
});

userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

export default model<IUser>('User', userSchema);