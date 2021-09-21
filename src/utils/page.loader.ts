import { Page } from 'playwright';

export async function loadPage(page: Page, url: string) {
  let loadFinished = false;
  let errMessage = '';
  await page.setDefaultTimeout(8000);
  for (let i = 0; i < 3 && !loadFinished; i++) {
    if (i == 0) {
      await page.goto(url, { waitUntil: 'networkidle' }).then(
        () => {
          loadFinished = true;
        },
        () => {
          errMessage = `loadPage -> load url ${url} failed`;
        },
      );
    } else {
      await page.reload({ waitUntil: 'networkidle' }).then(
        () => {
          loadFinished = true;
        },
        () => {
          errMessage = `loadPage -> load url ${url} failed`;
        },
      );
    }
  }
  if (loadFinished) {
    await page.waitForSelector('article', { timeout: 1000 }).catch(() => {
      errMessage = `loadPage -> load tweet page failed, possible deleted tweet`;
      loadFinished = false;
    });
  }

  return {
    flag: loadFinished,
    message: errMessage,
  };
}

export async function setViewPort(page: Page) {
  const viewport = await page.evaluate(() => {
    return {
      height: Math.max(document.body.scrollHeight, document.body.offsetHeight),
      width: Math.max(document.body.scrollWidth, document.body.offsetWidth),
    };
  });
  await page.setViewportSize(viewport);
}