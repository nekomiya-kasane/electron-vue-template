/**
 * 简化的 Socket 测试脚本
 * 用于调试基本功能
 */

import net from 'net'

const HOST = 'localhost'
const PORT = 8080

console.log(`Connecting to ${HOST}:${PORT}...`)

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('✅ Connected to server\n')

  // 简单测试：创建3个节点和2条边
  const commands = [
    // 创建节点
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Animal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Cat' }},
    
    // 设置继承关系
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Dog', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Cat', parent: 'Animal' }}
  ]

  let index = 0
  const sendNext = () => {
    if (index < commands.length) {
      const cmd = commands[index]
      console.log(`\n📤 [${index + 1}/${commands.length}] ${cmd.command}`)
      console.log(`   Payload: ${JSON.stringify(cmd.payload)}`)
      
      const message = JSON.stringify(cmd) + '\n'
      console.log(`   Raw: ${message.trim()}`)
      
      client.write(message)
      index++
      
      // 延迟1秒
      setTimeout(sendNext, 1000)
    } else {
      console.log('\n✅ All commands sent')
      console.log('Waiting 2 seconds before closing...')
      setTimeout(() => {
        console.log('Closing connection...')
        client.end()
      }, 2000)
    }
  }

  // 开始发送
  setTimeout(sendNext, 500)
})

client.on('data', (data) => {
  console.log('📥 Server response:', data.toString())
})

client.on('end', () => {
  console.log('\n🔌 Disconnected from server')
  process.exit(0)
})

client.on('error', (err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted')
  client.end()
  process.exit(0)
})
