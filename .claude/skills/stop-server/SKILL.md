---
name: stop-server
description: Kill any process running on port 3000 (stop the Next.js dev server)
---

Stop the Next.js dev server by killing any process on port 3000.

Steps:
1. Run `lsof -ti :3000 | xargs kill -9 2>/dev/null || true` to kill the process on port 3000
2. Confirm port 3000 is now free by checking `lsof -ti :3000` returns nothing
3. Report that the server has been stopped
