//band card  store model
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define the BankCardSchema
const BankCardSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    cardNumber: {
        type: String,
    },
    expiryMonth: {
        type: String,
    },
    expiryYear: {
        type: String,
    },
    cvv: {
        type: String,
    },
    cardHolderName: {
        type: String,
    }
},{timestamps:true});

// Create the Model from the Schema
export const UserBankCardDetail = mongoose.model('UserBankCardDetail', BankCardSchema, "UserBankCardDetail");