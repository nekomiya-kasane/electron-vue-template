/**
 * 事件发射器 - 类似 VSCode 的 EventEmitter
 * 提供类型安全的事件订阅和触发机制
 */

export interface Event<T> {
  (listener: (e: T) => any, thisArgs?: any): Disposable
}

export interface Disposable {
  dispose(): void
}

export class EventEmitter<T = any> {
  private listeners: Array<{
    listener: (e: T) => any
    thisArgs?: any
  }> = []

  private _disposed = false

  /**
   * 事件订阅接口
   */
  get event(): Event<T> {
    return (listener: (e: T) => any, thisArgs?: any): Disposable => {
      if (this._disposed) {
        throw new Error('EventEmitter has been disposed')
      }

      const listenerObj = { listener, thisArgs }
      this.listeners.push(listenerObj)

      // 返回 Disposable 对象
      return {
        dispose: () => {
          const index = this.listeners.indexOf(listenerObj)
          if (index !== -1) {
            this.listeners.splice(index, 1)
          }
        }
      }
    }
  }

  /**
   * 触发事件
   */
  fire(event: T): void {
    if (this._disposed) {
      console.warn('Attempting to fire event on disposed EventEmitter')
      return
    }

    // 复制监听器数组，避免在触发过程中修改导致问题
    const listeners = [...this.listeners]

    for (const { listener, thisArgs } of listeners) {
      try {
        listener.call(thisArgs, event)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    }
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(): boolean {
    return this.listeners.length > 0
  }

  /**
   * 获取监听器数量
   */
  get listenerCount(): number {
    return this.listeners.length
  }

  /**
   * 释放所有监听器
   */
  dispose(): void {
    if (this._disposed) {
      return
    }

    this.listeners = []
    this._disposed = true
  }

  /**
   * 检查是否已释放
   */
  get disposed(): boolean {
    return this._disposed
  }
}

/**
 * 创建一个简单的 Disposable 对象
 */
export function toDisposable(fn: () => void): Disposable {
  return {
    dispose: fn
  }
}

/**
 * 组合多个 Disposable
 */
export class DisposableStore implements Disposable {
  private disposables: Disposable[] = []
  private _disposed = false

  /**
   * 添加 Disposable
   */
  add<T extends Disposable>(disposable: T): T {
    if (this._disposed) {
      disposable.dispose()
    } else {
      this.disposables.push(disposable)
    }
    return disposable
  }

  /**
   * 释放所有 Disposable
   */
  dispose(): void {
    if (this._disposed) {
      return
    }

    this._disposed = true

    for (const disposable of this.disposables) {
      try {
        disposable.dispose()
      } catch (error) {
        console.error('Error disposing:', error)
      }
    }

    this.disposables = []
  }

  /**
   * 清空但不释放
   */
  clear(): void {
    this.disposables = []
  }

  /**
   * 检查是否已释放
   */
  get disposed(): boolean {
    return this._disposed
  }
}
