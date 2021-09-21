import { Module } from '@nestjs/common';
import { ScreenshotController } from './controllers/screenshot.controller';
import { ScreenshotService } from './services/screenshot.service';
import { TranslateController } from './controllers/translate.controller';
import { TranslateService } from './services/translate.service';

@Module({
  imports: [],
  controllers: [ScreenshotController, TranslateController],
  providers: [ScreenshotService, TranslateService],
})
export class AppModule {}
