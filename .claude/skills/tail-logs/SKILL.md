---
name: tail-logs
description: Tail the Next.js dev server logs from /tmp/nextjs-dev.log
---

Live-tail the Next.js dev server logs.

Steps:
1. Check if `/tmp/nextjs-dev.log` exists
2. If it exists, run `tail -f /tmp/nextjs-dev.log` in the background using the Bash tool with `run_in_background: true`, then inform the user that logs are streaming live from `/tmp/nextjs-dev.log` and they can stop with Ctrl+C
3. If it does not exist, inform the user that no log file was found and suggest starting the server with `/restart-server`
