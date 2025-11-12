/**
 * Socket Server 管理器
 * 支持多个客户端连接，每个连接视为独立会话
 */

import type {
  SocketServerConfig,
  SocketSession,
  SocketMessage,
  MessageHandler,
  ConnectionHandler,
  DisconnectionHandler,
  ErrorHandler
} from './types'

export class SocketServer {
  private server: any = null
  private sessions: Map<string, SocketSession> = new Map()
  private messageHandlers: Set<MessageHandler> = new Set()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private disconnectionHandlers: Set<DisconnectionHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private config: SocketServerConfig
  private isRunning = false

  constructor(config: SocketServerConfig) {
    this.config = {
      host: '0.0.0.0',
      maxConnections: 100,
      ...config
    }
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running')
    }

    return new Promise((resolve, reject) => {
      try {
        // 使用 Node.js net 模块（通过 Electron）
        const net = window.require('net')
        
        this.server = net.createServer((socket: any) => {
          this.handleConnection(socket)
        })

        this.server.listen(this.config.port, this.config.host, () => {
          this.isRunning = true
          console.log(`Socket server listening on ${this.config.host}:${this.config.port}`)
          resolve()
        })

        this.server.on('error', (error: Error) => {
          this.handleError(error)
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    return new Promise((resolve) => {
      // 关闭所有连接
      this.sessions.forEach((session) => {
        const socket = (session as any).socket
        if (socket) {
          socket.destroy()
        }
      })
      this.sessions.clear()

      // 关闭服务器
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false
          console.log('Socket server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * 处理新连接
   */
  private handleConnection(socket: any): void {
    const sessionId = `${socket.remoteAddress}:${socket.remotePort}`
    
    // 检查连接数限制
    if (this.sessions.size >= this.config.maxConnections!) {
      console.warn(`Max connections reached, rejecting ${sessionId}`)
      socket.destroy()
      return
    }

    const session: SocketSession & { socket: any } = {
      id: sessionId,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      connectedAt: new Date(),
      lastActivity: new Date(),
      socket
    }

    this.sessions.set(sessionId, session)
    console.log(`Client connected: ${sessionId}`)

    // 触发连接事件
    this.connectionHandlers.forEach(handler => {
      try {
        handler(session)
      } catch (error) {
        console.error('Error in connection handler:', error)
      }
    })

    // 处理数据
    let buffer = ''
    socket.on('data', (data: Buffer) => {
      try {
        buffer += data.toString()
        
        // 尝试解析 JSON（支持多个 JSON 对象）
        const messages = this.parseMessages(buffer)
        messages.forEach(msg => {
          buffer = buffer.slice(msg.raw.length)
          this.handleMessage(msg.parsed, session)
        })
      } catch (error) {
        console.error('Error handling data:', error)
        this.handleError(error as Error, session)
      }
    })

    // 处理断开连接
    socket.on('end', () => {
      this.handleDisconnection(session)
    })

    socket.on('close', () => {
      this.handleDisconnection(session)
    })

    // 处理错误
    socket.on('error', (error: Error) => {
      console.error(`Socket error for ${sessionId}:`, error)
      this.handleError(error, session)
      this.handleDisconnection(session)
    })
  }

  /**
   * 解析消息（支持多个 JSON 对象）
   */
  private parseMessages(buffer: string): Array<{ parsed: SocketMessage; raw: string }> {
    const messages: Array<{ parsed: SocketMessage; raw: string }> = []
    let remaining = buffer.trim()

    while (remaining.length > 0) {
      try {
        // 尝试找到完整的 JSON 对象
        let depth = 0
        let inString = false
        let escape = false
        let endIndex = -1

        for (let i = 0; i < remaining.length; i++) {
          const char = remaining[i]

          if (escape) {
            escape = false
            continue
          }

          if (char === '\\') {
            escape = true
            continue
          }

          if (char === '"') {
            inString = !inString
            continue
          }

          if (!inString) {
            if (char === '{') depth++
            if (char === '}') {
              depth--
              if (depth === 0) {
                endIndex = i + 1
                break
              }
            }
          }
        }

        if (endIndex === -1) {
          // 没有完整的 JSON 对象
          break
        }

        const jsonStr = remaining.slice(0, endIndex)
        const parsed = JSON.parse(jsonStr)
        
        if (this.isValidMessage(parsed)) {
          messages.push({ parsed, raw: jsonStr })
        }

        remaining = remaining.slice(endIndex).trim()
      } catch (error) {
        // 解析失败，跳过
        break
      }
    }

    return messages
  }

  /**
   * 验证消息格式
   */
  private isValidMessage(obj: any): obj is SocketMessage {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.framework === 'string' &&
      typeof obj.command === 'string' &&
      typeof obj.payload === 'object'
    )
  }

  /**
   * 处理消息
   */
  private handleMessage(message: SocketMessage, session: SocketSession): void {
    session.lastActivity = new Date()

    this.messageHandlers.forEach(handler => {
      try {
        const result = handler(message, session)
        if (result instanceof Promise) {
          result.catch(error => {
            console.error('Error in async message handler:', error)
            this.handleError(error, session)
          })
        }
      } catch (error) {
        console.error('Error in message handler:', error)
        this.handleError(error as Error, session)
      }
    })
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(session: SocketSession): void {
    if (!this.sessions.has(session.id)) {
      return
    }

    this.sessions.delete(session.id)
    console.log(`Client disconnected: ${session.id}`)

    this.disconnectionHandlers.forEach(handler => {
      try {
        handler(session)
      } catch (error) {
        console.error('Error in disconnection handler:', error)
      }
    })
  }

  /**
   * 处理错误
   */
  private handleError(error: Error, session?: SocketSession): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, session)
      } catch (err) {
        console.error('Error in error handler:', err)
      }
    })
  }

  /**
   * 发送消息到指定会话
   */
  send(sessionId: string, message: SocketMessage): boolean {
    const session = this.sessions.get(sessionId) as any
    if (!session || !session.socket) {
      return false
    }

    try {
      const data = JSON.stringify(message)
      session.socket.write(data + '\n')
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  /**
   * 广播消息到所有会话
   */
  broadcast(message: SocketMessage): void {
    this.sessions.forEach((session) => {
      this.send(session.id, message)
    })
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  /**
   * 注册连接处理器
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  /**
   * 注册断开连接处理器
   */
  onDisconnection(handler: DisconnectionHandler): () => void {
    this.disconnectionHandlers.add(handler)
    return () => this.disconnectionHandlers.delete(handler)
  }

  /**
   * 注册错误处理器
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  /**
   * 获取所有会话
   */
  getSessions(): SocketSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.config.port,
      host: this.config.host,
      sessionCount: this.sessions.size,
      maxConnections: this.config.maxConnections
    }
  }
}
