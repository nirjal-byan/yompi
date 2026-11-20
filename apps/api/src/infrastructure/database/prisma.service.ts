import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { prisma } from "@yompi/database";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = prisma;

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
