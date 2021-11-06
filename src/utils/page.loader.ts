import { Page } from 'playwright';

export async function loadPage(page: Page, url: string) {
  let loadFinished = false;
  let errMessage = '';
  for (let i = 0; i < 3 && !loadFinished; i++) {
    if (i == 0) {
      await page.goto(url, { waitUntil: 'domcontentloaded' }).then(
        () => {
          loadFinished = true;
        },
        () => {
          errMessage = `loadPage -> load url ${url} failed`;
        },
      );
    } else {
      await page.reload({ waitUntil: 'domcontentloaded' }).then(
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
    await page.waitForSelector('article').catch(() => {
      errMessage = `loadPage -> load tweet page failed, possible deleted tweet`;
      loadFinished = false;
    });
    let count = 0;
    let imageLoaded = false;
    while (!imageLoaded && count < 100) {
      const images = await page.$$('img');
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        imageLoaded = await (await image.getProperty('complete')).jsonValue();
        count++;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    await expandHiddenImages(page).catch((err) => {
      errMessage = `loadPage -> expand hidden image failed with error ${err}`;
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

async function expandHiddenImages(page: Page) {
  await page.evaluate(() => {
    const articles = document.querySelectorAll('article');
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const buttons = article.querySelectorAll('div[role=button]');
      for (let j = 0; j < buttons.length; j++) {
        const button = buttons[j];
        if (button != null && button.textContent == 'View') {
          console.log(`article ${i + 1} has a button`);
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false,
          });
          button.dispatchEvent(event);
        }
      }
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
