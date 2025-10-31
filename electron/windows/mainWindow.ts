import { BrowserWindow, shell } from "electron";
import path from "path";

// local imports
import { config, isDev } from "../config";
import { logger } from "../services/logger";

export function createMainWindow() {
  // step 1: create the main window
  const mainWindow = new BrowserWindow({
    // window size
    width: config.window.main.initWidth,
    height: config.window.main.initHeight,
    minWidth: config.window.main.minWidth,
    minHeight: config.window.main.minHeight,
    maxWidth: config.window.main.maxWidth,
    maxHeight: config.window.main.maxHeight,

    show: false,
    frame: true,

    webPreferences: {
      preload: path.join(process.cwd(), "preload.js"),
      nodeIntegration: false, // allow the renderer process to access node.js APIs
      contextIsolation: true, // let the renderer process and main process share the same context,
      sandbox: false, // enable sandbox for more security, but will impact performance. So we disable it.
      zoomFactor: 1.0, // set the zoom factor of the window
      devTools: true, // enable dev tools
      webviewTag: true, // enable webview tag to allow embedding other web content
      backgroundThrottling: false,
      // disable background throttling to prevent the app from being throttled when it is in the background
    },
  });

  // step 2: load the window context
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${config.port}`);
  } else {
    mainWindow.loadFile(path.join(process.cwd(), "../../dist/index.html"));
  }

  // step 3:
  //   after finished loading the window context, show it
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  //   prevent navigation to external urls
  mainWindow.webContents.on("will-navigate", (event, url) => {
    logger.info("will navigate to: ", url);
    if (
      !url.startsWith("http://localhost:") &&
      !url.startsWith("https://localhost:") &&
      !url.startsWith("http://localhost:") &&
      !url.startsWith("file://")
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  //   prevent opening new windows
  mainWindow.webContents.setWindowOpenHandler((details) => {
    logger.warn("window open handler: ", details);
    return { action: "deny" };
  });

  return mainWindow;
}
