---
name: restart-server
description: Kill any process on port 3000 and restart the Next.js dev server
---

Restart the Next.js dev server using the project's `dev.sh` script. `dev.sh` already frees port 3000 and sources nvm internally — don't duplicate those steps.

Steps:
1. Run `nohup ./dev.sh > /tmp/nextjs-dev.log 2>&1 &` from the project root, in the background
2. Wait a few seconds, then poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` until it returns 200
3. Report that the server is up at http://localhost:3000
