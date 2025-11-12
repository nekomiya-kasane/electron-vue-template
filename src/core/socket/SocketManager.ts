/**
 * Socket 管理器
 * 统一管理所有 Socket Server 和 Client 实例
 */

import { SocketServer } from './SocketServer'
import { SocketClient } from './SocketClient'
import type { SocketServerConfig, SocketClientConfig } from './types'

export class SocketManager {
  private servers: Map<string, SocketServer> = new Map()
  private clients: Map<string, SocketClient> = new Map()

  /**
   * 创建 Socket Server
   */
  createServer(name: string, config: SocketServerConfig): SocketServer {
    if (this.servers.has(name)) {
      throw new Error(`Server '${name}' already exists`)
    }

    const server = new SocketServer(config)
    this.servers.set(name, server)
    return server
  }

  /**
   * 获取 Socket Server
   */
  getServer(name: string): SocketServer | undefined {
    return this.servers.get(name)
  }

  /**
   * 删除 Socket Server
   */
  async removeServer(name: string): Promise<void> {
    const server = this.servers.get(name)
    if (server) {
      await server.stop()
      this.servers.delete(name)
    }
  }

  /**
   * 创建 Socket Client
   */
  createClient(name: string, config: SocketClientConfig): SocketClient {
    if (this.clients.has(name)) {
      throw new Error(`Client '${name}' already exists`)
    }

    const client = new SocketClient(config)
    this.clients.set(name, client)
    return client
  }

  /**
   * 获取 Socket Client
   */
  getClient(name: string): SocketClient | undefined {
    return this.clients.get(name)
  }

  /**
   * 删除 Socket Client
   */
  removeClient(name: string): void {
    const client = this.clients.get(name)
    if (client) {
      client.disconnect()
      this.clients.delete(name)
    }
  }

  /**
   * 获取所有 Server
   */
  getAllServers(): Map<string, SocketServer> {
    return new Map(this.servers)
  }

  /**
   * 获取所有 Client
   */
  getAllClients(): Map<string, SocketClient> {
    return new Map(this.clients)
  }

  /**
   * 清理所有连接
   */
  async cleanup(): Promise<void> {
    // 停止所有服务器
    const serverPromises = Array.from(this.servers.values()).map(server => server.stop())
    await Promise.all(serverPromises)
    this.servers.clear()

    // 断开所有客户端
    this.clients.forEach(client => client.disconnect())
    this.clients.clear()
  }
}

// 全局单例
export const socketManager = new SocketManager()
