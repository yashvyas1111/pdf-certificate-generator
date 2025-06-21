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
    default: () => getFinancialYear().toString(),
    trim: true
  },
  
  certificateNoSuffix: {
    type: String,
    trim: true
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

// ✅ Certificate Number Auto-Generation
heatTreatmentCertificateSchema.index(
  { certificateNoPrefix: 1, year: 1, certificateNoSuffix: 1 },
  { unique: true }
);

heatTreatmentCertificateSchema.pre('save', async function (next) {
  if (this.isNew && !this.certificateNoSuffix) {
    const doc = this;
    const CertificateModel = this.constructor;

    if (!doc.year) {
      if (
        doc.certificateDate instanceof Date && //if year not find then get year from the certificate date
        !isNaN(doc.certificateDate)
      ) {
        doc.year = getFinancialYear(doc.certificateDate).toString();
      } else {
        return next(
          new Error(
            'Year is required to generate certificate suffix, and could not be derived from certificateDate.'
          )
        );
      }
    }

    try {
      const lastCertificate = await CertificateModel
        .findOne({
          certificateNoPrefix: doc.certificateNoPrefix,
          year: doc.year
        })
        .sort({ certificateNoSuffix: -1 });

      let nextSuffixNumber = 1;
      if (lastCertificate && lastCertificate.certificateNoSuffix) {
        const lastSuffixAsInt = parseInt(lastCertificate.certificateNoSuffix, 10);
        if (!isNaN(lastSuffixAsInt)) {
          nextSuffixNumber = lastSuffixAsInt + 1;
        }
      }

      doc.certificateNoSuffix = nextSuffixNumber.toString().padStart(3, '0');
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Certificate = mongoose.model('HeatTreatmentCertificate', heatTreatmentCertificateSchema);

export default Certificate;
