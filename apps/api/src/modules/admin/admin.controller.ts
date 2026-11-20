import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { NoStoreInterceptor } from '../../common/interceptors/no-store.interceptor.js';
import { AdminService } from './admin.service.js';

/**
 * Admin API. Every route requires a signed-in user on the ADMIN_EMAILS allowlist (AdminGuard).
 * Responses are never cached because they hold unpublished edits.
 */
@Controller('admin')
@UseGuards(AdminGuard)
@UseInterceptors(NoStoreInterceptor)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Cheap check the web app uses to decide whether to show the admin screens. */
  @Get('session')
  session() {
    return { admin: true };
  }

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('trails')
  trails() {
    return this.admin.trailNames();
  }

  // ---- treks
  @Get('treks')
  listTreks() {
    return this.admin.listTreks();
  }

  @Get('treks/:slug')
  getTrek(@Param('slug') slug: string) {
    this.admin.assertSlug(slug);
    return this.admin.getTrek(slug);
  }

  @Post('treks')
  createTrek(@Body() body: unknown) {
    return this.admin.createTrek(body);
  }

  @Put('treks/:slug')
  updateTrek(@Param('slug') slug: string, @Body() body: unknown) {
    return this.admin.updateTrek(slug, body);
  }

  @Delete('treks/:slug')
  @HttpCode(204)
  async deleteTrek(@Param('slug') slug: string) {
    await this.admin.deleteTrek(slug);
  }

  // ---- permits
  @Get('permits')
  listPermits() {
    return this.admin.listPermits();
  }

  @Get('permits/:slug')
  getPermit(@Param('slug') slug: string) {
    this.admin.assertSlug(slug);
    return this.admin.getPermit(slug);
  }

  @Post('permits')
  createPermit(@Body() body: unknown) {
    return this.admin.createPermit(body);
  }

  @Put('permits/:slug')
  updatePermit(@Param('slug') slug: string, @Body() body: unknown) {
    return this.admin.updatePermit(slug, body);
  }

  @Delete('permits/:slug')
  @HttpCode(204)
  async deletePermit(@Param('slug') slug: string) {
    await this.admin.deletePermit(slug);
  }

  // ---- costs
  @Get('costs')
  listCosts() {
    return this.admin.listCosts();
  }

  @Get('costs/:slug')
  getCost(@Param('slug') slug: string) {
    this.admin.assertSlug(slug);
    return this.admin.getCost(slug);
  }

  @Post('costs')
  createCost(@Body() body: unknown) {
    return this.admin.createCost(body);
  }

  @Put('costs/:slug')
  updateCost(@Param('slug') slug: string, @Body() body: unknown) {
    return this.admin.updateCost(slug, body);
  }

  @Delete('costs/:slug')
  @HttpCode(204)
  async deleteCost(@Param('slug') slug: string) {
    await this.admin.deleteCost(slug);
  }
}
