import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, session } from "electron";
import { ipcMain } from "electron/main";
// import { UpdateSourceType, updateElectronApp } from "update-electron-app";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS, inDevelopment } from "./constants";
import { getBasePath } from "./utils/path";

function createWindow() {
  const basePath = getBasePath();
  const preload = path.join(basePath, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });
  ipcContext.setMainWindow(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(basePath, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

async function installExtensions() {
  if (!inDevelopment) {
    return;
  }

  try {
    const configuredDevToolsPath = process.env.REACT_DEVTOOLS_PATH;
    const reactDevToolsPath =
      configuredDevToolsPath ??
      path.join(app.getPath("userData"), "extensions", "react-devtools");

    if (!fs.existsSync(reactDevToolsPath)) {
      if (configuredDevToolsPath) {
        console.warn(
          "React Developer Tools extension path not found at REACT_DEVTOOLS_PATH."
        );
      }
      return;
    }

    const loadedExtensions =
      session.defaultSession.extensions.getAllExtensions();
    const isLoaded = loadedExtensions.some(
      (extension) => extension.name === "React Developer Tools"
    );

    if (isLoaded) {
      return;
    }

    await session.defaultSession.extensions.loadExtension(reactDevToolsPath);
    console.log("Extensions installed successfully: React Developer Tools");
  } catch (error) {
    console.warn("Failed to install React Developer Tools extension:", error);
  }
}

// function checkForUpdates() {
//   updateElectronApp({
//     updateSource: {
//       type: UpdateSourceType.ElectronPublicUpdateService,
//       repo: "LuanRoger/electron-shadcn",
//     },
//   });
// }

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

import { initDb } from "./lib/db";

app.whenReady().then(async () => {
  try {
    createWindow();
    await installExtensions();
    // checkForUpdates();
    await setupORPC();
    await initDb();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
