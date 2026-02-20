---
name: tail-logs
description: Tail the Next.js dev server logs from /tmp/nextjs-dev.log
---

Show the latest Next.js dev server logs.

Steps:
1. Check if `/tmp/nextjs-dev.log` exists
2. If it exists, run `tail -n 50 /tmp/nextjs-dev.log` to show the last 50 lines and report them to the user
3. If it does not exist, inform the user that no log file was found and suggest starting the server with `/restart-server`
