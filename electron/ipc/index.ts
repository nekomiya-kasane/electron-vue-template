import { setupAppIpcEndpoints as setupIpcEndpoints_App } from "./handlers/app";

export function setupIpcEndpoints() {
    setupIpcEndpoints_App()
}