import os from "node:os";
import path from "node:path";

export function buildAllowedRoots(envValue: string | undefined): string[] {
  return (envValue ? envValue.split(path.delimiter) : [os.homedir()]).map((p) =>
    path.resolve(p),
  );
}

export function isPathAllowed(
  filePath: string,
  allowedRoots: string[],
): boolean {
  const resolved = path.resolve(filePath);
  return allowedRoots.some(
    (root) => resolved === root || resolved.startsWith(root + path.sep),
  );
}

export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}
