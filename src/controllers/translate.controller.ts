import { Body, Controller, Get } from '@nestjs/common';
import { TranslateService } from '../services/translate.service';
import { TranslationRequestDTO } from '../models/request.models';

@Controller('translate')
export class TranslateController {
  constructor(private readonly appService: TranslateService) {}

  @Get()
  async getTranslate(@Body() translationRequestDTO: TranslationRequestDTO) {
    return await this.appService.getTranslation(translationRequestDTO);
  }
}
