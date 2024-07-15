

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentReference: { type: String, required: true },
    paymentGateway: { type: String, required: true },
    paymentType: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, required: true },
},{timestamps:true});