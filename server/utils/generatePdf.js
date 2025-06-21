import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/* ──────────────────────────────────────────────────────────── */
/* Handlebars helpers                                           */
/* ──────────────────────────────────────────────────────────── */
handlebars.registerHelper('inc', v => parseInt(v, 10) + 1);

/* ──────────────────────────────────────────────────────────── */
/* Main PDF generator                                           */
/* ──────────────────────────────────────────────────────────── */
export const generateCertificatePdf = async certificateData => {
  try {
    /* ----- date formatter ---------------------------------- */
    const formatDate = d => {
      const date = new Date(d);
      return isNaN(date)
        ? ''
        : date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
    };

    /* ----- prep items for the template ---------------------- */
    const itemsForTemplate = (certificateData.items || []).map(it => ({
      code:     it.code || it.item?.code || '',
      material: it.material || it.materialOverride || it.item?.material || '',
      size:     it.size || it.sizeOverride || it.item?.size || '',
    }));

    /* ----- embed images as base64 --------------------------- */
    const logoBuf = await fs.readFile(
      path.join(process.cwd(), 'public/images/Logo.png'),
    );
    const htBuf = await fs.readFile(
      path.join(process.cwd(), 'public/images/htlogo.jpeg'),
    );
    const signBuf = await fs.readFile(
      path.join(process.cwd(), 'public/images/Dharmesh Sing.jpeg'),
    );

    /* ----- template data ------------------------------------ */
    const processed = {
      ...certificateData,
      certificateDate:  formatDate(certificateData.certificateDate),
      dateOfTreatment:  formatDate(certificateData.dateOfTreatment),
      items:            itemsForTemplate,
      logoPath:         `data:image/png;base64,${logoBuf.toString('base64')}`,
      htLogoPath:       `data:image/png;base64,${htBuf.toString('base64')}`,
      signaturePath:    `data:image/png;base64,${signBuf.toString('base64')}`,
    };

    /* ----- compile HTML ------------------------------------- */
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'certificateTemplate.html',
    );
    const htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    const html = handlebars.compile(htmlTemplate)(processed);

    /* ----- launch Chromium (serverless‑safe) ---------------- */
    console.log('✅ Using Chromium from:', await chromium.executablePath());
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    /* ----- render PDF --------------------------------------- */
    const pdfBuffer = await page.pdf({
      width: '233mm',
      height: '333mm',
      margin: { bottom: '20px', right: '50px' },
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error('❌ PDF generation failed:', err);
    throw err;
  }
};
