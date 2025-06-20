import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';

handlebars.registerHelper('inc', (v) => parseInt(v, 10) + 1);  // 0 → 1, 1 → 2 …

export const generateCertificatePdf = async (certificateData) => {
  const formatDate = (d) => {
    const date = new Date(d);
    return isNaN(date) ? '' : date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // Shape every item so template can access code / material / size directly
  const itemsForTemplate = (certificateData.items || []).map((it) => ({
    code:     it.code || it.item?.code || '',
    material: it.material || it.materialOverride || it.item?.material || '',
    size:     it.size || it.sizeOverride || it.item?.size || ''
  }));


//Main logo
const logoFile   = path.join(process.cwd(), 'public', 'images', 'Logo.png');
const logoBuffer = await fs.readFile(logoFile);
const base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;



// HT logo
const htLogoFile = path.join(process.cwd(), 'public', 'images', 'htlogo.jpeg');
const htLogoBuffer = await fs.readFile(htLogoFile);
const base64HtLogo = `data:image/png;base64,${htLogoBuffer.toString('base64')}`;

// Signature
const signFile = path.join(process.cwd(), 'public', 'images', 'Dharmesh Sing.jpeg');
const signBuffer = await fs.readFile(signFile);
const base64Signature = `data:image/png;base64,${signBuffer.toString('base64')}`;

  const processed = {
    ...certificateData,
    certificateDate:  formatDate(certificateData.certificateDate),
    dateOfTreatment:  formatDate(certificateData.dateOfTreatment),
    items:            itemsForTemplate,
    logoPath:         base64Logo ,
    htLogoPath:       base64HtLogo,
    signaturePath:    base64Signature,
  };

  const templatePath = path.join(process.cwd(), 'templates', 'certificateTemplate.html');
  const htmlTemplate = await fs.readFile(templatePath, 'utf-8');

  const html = handlebars.compile(htmlTemplate)(processed);
  console.log('Using Chromium executable at:', puppeteer.executablePath());

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  
  
  const page     = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    
    width:'233mm',
    height:'333mm',
    
    margin: {bottom: '20px', right: '50px' },
    printBackground: true   
  });

  await browser.close();
  return pdf;
};
