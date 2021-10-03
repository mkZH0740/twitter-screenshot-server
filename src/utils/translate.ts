import { parse } from 'twemoji';
import { TranslationLine } from '../models/method.models';
import { ElementHandle, Page } from 'playwright';
import { TranslationRequestDTO } from '../models/request.models';
import { readFile } from 'fs/promises';

async function parseEmoji(translation: string) {
  const parsedWithoutTextSpan = parse(translation);
  const imgElementMatcher = /(<img[^>]*>)/gm;
  const matches = parsedWithoutTextSpan.split(imgElementMatcher);
  const result: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].startsWith('<img') && matches[i].endsWith('/>')) {
      result.push(
        matches[i].replace(
          'https://twemoji.maxcdn.com/v/13.1.0',
          'https://abs-0.twimg.com/emoji/v2',
        ),
      );
    } else if (matches[i] != '') {
      result.push(`<span class="text">${matches[i]}</span>`);
    }
  }
  return result.join('');
}

async function solveTranslationBlock(translation: string) {
  const resultPairs: TranslationLine[] = [];
  if (!translation.startsWith('#')) {
    const result = await parseEmoji(translation);
    resultPairs.push({ lineNumber: 0, lineContent: result });
  } else {
    const lineNumberMatcher = /(#\d+ )/gm;
    const lineMatchResults = translation.split(lineNumberMatcher);
    for (let i = 1; i < lineMatchResults.length - 1; i++) {
      const lineNumber = lineMatchResults[i];
      const lineContent = lineMatchResults[i + 1];
      const realLineNumber = parseInt(lineNumber.trim().substr(1)) - 1;
      const realLineContent = await parseEmoji(lineContent);
      resultPairs.push({
        lineNumber: realLineNumber,
        lineContent: realLineContent,
      });
    }
  }
  return resultPairs;
}

async function insertTranslationBlock(
  article: ElementHandle,
  translationContent: string,
) {
  await article.$eval(
    'div[lang]',
    (childElement, contentHTML) => {
      const translationBoard = document.createElement('div');
      translationBoard.className = 'translation';
      translationBoard.innerHTML = contentHTML;
      childElement.parentElement.appendChild(translationBoard);
    },
    translationContent,
  );
}

async function getImageBase64(imagePath: string) {
  if (imagePath == '') {
    return '';
  }
  const imageContentBase64 = await readFile(imagePath, { encoding: 'base64' });
  return `data:image/png;base64,${imageContentBase64}`;
}

async function insertCustomContent(
  article: ElementHandle<HTMLElement>,
  custom: Record<string, any>,
) {
  // custom background option, set background image of tweet board
  const customBackgroundPath: string = custom.background;
  const customBackgroundBase64 = await getImageBase64(customBackgroundPath);
  const customTagPath = custom.tag;
  const customTagBase64 = await getImageBase64(customTagPath);
  const customCssContent = await readFile(custom.css, {
    encoding: 'utf8',
  }).catch(() => {
    return '';
  });
  const customFileContents = {
    tag: customTagBase64,
    css: customCssContent,
    background: customBackgroundBase64,
  };
  await article.evaluate((article, contents) => {
    // make custom style element and load custom style
    if (contents.css != '') {
      const customStyle = document.createElement('style');
      customStyle.innerHTML = contents.css;
      document.body.appendChild(customStyle);
    }
    // make custom tag element and load custom tag
    if (contents.tag != '') {
      const translationBoard = article.querySelector('.translation');
      const tagImage = document.createElement('img');
      tagImage.src = contents.tag;
      tagImage.className = 'tag';
      const tagContainer = document.createElement('div');
      tagContainer.appendChild(tagImage);
      translationBoard.prepend(tagContainer);
    }
    // set tweet article background
    if (contents.background != '')
      article.parentElement.style.backgroundImage = `url(${contents.background})`;
  }, customFileContents);
}

export async function addTranslation(
  page: Page,
  translationRequestDTO: TranslationRequestDTO,
) {
  const translationBlocks = await solveTranslationBlock(
    translationRequestDTO.translation,
  );
  const articles = await page.$$('article');
  for (let i = 0; i < translationBlocks.length; i++) {
    const translationBlock = translationBlocks[i];
    if (
      translationBlock.lineNumber > -1 &&
      translationBlock.lineNumber < articles.length
    ) {
      const correspondingArticle = articles[translationBlock.lineNumber];
      await insertTranslationBlock(
        correspondingArticle,
        translationBlock.lineContent,
      );
      const hasTabIndex =
        (await correspondingArticle.getAttribute('tabIndex')) != null;
      const potentialBlockedTweetHref = await (
        await correspondingArticle.$('a')
      ).getAttribute('href');
      const isBlockedTweet =
        potentialBlockedTweetHref ==
        'https://help.twitter.com/rules-and-policies/notices-on-twitter';
      const isMainTweet = !(hasTabIndex || isBlockedTweet);
      if (isMainTweet) {
        await insertCustomContent(
          correspondingArticle,
          translationRequestDTO.custom,
        );
      }
    }
  }
}
