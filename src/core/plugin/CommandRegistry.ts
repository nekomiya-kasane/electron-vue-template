/**
 * 命令注册表 - 类似 VSCode 的命令系统
 * 允许插件注册和执行命令，实现插件间的通信
 */

export interface Command {
  id: string
  handler: (...args: any[]) => any | Promise<any>
  description?: string
  category?: string
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map()
  private commandHistory: Array<{ id: string; args: any[]; timestamp: number }> = []

  /**
   * 注册命令
   */
  registerCommand(id: string, handler: (...args: any[]) => any | Promise<any>, options?: {
    description?: string
    category?: string
  }): void {
    if (this.commands.has(id)) {
      console.warn(`[CommandRegistry] Command "${id}" is already registered, overwriting`)
    }

    this.commands.set(id, {
      id,
      handler,
      description: options?.description,
      category: options?.category
    })

    console.log(`[CommandRegistry] Command registered: ${id}`)
  }

  /**
   * 注销命令
   */
  unregisterCommand(id: string): boolean {
    const result = this.commands.delete(id)
    if (result) {
      console.log(`[CommandRegistry] Command unregistered: ${id}`)
    }
    return result
  }

  /**
   * 执行命令
   */
  async executeCommand<T = any>(id: string, ...args: any[]): Promise<T> {
    const command = this.commands.get(id)
    
    if (!command) {
      throw new Error(`Command "${id}" not found`)
    }

    try {
      // 记录命令历史
      this.commandHistory.push({
        id,
        args,
        timestamp: Date.now()
      })

      // 限制历史记录数量
      if (this.commandHistory.length > 100) {
        this.commandHistory.shift()
      }

      console.log(`[CommandRegistry] Executing command: ${id}`, args)
      
      const result = await command.handler(...args)
      return result as T
    } catch (error) {
      console.error(`[CommandRegistry] Error executing command "${id}":`, error)
      throw error
    }
  }

  /**
   * 检查命令是否存在
   */
  hasCommand(id: string): boolean {
    return this.commands.has(id)
  }

  /**
   * 获取所有命令
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
  }

  /**
   * 按类别获取命令
   */
  getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category)
  }

  /**
   * 获取命令历史
   */
  getCommandHistory(limit?: number): Array<{ id: string; args: any[]; timestamp: number }> {
    if (limit) {
      return this.commandHistory.slice(-limit)
    }
    return [...this.commandHistory]
  }

  /**
   * 清空命令历史
   */
  clearHistory(): void {
    this.commandHistory = []
  }

  /**
   * 清空所有命令
   */
  clear(): void {
    this.commands.clear()
    this.commandHistory = []
  }
}
