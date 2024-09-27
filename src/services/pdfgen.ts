import got from "got";
import puppeteer from "puppeteer";
import { Buffer } from "node:buffer";
import { PDFDocument } from "pdf-lib";
import { renderToStaticMarkup } from "react-dom/server";
import PaperPage from "../views/paper.js";

async function modifPdf(pdfBuffer: Buffer) {
    const pdf = await PDFDocument.load(pdfBuffer);

    pdf.setTitle("TestnTrack Paper Generator");
    pdf.setAuthor("TestnTrack");
    pdf.setSubject("Custom paper");
    pdf.setProducer("TestnTrack PDF generator");
    pdf.setCreator("testntrack (https://testntrack.com)");
    pdf.setCreationDate(new Date());
    pdf.setModificationDate(new Date());

    const pageIndices = pdf.getPageIndices();

    const pngUrl = "https://tnt-public-storage.s3.ap-south-1.amazonaws.com/logo.png";

    const pngImage = await pdf.embedPng(await got(pngUrl).buffer());
    const pngDims = pngImage.scale(0.15);

    for (const pageIndex of pageIndices) {
        const page = pdf.getPage(pageIndex);
        const pngImageCoords = {
            x: page.getWidth() / 2 - pngDims.width / 2,
            y: 8,
        };

        page.drawImage(pngImage, {
            x: pngImageCoords.x,
            y: pngImageCoords.y,
            width: pngDims.width,
            height: pngDims.height,
            opacity: 0.75,
        });
    }

    return Buffer.from(await pdf.save());
}

export async function generatePaperPdf(data: $TSFixMe) {
    const html = renderToStaticMarkup(PaperPage(data));

    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    await page.setContent(html);
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "0.4in", bottom: "0.4in", left: "0.4in", right: "0.4in" },
    });

    await browser.close();

    return await modifPdf(pdfBuffer);
}
