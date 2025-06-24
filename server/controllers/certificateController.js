/* ------------------------------------------------------------------ */
/* Certificate Controller – with PDF generation + email integration   */
/* ------------------------------------------------------------------ */

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import Certificate from '../models/Certificate.js'
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import { generateCertificatePdf } from '../utils/generatePdf.js';

export function fyStart(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= 3) { // April onwards
    return year;
  } else { // January to March
    return year - 1;
  }
}

export function fyRange(date=new Date()) {
  const start = fyStart(date)
  const end= (start+1).toString().slice(-2);
  return `${start}-${end}`
}

/* ------------------------------------------------------------------ */
/*  EMAIL (Gmail App‑Password) TRANSPORTER ‑ reused across functions  */
/* ------------------------------------------------------------------ */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // e.g. yourbusiness@gmail.com
    pass: process.env.EMAIL_APP_PASS,  // 16‑char Gmail App Password
  },
});

/* Helper – format date as "11 June 2025" */
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/* Create Certificate  + PDF                                          */
/* ------------------------------------------------------------------ */
export const createCertificate = async (req, res) => {
  try {
    /* 1. Resolve/insert items -------------------------------------- */
    const items = await Promise.all(
      (req.body.items || []).map(async (entry) => {
        if (mongoose.Types.ObjectId.isValid(entry.item)) {
          return {
            item: entry.item,
            materialOverride: entry.materialOverride,
            sizeOverride: entry.sizeOverride,
          };
        }
        /* If item code string, find or create Item */
        let existingItem = await Item.findOne({ code: entry.item });
        if (!existingItem) {
          existingItem = new Item({
            code: entry.item,
            material: entry.materialOverride || '',
            size: entry.sizeOverride || '',
          });
          await existingItem.save();
        }
        return {
          item: existingItem._id,
          materialOverride: entry.materialOverride,
          sizeOverride: entry.sizeOverride,
        };
      }),
    );

       /* 2. Prepare certificate data */
    // Ensure year and financialYear fields are set correctly:
    const dateForFY = req.body.certificateDate ? new Date(req.body.certificateDate) : new Date();
    const financialYearStart = fyStart(dateForFY); // Number like 2025
    const financialYearRange = fyRange(dateForFY); // String like "2025-26"

    /* 2. Save certificate ------------------------------------------ */
    const certData = { ...req.body, items, year: financialYearRange,       // FY string like "2025-26"
      financialYear: financialYearStart, // FY number like 2025 (for suffix query)
    };
    // delete certData.certificateNoSuffix;
    const newCert = new Certificate(certData);
    await newCert.save();

    /* 3. Prepare populated values for PDF -------------------------- */
    const customer = await Customer.findOne({ name: newCert.customerName }).lean();
    const populatedItems = await Promise.all(
      newCert.items.map(async (entry) => {
        const item = await Item.findById(entry.item).lean();
        return {
          code: item?.code || '',
          material: entry.materialOverride || item?.material || '',
          size: entry.sizeOverride || item?.size || '',
        };
      }),
    );
    const certificateNo = `${newCert.certificateNoPrefix}/${newCert.certificateNoSuffix}`;

    /* 4. Generate PDF buffer --------------------------------------- */
    await generateCertificatePdf({
      
      certificateNo,
      certificateDate: formatDate(newCert.certificateDate),
      year: newCert.year,
      customerName: newCert.customerName,
      customerAddress: customer?.address || newCert.customerAddress,
      items: populatedItems,
      qtyTreated1: newCert.qtyTreated1,
      qtyTreated2: newCert.qtyTreated2,
      truckNo: newCert.truckNo,
      batchNumber: newCert.batchNumber,
      soNumber: newCert.soNumber,
      containerNumber: newCert.containerNumber,
      country: newCert.country,
      note: newCert.note,
      dateOfTreatment: formatDate(newCert.dateOfTreatment),
      attainingTimeMins: newCert.attainingTimeMins,
      totalTreatmentTimeMins: newCert.totalTreatmentTimeMins,
      moistureBeforeTreatment: newCert.moistureBeforeTreatment,
      moistureAfterTreatment: newCert.moistureAfterTreatment,
      includeHeader: true, 
    });

    /* 5. Respond --------------------------------------------------- */
    res.status(201).json({
      message: 'Certificate created and PDF generated',
      certificate: newCert,
    });
  } catch (err) {
    console.error('❌ Certificate creation error:', err); 
    res.status(500).json({ message: 'Certificate creation failed', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* Get ALL certificates – newest first                                */
/* ------------------------------------------------------------------ */
export const getAllCertificates = async (_req, res) => {
  try {
    const certs = await Certificate.find()
      .populate('items.item', 'code')
      .sort({ createdAt: -1 })
      .lean();
    res.json(certs);
  } catch {
    res.status(500).json({ message: 'Error fetching certificates' });
  }
};


/* ------------------------------------------------------------------ */
/* Search Certificates – by batch, date or item code (partial match)  */
/* ------------------------------------------------------------------ */
export const searchCertificates = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i'); // case-insensitive

    // Optional exact date parsing
    let dateMatch = null;
    const parsedDate = new Date(query);
    if (!isNaN(parsedDate)) {
      const next = new Date(parsedDate);
      next.setDate(parsedDate.getDate() + 1);
      dateMatch = { $gte: parsedDate, $lt: next };
    }

    const certs = await Certificate.aggregate([
      // Build full certificate number for search
      {
        $addFields: {
          certNoFull: {
            $concat: [
              '$certificateNoPrefix',
              '/',
              '$year',
              '/',
              '$certificateNoSuffix'
            ]
          }
        }
      },

      // Lookup full item documents
      {
        $lookup: {
          from: 'items',
          localField: 'items.item',
          foreignField: '_id',
          as: 'itemsData'
        }
      },

      // Merge item info into each entry in items[]
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'row',
              in: {
                $mergeObjects: [
                  '$$row',
                  {
                    item: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$itemsData',
                            as: 'doc',
                            cond: { $eq: ['$$doc._id', '$$row.item'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },

      // (Optional) Remove helper array
      { $project: { itemsData: 0 } },

      // Match across many fields
      {
        $match: {
          $or: [
            { certNoFull: { $regex: regex } },
            { batchNumber: { $regex: regex } },
            { soNumber: { $regex: regex } },
            { truckNo: { $regex: regex } },
            { containerNumber: { $regex: regex } },
            { customerName: { $regex: regex } },
            { customerAddress: { $regex: regex } },
            { country: { $regex: regex } },

            // ✅ Now works: item.code, material, size
            { 'items.item.code': { $regex: regex } },
            { 'items.item.material': { $regex: regex } },
            { 'items.item.size': { $regex: regex } },

            // Also include override fields
            { 'items.materialOverride': { $regex: regex } },
            { 'items.sizeOverride': { $regex: regex } },

            // Optional exact-date search
            ...(dateMatch
              ? [
                  { certificateDate: dateMatch },
                  { dateOfTreatment: dateMatch }
                ]
              : [])
          ]
        }
      },

      // Sort newest first
      { $sort: { createdAt: -1 } }
    ]);

    res.json(certs);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};



/* ------------------------------------------------------------------ */
/* Get ONE certificate by ID                                          */
/* ------------------------------------------------------------------ */
export const getCertificateById = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('items.item', 'code')
      .lean();
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json(cert);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error fetching certificate', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* Delete a certificate                                               */
/* ------------------------------------------------------------------ */
export const deleteCertificate = async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Certificate deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting certificate' });
  }
};

/* ------------------------------------------------------------------ */
/* Update a certificate                                               */
/* ------------------------------------------------------------------ */
export const updateCertificate = async (req, res) => {
  try {
    const updated = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate('items.item', 'code')
      .lean();
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Error updating certificate' });
  }
};

/* ------------------------------------------------------------------ */
/* Download PDF inline                                                */
/* ------------------------------------------------------------------ */
export const downloadCertificatePdf = async (req, res) => {
  try {

    const includeHeader = req.query.header !== 'false';

    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const customer = await Customer.findOne({ name: cert.customerName }).lean();
    const populatedItems = await Promise.all(
      cert.items.map(async (entry) => {
        const item = await Item.findById(entry.item).lean();
        return {
          code: item?.code ?? '',
          material: entry.materialOverride || item?.material || '',
          size: entry.sizeOverride || item?.size || '',
        };
      }),
    );

    const certificateNo = `${cert.certificateNoPrefix}/${cert.certificateNoSuffix}`;

    const pdfBuffer = await generateCertificatePdf({
      certificateNo,
      certificateDate: formatDate(cert.certificateDate),
      year: cert.year,
      customerName: cert.customerName,
      customerAddress: customer?.address || cert.customerAddress,
      items: populatedItems,
      qtyTreated1: cert.qtyTreated1,
      qtyTreated2: cert.qtyTreated2,
      truckNo: cert.truckNo,
      batchNumber: cert.batchNumber,
      soNumber: cert.soNumber,
      containerNumber: cert.containerNumber,
      country: cert.country,
      note: cert.note,
      dateOfTreatment: formatDate(cert.dateOfTreatment),
      attainingTimeMins: cert.attainingTimeMins,
      totalTreatmentTimeMins: cert.totalTreatmentTimeMins,
      moistureBeforeTreatment: cert.moistureBeforeTreatment,
      moistureAfterTreatment: cert.moistureAfterTreatment,
      includeHeader
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificateNo}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'PDF download failed', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* Preview PDF (no save)                                              */
/* ------------------------------------------------------------------ */
export const previewCertificate = async (req, res) => {
  try {
    const data = req.body;
    const populatedItems = await Promise.all(
      (data.items || []).map(async (entry) => {
        const item = await Item.findById(entry.item).lean();
        return {
          code: item?.code || '',
          material: entry.materialOverride || item?.material || '',
          size: entry.sizeOverride || item?.size || '',
        };
      }),
    );

    const certificateNo = `${data.certificateNoPrefix}/${
      data.certificateNoSuffix || 'PREVIEW'
    }`;

    const pdfBuffer = await generateCertificatePdf({
      ...data,
      certificateNo,
      certificateDate: formatDate(data.certificateDate),
      dateOfTreatment: formatDate(data.dateOfTreatment),
      items: populatedItems,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=certificate-preview.pdf',
    });
    res.send(pdfBuffer);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'PDF Preview failed', error: err.message });
  }
};

/* ------------------------------------------------------------------ */
/* NEW – Send PDF to any email address                                */
/* ------------------------------------------------------------------ */
export const sendCertificateEmail = async (req, res) => {
  const { id } = req.params;
  const { email,includeHeader = true} = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });


  try {
    const cert = await Certificate.findById(id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const { customerName } = cert;  

    const customer = await Customer.findOne({ name: cert.customerName }).lean();
    const populatedItems = await Promise.all(
      cert.items.map(async (entry) => {
        const item = await Item.findById(entry.item).lean();
        return {
          code: item?.code || '',
          material: entry.materialOverride || item?.material || '',
          size: entry.sizeOverride || item?.size || '',
        };
      }),
    );

    const certificateNo = `${cert.certificateNoPrefix}/${cert.year}/${cert.certificateNoSuffix}`;


    const pdfBuffer = await generateCertificatePdf({
      certificateNo,
      certificateDate: formatDate(cert.certificateDate),
      year: cert.year,
      customerName: cert.customerName,
      customerAddress: customer?.address || cert.customerAddress,
      items: populatedItems,
      qtyTreated1: cert.qtyTreated1,
      qtyTreated2: cert.qtyTreated2,
      truckNo: cert.truckNo,
      batchNumber: cert.batchNumber,
      soNumber: cert.soNumber,
      containerNumber: cert.containerNumber,
      country: cert.country,
      note: cert.note,
      dateOfTreatment: formatDate(cert.dateOfTreatment),
      attainingTimeMins: cert.attainingTimeMins,
      totalTreatmentTimeMins: cert.totalTreatmentTimeMins,
      moistureBeforeTreatment: cert.moistureBeforeTreatment,
      moistureAfterTreatment: cert.moistureAfterTreatment,
      includeHeader,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Heat Treatment Certificate – ${certificateNo}`,
      text: `Dear ${customerName},\n\nPlease find attached your Heat Treatment Certificate (${certificateNo}).\n\nRegards,\nShree Jalaram Pallets`,
      attachments: [
        {
          filename: `${certificateNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: `Certificate sent to ${email}` });
  } catch (err) {
    console.error('Email send error:', err);
    res
      .status(500)
      .json({ message: 'Failed to send email', error: err.message });
  }
};


/* ------------------------------------------------------------------ */
/* Get next certificate suffix                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Get next certificate suffix                                         */
/* ------------------------------------------------------------------ */
export const getNextCertificateSuffix = async (req, res) => {
  try {
    // 1️⃣  Parse reference date (today if none supplied)
    const refDate = req.query.date ? new Date(req.query.date) : new Date();
    const fyStartYear = fyStart(refDate);   // e.g. 2025

    // 2️⃣  If no certificate exists for this FY, start from 001
    const count = await Certificate.countDocuments({ financialYear: fyStartYear });
    if (count === 0) {
      return res.json({ nextSuffix: '001' });
    }

    // 3️⃣  Otherwise, find the last suffix and increment it
    const lastCert = await Certificate
      .findOne({ financialYear: fyStartYear })
      .sort({ certificateNoSuffix: -1 })     // highest suffix first
      .lean();

    let nextSuffixNumber = 1;
    if (lastCert?.certificateNoSuffix) {
      const lastNum = parseInt(lastCert.certificateNoSuffix, 10);
      if (!isNaN(lastNum)) nextSuffixNumber = lastNum + 1;
    }

    const nextSuffix = nextSuffixNumber.toString().padStart(3, '0');
    res.json({ nextSuffix });
  } catch (err) {
    console.error('Error fetching next certificate suffix:', err);
    res
      .status(500)
      .json({ message: 'Failed to get next suffix', error: err.message });
  }
};
