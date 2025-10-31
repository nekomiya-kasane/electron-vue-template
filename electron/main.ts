import { app, BrowserWindow, Tray } from "electron";
import path from "path";

// local imports
import { setupErrorHandlers } from "./services/logger";
import { setupIpcEndpoints } from "./ipc";
import { windowManager } from "./windows/windowManger";
import { logger } from "./services/logger";
import { config } from "./config";

app.whenReady().then(() => {
  // step 1: setup error handlers to catch all unhandled errors and log them
  setupErrorHandlers();

  // step 2: setup ipc endpoints for the frontend
  setupIpcEndpoints();

  // step 3: define app events
  //    when app is activated, create the main window or focus on it if it already exists
  app.on("activate", () => {
    logger.info("app ready");

    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow();
    } else {
      windowManager.getMainWindow()?.focus();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("render-process-gone", (event, webContents, details) => {
  logger.error("render process gone", details);
});

if (config.isDev) {
  app.commandLine.appendSwitch("disable-http-cache");
  app.commandLine.appendSwitch("disable-web-security");
}
app.commandLine.appendSwitch("disable-extensions");
