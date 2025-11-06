# Plugin System Architecture

## Overview

The plugin system is inspired by VSCode's extension architecture, providing a flexible and powerful way to extend the application with new features, document types, themes, and language support.

## Key Features

### 1. **Dynamic Plugin Discovery**
- Plugins are automatically discovered at startup
- No need to manually register plugins in code
- Supports both built-in and external plugins

### 2. **Enable/Disable Functionality**
- Plugins can be enabled or disabled through settings
- Changes persist across sessions
- Hot-reload support for development

### 3. **Unified Settings System**
- All plugin settings are stored in a single configuration
- Similar to VSCode's `settings.json`
- Supports both global and workspace scopes

### 4. **Contribution Points**
- Plugins declare their contributions in a manifest file
- Supports multiple contribution types (see below)

## Plugin Categories

### 1. Document Type Plugins (文档类型插件)
Register new document types that can be opened and edited in the application.

**Example:** Graph Plugin registers the `QIViewer` document type

### 2. Feature Plugins (额外功能插件)
Add additional functionality to existing document types or the application itself.

**Example:** Adding a sidebar panel for file navigation

### 3. Theme Plugins (主题插件)
Customize the visual appearance of the application.

**Example:** Dark theme, Light theme, High contrast theme

### 4. Language Plugins (语言支持插件)
Provide language-specific features like syntax highlighting, LSP support, etc.

**Example:** TypeScript language support with LSP

## Plugin Manifest

Each plugin must have a manifest file (`manifest.json` or in `package.json`) that describes the plugin and its contributions.

### Basic Structure

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "A plugin that does awesome things",
  "publisher": "your-name",
  "categories": ["feature"],
  "keywords": ["awesome", "plugin"],
  "icon": "🚀",
  "isBuiltin": false,
  "engines": {
    "app": "^0.0.1"
  },
  "activationEvents": [
    "onStartup"
  ],
  "main": "./index.ts",
  "contributes": {
    // Contribution points (see below)
  }
}
```

### Manifest Fields

- **id**: Unique identifier for the plugin (required)
- **name**: Human-readable name (required)
- **displayName**: Display name (optional, defaults to name)
- **version**: Semantic version (required)
- **description**: Brief description
- **publisher**: Publisher name
- **categories**: Array of plugin categories
- **keywords**: Search keywords
- **icon**: Icon emoji or path
- **isBuiltin**: Whether this is a built-in plugin
- **engines**: Required application version
- **activationEvents**: When to activate the plugin
- **main**: Entry point file
- **contributes**: Contribution points

## Contribution Points

### Document Types

Register new document types:

```json
{
  "contributes": {
    "documentTypes": [
      {
        "id": "myDocType",
        "name": "My Document",
        "extensions": [".mydoc"],
        "icon": "📄",
        "defaultEditor": "my-editor"
      }
    ]
  }
}
```

### Sidebars

Add sidebar panels:

```json
{
  "contributes": {
    "sidebars": [
      {
        "id": "my-sidebar",
        "title": "My Sidebar",
        "icon": "📁",
        "position": "left",
        "when": "documentType == 'myDocType'"
      }
    ]
  }
}
```

### Icon Buttons

Add icon buttons to the icon bar:

```json
{
  "contributes": {
    "iconButtons": [
      {
        "id": "my-button",
        "icon": "🔧",
        "title": "My Tool",
        "position": "left",
        "command": "myPlugin.myCommand",
        "when": "documentType == 'myDocType'"
      }
    ]
  }
}
```

### Main Views

Register main view components for document types:

```json
{
  "contributes": {
    "mainViews": [
      {
        "id": "my-viewer",
        "supportedDocumentTypes": ["myDocType"],
        "priority": 10
      }
    ]
  }
}
```

### Status Bar Items

Add items to the status bar:

```json
{
  "contributes": {
    "statusBarItems": [
      {
        "id": "my-status",
        "position": "left",
        "priority": 5,
        "when": "documentType == 'myDocType'"
      }
    ]
  }
}
```

### Commands

Register commands:

```json
{
  "contributes": {
    "commands": [
      {
        "id": "myPlugin.myCommand",
        "title": "My Command",
        "category": "My Plugin",
        "icon": "⚡",
        "when": "documentType == 'myDocType'"
      }
    ]
  }
}
```

### Menus

Add menu items:

```json
{
  "contributes": {
    "menus": {
      "main": [
        {
          "command": "myPlugin.myCommand",
          "group": "myGroup",
          "when": "documentType == 'myDocType'"
        }
      ]
    }
  }
}
```

### Configuration

Define plugin settings:

```json
{
  "contributes": {
    "configuration": {
      "title": "My Plugin",
      "properties": {
        "myPlugin.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable my plugin features"
        },
        "myPlugin.mode": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "manual"],
          "enumDescriptions": [
            "Automatic mode",
            "Manual mode"
          ],
          "description": "Plugin operation mode"
        }
      }
    }
  }
}
```

### Themes

Contribute themes:

```json
{
  "contributes": {
    "themes": [
      {
        "id": "my-dark-theme",
        "label": "My Dark Theme",
        "uiTheme": "vs-dark",
        "path": "./themes/dark.json"
      }
    ]
  }
}
```

### Languages

Add language support:

```json
{
  "contributes": {
    "languages": [
      {
        "id": "mylang",
        "extensions": [".mylang"],
        "configuration": "./language-configuration.json",
        "lspServer": {
          "module": "./lsp-server.js",
          "args": ["--stdio"],
          "options": {
            "cwd": "${workspaceFolder}"
          }
        }
      }
    ]
  }
}
```

## Activation Events

Plugins can specify when they should be activated:

- **onStartup**: Activate when the application starts
- **onDocumentType:typeId**: Activate when a specific document type is opened
- **onCommand:commandId**: Activate when a specific command is executed
- **onView:viewId**: Activate when a specific view is opened
- **onLanguage:***: Activate when any language file is opened

## Plugin API

### Plugin Context

Every plugin receives a `PluginContext` object that provides access to the application's API:

```typescript
interface PluginContext {
  // Document type registration
  registerDocumentType(type: DocumentType): void
  
  // UI registration
  registerIconButton(button: IconBarButton, documentTypes?: string[]): void
  registerSidebar(config: SidebarConfig, documentTypes?: string[]): void
  registerMainView(config: MainViewConfig): void
  registerMenu(config: MenuConfig): void
  registerStatusBarItem(item: StatusBarItem): void
  
  // Document management
  createDocument(document: Document): void
  switchToDocument(documentId: string): void
  
  // UI control
  activateSidebar(id: string, position: SidebarPosition): void
  closeSidebar(position: SidebarPosition): void
  switchMainView(id: string, props?: Record<string, any>): void
  
  // Event system
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
  emit(event: string, ...args: any[]): void
  
  // Plugin interaction
  getPlugin(id: string): Plugin | undefined
  
  // Storage
  storage: {
    get(key: string): any
    set(key: string, value: any): void
    remove(key: string): void
  }
  
  // Commands
  commands: {
    registerCommand(id: string, handler: (...args: any[]) => any, options?: CommandOptions): string
    executeCommand<T>(id: string, ...args: any[]): Promise<T>
    getCommands(): Array<CommandInfo>
  }
  
  // Configuration
  configuration: {
    get<T>(section: string, defaultValue?: T): T | undefined
    update(section: string, value: any, scope?: 'global' | 'workspace'): void
    has(section: string): boolean
    getConfiguration(section?: string): Configuration
    onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): () => void
  }
  
  // Disposable management
  subscriptions: DisposableStore
}
```

### Plugin Lifecycle

Plugins have several lifecycle hooks:

```typescript
interface Plugin {
  metadata: PluginMetadata
  
  // Called when the plugin is installed
  install(context: PluginContext): void | Promise<void>
  
  // Optional lifecycle hooks
  onInstall?(context: PluginContext): void | Promise<void>
  onActivate?(context: PluginContext): void | Promise<void>
  onDeactivate?(context: PluginContext): void | Promise<void>
  onUninstall?(context: PluginContext): void | Promise<void>
}
```

## Settings

### Plugin Settings Location

All plugin settings are stored in a unified configuration, similar to VSCode:

```json
{
  "plugins.disabled": ["plugin-id-1", "plugin-id-2"],
  "graph.autoLayout": true,
  "graph.layoutAlgorithm": "dagre",
  "editor.fontSize": 14,
  "theme.current": "dark"
}
```

### Enabling/Disabling Plugins

```typescript
import { enablePlugin, disablePlugin, isPluginEnabled } from '@/plugins/initializePluginsV2'

// Enable a plugin
await enablePlugin('graph')

// Disable a plugin
await disablePlugin('graph')

// Check if a plugin is enabled
const enabled = isPluginEnabled('graph')
```

## Hot Reload

The plugin system supports hot-reload during development:

```typescript
import { reloadPlugins } from '@/plugins/initializePluginsV2'

// Reload all plugins
await reloadPlugins()
```

## Main Program Provides

The main program provides the following services to plugins:

### 1. Document Type System
- Register custom document types
- Open and manage documents
- Switch between documents

### 2. UI System
- Two sidebars (left and right)
- Status bar
- Icon bar
- Main view area

### 3. Settings System
- Unified configuration storage
- Global and workspace scopes
- Configuration change events

### 4. Event System
- Plugin-to-plugin communication
- Main program to plugin communication
- Event subscription and broadcasting

### 5. Rendering Support
- WebGPU support
- WebGL support
- Canvas rendering

### 6. LSP Support
- Language Server Protocol integration
- Syntax highlighting
- Code completion
- Diagnostics

## Example: Creating a Plugin

### 1. Create Plugin Structure

```
my-plugin/
├── manifest.json
├── index.ts
├── components/
│   ├── MyView.vue
│   └── MySidebar.vue
└── README.md
```

### 2. Define Manifest

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "categories": ["feature"],
  "activationEvents": ["onStartup"],
  "main": "./index.ts",
  "contributes": {
    "commands": [
      {
        "id": "myPlugin.hello",
        "title": "Hello World",
        "category": "My Plugin"
      }
    ]
  }
}
```

### 3. Implement Plugin

```typescript
import type { Plugin, PluginContext } from '@/core/plugin'

export const MyPlugin: Plugin = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0'
  },

  install(context: PluginContext) {
    // Register command
    context.commands.registerCommand('hello', () => {
      console.log('Hello from My Plugin!')
    }, {
      description: 'Say hello',
      category: 'My Plugin'
    })

    // Listen to events
    context.on('document:created', (doc) => {
      console.log('Document created:', doc)
    })
  },

  onActivate(context: PluginContext) {
    console.log('My Plugin activated!')
  },

  onDeactivate(context: PluginContext) {
    console.log('My Plugin deactivated!')
  }
}
```

## Migration Guide

### From Old System to New System

1. **Create a manifest file** for your plugin
2. **Update imports** to use `pluginManagerV2`
3. **Use `initializePluginsV2()`** instead of manual registration
4. **Move settings** to the unified configuration system

### Example Migration

**Before:**
```typescript
// plugins/index.ts
await pluginManager.registerPlugin(MyPlugin)
await pluginManager.activatePlugin('my-plugin')
```

**After:**
```typescript
// plugins/index.ts
import { initializePluginsV2 } from './initializePluginsV2'

// Just initialize - plugins are discovered and loaded automatically
await initializePluginsV2()
```

## Best Practices

1. **Use activation events** to lazy-load plugins
2. **Clean up resources** in `onDeactivate` and `onUninstall`
3. **Use the disposable system** for automatic cleanup
4. **Namespace your commands** with plugin ID (e.g., `myPlugin.command`)
5. **Provide configuration options** for customization
6. **Document your plugin** with a README
7. **Use semantic versioning** for your plugin version
8. **Test enable/disable** functionality

## Troubleshooting

### Plugin Not Loading

1. Check that the plugin ID is correct
2. Verify the manifest is valid JSON
3. Check console for errors
4. Ensure the plugin is not disabled in settings

### Plugin Not Activating

1. Check activation events in manifest
2. Verify dependencies are installed
3. Check for errors in `onActivate` hook

### Settings Not Persisting

1. Ensure you're using the correct scope ('global' or 'workspace')
2. Check that the configuration key is correct
3. Verify the ConfigurationService is working

## Future Enhancements

- [ ] Plugin marketplace
- [ ] Plugin dependencies management
- [ ] Plugin sandboxing
- [ ] Plugin API versioning
- [ ] Plugin testing framework
- [ ] Plugin development tools
- [ ] Plugin documentation generator
