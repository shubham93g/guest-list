---
name: tail-logs
description: Tail the Next.js dev server logs from /tmp/nextjs-dev.log
---

Show the latest Next.js dev server logs and guide the user to tail live.

Steps:
1. Check if `/tmp/nextjs-dev.log` exists
2. If it exists:
   a. Run `tail -n 50 /tmp/nextjs-dev.log` and print the output to the user
   b. Tell the user that for live streaming they should run `tail -f /tmp/nextjs-dev.log` in a terminal
3. If it does not exist, inform the user that no log file was found and suggest starting the server with `/restart-server`
