import { ipcMain, app, BrowserWindow } from "electron";

export function setupAppIpcEndpoints() {
    // get current app version
    ipcMain.handle("app:get-version", () => {
        return app.getVersion()
    })

    // get current app's executable path
    ipcMain.handle("app:get-exe-path", () => {
        return app.getAppPath()
    })

    // window controls
    ipcMain.handle("window:minimize", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.minimize();
    });

    ipcMain.handle("window:maximize", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.isMaximized() ? window.unmaximize() : window?.maximize();
    });

    ipcMain.handle("window:close", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.close();
    });

    ipcMain.handle("window:is-minimized", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        return window?.isMinimized() ?? false;
    })

    ipcMain.handle("window:is-maximized", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        return window?.isMaximized() ?? false;
    });
}