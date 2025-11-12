/**
 * Socket 交互式 CLI 测试工具
 * 支持手动输入命令进行测试
 */

import net from 'net'
import readline from 'readline'

const HOST = 'localhost'
const PORT = 8080

let client = null
let connected = false

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Socket Interactive CLI Test Tool                      ║
╚════════════════════════════════════════════════════════════════╝

Commands:
  connect              - Connect to socket server
  disconnect           - Disconnect from server
  help                 - Show help message
  exit                 - Exit program
  
  create <name>        - Create a vertex
  type <name> <type>   - Set vertex type
  parent <name> <parent> - Set parent (inheritance)
  ext <name> <extension> [type] - Add extension
  iface <name> <interface> <type> - Add interface
  
  query-start          - Start query mode
  query-end <result>   - End query (ok/failed/cached)
  query-querier <name> - Set querier
  query-iface <name>   - Set interface
  query-clear          - Clear query history
  
  raw <json>           - Send raw JSON command

Examples:
  create Dog
  type Dog component
  parent Dog Animal
  ext Dog BarkingExt code
  iface Dog IPet tie
  
Type 'help' for more information.
`)

// 连接到服务器
function connect() {
  if (connected) {
    console.log('⚠️  Already connected')
    return
  }

  console.log(`\n🔌 Connecting to ${HOST}:${PORT}...`)
  
  client = net.createConnection({ host: HOST, port: PORT }, () => {
    connected = true
    console.log('✅ Connected to server')
    console.log(`Local: ${client.localAddress}:${client.localPort}`)
    console.log(`Remote: ${client.remoteAddress}:${client.remotePort}\n`)
    rl.prompt()
  })

  client.on('data', (data) => {
    // 静默接收数据，避免干扰输入
  })

  client.on('end', () => {
    connected = false
    console.log('\n🔌 Server ended connection')
    rl.prompt()
  })

  client.on('close', (hadError) => {
    connected = false
    console.log(`\n🔌 Connection closed ${hadError ? 'with error' : 'normally'}`)
    rl.prompt()
  })

  client.on('error', (err) => {
    connected = false
    console.error(`\n❌ Socket error:`, err.message)
    rl.prompt()
  })
}

// 断开连接
function disconnect() {
  if (!connected) {
    console.log('⚠️  Not connected')
    return
  }

  console.log('🔌 Disconnecting...')
  client.end()
}

// 发送命令
function sendCommand(command) {
  if (!connected) {
    console.log('❌ Not connected. Use "connect" first.')
    return
  }

  const message = JSON.stringify(command) + '\n'
  client.write(message, (err) => {
    if (err) {
      console.error('❌ Write error:', err.message)
    } else {
      console.log('✅ Sent:', command.command)
    }
  })
}

// 显示帮助
function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                        Command Reference                       ║
╚════════════════════════════════════════════════════════════════╝

Connection:
  connect              Connect to socket server (localhost:8080)
  disconnect           Disconnect from server
  exit                 Exit program

Meta-Class Commands:
  create <name>
    Create a new vertex
    Example: create Dog
    
  type <name> <type>
    Set vertex type
    Types: unknown, component, interface, tie, boa,
           data-extension, code-extension, 
           transient-extension, cache-extension
    Example: type Dog component
    
  parent <name> <parent>
    Set parent (inheritance)
    Example: parent Dog Animal
    Use "parent Dog none" to remove parent
    
  ext <name> <extension> [type]
    Add extension to vertex
    Types: data, code, cache, transient (optional)
    Example: ext Dog BarkingExt code
    Example: ext Dog DataExt (auto-infer type)
    
  iface <name> <interface> <type>
    Add interface implementation
    Types: tie, tie-chain, boa
    Example: iface Dog IPet tie

Query Commands:
  query-start          Start query mode
  query-end <result>   End query (ok/failed/cached)
  query-querier <name> Set querier vertex
  query-iface <name>   Set interface vertex
  query-clear          Clear all query highlights

Advanced:
  raw <json>           Send raw JSON command
    Example: raw {"framework":"System","command":"meta-class:create","payload":{"name":"Test"}}

Node Types & Colors:
  unknown              Gray    - Default type
  component            Blue    - Component class
  interface            Purple  - Interface
  tie                  Cyan    - Tie type
  boa                  Indigo  - Boa type
  data-extension       Green   - Data extension
  code-extension       Green   - Code extension
  transient-extension  Green   - Transient extension
  cache-extension      Green   - Cache extension

Edge Types:
  Inheritance          Blue solid line
  Extension            Green dashed line (4 types)
  Implementation       Cyan dotted line (3 types)

Tips:
  - Use Tab for command history
  - Commands are case-sensitive
  - Press Ctrl+C to exit
`)
}

// 处理用户输入
rl.on('line', (line) => {
  const input = line.trim()
  
  if (!input) {
    rl.prompt()
    return
  }

  const parts = input.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  try {
    switch (cmd) {
      case 'connect':
        connect()
        break

      case 'disconnect':
        disconnect()
        break

      case 'help':
        showHelp()
        break

      case 'exit':
      case 'quit':
        console.log('\n👋 Goodbye!')
        if (connected) {
          client.end()
        }
        process.exit(0)
        break

      case 'create':
        if (args.length < 1) {
          console.log('❌ Usage: create <name>')
        } else {
          sendCommand({
            framework: 'System',
            command: 'meta-class:create',
            payload: { name: args[0] }
          })
        }
        break

      case 'type':
        if (args.length < 2) {
          console.log('❌ Usage: type <name> <type>')
          console.log('   Types: unknown, component, interface, tie, boa, data-extension, code-extension, transient-extension, cache-extension')
        } else {
          sendCommand({
            framework: 'System',
            command: 'meta-class:set-type',
            payload: { name: args[0], type: args[1] }
          })
        }
        break

      case 'parent':
        if (args.length < 2) {
          console.log('❌ Usage: parent <name> <parent>')
          console.log('   Use "parent <name> none" to remove parent')
        } else {
          sendCommand({
            framework: 'System',
            command: 'meta-class:set-parent',
            payload: { name: args[0], parent: args[1] }
          })
        }
        break

      case 'ext':
      case 'extension':
        if (args.length < 2) {
          console.log('❌ Usage: ext <name> <extension> [type]')
          console.log('   Types: data, code, cache, transient (optional)')
        } else {
          const payload = { name: args[0], extension: args[1] }
          if (args[2]) {
            payload.type = args[2]
          }
          sendCommand({
            framework: 'System',
            command: 'meta-class:add-extension',
            payload
          })
        }
        break

      case 'iface':
      case 'interface':
        if (args.length < 3) {
          console.log('❌ Usage: iface <name> <interface> <type>')
          console.log('   Types: tie, tie-chain, boa')
        } else {
          sendCommand({
            framework: 'System',
            command: 'meta-class:add-interface',
            payload: { name: args[0], interface: args[1], type: args[2] }
          })
        }
        break

      case 'query-start':
        sendCommand({
          framework: 'System',
          command: 'query:start-query',
          payload: {}
        })
        break

      case 'query-end':
        if (args.length < 1) {
          console.log('❌ Usage: query-end <result>')
          console.log('   Results: ok, failed, cached')
        } else {
          sendCommand({
            framework: 'System',
            command: 'query:end-query',
            payload: { result: args[0] }
          })
        }
        break

      case 'query-querier':
        if (args.length < 1) {
          console.log('❌ Usage: query-querier <name>')
        } else {
          sendCommand({
            framework: 'System',
            command: 'query:set-querier',
            payload: { name: args[0] }
          })
        }
        break

      case 'query-iface':
      case 'query-interface':
        if (args.length < 1) {
          console.log('❌ Usage: query-iface <name>')
        } else {
          sendCommand({
            framework: 'System',
            command: 'query:set-interface',
            payload: { name: args[0] }
          })
        }
        break

      case 'query-clear':
        sendCommand({
          framework: 'System',
          command: 'query:clear-query-history',
          payload: {}
        })
        break

      case 'raw':
        if (args.length < 1) {
          console.log('❌ Usage: raw <json>')
        } else {
          try {
            const json = JSON.parse(args.join(' '))
            sendCommand(json)
          } catch (e) {
            console.error('❌ Invalid JSON:', e.message)
          }
        }
        break

      default:
        console.log(`❌ Unknown command: ${cmd}`)
        console.log('   Type "help" for available commands')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  rl.prompt()
})

rl.on('close', () => {
  console.log('\n👋 Goodbye!')
  if (connected) {
    client.end()
  }
  process.exit(0)
})

// 显示提示符
rl.prompt()
