import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PHOTO_MAX_BYTES, type TrekPhotoInfo } from "@yompi/shared";
import { AdminGuard } from "../../common/guards/admin.guard.js";
import { TrekPhotosService, type UploadedPhoto } from "./trek-photos.service.js";

@Controller("trek-photos")
export class TrekPhotosController {
  constructor(private readonly photos: TrekPhotosService) {}

  @Get()
  @Header("Cache-Control", "no-cache")
  list(): Promise<TrekPhotoInfo[]> {
    return this.photos.list();
  }

  @Get("files/:fileName")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  async file(@Param("fileName") fileName: string): Promise<StreamableFile> {
    const { content, mimeType } = await this.photos.readFile(fileName);

    return new StreamableFile(content, { type: mimeType });
  }

  @Put(":slug")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor("photo", { limits: { fileSize: PHOTO_MAX_BYTES, files: 1 } }))
  upload(
    @Param("slug") slug: string,
    @UploadedFile() file: UploadedPhoto | undefined,
    @Body() body: unknown,
  ): Promise<void> {
    return this.photos.set(slug, file, body);
  }

  @Delete(":slug")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param("slug") slug: string): Promise<void> {
    return this.photos.remove(slug);
  }
}
