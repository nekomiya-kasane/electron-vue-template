# Project Structure

## Directory Layout

```
debugger/
├── CMakeLists.txt              # Main CMake configuration
├── README.md                   # Comprehensive documentation
├── QUICK_START.md             # 5-minute getting started guide
├── PROJECT_STRUCTURE.md       # This file
├── build.ps1                  # Windows build script
├── .gitignore                 # Git ignore rules
│
├── include/debugger/          # Public headers
│   ├── debugger.hpp          # Main debugger class + DebugSubitem
│   ├── message.hpp           # DebugMessage class
│   └── subscriber.hpp        # DebugSubscriber class
│
├── src/                       # Implementation files
│   ├── debugger.cpp          # Debugger + DebugSubitem implementation
│   ├── message.cpp           # DebugMessage implementation (header-only)
│   └── subscriber.cpp        # DebugSubscriber implementation
│
└── examples/                  # Example programs
    ├── basic_usage.cpp       # Simple message sending
    ├── subitem_management.cpp # Component-level debugging
    └── advanced_stdexec.cpp  # Custom scheduler integration
```

## File Descriptions

### Core Headers

#### `include/debugger/debugger.hpp`
- **Debugger** singleton class
  - Message queue management
  - Handler registration
  - Subscriber management
  - Subitem creation
  - Thread pool integration
- **DebugSubitem** class
  - Component-level debugging
  - Hierarchical categorization
  - Convenience logging methods
- Template implementation for custom schedulers

#### `include/debugger/message.hpp`
- **DebugMessage** class
  - Immutable message representation
  - Automatic timestamp generation
  - JSON serialization
  - Header-only implementation

#### `include/debugger/subscriber.hpp`
- **DebugSubscriber** class
  - Category-based message filtering
  - Callback registration
  - Thread-safe delivery

### Implementation Files

#### `src/debugger.cpp`
- Debugger singleton implementation
- DebugSubitem method implementations
- Message processing loop
- Thread pool management
- Handler and subscriber management

#### `src/message.cpp`
- Placeholder for future DebugMessage extensions
- Currently header-only

#### `src/subscriber.cpp`
- DebugSubscriber method implementations
- Subscription management
- Message delivery

### Examples

#### `examples/basic_usage.cpp`
**Demonstrates:**
- Debugger initialization
- Handler registration
- Message sending
- Subscriber creation
- Convenience macro usage

**Key Concepts:**
- Simple message flow
- Category-based routing
- JSON data payloads

#### `examples/subitem_management.cpp`
**Demonstrates:**
- Creating multiple module subitems
- Hierarchical categorization
- Different log levels (info, warning, error)
- Concurrent module debugging
- Listing all subitems

**Key Concepts:**
- Component-level debugging
- Automatic ID generation
- Subitem lifecycle management

#### `examples/advanced_stdexec.cpp`
**Demonstrates:**
- Custom thread pool creation
- stdexec sender/receiver patterns
- Concurrent task debugging
- `when_all` for parallel execution
- Async subitem usage

**Key Concepts:**
- stdexec integration
- Scheduler customization
- Async debugging patterns

### Build Files

#### `CMakeLists.txt`
**Features:**
- C++23 requirement
- FetchContent for dependencies (stdexec, nlohmann/json)
- Library target configuration
- Example executables (optional)
- Install rules
- Package configuration

**Options:**
- `BUILD_EXAMPLES` (default: ON)

#### `build.ps1`
**PowerShell build script for Windows:**
- Clean build option
- Build type selection (Release/Debug)
- Example build toggle
- Colored output
- Error handling

**Usage:**
```powershell
.\build.ps1                    # Standard build
.\build.ps1 -Clean            # Clean and rebuild
.\build.ps1 -NoExamples       # Build without examples
.\build.ps1 -BuildType Debug  # Debug build
```

### Documentation

#### `README.md`
**Comprehensive guide covering:**
- Features overview
- Requirements
- Building instructions
- Quick start examples
- Architecture explanation
- stdexec integration details
- JSON message format
- Complete API reference
- Best practices
- Performance considerations
- Troubleshooting

#### `QUICK_START.md`
**Fast-track guide for:**
- 5-minute setup
- Minimal working example
- Common patterns
- Key API summary
- Quick troubleshooting

#### `PROJECT_STRUCTURE.md`
**This file - provides:**
- Directory layout
- File descriptions
- Design decisions
- Integration guide

## Design Decisions

### Why Singleton?
The Debugger uses a singleton pattern to provide global access without passing references throughout the application. This is appropriate for debugging infrastructure.

### Why stdexec?
- Modern C++ async model (P2300)
- Efficient sender/receiver abstraction
- Composable async operations
- Thread pool integration
- Future-proof (targeting C++26 standard)

### Why JSON?
- Human-readable
- Structured data
- Easy serialization/deserialization
- Language-agnostic format
- Tooling support

### Why Subitems?
- Component isolation
- Hierarchical organization
- Automatic ID tracking
- Simplified API for modules

## Integration Patterns

### Pattern 1: Header-Only Usage
```cmake
target_include_directories(your_target PRIVATE path/to/debugger/include)
target_link_libraries(your_target PRIVATE stdexec nlohmann_json)
```

### Pattern 2: Linked Library
```cmake
add_subdirectory(path/to/debugger)
target_link_libraries(your_target PRIVATE debugger)
```

### Pattern 3: Installed Package
```cmake
find_package(debugger REQUIRED)
target_link_libraries(your_target PRIVATE debugger::debugger)
```

## Extension Points

### Custom Message Processors
Implement custom handlers for specialized processing:
```cpp
Debugger::instance().register_handler("metrics", 
    [](const json& msg) {
        // Send to monitoring system
        prometheus::counter.increment();
    });
```

### Custom Schedulers
Use application-specific execution contexts:
```cpp
auto custom_scheduler = my_app::get_scheduler();
Debugger::instance().init_with_scheduler(custom_scheduler);
```

### Message Persistence
Add file/database logging:
```cpp
Debugger::instance().register_handler("persistent", 
    [&db](const json& msg) {
        db.insert("debug_log", msg);
    });
```

## Dependencies

### Direct Dependencies
- **NVIDIA stdexec** (Apache 2.0)
  - Version: main branch (latest)
  - Purpose: Async execution model
  - Fetched via: CMake FetchContent

- **nlohmann/json** (MIT)
  - Version: 3.11.3
  - Purpose: JSON serialization
  - Fetched via: CMake FetchContent

### Build Dependencies
- CMake 3.25+
- C++23 compiler
- Git (for FetchContent)

### Runtime Dependencies
- C++ standard library
- Threading support (pthread on Unix)

## Performance Characteristics

### Time Complexity
- `send_message()`: O(1) - queue push
- `register_handler()`: O(1) - map insert
- `create_subitem()`: O(1) - map lookup/insert
- Message processing: O(n) where n = handlers + subscribers

### Space Complexity
- Message queue: O(m) where m = pending messages
- Handlers: O(h) where h = registered handlers
- Subitems: O(s) where s = created subitems

### Thread Safety
- All public APIs are thread-safe
- Fine-grained locking minimizes contention
- Lock-free message queue operations where possible

## Testing Strategy

### Unit Tests (Not Included)
Recommended test coverage:
- Message serialization/deserialization
- Handler registration and invocation
- Subscriber filtering
- Subitem creation and hierarchy
- Thread safety under load

### Integration Tests (Examples Serve This Purpose)
- End-to-end message flow
- Concurrent operation
- Scheduler integration
- Error handling

## Future Enhancements

Potential additions:
1. **Message Filtering**: Filter by severity, regex, etc.
2. **Rate Limiting**: Prevent message flooding
3. **Message Batching**: Reduce overhead for high-volume logging
4. **Network Transport**: Remote debugging support
5. **Visualization**: Real-time debug dashboard
6. **Compression**: Reduce memory footprint
7. **Persistence**: Automatic log file rotation
8. **Metrics**: Built-in performance counters

## License Considerations

This project uses:
- NVIDIA stdexec (Apache 2.0 License)
- nlohmann/json (MIT License)

Both are permissive licenses compatible with commercial use.

## Contributing Guidelines

When extending this library:
1. Maintain C++23 compatibility
2. Follow existing naming conventions
3. Keep APIs thread-safe
4. Document public interfaces
5. Add examples for new features
6. Update README.md and this file
7. Ensure backward compatibility

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Your Team
