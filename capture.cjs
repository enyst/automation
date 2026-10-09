const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const targets = JSON.parse(fs.readFileSync('targets.json', 'utf8'));
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    for (const target of targets) {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const card = page.locator(`#pullrequestreview-${target.reviewId}`);
      await card.waitFor({ state: 'visible', timeout: 60000 });
      const body = await card.innerText();
      if (!body.includes('LLM profile:') || !body.includes(target.model)) {
        throw new Error(`Review ${target.reviewId} has no expected footer`);
      }
      await card.scrollIntoViewIfNeeded();
      const outDir = path.join('evidence', 'pr-547');
      fs.mkdirSync(outDir, { recursive: true });
      await card.screenshot({ path: path.join(outDir, `${target.name}-card.jpg`), type: 'jpeg', quality: 90 });
      await page.screenshot({ path: path.join(outDir, `${target.name}-page.jpg`), type: 'jpeg', quality: 90 });
      console.log(`Captured ${target.name}: review ${target.reviewId}, expected footer present`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
