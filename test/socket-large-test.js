/**
 * Socket 大型测试脚本 - 100+ 命令
 * 测试完整的类型系统和接口查找功能
 */

import net from 'net'

const HOST = 'localhost'
const PORT = 8080

console.log(`\n=== Socket Large Test (100+ Commands) ===`)
console.log(`Connecting to ${HOST}:${PORT}...\n`)

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log('✅ Connected to server\n')

  // 大型测试命令集
  const commands = [
    // ========== 第一部分：基础类型系统 (20 commands) ==========
    
    // 1. 创建基础类型节点
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Object' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Object', type: 'component' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IBase' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IBase', type: 'interface' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'ISerializable' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'ISerializable', type: 'interface' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'ISerializable', parent: 'IBase' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IComparable' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IComparable', type: 'interface' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'IComparable', parent: 'IBase' }},
    
    // 2. 创建扩展节点
    { framework: 'System', command: 'meta-class:create', payload: { name: 'DataExt1' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'DataExt1', type: 'data-extension' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'CodeExt1' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'CodeExt1', type: 'code-extension' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'CacheExt1' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'CacheExt1', type: 'cache-extension' }},
    
    { framework: 'System', command: 'meta-class:create', payload: { name: 'TransientExt1' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'TransientExt1', type: 'transient-extension' }},
    
    // ========== 第二部分：动物类层次 (30 commands) ==========
    
    // 3. 创建动物基类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Animal' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Animal', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Animal', parent: 'Object' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Animal', interface: 'ISerializable', type: 'tie' }},
    
    // 4. 创建哺乳动物
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Mammal' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Mammal', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Mammal', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Mammal', extension: 'DataExt1' }},
    
    // 5. 创建狗
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Dog' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Dog', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Dog', parent: 'Mammal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'BarkingExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'BarkingExt', type: 'code-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Dog', extension: 'BarkingExt' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IPet' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IPet', type: 'interface' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Dog', interface: 'IPet', type: 'tie' }},
    
    // 6. 创建猫
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Cat' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Cat', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Cat', parent: 'Mammal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'MeowingExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'MeowingExt', type: 'code-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Cat', extension: 'MeowingExt' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Cat', interface: 'IPet', type: 'tie' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Cat', interface: 'IComparable', type: 'boa' }},
    
    // 7. 创建马
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Horse' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Horse', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Horse', parent: 'Mammal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'RunningExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'RunningExt', type: 'cache-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Horse', extension: 'RunningExt' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IFarm' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IFarm', type: 'interface' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Horse', interface: 'IFarm', type: 'tie-chain' }},
    
    // ========== 第三部分：鸟类层次 (20 commands) ==========
    
    // 8. 创建鸟类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Bird' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Bird', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Bird', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IFlyable' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IFlyable', type: 'interface' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Bird', interface: 'IFlyable', type: 'tie' }},
    
    // 9. 创建老鹰
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Eagle' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Eagle', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Eagle', parent: 'Bird' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'HuntingExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'HuntingExt', type: 'code-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Eagle', extension: 'HuntingExt' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'IWild' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'IWild', type: 'interface' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Eagle', interface: 'IWild', type: 'boa' }},
    
    // 10. 创建企鹅
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Penguin' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Penguin', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Penguin', parent: 'Bird' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'SwimmingExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'SwimmingExt', type: 'transient-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Penguin', extension: 'SwimmingExt' }},
    
    // ========== 第四部分：鱼类层次 (15 commands) ==========
    
    // 11. 创建鱼类
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Fish' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Fish', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Fish', parent: 'Animal' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'ISwimmable' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'ISwimmable', type: 'interface' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Fish', interface: 'ISwimmable', type: 'tie' }},
    
    // 12. 创建鲨鱼
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Shark' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Shark', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Shark', parent: 'Fish' }},
    { framework: 'System', command: 'meta-class:create', payload: { name: 'PredatorExt' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'PredatorExt', type: 'data-extension' }},
    { framework: 'System', command: 'meta-class:add-extension', payload: { name: 'Shark', extension: 'PredatorExt' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Shark', interface: 'IWild', type: 'tie' }},
    
    // 13. 创建金鱼
    { framework: 'System', command: 'meta-class:create', payload: { name: 'Goldfish' }},
    { framework: 'System', command: 'meta-class:set-type', payload: { name: 'Goldfish', type: 'component' }},
    { framework: 'System', command: 'meta-class:set-parent', payload: { name: 'Goldfish', parent: 'Fish' }},
    { framework: 'System', command: 'meta-class:add-interface', payload: { name: 'Goldfish', interface: 'IPet', type: 'tie' }},
    
    // ========== 第五部分：查询测试 (15 commands) ==========
    
    // 14. 查询 Dog 实现的接口
    { framework: 'System', command: 'query:start-query', payload: {}},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Dog' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'IPet' }},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Cat' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'IPet' }},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Cat' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'ISerializable' }},
    { framework: 'System', command: 'query:end-query', payload: { result: 'ok' }},
    
    // 15. 查询 Cat 实现的接口
    { framework: 'System', command: 'query:start-query', payload: {}},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Cat' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'ISerializable' }},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Eagle' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'IFlyable' }},
    { framework: 'System', command: 'query:set-querier', payload: { name: 'Penguin' }},
    { framework: 'System', command: 'query:set-interface', payload: { name: 'IPet' }},
    { framework: 'System', command: 'query:end-query', payload: { result: 'failed' }},
  ]

  console.log(`Total commands: ${commands.length}\n`)

  let index = 0
  let sentCount = 0
  
  const sendNext = () => {
    if (index < commands.length) {
      const cmd = commands[index]
      const message = JSON.stringify(cmd) + '\n'
      
      console.log(`📤 [${index + 1}/${commands.length}] ${cmd.command}`)
      if (cmd.payload.name) {
        console.log(`   → ${cmd.payload.name}${cmd.payload.type ? ` (${cmd.payload.type})` : ''}`)
      }
      
      client.write(message, (err) => {
        if (err) {
          console.error(`   ❌ Write error:`, err.message)
        } else {
          sentCount++
        }
      })
      
      index++
      
      // 延迟600ms发送下一个
      setTimeout(sendNext, 600)
    } else {
      console.log(`\n✅ All ${commands.length} commands sent`)
      console.log(`Waiting 3 seconds before closing connection...`)
      
      setTimeout(() => {
        console.log(`\nClosing connection...`)
        client.end()
      }, 3000)
    }
  }

  // 延迟500ms开始发送
  setTimeout(() => {
    console.log(`Starting to send commands...\n`)
    sendNext()
  }, 500)
})

client.on('data', (data) => {
  // 不输出服务器响应，避免刷屏
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
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log(`\n\n⚠️  Interrupted by user`)
  client.destroy()
  process.exit(0)
})

client.setTimeout(120000) // 2分钟超时
