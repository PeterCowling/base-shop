#!/usr/bin/env bash
# Agent Runner Daemon Control Script
#
# Usage:
#   ./scripts/agent-runner.sh start   # Start daemon in background
#   ./scripts/agent-runner.sh stop    # Stop daemon
#   ./scripts/agent-runner.sh status  # Check daemon status
#   ./scripts/agent-runner.sh logs    # View daemon logs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_DIR/.agent-runner.pid"
LOG_FILE="$PROJECT_DIR/.agent-runner.log"

start_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Agent runner is already running (PID: $PID)"
            exit 1
        else
            echo "Removing stale PID file"
            rm "$PID_FILE"
        fi
    fi

    echo "Starting agent runner daemon..."

    # Enable agent runner
    export BUSINESS_OS_AGENT_RUNNER_ENABLED=true

    # Start daemon in background
    cd "$PROJECT_DIR"
    nohup pnpm tsx src/agent-runner/index.ts >> "$LOG_FILE" 2>&1 &

    PID=$!
    echo $PID > "$PID_FILE"

    echo "Agent runner started (PID: $PID)"
    echo "Logs: $LOG_FILE"
}

stop_daemon() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Agent runner is not running (no PID file)"
        exit 1
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo "Agent runner is not running (PID $PID not found)"
        rm "$PID_FILE"
        exit 1
    fi

    echo "Stopping agent runner (PID: $PID)..."
    kill "$PID"

    # Wait for process to stop
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done

    # Force kill if still running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Force killing agent runner..."
        kill -9 "$PID"
    fi

    rm "$PID_FILE"
    echo "Agent runner stopped"
}

status_daemon() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Agent runner is NOT running (no PID file)"
        exit 1
    fi

    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Agent runner is RUNNING (PID: $PID)"
        ps -p "$PID" -o pid,ppid,user,%cpu,%mem,etime,command
    else
        echo "Agent runner is NOT running (PID $PID not found)"
        rm "$PID_FILE"
        exit 1
    fi
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file found at $LOG_FILE"
        exit 1
    fi
}

case "${1:-}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon || true
        sleep 1
        start_daemon
        ;;
    status)
        status_daemon
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
