const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  items: [{
    name: String,
    price: Number,
    description: String
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentReference: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
