#!/usr/bin/env bash
set -e

MODE="dev"
if [[ "$1" == "--prod" || "$1" == "-p" ]]; then
  MODE="prod"
fi

# Kill anything on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Load nvm
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

if [[ "$MODE" == "prod" ]]; then
  echo "Building production bundle..."
  npm run build
  echo "Starting production server at http://localhost:3000 ..."
else
  echo "Starting dev server at http://localhost:3000 ..."
fi

# Open the browser once the server is ready
(
  while ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; do
    sleep 1
  done
  open http://localhost:3000
) &

if [[ "$MODE" == "prod" ]]; then
  npm start
else
  npm run dev
fi
