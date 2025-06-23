// models/HeatTreatmentCertificate.js
import mongoose from 'mongoose';


function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based (0 = January, 3 = April)
  
  // If month is April (3) or later, financial year starts from current year (eg.certificate no 001)
  
  if (month >= 3) { // April onwards (3 = April, 4 = May, etc.)
    return year;
  } else { // January to March
    return year - 1;
  }
}

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
  certificateNoPrefix: {
    type: String,
    default: 'SJWI',
    required: true,
    enum: ['SJWI']
  },
  year: {
    type: String,
    trim: true,
    required:true
  },
  
  financialYear: {
    type: Number,
    required: true,
    index: true,
  },
  
  certificateNoSuffix: {
    type: String,
    trim: true,
    required: true,
  },
  certificateDate: {
    type: Date,
    required: true
  },
  truckNo: {
    type: String,
    trim: true
  },
  dateOfTreatment: {
    type: Date,
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerAddress: {
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

  // ⬇️ NEW way to handle item/material/size
  items: [itemEntrySchema],

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
  }
}, {
  timestamps: true
});

/// Index remains unchanged — ensures unique combination of prefix, FY, and suffix
heatTreatmentCertificateSchema.index(
  { certificateNoPrefix: 1, financialYear: 1, certificateNoSuffix: 1 },
  { unique: true }
);

heatTreatmentCertificateSchema.pre('save', async function (next) {
  // Only generate suffix if this is a new doc AND suffix not already set
  if (!this.isNew || this.certificateNoSuffix) {
    return next();
  }

  try {
    // Validate certificateDate properly
    if (!(this.certificateDate instanceof Date) || isNaN(this.certificateDate)) {
      return next(
        new Error('Valid certificateDate is required to generate suffix')
      );
    }

    // Calculate financialYear and display year string
    const fyStartYear = getFinancialYear(this.certificateDate);
    this.financialYear = fyStartYear;
    this.year = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;

    // Find last certificate with same prefix and financialYear
    const lastCertificate = await this.constructor
      .findOne({
        certificateNoPrefix: this.certificateNoPrefix,
        financialYear: this.financialYear,
      })
      .sort({ certificateNoSuffix: -1 })
      .lean();

    // Calculate next suffix number
    let nextSuffixNumber = 1;
    if (lastCertificate?.certificateNoSuffix) {
      const lastSuffixInt = parseInt(lastCertificate.certificateNoSuffix, 10);
      if (!isNaN(lastSuffixInt)) {
        nextSuffixNumber = lastSuffixInt + 1;
      }
    }

    // Assign suffix padded with leading zeros to length 3 (e.g. 001)
    this.certificateNoSuffix = nextSuffixNumber.toString().padStart(3, '0');

    next();
  } catch (error) {
    next(error);
  }
});

const Certificate = mongoose.model('HeatTreatmentCertificate', heatTreatmentCertificateSchema);

export default Certificate;
