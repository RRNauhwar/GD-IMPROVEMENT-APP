// Renders an HTML file to a paginated PDF using headless Chromium (puppeteer).
// Waits for Mermaid diagrams and highlight.js to finish before printing.
//
// Usage: node scripts/render-pdf.mjs <input.html> <output.pdf>
import puppeteer from "puppeteer";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const [, , inArg, outArg] = process.argv;
if (!inArg || !outArg) {
  console.error("Usage: node scripts/render-pdf.mjs <input.html> <output.pdf>");
  process.exit(1);
}
const inputUrl = pathToFileURL(resolve(inArg)).href;
const outputPath = resolve(outArg);

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
page.on("console", (m) => {
  const t = m.text();
  if (t.includes("mermaid") || t.toLowerCase().includes("error")) console.log("[page]", t);
});

await page.goto(inputUrl, { waitUntil: "networkidle0", timeout: 120000 });

// Wait until every .mermaid block has been replaced by an <svg>.
try {
  await page.waitForFunction(
    () => {
      const blocks = Array.from(document.querySelectorAll(".mermaid"));
      if (blocks.length === 0) return true;
      return blocks.every((b) => b.querySelector("svg") || b.getAttribute("data-processed"));
    },
    { timeout: 120000, polling: 500 }
  );
} catch (e) {
  console.warn("Mermaid wait timed out; rendering anyway.", e.message);
}
// Small settle delay for fonts/layout.
await new Promise((r) => setTimeout(r, 1500));

const diagramCount = await page.evaluate(
  () => document.querySelectorAll(".mermaid svg").length
);
console.log(`Rendered Mermaid diagrams: ${diagramCount}`);

await page.pdf({
  path: outputPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
  headerTemplate: `<div style="font-size:7px;color:#9aa0b5;width:100%;padding:0 14mm;text-align:right;">SpeakX AI · Engineering & Interview Handbook</div>`,
  footerTemplate: `<div style="font-size:8px;color:#6b7280;width:100%;padding:0 14mm;display:flex;justify-content:space-between;">
      <span>GD-IMPROVEMENT-APP</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log(`PDF written to ${outputPath}`);
