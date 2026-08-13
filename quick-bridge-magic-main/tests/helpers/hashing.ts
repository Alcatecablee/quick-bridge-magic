import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

export function getFileSha256(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const hashSum = createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

export function getFileSize(filePath: string): number {
  return statSync(filePath).size;
}

export function getFixturePath(filename: string): string {
  return join(process.cwd(), 'tests', 'fixtures', filename);
}
