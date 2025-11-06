# Plugin System Migration Guide

## Overview

This guide helps you migrate from the old hardcoded plugin system to the new VSCode-like dynamic plugin system.

## What's Changed

### Before (Old System)
- Plugins were manually registered in `src/plugins/index.ts`
- No enable/disable functionality
- Settings scattered across different files
- No hot-reload support
- Manual activation required

### After (New System)
- Plugins are automatically discovered at startup
- Enable/disable through unified settings
- All settings in one place (like VSCode)
- Hot-reload support for development
- Automatic activation based on events
- Plugin manifests declare contributions

## Migration Steps

### Step 1: Update Main Entry Point

**Old (`src/main.ts`):**
```typescript
import { initializePlugins } from './plugins'

// Initialize plugins
await initializePlugins()
```

**New (`src/main.ts`):**
```typescript
import { initializePluginsV2 } from './plugins/initializePluginsV2'

// Initialize plugin system V2
await initializePluginsV2()
```

### Step 2: Create Plugin Manifests (Optional but Recommended)

For each plugin, create a `manifest.json` file in its directory:

```
src/plugins/
├── graph/
│   ├── manifest.json  ← New
│   └── GraphPlugin.ts
├── editor/
│   ├── manifest.json  ← New
│   └── EditorPlugin.ts
└── ...
```

Example `manifest.json`:
```json
{
  "id": "graph",
  "name": "Graph Visualization Plugin",
  "version": "1.0.0",
  "description": "Graph visualization and data packet monitoring",
  "categories": ["documentType", "feature"],
  "activationEvents": ["onStartup"],
  "main": "./GraphPlugin.ts",
  "contributes": {
    "documentTypes": [...],
    "sidebars": [...],
    "commands": [...],
    "configuration": {...}
  }
}
```

### Step 3: Update Plugin Imports

**Old:**
```typescript
import { pluginManager } from '@/core/plugin'
```

**New:**
```typescript
import { pluginManagerV2 } from '@/core/plugin'
// or
import { pluginManagerV2 as pluginManager } from '@/core/plugin'
```

### Step 4: Remove Manual Registration

**Old (`src/plugins/index.ts`):**
```typescript
export async function initializePlugins() {
  await pluginManager.registerPlugin(DocumentPlugin)
  await pluginManager.registerPlugin(EditorPlugin)
  await pluginManager.registerPlugin(Model3DPlugin)
  await pluginManager.registerPlugin(GraphPlugin)
  await pluginManager.registerPlugin(SettingsPlugin)
  await pluginManager.registerPlugin(EditorCodePlugin)

  await pluginManager.activatePlugin('document')
  await pluginManager.activatePlugin('editor')
  await pluginManager.activatePlugin('model3d')
  await pluginManager.activatePlugin('graph')
  await pluginManager.activatePlugin('settings')
  await pluginManager.activatePlugin('editor-code')
}
```

**New (`src/plugins/initializePluginsV2.ts`):**
```typescript
export async function initializePluginsV2() {
  // Just initialize - plugins are discovered and loaded automatically
  await pluginManagerV2.initialize()
}
```

### Step 5: Move Settings to Unified Configuration

**Old (scattered settings):**
```typescript
// In plugin code
const mySettings = {
  enabled: true,
  mode: 'auto'
}
```

**New (unified configuration):**
```typescript
// In manifest.json
{
  "contributes": {
    "configuration": {
      "properties": {
        "myPlugin.enabled": {
          "type": "boolean",
          "default": true
        },
        "myPlugin.mode": {
          "type": "string",
          "default": "auto"
        }
      }
    }
  }
}

// In plugin code
const enabled = context.configuration.get('myPlugin.enabled', true)
const mode = context.configuration.get('myPlugin.mode', 'auto')
```

### Step 6: Update Settings Access

**Old:**
```typescript
// Custom settings storage
const settings = loadSettings()
```

**New:**
```typescript
// Use unified configuration
const config = context.configuration.getConfiguration('myPlugin')
const value = config.get('setting', defaultValue)
config.update('setting', newValue)
```

## New Features to Adopt

### 1. Enable/Disable Plugins

```typescript
import { enablePlugin, disablePlugin, isPluginEnabled } from '@/plugins/initializePluginsV2'

// Check if enabled
if (isPluginEnabled('graph')) {
  // Plugin is enabled
}

// Disable a plugin
await disablePlugin('graph')

// Enable a plugin
await enablePlugin('graph')
```

### 2. Hot Reload

```typescript
import { reloadPlugins } from '@/plugins/initializePluginsV2'

// Reload all plugins (useful for development)
await reloadPlugins()
```

### 3. Plugin Management UI

Add the plugin settings component to your settings panel:

```vue
<template>
  <plugin-settings />
</template>

<script setup>
import PluginSettings from '@/components/settings/PluginSettings.vue'
</script>
```

### 4. Activation Events

Instead of activating all plugins at startup, use activation events:

```json
{
  "activationEvents": [
    "onDocumentType:QIViewer",  // Activate when QI document is opened
    "onCommand:graph.newGraph",  // Activate when command is executed
    "onView:graph-viewer"        // Activate when view is opened
  ]
}
```

### 5. Contribution Points

Declare UI contributions in manifest instead of code:

**Old:**
```typescript
context.registerIconButton({
  id: 'session',
  icon: '📊',
  title: 'Session',
  position: 'left'
}, ['QIViewer'])
```

**New (in manifest.json):**
```json
{
  "contributes": {
    "iconButtons": [
      {
        "id": "session",
        "icon": "📊",
        "title": "Session",
        "position": "left",
        "when": "documentType == 'QIViewer'"
      }
    ]
  }
}
```

## Backward Compatibility

The old plugin system (`PluginManager`) is still available for backward compatibility:

```typescript
// Old system still works
import { pluginManager } from '@/core/plugin'
await pluginManager.registerPlugin(MyPlugin)
await pluginManager.activatePlugin('my-plugin')
```

However, it's recommended to migrate to the new system for better features and maintainability.

## Testing Your Migration

1. **Test plugin discovery:**
   ```typescript
   import { getAllPlugins } from '@/plugins/initializePluginsV2'
   const plugins = getAllPlugins()
   console.log('Discovered plugins:', plugins)
   ```

2. **Test enable/disable:**
   ```typescript
   await disablePlugin('graph')
   // Verify plugin is disabled
   await enablePlugin('graph')
   // Verify plugin is enabled
   ```

3. **Test hot reload:**
   ```typescript
   // Make changes to plugin
   await reloadPlugins()
   // Verify changes are applied
   ```

4. **Test settings:**
   ```typescript
   const config = pluginManagerV2.getConfiguration('graph')
   console.log('Graph settings:', config)
   ```

## Common Issues

### Issue 1: Plugin Not Found

**Problem:** Plugin is not discovered at startup

**Solution:**
- Check plugin ID matches the file name pattern
- Verify manifest.json is valid
- Check console for discovery errors

### Issue 2: Settings Not Persisting

**Problem:** Plugin settings don't persist across sessions

**Solution:**
- Use `'global'` scope for persistent settings:
  ```typescript
  context.configuration.update('key', value, 'global')
  ```

### Issue 3: Plugin Not Activating

**Problem:** Plugin is enabled but not activating

**Solution:**
- Check activation events in manifest
- Verify no errors in `onActivate` hook
- Check plugin dependencies

### Issue 4: UI Not Updating

**Problem:** UI doesn't reflect plugin changes

**Solution:**
- Call `await reloadPlugins()` after changes
- Check that reactive state is being used
- Verify component is watching plugin state

## Rollback Plan

If you need to rollback to the old system:

1. Revert `src/main.ts` to use `initializePlugins()`
2. Keep using `pluginManager` instead of `pluginManagerV2`
3. Remove manifest files (optional)

Both systems can coexist during migration.

## Next Steps

After migration:

1. ✅ Test all plugin functionality
2. ✅ Add plugin management UI to settings
3. ✅ Document plugin-specific settings
4. ✅ Create manifest files for all plugins
5. ✅ Set up hot-reload for development
6. ✅ Remove old initialization code

## Support

For issues or questions:
- Check the [Plugin System Documentation](./PLUGIN_SYSTEM.md)
- Review example plugins in `src/plugins/`
- Check console logs for errors
