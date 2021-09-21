export class TranslationRequestDTO {
  readonly url: string;
  readonly translation: string;
  readonly custom: Record<string, any>;
}
