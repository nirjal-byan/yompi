import { Injectable, NotFoundException } from "@nestjs/common";
import { ADMIN_RESOURCES, type AdminOverview, type AdminResource } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { buildOverview } from "./admin-overview.js";
import { createConditionResource } from "./resources/condition.resource.js";
import { createCostResource } from "./resources/cost.resource.js";
import { createStayResource } from "./resources/stay.resource.js";
import { createItineraryResource } from "./resources/itinerary.resource.js";
import { createPermitResource } from "./resources/permit.resource.js";
import { type CrudOperations, ResourceCrud } from "./resources/resource-crud.js";
import type { Database } from "./resources/resource-definition.js";
import { listTrailNames } from "./resources/trails.js";
import { createTrekResource } from "./resources/trek.resource.js";

const isAdminResource = (name: string): name is AdminResource =>
  (ADMIN_RESOURCES as readonly string[]).includes(name);

function createCruds(db: Database) {
  return {
    treks: new ResourceCrud(db, createTrekResource(db)),
    permits: new ResourceCrud(db, createPermitResource(db)),
    costs: new ResourceCrud(db, createCostResource(db)),
    stays: new ResourceCrud(db, createStayResource(db)),
    conditions: new ResourceCrud(db, createConditionResource(db)),
    itinerary: new ResourceCrud(db, createItineraryResource(db)),
  };
}

@Injectable()
export class AdminService {
  private readonly cruds: ReturnType<typeof createCruds>;

  constructor(private readonly prisma: PrismaService) {
    this.cruds = createCruds(prisma.client);
  }

  crud(resource: string): CrudOperations {
    if (!isAdminResource(resource)) throw new NotFoundException("Unknown resource");

    return this.cruds[resource];
  }

  trailNames(): Promise<string[]> {
    return listTrailNames(this.prisma.client);
  }

  async overview(): Promise<AdminOverview> {
    const [treks, permits, costs, stays, conditions, itinerary] = await Promise.all([
      this.cruds.treks.list(),
      this.cruds.permits.list(),
      this.cruds.costs.list(),
      this.cruds.stays.list(),
      this.cruds.conditions.list(),
      this.cruds.itinerary.list(),
    ]);

    return buildOverview(this.prisma.client, {
      treks,
      permits,
      costs,
      stays,
      conditions,
      itinerary,
    });
  }
}
