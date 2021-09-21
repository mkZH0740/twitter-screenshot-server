import { Body, Controller, Get, Logger } from '@nestjs/common';
import { ScreenshotService } from '../services/screenshot.service';

@Controller('screenshot')
export class ScreenshotController {
  constructor(private readonly appService: ScreenshotService) {}

  @Get()
  async getScreenshot(@Body('url') url: string) {
    return await this.appService.getScreenshot(url);
  }
}
