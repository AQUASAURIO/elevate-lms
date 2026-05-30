#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..."
  bunx next dev -p 3000 2>&1 &
  PID=$!
  wait $PID
  echo "[$(date)] Dev server died, restarting in 2s..."
  sleep 2
done
