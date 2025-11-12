/**
 * Socket 简化版交互式 CLI
 * 更简洁的命令格式
 */

import net from 'net'
import readline from 'readline'

const HOST = 'localhost'
const PORT = 8080

let client = null
let connected = false

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '🔵 > ',
  completer: (line) => {
    const commands = [
      'connect', 'disconnect', 'help', 'exit',
      'create', 'type', 'parent', 'ext', 'iface',
      'query-start', 'query-end', 'query-querier', 'query-iface', 'query-clear'
    ]
    const hits = commands.filter((c) => c.startsWith(line))
    return [hits.length ? hits : commands, line]
  }
})

console.log(`
╔═══════════════════════════════════════════╗
║    Socket CLI - Quick Test Tool          ║
╚═══════════════════════════════════════════╝

Quick Start:
  1. connect
  2. create Dog
  3. type Dog component
  4. parent Dog Animal
  
Type 'help' for full command list.
`)

function connect() {
  if (connected) {
    console.log('⚠️  Already connected')
    rl.prompt()
    return
  }

  console.log(`🔌 Connecting to ${HOST}:${PORT}...`)
  
  client = net.createConnection({ host: HOST, port: PORT }, () => {
    connected = true
    console.log('✅ Connected!')
    rl.setPrompt('🟢 > ')
    rl.prompt()
  })

  client.on('end', () => {
    connected = false
    console.log('\n🔌 Disconnected')
    rl.setPrompt('🔵 > ')
    rl.prompt()
  })

  client.on('error', (err) => {
    connected = false
    console.error(`❌ Error:`, err.message)
    rl.setPrompt('🔵 > ')
    rl.prompt()
  })
}

function send(command) {
  if (!connected) {
    console.log('❌ Not connected. Type "connect" first.')
    return
  }

  const message = JSON.stringify(command) + '\n'
  client.write(message, (err) => {
    if (err) {
      console.error('❌ Send failed:', err.message)
    } else {
      console.log(`✓ ${command.command}`)
    }
  })
}

function showHelp() {
  console.log(`
Commands:
  connect                        Connect to server
  disconnect                     Disconnect
  exit                           Exit program

Basic:
  create <name>                  Create vertex
  type <name> <type>             Set type
  parent <name> <parent>         Set parent
  ext <name> <ext> [type]        Add extension
  iface <name> <iface> <type>    Add interface

Query:
  query-start                    Start query
  query-end <ok|failed|cached>   End query
  query-querier <name>           Set querier
  query-iface <name>             Set interface
  query-clear                    Clear highlights

Types:
  Node: unknown, component, interface, tie, boa,
        data-extension, code-extension, 
        transient-extension, cache-extension
  Extension: data, code, cache, transient
  Interface: tie, tie-chain, boa

Examples:
  create Animal
  type Animal component
  create Dog
  type Dog component
  parent Dog Animal
  create BarkingExt
  type BarkingExt code-extension
  ext Dog BarkingExt
  create IPet
  type IPet interface
  iface Dog IPet tie
`)
}

rl.on('line', (line) => {
  const input = line.trim()
  
  if (!input) {
    rl.prompt()
    return
  }

  const [cmd, ...args] = input.split(/\s+/)

  switch (cmd.toLowerCase()) {
    case 'connect':
      connect()
      break

    case 'disconnect':
      if (connected) {
        client.end()
      } else {
        console.log('⚠️  Not connected')
      }
      break

    case 'help':
    case '?':
      showHelp()
      break

    case 'exit':
    case 'quit':
      console.log('👋 Bye!')
      if (connected) client.end()
      process.exit(0)
      break

    case 'create':
    case 'c':
      if (args.length < 1) {
        console.log('Usage: create <name>')
      } else {
        send({
          framework: 'System',
          command: 'meta-class:create',
          payload: { name: args[0] }
        })
      }
      break

    case 'type':
    case 't':
      if (args.length < 2) {
        console.log('Usage: type <name> <type>')
      } else {
        send({
          framework: 'System',
          command: 'meta-class:set-type',
          payload: { name: args[0], type: args[1] }
        })
      }
      break

    case 'parent':
    case 'p':
      if (args.length < 2) {
        console.log('Usage: parent <name> <parent>')
      } else {
        send({
          framework: 'System',
          command: 'meta-class:set-parent',
          payload: { name: args[0], parent: args[1] }
        })
      }
      break

    case 'ext':
    case 'e':
      if (args.length < 2) {
        console.log('Usage: ext <name> <extension> [type]')
      } else {
        const payload = { name: args[0], extension: args[1] }
        if (args[2]) payload.type = args[2]
        send({
          framework: 'System',
          command: 'meta-class:add-extension',
          payload
        })
      }
      break

    case 'iface':
    case 'i':
      if (args.length < 3) {
        console.log('Usage: iface <name> <interface> <type>')
      } else {
        send({
          framework: 'System',
          command: 'meta-class:add-interface',
          payload: { name: args[0], interface: args[1], type: args[2] }
        })
      }
      break

    case 'query-start':
    case 'qs':
      send({
        framework: 'System',
        command: 'query:start-query',
        payload: {}
      })
      break

    case 'query-end':
    case 'qe':
      if (args.length < 1) {
        console.log('Usage: query-end <ok|failed|cached>')
      } else {
        send({
          framework: 'System',
          command: 'query:end-query',
          payload: { result: args[0] }
        })
      }
      break

    case 'query-querier':
    case 'qq':
      if (args.length < 1) {
        console.log('Usage: query-querier <name>')
      } else {
        send({
          framework: 'System',
          command: 'query:set-querier',
          payload: { name: args[0] }
        })
      }
      break

    case 'query-iface':
    case 'qi':
      if (args.length < 1) {
        console.log('Usage: query-iface <name>')
      } else {
        send({
          framework: 'System',
          command: 'query:set-interface',
          payload: { name: args[0] }
        })
      }
      break

    case 'query-clear':
    case 'qc':
      send({
        framework: 'System',
        command: 'query:clear-query-history',
        payload: {}
      })
      break

    default:
      console.log(`Unknown: ${cmd}. Type 'help' for commands.`)
  }

  rl.prompt()
})

rl.on('close', () => {
  console.log('\n👋 Bye!')
  if (connected) client.end()
  process.exit(0)
})

rl.prompt()
