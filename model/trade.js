const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradesSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  team: String,
  year: Number,
  condition: String,
  image: {
    type: String,
    default: '/Picture/image.png'
  },
  status: {
    type: String,
    default: 'Available'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Card', tradesSchema, 'Card');
