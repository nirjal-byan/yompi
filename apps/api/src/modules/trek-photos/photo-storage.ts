import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const DEFAULT_UPLOAD_DIR = resolve(import.meta.dirname, "../../../../../uploads");
const STORED_FILE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

@Injectable()
export class PhotoStorage {
  private readonly directory: string;

  constructor(config: ConfigService) {
    this.directory = config.get<string>("UPLOAD_DIR") ?? DEFAULT_UPLOAD_DIR;
  }

  async save(content: Buffer, extension: string): Promise<string> {
    const fileName = `${randomUUID()}.${extension}`;

    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, fileName), content);

    return fileName;
  }

  async read(fileName: string): Promise<Buffer | null> {
    if (!STORED_FILE_NAME.test(fileName)) return null;

    return readFile(join(this.directory, fileName)).catch(() => null);
  }

  async remove(fileName: string): Promise<void> {
    if (!STORED_FILE_NAME.test(fileName)) return;

    await rm(join(this.directory, fileName), { force: true });
  }
}
