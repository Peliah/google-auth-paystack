import { Schema, model, Types } from 'mongoose';

interface IToken {
    token: string;
    userId: Types.ObjectId;
}

const tokenSchema = new Schema<IToken>({
    token: {
        type: String,
        require: [true, 'Token is required'],
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        require: [true, 'User ID is required'],
        ref: 'User',
    },
}, {
    timestamps: true,
});

export default model<IToken>('Token', tokenSchema);