# mcp-mindfull-memory

MCP server that requires your approval before writing any memory file to disk.

Not every thought deserves to become a memory.

> Requires an MCP client with [`elicitInput`](https://modelcontextprotocol.io/specification/2025-11-05/client/elicitation) support — Claude Code or Claude Desktop.

## Install

Requires Node.js ≥ 22.

```bash
claude mcp add mindfull-memory -- npx -y mcp-mindfull-memory
```

> Writes are restricted to your home directory by default.
> Set `MEMORY_ALLOWED_PATHS` (colon-separated absolute paths) in the server's `env` to override.

## License

ISC
