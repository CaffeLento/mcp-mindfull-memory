import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildAllowedRoots, isPathAllowed, stripFrontmatter } from "./utils.js";

// --- stripFrontmatter ---

test("stripFrontmatter: removes YAML frontmatter", () => {
  const input = "---\nname: test\ntype: user\n---\nThis is the body.";
  assert.equal(stripFrontmatter(input), "This is the body.");
});

test("stripFrontmatter: returns content as-is when no frontmatter present", () => {
  assert.equal(stripFrontmatter("Just some content."), "Just some content.");
});

test("stripFrontmatter: trims surrounding whitespace from the body", () => {
  const input = "---\nkey: value\n---\n\n  Padded body.  \n";
  assert.equal(stripFrontmatter(input), "Padded body.");
});

test("stripFrontmatter: handles CRLF line endings", () => {
  const input = "---\r\nname: test\r\n---\r\nWindows body.";
  assert.equal(stripFrontmatter(input), "Windows body.");
});

test("stripFrontmatter: returns empty string for frontmatter-only content", () => {
  assert.equal(stripFrontmatter("---\nname: test\n---\n"), "");
});

test("stripFrontmatter: does not strip if opening delimiter is missing", () => {
  const input = "name: test\n---\nbody";
  assert.equal(stripFrontmatter(input), "name: test\n---\nbody");
});

// --- buildAllowedRoots ---

test("buildAllowedRoots: defaults to resolved home directory when env var is absent", () => {
  const roots = buildAllowedRoots(undefined);
  assert.deepEqual(roots, [path.resolve(os.homedir())]);
});

test("buildAllowedRoots: splits on path.delimiter", () => {
  const envValue = `/tmp/a${path.delimiter}/tmp/b`;
  assert.deepEqual(buildAllowedRoots(envValue), [
    path.resolve("/tmp/a"),
    path.resolve("/tmp/b"),
  ]);
});

test("buildAllowedRoots: resolves relative paths to absolute", () => {
  const roots = buildAllowedRoots("relative/path");
  assert.ok(path.isAbsolute(roots[0]));
});

// --- isPathAllowed ---

test("isPathAllowed: allows a file nested inside an allowed root", () => {
  assert.equal(isPathAllowed("/home/user/notes/file.md", ["/home/user"]), true);
});

test("isPathAllowed: rejects a path outside all allowed roots", () => {
  assert.equal(isPathAllowed("/etc/passwd", ["/home/user"]), false);
});

test("isPathAllowed: rejects a path that shares a prefix but is not a subdirectory", () => {
  // /home/user-evil must not be permitted when /home/user is the root
  assert.equal(isPathAllowed("/home/user-evil/file.md", ["/home/user"]), false);
});

test("isPathAllowed: allows the root path itself", () => {
  assert.equal(isPathAllowed("/home/user", ["/home/user"]), true);
});

test("isPathAllowed: allows a path matching any one of multiple roots", () => {
  assert.equal(
    isPathAllowed("/tmp/memories/note.md", ["/home/user", "/tmp/memories"]),
    true,
  );
});

test("isPathAllowed: rejects path when allowed roots list is empty", () => {
  assert.equal(isPathAllowed("/home/user/file.md", []), false);
});
