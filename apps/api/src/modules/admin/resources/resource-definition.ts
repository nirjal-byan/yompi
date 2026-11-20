import type { PrismaService } from "../../../infrastructure/database/prisma.service.js";

export type Database = PrismaService["client"];

export type ResourceTable = "Trek" | "Permit" | "CostItem";

export interface ResourceDefinition<
  TRecord extends { slug: string },
  TRow extends { slug: string },
> {
  table: ResourceTable;
  label: string;
  list(): Promise<TRecord[]>;
  find(slug: string): Promise<TRecord | undefined>;
  parse(body: unknown): Promise<TRow>;
  save(row: TRow): Promise<void>;
}
