import { Page } from 'playwright';
import { TweetComponentFactory } from '../models/tweet.components';
import { tmpNameSync } from 'tmp';

export async function rawGetScreenshot(page: Page) {
  const articles = await page.$$('article');
  let boundingBox = null;
  let text = '';
  let requireLineNumber = true;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const hasTabIndex = (await article.getAttribute('tabIndex')) != null;
    const potentialBlockedTweetHref = await (
      await article.$('a')
    ).getAttribute('href');
    const isBlockedTweet =
      potentialBlockedTweetHref ==
      'https://help.twitter.com/rules-and-policies/notices-on-twitter';
    const isMainTweet = !(hasTabIndex || isBlockedTweet);
    if (isMainTweet && i == 0) requireLineNumber = false;

    if (boundingBox == null) {
      boundingBox = await article.boundingBox();
    } else {
      boundingBox.height += (await article.boundingBox()).height;
    }

    const tweetComponents = await TweetComponentFactory.solveTweetComponents(
      article,
    );
    let currText = '';
    for (let j = 0; j < tweetComponents.length; j++) {
      currText += tweetComponents[j].toString();
    }

    if (requireLineNumber) {
      text += `line No. ${i + 1}: ${currText}`;
    } else {
      text += currText;
    }
    if (isMainTweet) break;
    if (i != articles.length - 1) {
      text += '\n';
    }
  }

  const tempFilePath = tmpNameSync({ postfix: '.png', dir: './/cache' });
  await page.screenshot({ path: tempFilePath, clip: boundingBox });

  return {
    screenshotPath: tempFilePath,
    text: text,
  };
}
