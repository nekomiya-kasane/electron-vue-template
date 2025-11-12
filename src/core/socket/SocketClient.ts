/**
 * Socket Client 管理器
 * 支持连接到远程 Socket 服务器
 */

import type {
  SocketClientConfig,
  SocketMessage,
  MessageHandler,
  ErrorHandler
} from './types'

export class SocketClient {
  private socket: any = null
  private config: SocketClientConfig
  private isConnected = false
  private reconnectTimer: any = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private connectHandlers: Set<() => void> = new Set()
  private disconnectHandlers: Set<() => void> = new Set()

  constructor(config: SocketClientConfig) {
    this.config = {
      reconnect: true,
      reconnectInterval: 5000,
      ...config
    }
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      throw new Error('Client is already connected')
    }

    return new Promise((resolve, reject) => {
      try {
        const net = window.require('net')
        
        this.socket = net.createConnection({
          host: this.config.host,
          port: this.config.port
        })

        this.socket.on('connect', () => {
          this.isConnected = true
          console.log(`Connected to ${this.config.host}:${this.config.port}`)
          
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
          }

          this.connectHandlers.forEach(handler => {
            try {
              handler()
            } catch (error) {
              console.error('Error in connect handler:', error)
            }
          })

          resolve()
        })

        let buffer = ''
        this.socket.on('data', (data: Buffer) => {
          try {
            buffer += data.toString()
            
            const messages = this.parseMessages(buffer)
            messages.forEach(msg => {
              buffer = buffer.slice(msg.raw.length)
              this.handleMessage(msg.parsed)
            })
          } catch (error) {
            console.error('Error handling data:', error)
            this.handleError(error as Error)
          }
        })

        this.socket.on('end', () => {
          this.handleDisconnection()
        })

        this.socket.on('close', () => {
          this.handleDisconnection()
        })

        this.socket.on('error', (error: Error) => {
          console.error('Socket error:', error)
          this.handleError(error)
          
          if (!this.isConnected) {
            reject(error)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }

    this.isConnected = false
  }

  /**
   * 解析消息
   */
  private parseMessages(buffer: string): Array<{ parsed: SocketMessage; raw: string }> {
    const messages: Array<{ parsed: SocketMessage; raw: string }> = []
    let remaining = buffer.trim()

    while (remaining.length > 0) {
      try {
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
          break
        }

        const jsonStr = remaining.slice(0, endIndex)
        const parsed = JSON.parse(jsonStr)
        
        if (this.isValidMessage(parsed)) {
          messages.push({ parsed, raw: jsonStr })
        }

        remaining = remaining.slice(endIndex).trim()
      } catch (error) {
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
  private handleMessage(message: SocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        const result = handler(message, {
          id: 'client',
          remoteAddress: this.config.host,
          remotePort: this.config.port,
          connectedAt: new Date(),
          lastActivity: new Date()
        })
        
        if (result instanceof Promise) {
          result.catch(error => {
            console.error('Error in async message handler:', error)
            this.handleError(error)
          })
        }
      } catch (error) {
        console.error('Error in message handler:', error)
        this.handleError(error as Error)
      }
    })
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(): void {
    if (!this.isConnected) {
      return
    }

    this.isConnected = false
    console.log('Disconnected from server')

    this.disconnectHandlers.forEach(handler => {
      try {
        handler()
      } catch (error) {
        console.error('Error in disconnect handler:', error)
      }
    })

    // 自动重连
    if (this.config.reconnect && !this.reconnectTimer) {
      console.log(`Reconnecting in ${this.config.reconnectInterval}ms...`)
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }, this.config.reconnectInterval)
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error)
      } catch (err) {
        console.error('Error in error handler:', err)
      }
    })
  }

  /**
   * 发送消息
   */
  send(message: SocketMessage): boolean {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message: not connected')
      return false
    }

    try {
      const data = JSON.stringify(message)
      this.socket.write(data + '\n')
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
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
  onConnect(handler: () => void): () => void {
    this.connectHandlers.add(handler)
    return () => this.connectHandlers.delete(handler)
  }

  /**
   * 注册断开连接处理器
   */
  onDisconnect(handler: () => void): () => void {
    this.disconnectHandlers.add(handler)
    return () => this.disconnectHandlers.delete(handler)
  }

  /**
   * 注册错误处理器
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      host: this.config.host,
      port: this.config.port
    }
  }
}
