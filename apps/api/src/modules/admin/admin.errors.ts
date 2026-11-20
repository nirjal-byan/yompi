import { BadRequestException } from "@nestjs/common";
import type { FieldError } from "@yompi/shared";

export function failValidation(errors: FieldError[]): never {
  throw new BadRequestException({ errors });
}

export function fieldError(field: string, message: string): FieldError {
  return { field, message };
}
