import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const server = new McpServer({
  name: "mcp-mindfull-memory",
  version: "0.1.0",
});

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
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
    const preview = stripFrontmatter(content);

    const result = await server.server.elicitInput({
      message: `Save this memory?\n\n${preview}\n\nSubmit to approve. Add a note to request changes. Cancel to discard.`,
      requestedSchema: {
        type: "object" as const,
        properties: {
          notes: {
            type: "string" as const,
            title: "Refinements (optional)",
            description: "Describe changes to make before saving, or leave empty to approve as-is",
          },
        },
        required: [],
      },
    });

    if (result.action !== "accept") {
      return {
        content: [{ type: "text" as const, text: "Memory write declined." }],
        isError: true,
      };
    }

    if (result.content?.notes) {
      return {
        content: [
          {
            type: "text" as const,
            text: `User requested changes: ${result.content.notes}\n\nPlease update the memory content accordingly and call write_memory again.`,
          },
        ],
      };
    }

    fs.mkdirSync(path.dirname(file_path), { recursive: true });
    fs.writeFileSync(file_path, content, "utf8");

    return {
      content: [{ type: "text" as const, text: `Memory saved: ${file_path}` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
