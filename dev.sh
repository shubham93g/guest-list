#!/usr/bin/env bash
set -e

# Kill anything on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Load nvm
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

echo "Starting dev server at http://localhost:3000 ..."

# Open the browser once the server is ready
(
  while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; do
    sleep 1
  done
  open http://localhost:3000
) &

npm run dev
