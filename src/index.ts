import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-mindfull-memory",
  version: "0.1.0",
});

const ALLOWED_ROOTS: string[] = (
  process.env.MEMORY_ALLOWED_PATHS
    ? process.env.MEMORY_ALLOWED_PATHS.split(path.delimiter)
    : [os.homedir()]
).map((p) => path.resolve(p));

function isPathAllowed(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return ALLOWED_ROOTS.some(
    (root) => resolved === root || resolved.startsWith(root + path.sep),
  );
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

server.registerTool(
  "write_memory",
  {
    description: "Write a memory file — requires user approval before saving.",
    inputSchema: {
      file_path: z.string().describe("Absolute path to the memory file"),
      content: z.string().describe("Full file content including frontmatter"),
    },
  },
  async ({ file_path, content }) => {
    if (!isPathAllowed(file_path)) {
      return {
        content: [
          {
            type: "text",
            text: `Path not allowed: ${file_path}. Writes are restricted to: ${ALLOWED_ROOTS.join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    const preview = stripFrontmatter(content);

    const result = await server.server.elicitInput({
      message: `Save this memory?\n\n${preview}\n\nSubmit to approve. Add a note to request changes. Cancel to discard.`,
      requestedSchema: {
        type: "object" as const,
        properties: {
          notes: {
            type: "string" as const,
            title: "Refinements (optional)",
            description:
              "Describe changes to make before saving, or leave empty to approve as-is",
          },
        },
        required: [],
      },
    });

    if (result.action !== "accept") {
      return {
        content: [{ type: "text", text: "Memory write declined." }],
        isError: true,
      };
    }

    if (result.content?.notes) {
      return {
        content: [
          {
            type: "text",
            text: `User requested changes: ${result.content.notes}\n\nPlease update the memory content accordingly and call write_memory again.`,
          },
        ],
      };
    }

    try {
      await fs.mkdir(path.dirname(file_path), { recursive: true });
      await fs.writeFile(file_path, content, "utf8");
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to write memory: ${(err as Error).message}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: `Memory saved: ${file_path}` }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
