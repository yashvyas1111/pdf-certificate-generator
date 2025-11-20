import { generateCertificatePdf } from './utils/generatePdf.js';
import fs from 'fs';

async function run() {
  try {
    // 🔹 Dummy test data – similar to what your controller sends
    const testData = {
      certificateNo: 'SJWI/2025-26/999',
      certificateDate: '2025-11-20',
      year: '2025-26',
      customerName: 'Test Customer',
      customerAddress: '123 Demo Street, Ahmedabad',
      items: [
        { code: 'PALLET-01', material: 'Pine Wood', size: '1200x1000mm' },
        { code: 'PALLET-02', material: 'Hard Wood', size: '1000x800mm' },
      ],
      qtyTreated1: 100,
      qtyTreated2: 0,
      truckNo: 'GJ01AB1234',
      batchNumber: 'BATCH-001',
      soNumber: 'SO-111',
      containerNumber: 'CONT-001',
      country: 'India',
      note: 'Testing PDF generation only',
      dateOfTreatment: '2025-11-20',
      attainingTimeMins: 30,
      totalTreatmentTimeMins: 180,
      moistureBeforeTreatment: 20,
      moistureAfterTreatment: 12,
      includeHeader: true,
    };

    console.log('⏳ Generating test PDF...');
    const pdfBuffer = await generateCertificatePdf(testData);

    // 🔹 Save locally to verify
    fs.writeFileSync('test.pdf', pdfBuffer);
    console.log('✅ PDF created successfully: test.pdf');
  } catch (err) {
    console.error('❌ Error generating test PDF:', err);
  }
}

run();
