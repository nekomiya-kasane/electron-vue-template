/**
 * Socket 调试测试脚本
 * 带详细日志，用于诊断问题
 */

import net from 'net'

const HOST = 'localhost'
const PORT = 8080

console.log(`\n=== Socket Debug Test ===`)
console.log(`Connecting to ${HOST}:${PORT}...\n`)

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('✅ Connected to server')
  console.log(`Local: ${client.localAddress}:${client.localPort}`)
  console.log(`Remote: ${client.remoteAddress}:${client.remotePort}\n`)

  // 测试命令 - 扩展的类层次结构（带类型）
  const commands = [
    // 1. 创建基础类层次
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Object' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Object', type: 'component' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Animal' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Animal', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Animal', parent: 'Object' }},
    
    // 2. 创建动物子类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Mammal' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Mammal', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Bird' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Bird', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Fish' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Fish', parent: 'Animal' }},
    
    // 3. 创建哺乳动物子类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Dog', parent: 'Mammal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Cat' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Cat', parent: 'Mammal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Horse' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Horse', parent: 'Mammal' }},
    
    // 4. 创建鸟类子类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Eagle' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Eagle', parent: 'Bird' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Penguin' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Penguin', parent: 'Bird' }},
    
    // 5. 添加扩展
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Dog', extension: 'Barking', type: 'data' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Cat', extension: 'Meowing', type: 'data' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Eagle', extension: 'Flying', type: 'code' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Horse', extension: 'Running', type: 'cache' }},
    
    // 6. 添加接口
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Dog', interface: 'IPet', type: 'tie' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Cat', interface: 'IPet', type: 'tie' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Eagle', interface: 'IWild', type: 'boa' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Horse', interface: 'IFarm', type: 'tie-chain' }},
    
    // 7. 查询测试
    { framework: 'System', command: 'query:start-query', payload: {}},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Dog' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'IPet' }},
    { framework: 'System', command: 'query:end-query', payload: { result: 'ok' }},
    { framework: 'System', command: 'query:clear-query-history', payload: {}}
  ]

  let index = 0
  let sentCount = 0
  
  const sendNext = () => {
    if (index < commands.length) {
      const cmd = commands[index]
      const message = JSON.stringify(cmd) + '\n'
      
      console.log(`\n📤 [${index + 1}/${commands.length}] Sending: ${cmd.command}`)
      console.log(`   Payload: ${JSON.stringify(cmd.payload)}`)
      console.log(`   Message length: ${message.length} bytes`)
      
      const success = client.write(message, (err) => {
        if (err) {
          console.error(`   ❌ Write error:`, err.message)
        } else {
          sentCount++
          console.log(`   ✅ Sent successfully (${sentCount}/${commands.length})`)
        }
      })
      
      if (!success) {
        console.warn(`   ⚠️  Write buffer full, waiting for drain...`)
      }
      
      index++
      
      // 延迟1.5秒发送下一个
      setTimeout(sendNext, 1500)
    } else {
      console.log(`\n✅ All ${commands.length} commands sent`)
      console.log(`Waiting 5 seconds before closing connection...`)
      
      setTimeout(() => {
        console.log(`\nClosing connection...`)
        client.end()
      }, 5000)
    }
  }

  // 延迟500ms开始发送
  setTimeout(() => {
    console.log(`Starting to send commands...\n`)
    sendNext()
  }, 500)
})

client.on('data', (data) => {
  console.log(`\n📥 Server response:`, data.toString())
})

client.on('drain', () => {
  console.log(`   🔄 Write buffer drained`)
})

client.on('end', () => {
  console.log(`\n🔌 Server ended connection`)
})

client.on('close', (hadError) => {
  console.log(`\n🔌 Connection closed ${hadError ? 'with error' : 'normally'}`)
  console.log(`\n=== Test Complete ===\n`)
  process.exit(0)
})

client.on('error', (err) => {
  console.error(`\n❌ Socket error:`, err.message)
  console.error(`   Code:`, err.code)
  process.exit(1)
})

client.on('timeout', () => {
  console.warn(`\n⚠️  Socket timeout`)
})

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Interrupted by user`)
  client.destroy()
  process.exit(0)
})

// 设置超时
client.setTimeout(30000) // 30秒超时
