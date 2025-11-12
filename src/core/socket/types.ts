/**
 * Socket 管理系统类型定义
 */

export interface SocketMessage {
  framework: string
  command: string
  payload: Record<string, any>
}

export interface SocketSession {
  id: string
  remoteAddress: string
  remotePort: number
  connectedAt: Date
  lastActivity: Date
}

export interface SocketServerConfig {
  port: number
  host?: string
  maxConnections?: number
}

export interface SocketClientConfig {
  host: string
  port: number
  reconnect?: boolean
  reconnectInterval?: number
}

export type MessageHandler = (message: SocketMessage, session: SocketSession) => void | Promise<void>
export type ConnectionHandler = (session: SocketSession) => void
export type DisconnectionHandler = (session: SocketSession) => void
export type ErrorHandler = (error: Error, session?: SocketSession) => void
