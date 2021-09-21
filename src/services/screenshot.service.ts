import { Injectable, Logger } from '@nestjs/common';
import { getPage } from '../utils/browser.provider';
import { loadPage, setViewPort } from '../utils/page.loader';
import { rawGetScreenshot } from '../utils/screenshot';
import { ScreenshotResponse } from '../models/response.models';

@Injectable()
export class ScreenshotService {
  private readonly screenshotLogger = new Logger(ScreenshotService.name);
  async getScreenshot(url: string) {
    this.screenshotLogger.debug(`${url} screenshot request received`);
    const page = await getPage();
    const loadResult = await loadPage(page, url);
    let screenshotResponse: ScreenshotResponse = null;
    // debug
    this.screenshotLogger.debug(
      `page for ${url} load completed, result = ${JSON.stringify(loadResult)}`,
    );
    if (loadResult.flag) {
      await setViewPort(page);
      const screenshotProcess = rawGetScreenshot(page).then(
        (success) => {
          return {
            type: 'ok',
            text: success.text,
            screenshotPath: success.screenshotPath,
          };
        },
        (err) => {
          return {
            type: 'err',
            message: `rawTakeScreenshot -> ${err}`,
          };
        },
      );
      screenshotResponse = await screenshotProcess;
    } else {
      screenshotResponse = {
        type: 'err',
        message: loadResult.message,
      };
    }
    await page.close();
    this.screenshotLogger.debug(
      `request solved, result = ${JSON.stringify(screenshotResponse)}`,
    );
    return screenshotResponse;
  }
}
