/**
 * Socket Client 测试脚本
 * 用于测试 GraphView 的 Socket Server
 * 
 * 使用方法：node test/socket-client-test.js
 */

import net from 'net'

const HOST = 'localhost'
const PORT = 8080

console.log(`Connecting to ${HOST}:${PORT}...`)

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('✅ Connected to server\n')

  // 测试命令序列
  const commands = [
    // 1. 创建顶点
    {
      framework: 'System',
      command: 'meta-class:create',
      payload: { name: 'Animal' }
    },
    {
      framework: 'System',
      command: 'meta-class:create',
      payload: { name: 'Dog' }
    },
    {
      framework: 'System',
      command: 'meta-class:create',
      payload: { name: 'Cat' }
    },

    // 2. 设置继承关系
    {
      framework: 'System',
      command: 'meta-class:set-parent',
      payload: { name: 'Dog', parent: 'Animal' }
    },
    {
      framework: 'System',
      command: 'meta-class:set-parent',
      payload: { name: 'Cat', parent: 'Animal' }
    },

    // 3. 添加扩展
    {
      framework: 'System',
      command: 'meta-class:add-extension',
      payload: { name: 'Dog', extension: 'Barking', type: 'data' }
    },
    {
      framework: 'System',
      command: 'meta-class:add-extension',
      payload: { name: 'Cat', extension: 'Meowing', type: 'code' }
    },

    // 4. 添加接口
    {
      framework: 'System',
      command: 'meta-class:add-interface',
      payload: { name: 'Dog', interface: 'IPet', type: 'tie' }
    },

    // 5. 查询测试
    {
      framework: 'System',
      command: 'query:start-query',
      payload: {}
    },
    {
      framework: 'System',
      command: 'query:set-querier',
      payload: { name: 'Dog' }
    },
    {
      framework: 'System',
      command: 'query:set-interface',
      payload: { name: 'IPet' }
    },
    {
      framework: 'System',
      command: 'query:end-query',
      payload: { result: 'ok' }
    }
  ]

  // 逐个发送命令
  let index = 0
  const sendNext = () => {
    if (index < commands.length) {
      const cmd = commands[index]
      console.log(`📤 Sending command ${index + 1}/${commands.length}: ${cmd.command}`)
      console.log(`   Payload:`, JSON.stringify(cmd.payload))
      
      client.write(JSON.stringify(cmd) + '\n')
      index++
      
      // 延迟发送下一个命令（增加延迟确保消息被处理）
      setTimeout(sendNext, 800)
    } else {
      console.log('\n✅ All commands sent')
      setTimeout(() => {
        console.log('Closing connection...')
        client.end()
      }, 1000)
    }
  }

  // 开始发送
  sendNext()
})

client.on('data', (data) => {
  console.log('📥 Received:', data.toString())
})

client.on('end', () => {
  console.log('\n🔌 Disconnected from server')
})

client.on('error', (err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted, closing connection...')
  client.end()
  process.exit(0)
})
