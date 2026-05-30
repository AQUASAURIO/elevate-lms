import { spawn } from "bun";

const DEV_CMD = ["bun", "run", "dev"];
let child: ReturnType<typeof spawn> | null = null;

function start() {
  console.log(`[${new Date().toISOString()}] Starting dev server...`);
  child = spawn(DEV_CMD[0], DEV_CMD.slice(1), {
    stdout: "inherit",
    stderr: "inherit",
  });

  child.on("exit", (code) => {
    console.log(`[${new Date().toISOString()}] Dev server exited (code: ${code}). Restarting in 2s...`);
    setTimeout(start, 2000);
  });

  child.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] Error: ${err}`);
    setTimeout(start, 2000);
  });
}

start();

// Keep process alive
setInterval(() => {
  if (!child || child.killed) {
    console.log(`[${new Date().toISOString()}] Watchdog: process gone, restarting...`);
    start();
  }
}, 5000);
