#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..."
  bun run dev 2>&1 &
  CHILD=$!
  echo "[$(date)] Child PID: $CHILD"
  # Wait up to 60 seconds for the child
  wait $CHILD 2>/dev/null
  echo "[$(date)] Child died, restarting in 2s..."
  sleep 2
done
