import mongoose from 'mongoose';

const utmTrackingSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  utm_source: {
    type: String,
    trim: true
  },
  utm_medium: {
    type: String,
    trim: true
  },
  utm_campaign: {
    type: String,
    trim: true
  },
  utm_content: {
    type: String,
    trim: true
  },
  utm_term: {
    type: String,
    trim: true
  },
  src: {
    type: String,
    trim: true
  },
  sck: {
    type: String,
    trim: true
  },
  fbclid: {
    type: String,
    trim: true
  },
  gclid: {
    type: String,
    trim: true
  },
  // Dados adicionais de tracking
  user_agent: {
    type: String
  },
  referrer: {
    type: String
  },
  page_url: {
    type: String
  },
  // Timestamps
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // TTL - expira em 30 dias
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 dias em segundos
  }
}, {
  timestamps: true
});

// Middleware para atualizar lastUpdated
utmTrackingSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const UtmTracking = mongoose.model('UtmTracking', utmTrackingSchema);

export default UtmTracking; 