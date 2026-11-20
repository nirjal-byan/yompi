import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AdminGuard } from "../../common/guards/admin.guard.js";
import { NoStoreInterceptor } from "../../common/interceptors/no-store.interceptor.js";
import { AdminService } from "./admin.service.js";

@Controller("admin")
@UseGuards(AdminGuard)
@UseInterceptors(NoStoreInterceptor)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("session")
  session() {
    return { admin: true };
  }

  @Get("overview")
  overview() {
    return this.admin.overview();
  }

  @Get("trails")
  trails() {
    return this.admin.trailNames();
  }

  @Get(":resource")
  list(@Param("resource") resource: string) {
    return this.admin.crud(resource).list();
  }

  @Get(":resource/:slug")
  get(@Param("resource") resource: string, @Param("slug") slug: string) {
    return this.admin.crud(resource).get(slug);
  }

  @Post(":resource")
  create(@Param("resource") resource: string, @Body() body: unknown) {
    return this.admin.crud(resource).create(body);
  }

  @Put(":resource/:slug")
  update(@Param("resource") resource: string, @Param("slug") slug: string, @Body() body: unknown) {
    return this.admin.crud(resource).update(slug, body);
  }

  @Delete(":resource/:slug")
  @HttpCode(204)
  async remove(@Param("resource") resource: string, @Param("slug") slug: string) {
    await this.admin.crud(resource).remove(slug);
  }
}
