import { spawn } from "node:child_process";
import path from "node:path";

export async function reachable(url, timeoutMs = 2500) {
  if (!url) return false;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * If a configured local dev server is not already answering, start it and wait
 * for a real HTTP response. Only a child started here is ever stopped.
 */
export async function ensureDevServer(config, { logger, root = process.cwd() } = {}) {
  const spec = config.devServer;
  if (!spec?.url) return null;
  if (await reachable(spec.url)) {
    logger?.info("reusing local server", { url: spec.url });
    return null;
  }
  const command = Array.isArray(spec.command) ? spec.command : String(spec.command ?? "").split(/\s+/).filter(Boolean);
  if (!command.length) throw new Error("devServer.command is empty");
  const cwd = path.resolve(root, spec.cwd ?? ".");
  logger?.info("starting local server", { command: command.join(" "), cwd });
  const child = spawn(command[0], command.slice(1), {
    cwd,
    env: { ...process.env, ...(spec.env ?? {}) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += String(chunk);
    if (output.length > 20000) output = output.slice(-20000);
  });
  child.stderr?.on("data", (chunk) => {
    output += String(chunk);
    if (output.length > 20000) output = output.slice(-20000);
  });

  const timeoutMs = spec.timeoutMs ?? 45000;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await reachable(spec.url)) return child;
    if (child.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  stopServer(child);
  throw new Error(`Local server did not become reachable at ${spec.url}.\n${output}`);
}

export function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  setTimeout(() => {
    if (child.exitCode === null) child.kill("SIGKILL");
  }, 2500).unref();
}
