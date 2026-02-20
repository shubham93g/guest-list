---
name: restart-server
description: Kill any process on port 3000 and restart the Next.js dev server
---

Kill any process running on port 3000, then start the Next.js dev server.

Steps:
1. Run `lsof -ti :3000 | xargs kill -9 2>/dev/null || true` to free port 3000
2. Source nvm if needed: `[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"`
3. Run `npm run dev` in the background from the project root
4. Wait a few seconds, then confirm the server is up at http://localhost:3000 and report status
