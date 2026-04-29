const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF(inputHtml, outputPdf) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Load the HTML file
    const fileUrl = 'file://' + path.resolve(inputHtml);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Inject CSS to hide navbar and background, and style for print
    await page.addStyleTag({
        content: `
            .navbar, .background-animation, .status-indicator-nav { display: none !important; }
            body { background: #0f172a !important; color: #e2e8f0 !important; margin: 0 !important; padding: 0 !important; }
            .doc-content { margin: 0 !important; padding: 40px !important; border: none !important; box-shadow: none !important; max-width: 100% !important; }
            /* Ensure text is visible on dark background if it wasn't already */
            h1, h2, h3, h4, h5, h6 { color: #f8fafc !important; }
            p, li, td, th { color: #cbd5e1 !important; }
            a { color: #3b82f6 !important; text-decoration: none !important; }
            /* Hide any other interactive elements if needed */
            button, .btn { display: none !important; }
        `
    });

    // Generate PDF
    await page.pdf({
        path: outputPdf,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    console.log(`Generated ${outputPdf}`);
}

(async () => {
    try {
        await generatePDF('doc-water.html', 'water-analysis-doc.pdf');
        await generatePDF('doc-stress.html', 'stress-analysis-doc.pdf');
    } catch (error) {
        console.error('Error generating PDFs:', error);
    }
})();
