
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true
    },
    name: String,
    price: Number,
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    addons: [String]
  }],
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Served', 'Cancelled'],
    default: 'Pending'
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
