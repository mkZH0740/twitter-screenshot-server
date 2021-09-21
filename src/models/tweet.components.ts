import { ElementHandle } from 'playwright';
import { NotImplementedException } from '@nestjs/common';
import { convert } from 'twemoji';

class TweetComponent {
  element: ElementHandle;

  constructor(element: ElementHandle) {
    this.element = element;
  }

  async init() {
    throw new NotImplementedException();
  }

  toString() {
    throw new NotImplementedException();
  }
}

class TweetEmoji extends TweetComponent {
  emoji: string;

  async init() {
    const emojiUrl = await (await this.element.getProperty('src')).jsonValue();
    const emojiCode = emojiUrl.substring(
      emojiUrl.lastIndexOf('/') + 1,
      emojiUrl.lastIndexOf('.'),
    );
    this.emoji = convert.fromCodePoint(emojiCode);
  }

  toString() {
    return this.emoji;
  }
}

class TweetLink extends TweetComponent {
  url: string;

  async init() {
    this.url = await this.element.evaluate((element) => {
      return element.textContent;
    }, this.element);
  }

  toString() {
    return this.url;
  }
}

class TweetHashTag extends TweetComponent {
  hashtag: string;

  async init() {
    this.hashtag = await this.element.$eval('a', (element) => {
      return element.textContent;
    });
  }

  toString() {
    return this.hashtag;
  }
}

class TweetText extends TweetComponent {
  text: string;

  async init() {
    this.text = await this.element.evaluate((span) => {
      return span.textContent;
    }, this.element);
  }

  toString() {
    return this.text;
  }
}

export class TweetComponentFactory {
  public static async solveTweetComponents(article: ElementHandle) {
    const results: TweetComponent[] = [];
    const childElements = await article.$$('div[lang] > *');
    for (let i = 0; i < childElements.length; i++) {
      const currChildElement = childElements[i];
      let component: TweetComponent = null;
      const childComponentType = await currChildElement.evaluate(
        (childElement) => {
          if (childElement.tagName == 'IMG') {
            return 'emoji';
          } else if (childElement.tagName == 'A') {
            return 'link';
          } else if (childElement.querySelector('a') != null) {
            return 'hashtag';
          } else {
            return 'text';
          }
        },
        currChildElement,
      );

      switch (childComponentType) {
        case 'emoji':
          component = new TweetEmoji(currChildElement);
          break;
        case 'link':
          component = new TweetLink(currChildElement);
          break;
        case 'hashtag':
          component = new TweetHashTag(currChildElement);
          break;
        default:
          component = new TweetText(currChildElement);
          break;
      }

      await component.init();
      results.push(component);
    }

    return results;
  }
}
