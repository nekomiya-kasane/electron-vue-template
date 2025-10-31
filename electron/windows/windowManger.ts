import { BrowserWindow } from "electron";

// local imports
import { createMainWindow } from "./mainWindow";

class WindowManager {
  private _mainWindow: BrowserWindow | null = null;

  createMainWindow() {
    if (this._mainWindow) {
      this._mainWindow.focus();
      return this._mainWindow;
    }

    this._mainWindow = createMainWindow();
    return this._mainWindow;
  }

  getMainWindow() {
    if (!this._mainWindow) {
      this.createMainWindow();
    }
    return this._mainWindow;
  }
}

export const windowManager = new WindowManager();