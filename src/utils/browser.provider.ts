import { chromium, Browser, BrowserContext } from 'playwright';

let browser: Browser = null;
let userContext: BrowserContext = null;

export async function getBrowser() {
  if (browser == null) {
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
  } else if (!browser.isConnected()) {
    await userContext.close().catch(err => console.log(err));
    await browser.close().catch(err => console.log(err));
    browser = await chromium.launch({ headless: false, channel: 'chrome' });
    userContext = null;
  }
}

export async function getUserContext() {
  await getBrowser();
  if (userContext == null) {
    userContext = await browser.newContext();
  }
}

export async function getPage() {
  await getUserContext();
  return await userContext.newPage();
}
