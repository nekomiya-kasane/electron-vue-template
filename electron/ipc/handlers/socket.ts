import { ipcMain, BrowserWindow } from "electron"
import * as net from "net"

interface SocketSession {
  id: string
  remoteAddress: string
  remotePort: number
  connectedAt: Date
  lastActivity: Date
}

interface SocketMessage {
  framework: string
  command: string
  payload: Record<string, any>
}

class SocketServerManager {
  private servers: Map<string, net.Server> = new Map()
  private sessions: Map<string, Map<string, { socket: net.Socket; session: SocketSession }>> = new Map()

  createServer(name: string, port: number, host: string = '0.0.0.0'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.servers.has(name)) {
        reject(new Error(`Server '${name}' already exists`))
        return
      }

      const server = net.createServer((socket) => {
        this.handleConnection(name, socket)
      })

      server.listen(port, host, () => {
        this.servers.set(name, server)
        this.sessions.set(name, new Map())
        console.log(`Socket server '${name}' listening on ${host}:${port}`)
        resolve()
      })

      server.on('error', (error) => {
        console.error(`Socket server '${name}' error:`, error)
        reject(error)
      })
    })
  }

  stopServer(name: string): Promise<void> {
    return new Promise((resolve) => {
      const server = this.servers.get(name)
      if (!server) {
        resolve()
        return
      }

      // 关闭所有连接
      const sessions = this.sessions.get(name)
      if (sessions) {
        sessions.forEach(({ socket }) => {
          socket.destroy()
        })
        sessions.clear()
      }

      server.close(() => {
        this.servers.delete(name)
        this.sessions.delete(name)
        console.log(`Socket server '${name}' stopped`)
        resolve()
      })
    })
  }

  private handleConnection(serverName: string, socket: net.Socket) {
    const sessionId = `${socket.remoteAddress}:${socket.remotePort}`
    const session: SocketSession = {
      id: sessionId,
      remoteAddress: socket.remoteAddress || 'unknown',
      remotePort: socket.remotePort || 0,
      connectedAt: new Date(),
      lastActivity: new Date()
    }

    const sessions = this.sessions.get(serverName)
    if (sessions) {
      sessions.set(sessionId, { socket, session })
      console.log(`[${serverName}] Client connected: ${sessionId}`)

      // 通知渲染进程
      this.notifyRenderer('socket:connection', { serverName, session })
    }

    let buffer = ''
    socket.on('data', (data: Buffer) => {
      try {
        const received = data.toString()
        buffer += received
        console.log(`[${serverName}] Received data (${received.length} bytes):`, received.substring(0, 100))
        
        const messages = this.parseMessages(buffer)
        console.log(`[${serverName}] Parsed ${messages.length} messages from buffer`)
        
        // 处理所有解析出的消息
        for (const msg of messages) {
          session.lastActivity = new Date()
          console.log(`[${serverName}] Processing message:`, msg.parsed.command)
          
          // 通知渲染进程处理消息
          this.notifyRenderer('socket:message', {
            serverName,
            session,
            message: msg.parsed
          })
          
          // 从 buffer 中移除已处理的消息
          buffer = buffer.slice(msg.raw.length).trim()
        }
        
        console.log(`[${serverName}] Remaining buffer length:`, buffer.length)
      } catch (error) {
        console.error(`[${serverName}] Error handling data:`, error)
      }
    })

    socket.on('end', () => {
      this.handleDisconnection(serverName, sessionId)
    })

    socket.on('close', () => {
      this.handleDisconnection(serverName, sessionId)
    })

    socket.on('error', (error) => {
      console.error(`Socket error for ${sessionId}:`, error)
      this.handleDisconnection(serverName, sessionId)
    })
  }

  private handleDisconnection(serverName: string, sessionId: string) {
    const sessions = this.sessions.get(serverName)
    if (sessions && sessions.has(sessionId)) {
      const { session } = sessions.get(sessionId)!
      sessions.delete(sessionId)
      console.log(`[${serverName}] Client disconnected: ${sessionId}`)

      // 通知渲染进程
      this.notifyRenderer('socket:disconnection', { serverName, session })
    }
  }

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

        if (endIndex === -1) break

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

  private isValidMessage(obj: any): obj is SocketMessage {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.framework === 'string' &&
      typeof obj.command === 'string' &&
      typeof obj.payload === 'object'
    )
  }

  private notifyRenderer(channel: string, data: any) {
    // 发送到所有窗口
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(channel, data)
    })
  }

  getSessions(serverName: string): SocketSession[] {
    const sessions = this.sessions.get(serverName)
    if (!sessions) return []
    
    return Array.from(sessions.values()).map(({ session }) => session)
  }

  getServerStatus(serverName: string) {
    const server = this.servers.get(serverName)
    if (!server) return null

    const sessions = this.sessions.get(serverName)
    return {
      isRunning: true,
      sessionCount: sessions?.size || 0
    }
  }
}

const socketManager = new SocketServerManager()

export function setupSocketIpcEndpoints() {
  // 创建 Socket 服务器
  ipcMain.handle('socket:create-server', async (event, name: string, port: number, host?: string) => {
    try {
      await socketManager.createServer(name, port, host)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 停止 Socket 服务器
  ipcMain.handle('socket:stop-server', async (event, name: string) => {
    try {
      await socketManager.stopServer(name)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 获取会话列表
  ipcMain.handle('socket:get-sessions', (event, name: string) => {
    return socketManager.getSessions(name)
  })

  // 获取服务器状态
  ipcMain.handle('socket:get-status', (event, name: string) => {
    return socketManager.getServerStatus(name)
  })
}
