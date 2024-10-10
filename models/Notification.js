const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  to_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig'
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  type: {
    type: String,
    default: 'rating',
    enum: ['rating','request', 'order','message']
  },
  description_en: {
    type: String,
    required: true,
  },
  title_en: {
    type: String,
    required: true,
  },
  description_sp: {
    type: String,
    required: true,
  },
  title_sp: {
    type: String,
    required: true,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
