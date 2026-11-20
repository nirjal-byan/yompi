import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@yompi/database";
import { failValidation, fieldError } from "../admin.errors.js";
import { quoteTable } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface CrudOperations {
  list(): Promise<unknown[]>;
  get(slug: string): Promise<unknown>;
  create(body: unknown): Promise<unknown>;
  update(slug: string, body: unknown): Promise<unknown>;
  remove(slug: string): Promise<void>;
}

export class ResourceCrud<
  TRecord extends { slug: string },
  TRow extends { slug: string },
> implements CrudOperations {
  constructor(
    private readonly db: Database,
    private readonly resource: ResourceDefinition<TRecord, TRow>,
  ) {}

  list(): Promise<TRecord[]> {
    return this.resource.list();
  }

  async get(slug: string): Promise<TRecord> {
    this.assertValidSlug(slug);

    const record = await this.resource.find(slug);
    if (!record) throw this.notFound();

    return record;
  }

  async create(body: unknown): Promise<TRecord> {
    const row = await this.resource.parse(body);

    if (await this.resource.find(row.slug)) {
      failValidation([fieldError("slug", "This id is already used. Pick another one.")]);
    }

    await this.resource.save(row);
    return this.get(row.slug);
  }

  async update(slug: string, body: unknown): Promise<TRecord> {
    await this.get(slug);

    const row = await this.resource.parse(body);
    if (row.slug !== slug) {
      failValidation([
        fieldError(
          "slug",
          `The id of an existing ${this.resource.label.toLowerCase()} cannot be changed.`,
        ),
      ]);
    }

    await this.resource.save(row);
    return this.get(slug);
  }

  async remove(slug: string): Promise<void> {
    this.assertValidSlug(slug);

    const removed = await this.db.$executeRaw(
      Prisma.sql`DELETE FROM ${quoteTable(this.resource.table)} WHERE slug = ${slug}`,
    );
    if (removed === 0) throw this.notFound();
  }

  private assertValidSlug(slug: string): void {
    if (!SLUG_PATTERN.test(slug)) throw new BadRequestException("Invalid id");
  }

  private notFound(): NotFoundException {
    return new NotFoundException(`${this.resource.label} not found`);
  }
}
