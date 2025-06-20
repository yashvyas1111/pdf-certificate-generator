import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';

// Register Handlebars helper
handlebars.registerHelper('inc', (v) => parseInt(v, 10) + 1);

// Path to the Chromium installed by Puppeteer on Render
const CHROMIUM_PATH = '/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.55/chrome-linux64/chrome';

export const generateCertificatePdf = async (certificateData) => {
  try {
    console.log("✅ Checking Chromium path:", CHROMIUM_PATH);
    const exists = await fs.pathExists(CHROMIUM_PATH);
    console.log("📦 Chrome exists:", exists);
    if (!exists) throw new Error("Chromium executable not found on Render.");

    // Format date helper
    const formatDate = (d) => {
      const date = new Date(d);
      return isNaN(date) ? '' : date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    };

    // Process items
    const itemsForTemplate = (certificateData.items || []).map((it) => ({
      code:     it.code || it.item?.code || '',
      material: it.material || it.materialOverride || it.item?.material || '',
      size:     it.size || it.sizeOverride || it.item?.size || ''
    }));

    // Encode logo images
    const logoBuffer   = await fs.readFile(path.join(process.cwd(), 'public/images/Logo.png'));
    const base64Logo   = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    const htLogoBuffer = await fs.readFile(path.join(process.cwd(), 'public/images/htlogo.jpeg'));
    const base64HtLogo = `data:image/png;base64,${htLogoBuffer.toString('base64')}`;
    const signBuffer   = await fs.readFile(path.join(process.cwd(), 'public/images/Dharmesh Sing.jpeg'));
    const base64Sign   = `data:image/png;base64,${signBuffer.toString('base64')}`;

    // Prepare data for template
    const processed = {
      ...certificateData,
      certificateDate:  formatDate(certificateData.certificateDate),
      dateOfTreatment:  formatDate(certificateData.dateOfTreatment),
      items:            itemsForTemplate,
      logoPath:         base64Logo,
      htLogoPath:       base64HtLogo,
      signaturePath:    base64Sign
    };

    const templatePath = path.join(process.cwd(), 'templates', 'certificateTemplate.html');
    const htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    const html = handlebars.compile(htmlTemplate)(processed);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROMIUM_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '233mm',
      height: '333mm',
      margin: { bottom: '20px', right: '50px' },
      printBackground: true
    });

    await browser.close();
    return pdfBuffer;

  } catch (err) {
    console.error("❌ PDF generation failed:", err.message);
    throw err;
  }
};
