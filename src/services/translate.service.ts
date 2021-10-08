import { Injectable, Logger } from '@nestjs/common';
import { TranslationRequestDTO } from '../models/request.models';
import { loadPage, setViewPort } from '../utils/page.loader';
import { getPage } from '../utils/browser.provider';
import {
  AddTranslationResponse,
  TranslateResponse,
} from '../models/response.models';
import { addTranslation } from '../utils/translate';
import { rawGetScreenshot } from '../utils/screenshot';

@Injectable()
export class TranslateService {
  private readonly translateLogger = new Logger(TranslateService.name);

  async getTranslation(translationRequestDTO: TranslationRequestDTO) {
    this.translateLogger.debug('entered getTranslation');
    const url = translationRequestDTO.url;
    this.translateLogger.debug(
      `${url} translation request received, payload ${JSON.stringify(
        translationRequestDTO,
      )}`,
    );
    const page = await getPage();
    const loadResult = await loadPage(page, url);
    let translateResponse: TranslateResponse;
    this.translateLogger.debug(
      `load page completed, result: ${JSON.stringify(loadResult)}`,
    );
    if (loadResult.flag) {
      await setViewPort(page);
      const addTranslationResult: AddTranslationResponse = await addTranslation(
        page,
        translationRequestDTO,
      ).then(
        () => {
          return { type: 'ok' };
        },
        (err) => {
          return { type: 'err', message: `addTranslationErr: ${err}` };
        },
      );
      this.translateLogger.debug(
        `add translation completed, result: ${JSON.stringify(
          addTranslationResult,
        )}`,
      );
      if (addTranslationResult.type != 'ok') {
        translateResponse = {
          type: addTranslationResult.type,
          message: addTranslationResult.message,
        };
      } else {
        const screenshotResponse = await rawGetScreenshot(page);
        translateResponse = {
          type: 'ok',
          screenshotPath: screenshotResponse.screenshotPath,
        };
      }
    } else {
      translateResponse = { type: 'err', message: loadResult.message };
    }
    this.translateLogger.debug(
      `ready to return screenshot, result: ${translateResponse}`,
    );
    await page.close();
    return translateResponse;
  }
}
