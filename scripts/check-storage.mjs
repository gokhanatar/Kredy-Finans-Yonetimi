import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: false,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
await page.goto('http://localhost:5200', { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 3000));

const storage = await page.evaluate(() => {
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    items[key] = localStorage.getItem(key)?.substring(0, 100);
  }
  return items;
});

console.log('LocalStorage keys:', JSON.stringify(storage, null, 2));

const url = page.url();
console.log('Current URL:', url);

const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
console.log('Body text:', bodyText);

await browser.close();
