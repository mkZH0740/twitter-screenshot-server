import { chromium, Browser, BrowserContext } from 'playwright';

let browser: Browser = null;
let userContext: BrowserContext = null;

export async function getBrowser(): Promise<Browser> {
  if (browser == null) {
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
  }
  return browser;
}

export async function getPage() {
  const browser = await getBrowser();
  if (userContext == null) {
    userContext = await browser.newContext();
    await userContext.newPage();
  }
  return await userContext.newPage();
}
