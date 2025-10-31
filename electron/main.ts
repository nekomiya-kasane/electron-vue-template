import { app, BrowserWindow, Tray } from 'electron'
import path from 'path'

// local imports
import { logger, setupErrorHandlers } from './services/logger'

const isDev = process.env.NODE_ENV === 'development'
const isProduction = !isDev

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

app.whenReady().then(() => {
    setupErrorHandlers()


})