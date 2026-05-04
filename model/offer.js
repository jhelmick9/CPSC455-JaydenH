const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    user1: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    card1: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
        required: true
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    card2: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema, 'offers');
