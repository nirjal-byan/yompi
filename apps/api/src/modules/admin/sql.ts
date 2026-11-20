import { Prisma } from "@yompi/database";

export function formatDate(column: string) {
  return Prisma.raw(`to_char(${column}, 'YYYY-MM-DD')`);
}

export function quoteTable(table: string) {
  return Prisma.raw(`"${table}"`);
}
