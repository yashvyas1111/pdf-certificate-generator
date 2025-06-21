import mongoose from 'mongoose';

const itemEntrySchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  materialOverride: {
    type: String,
    trim: true
  },
  sizeOverride: {
    type: String,
    trim: true
  }
});

const heatTreatmentCertificateSchema = new mongoose.Schema({
  // 📦 Certificate Numbering
  certificateNoPrefix: {
    type: String,
    default: 'SJWI',
    required: true,
    enum: ['SJWI']
  },
  year: {
    type: String, // visible year in number like "2025"
    default: () => new Date().getFullYear().toString(),
    trim: true
  },
  certificateNoSuffix: {
    type: String, // auto-incremented like "001", "002"
    trim: true
  },

  // 📆 Date Fields
  certificateDate: {
    type: Date,
    required: true
  },
  dateOfTreatment: {
    type: Date,
    required: true
  },

  // 🚚 Shipment Details
  truckNo: {
    type: String,
    trim: true
  },
  containerNumber: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  soNumber: {
    type: String,
    trim: true
  },

  // 🧾 Customer Info
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    trim: true
  },

  // 📋 Items
  items: [itemEntrySchema],

  // 📊 Treatment Details
  qtyTreated: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  attainingTimeMins: {
    type: Number
  },
  totalTreatmentTimeMins: {
    type: Number
  },
  moistureBeforeTreatment: {
    type: Number
  },
  moistureAfterTreatment: {
    type: Number
  },
  note: {
    type: String,
    trim: true
  },

  // 🆕 New fields for April-based cycle logic
  cycleYear: {
    type: Number,
    required: true
  },
  serialNumber: {
    type: Number,
    required: true
  }

}, { timestamps: true });


// ✅ Unique index on cycle + serial
heatTreatmentCertificateSchema.index(
  { certificateNoPrefix: 1, cycleYear: 1, serialNumber: 1 },
  { unique: true }
);


// ✅ Auto-generate suffix & handle fiscal-year reset
heatTreatmentCertificateSchema.pre('save', async function (next) {
  if (!this.isNew || this.certificateNoSuffix) {
    return next();
  }

  const Certificate = this.constructor;
  const today = this.certificateDate || new Date();

  const currentYear = today.getFullYear();
  const aprilFirst = new Date(currentYear, 3, 1); // April = 3 (0-indexed)
  const cycleYear = today < aprilFirst ? currentYear - 1 : currentYear;

  const lastCert = await Certificate
    .findOne({ certificateNoPrefix: this.certificateNoPrefix, cycleYear })
    .sort({ serialNumber: -1 })
    .select('serialNumber')
    .lean();

  const nextSerial = lastCert ? lastCert.serialNumber + 1 : 1;

  this.cycleYear = cycleYear;
  this.serialNumber = nextSerial;
  this.certificateNoSuffix = String(nextSerial).padStart(3, '0');
  this.year = currentYear.toString();

  next();
});

const Certificate = mongoose.model('HeatTreatmentCertificate', heatTreatmentCertificateSchema);
export default Certificate;
