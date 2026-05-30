#!/bin/bash
cd /home/z/my-project
while true; do
  bunx next dev -p 3000 2>&1 &
  PID=$!
  echo "[$(date)] Dev server started (PID: $PID)"
  # Wait for the process
  wait $PID 2>/dev/null
  EXIT=$?
  echo "[$(date)] Dev server exited (code: $EXIT), restarting in 1s..."
  sleep 1
done
