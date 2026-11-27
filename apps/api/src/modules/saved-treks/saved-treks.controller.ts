import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { AuthUser } from "@yompi/shared";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { SessionGuard } from "../../common/guards/session.guard.js";
import { NoStoreInterceptor } from "../../common/interceptors/no-store.interceptor.js";
import { SavedTreksService } from "./saved-treks.service.js";

@Controller("me/saved-treks")
@UseGuards(SessionGuard)
@UseInterceptors(NoStoreInterceptor)
export class SavedTreksController {
  constructor(private readonly savedTreks: SavedTreksService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<string[]> {
    return this.savedTreks.listSlugs(user.id);
  }

  @Put(":slug")
  @HttpCode(204)
  save(@CurrentUser() user: AuthUser, @Param("slug") slug: string): Promise<void> {
    return this.savedTreks.save(user.id, slug);
  }

  @Delete(":slug")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("slug") slug: string): Promise<void> {
    return this.savedTreks.remove(user.id, slug);
  }
}
