import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const chrome = process.env.CHROME;
const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
if (!chrome) throw new Error("CHROME environment variable is required.");

const userDataDir = "/tmp/hafloorplan-export-chrome";
await rm(userDataDir, { recursive: true, force: true });
await mkdir(userDataDir, { recursive: true });

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--remote-debugging-port=9223",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let chromeStderr = "";
chromeProcess.stderr.on("data", chunk => { chromeStderr += chunk.toString(); });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9223/json/version");
      if (response.ok) return response.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`Chrome DevTools endpoint did not start.\n${chromeStderr}`);
}

const version = await waitForDebugger();
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const listeners = new Map();
const consoleMessages = [];
const logMessages = [];
const exceptions = [];

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
    return;
  }

  if (message.method === "Runtime.consoleAPICalled") {
    consoleMessages.push((message.params.args || []).map(arg => arg.value ?? arg.description ?? "").join(" "));
  }
  if (message.method === "Log.entryAdded") logMessages.push(message.params.entry?.text || "");
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "");

  const key = `${message.sessionId || "browser"}:${message.method}`;
  const queue = listeners.get(key);
  if (queue?.length) queue.shift()(message.params);
});

function send(method, params = {}, sessionId) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitForEvent(method, sessionId) {
  const key = `${sessionId || "browser"}:${method}`;
  return new Promise(resolve => {
    const queue = listeners.get(key) || [];
    queue.push(resolve);
    listeners.set(key, queue);
  });
}

async function navigate(url, sessionId) {
  const loaded = waitForEvent("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url }, sessionId);
  await loaded;
}

try {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Log.enable", {}, sessionId);

  await navigate(`${baseUrl}/home-assistant-export`, sessionId);

  const project = {
    name: "QA Hydration Plan",
    width: 1000,
    height: 620,
    image: "",
    rooms: [{
      id: "living",
      name: "Living",
      color: "#ffb86b",
      light: false,
      temperature: 70,
      points: [{ x: 0, y: 0 }, { x: 900, y: 0 }, { x: 900, y: 500 }],
    }],
    devices: [{ id: "light-1", roomId: "living", x: 450, y: 250, type: "light" }],
  };

  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("floor-plan-studio-project", ${JSON.stringify(JSON.stringify(project))})`,
  }, sessionId);

  consoleMessages.length = 0;
  logMessages.length = 0;
  exceptions.length = 0;

  const reloaded = waitForEvent("Page.loadEventFired", sessionId);
  await send("Page.reload", { ignoreCache: true }, sessionId);
  await reloaded;
  await sleep(1500);

  const { result } = await send("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  }, sessionId);
  const bodyText = result.value || "";

  if (!bodyText.includes("QA Hydration Plan")) {
    throw new Error(`Saved project did not render after hydration. Body:\n${bodyText}`);
  }

  const browserOutput = [...consoleMessages, ...logMessages, ...exceptions].join("\n");
  if (/Hydration failed|server rendered text didn't match the client|hydration mismatch/i.test(browserOutput)) {
    throw new Error(`React hydration error detected:\n${browserOutput}`);
  }

  const screenshot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  await writeFile("/tmp/ha-export.png", Buffer.from(screenshot.data, "base64"));
  await writeFile("/tmp/ha-export-browser.log", browserOutput || "No hydration/runtime errors captured.\n");
} finally {
  socket.close();
  chromeProcess.kill("SIGTERM");
}
