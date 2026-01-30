#!/usr/bin/env bash
#
# tunnel-trycloudflare.sh
# One-command tunnel setup for Business OS remote access
#
# Usage:
#   ./apps/business-os/scripts/tunnel-trycloudflare.sh
#
# What it does:
#   1. Checks cloudflared installation (installs if missing on macOS)
#   2. Starts Business OS dev server (port 3020)
#   3. Creates TryCloudflare tunnel
#   4. Displays public URL
#
# Press Ctrl+C to stop both dev server and tunnel.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Repo root detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo -e "${BOLD}Business OS Remote Access Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo -e "${YELLOW}⚠${NC}  cloudflared not found"

  # Auto-install on macOS if Homebrew is available
  if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
    echo -e "${BLUE}ℹ${NC}  Installing cloudflared via Homebrew..."
    brew install cloudflared
    echo -e "${GREEN}✓${NC} cloudflared installed"
  else
    echo -e "${RED}✗${NC} Please install cloudflared manually:"
    echo ""
    echo "  macOS:  brew install cloudflared"
    echo "  Linux:  wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "          sudo dpkg -i cloudflared-linux-amd64.deb"
    echo ""
    echo "  Or see: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    exit 1
  fi
else
  echo -e "${GREEN}✓${NC} cloudflared is installed ($(cloudflared --version | head -1))"
fi

# Check if port 3020 is already in use
if lsof -Pi :3020 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠${NC}  Port 3020 is already in use"
  echo -e "${BLUE}ℹ${NC}  Assuming Business OS dev server is already running..."
  DEV_SERVER_PID=""
else
  # Start Business OS dev server in background
  echo -e "${BLUE}ℹ${NC}  Starting Business OS dev server on port 3020..."
  cd "$REPO_ROOT"

  # Start dev server in background, suppress initial output
  pnpm --filter @apps/business-os dev > /tmp/business-os-dev.log 2>&1 &
  DEV_SERVER_PID=$!

  # Wait for dev server to be ready (check for port 3020 listening)
  MAX_WAIT=30
  WAIT_COUNT=0
  while ! lsof -Pi :3020 -sTCP:LISTEN -t >/dev/null 2>&1; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
      echo -e "${RED}✗${NC} Dev server failed to start within ${MAX_WAIT}s"
      echo -e "${BLUE}ℹ${NC}  Check logs: tail /tmp/business-os-dev.log"
      [ -n "$DEV_SERVER_PID" ] && kill $DEV_SERVER_PID 2>/dev/null || true
      exit 1
    fi
  done

  echo -e "${GREEN}✓${NC} Dev server running (PID: $DEV_SERVER_PID)"
fi

# Cleanup function to stop dev server on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}⚠${NC}  Shutting down..."
  if [ -n "$DEV_SERVER_PID" ]; then
    kill $DEV_SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Dev server stopped"
  fi
  echo -e "${GREEN}✓${NC} Tunnel closed"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start cloudflared tunnel
echo -e "${BLUE}ℹ${NC}  Creating tunnel to localhost:3020..."
echo ""

# Create temp file to capture cloudflared output
TUNNEL_LOG=$(mktemp)

# Start cloudflared in background, capture output
cloudflared tunnel --url http://localhost:3020 2>&1 | tee "$TUNNEL_LOG" &
TUNNEL_PID=$!

# Wait for tunnel URL to appear in logs (max 15 seconds)
MAX_WAIT=15
WAIT_COUNT=0
TUNNEL_URL=""

while [ -z "$TUNNEL_URL" ] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  sleep 1
  TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ -z "$TUNNEL_URL" ]; then
  echo -e "${RED}✗${NC} Failed to extract tunnel URL from cloudflared output"
  echo -e "${BLUE}ℹ${NC}  Check logs: cat $TUNNEL_LOG"
  rm -f "$TUNNEL_LOG"
  exit 1
fi

# Clean up temp log
rm -f "$TUNNEL_LOG"

# Display success message with URL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}${BOLD}  ✓ Business OS is now accessible at:${NC}"
echo ""
echo -e "  ${BLUE}${BOLD}${TUNNEL_URL}${NC}"
echo ""
echo -e "${YELLOW}  ⚠  This URL is temporary and expires when you stop this script.${NC}"
echo -e "${YELLOW}  ⚠  Do NOT share publicly or commit to version control.${NC}"
echo ""
echo -e "${BLUE}  ℹ  Press Ctrl+C to stop the tunnel and dev server.${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for tunnel process (keeps script running)
wait $TUNNEL_PID
