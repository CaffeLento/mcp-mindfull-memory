# mcp-mindfull-memory

An [MCP](https://modelcontextprotocol.io) server that writes memory files to disk — but only after you approve them.

When an AI assistant tries to save a memory, you get a preview and can approve it, request changes, or discard it entirely. Nothing is written without your explicit consent.

## How it works

The server exposes a single tool: `write_memory`. When called, it:

1. Strips frontmatter and shows you a readable preview of the content
2. Prompts for approval — you can approve as-is, add refinement notes, or cancel
3. If you approve, creates any missing directories and writes the file
4. If you add notes, returns them to the AI so it can revise and try again
5. If you cancel, discards the write entirely

> Requires an MCP client that supports `elicitInput` (e.g. Claude Code).

## Installation

```bash
npm install
npm run build
```

## Configuration

### Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "mindfull-memory": {
      "command": "node",
      "args": ["/absolute/path/to/mindfull-memory/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mindfull-memory": {
      "command": "node",
      "args": ["/absolute/path/to/mindfull-memory/dist/index.js"]
    }
  }
}
```

## Tool reference

### `write_memory`

| Parameter   | Type   | Description                                  |
|-------------|--------|----------------------------------------------|
| `file_path` | string | Absolute path where the memory file is saved |
| `content`   | string | Full file content (frontmatter + body)        |

The content may include YAML frontmatter (between `---` delimiters). Frontmatter is stripped from the approval preview but written to disk as-is.

## Development

```bash
npm run dev   # run with tsx (no build step)
npm run build # compile TypeScript to dist/
npm start     # run compiled output
```

## License

ISC
