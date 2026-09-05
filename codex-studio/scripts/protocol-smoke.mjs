import { spawn } from "node:child_process";
import readline from "node:readline";

const executable = process.env.CODEX_BIN?.trim() || "codex";
const child = spawn(executable, ["app-server", "--listen", "stdio://"], {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});

const timer = setTimeout(() => {
  console.error("Protocol smoke test timed out.");
  child.kill();
  process.exitCode = 1;
}, 15_000);

const lines = readline.createInterface({ input: child.stdout });
child.on("error", (error) => {
  clearTimeout(timer);
  console.error(error.message);
  process.exitCode = 1;
});

lines.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.id !== 1) return;
  clearTimeout(timer);
  if (message.error) {
    console.error(message.error.message ?? "Initialization failed.");
    process.exitCode = 1;
  } else {
    child.stdin.write(`${JSON.stringify({ method: "initialized" })}\n`);
    console.log("Codex App Server protocol handshake: OK");
  }
  child.kill();
});

child.stdin.write(`${JSON.stringify({
  method: "initialize",
  id: 1,
  params: {
    clientInfo: { name: "arc_code_smoke", title: "Arc Code Smoke Test", version: "0.1.0" },
    capabilities: {
      experimentalApi: false,
      requestAttestation: false,
      mcpServerOpenaiFormElicitation: false,
      optOutNotificationMethods: null,
      extensions: null,
    },
  },
})}\n`);
