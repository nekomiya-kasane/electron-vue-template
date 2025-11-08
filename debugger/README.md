# Debugger Thread Library with NVIDIA stdexec

A modern C++23 debugger thread library built on top of NVIDIA's stdexec library, providing asynchronous message-based debugging with JSON serialization, subitem management, and easy-to-use interfaces for large projects.

## Features

- **Asynchronous Message Processing**: Uses stdexec's sender/receiver model for efficient async debugging
- **Thread Pool Integration**: Built-in thread pool support via `exec::static_thread_pool`
- **JSON Message Format**: All debug messages are serialized as JSON using nlohmann/json
- **Subitem Management**: Hierarchical component-level debugging with automatic ID generation
- **Subscriber Pattern**: Subscribe to specific debug categories for filtered message handling
- **C++23**: Leverages modern C++ features including concepts, ranges, and coroutines
- **Header-Only Friendly**: Minimal compilation overhead with template-based scheduler support

## Requirements

- **C++23** compatible compiler (GCC 12+, Clang 15+, MSVC 19.30+)
- **CMake 3.25+**
- **NVIDIA stdexec** (automatically fetched via CMake FetchContent)
- **nlohmann/json** (automatically fetched via CMake FetchContent)

## Building

### Basic Build

```bash
mkdir build && cd build
cmake ..
cmake --build .
```

### Build Options

```bash
# Disable examples
cmake -DBUILD_EXAMPLES=OFF ..

# Specify C++ compiler
cmake -DCMAKE_CXX_COMPILER=g++-12 ..
```

## Quick Start

### Basic Usage

```cpp
#include <debugger/debugger.hpp>

int main() {
    // Initialize with 2 worker threads
    debugger::Debugger::instance().init(2);
    
    // Register a message handler
    debugger::Debugger::instance().register_handler("network", 
        [](const nlohmann::json& msg) {
            std::cout << "[NETWORK] " << msg.dump(2) << std::endl;
        });
    
    // Send a debug message
    debugger::Debugger::instance().send_message("network", 
        "Connection established", {
            {"host", "example.com"},
            {"port", 8080}
        });
    
    // Or use the convenience macro
    DEBUG_LOG("network", "Data received", 
        {"bytes", 1024},
        {"protocol", "HTTP/1.1"}
    );
    
    // Shutdown when done
    debugger::Debugger::instance().shutdown();
    
    return 0;
}
```

### Using Subitems for Component-Level Debugging

```cpp
#include <debugger/debugger.hpp>

class NetworkModule {
public:
    NetworkModule() {
        // Create a subitem for this module
        subitem_ = debugger::Debugger::instance()
            .create_subitem("NetworkModule", "application");
    }
    
    void connect(const std::string& host, int port) {
        // Log with different severity levels
        subitem_->log_info("Connecting to server", {
            {"host", host},
            {"port", port}
        });
        
        // ... connection logic ...
        
        subitem_->log_info("Connection established");
    }
    
    void handle_error(const std::string& error) {
        subitem_->log_error("Network error occurred", {
            {"error", error}
        });
    }

private:
    std::shared_ptr<debugger::DebugSubitem> subitem_;
};
```

### Advanced: Custom Scheduler Integration

```cpp
#include <debugger/debugger.hpp>
#include <exec/static_thread_pool.hpp>

int main() {
    // Create your own thread pool
    exec::static_thread_pool app_pool(4);
    auto scheduler = app_pool.get_scheduler();
    
    // Initialize debugger with custom scheduler
    debugger::Debugger::instance().init_with_scheduler(scheduler);
    
    // Use stdexec to run async tasks with debugging
    auto task = stdexec::schedule(scheduler)
        | stdexec::then([] {
            debugger::Debugger::instance().send_message(
                "async_task", "Task completed", {
                    {"result", "success"}
                });
        });
    
    stdexec::sync_wait(std::move(task));
    
    debugger::Debugger::instance().shutdown();
    
    return 0;
}
```

### Subscriber Pattern

```cpp
#include <debugger/debugger.hpp>
#include <debugger/subscriber.hpp>

int main() {
    debugger::Debugger::instance().init();
    
    // Create a subscriber for specific category
    auto subscriber = debugger::Debugger::instance()
        .create_subscriber("database");
    
    // Subscribe with a callback
    subscriber->subscribe([](const nlohmann::json& msg) {
        std::cout << "Database event: " << msg.dump() << std::endl;
    });
    
    // Messages to "database" category will trigger the callback
    debugger::Debugger::instance().send_message("database", 
        "Query executed", {
            {"query", "SELECT * FROM users"},
            {"rows", 42}
        });
    
    // Unsubscribe when done
    subscriber->unsubscribe();
    
    debugger::Debugger::instance().shutdown();
    
    return 0;
}
```

## Architecture

### Core Components

#### `Debugger` (Singleton)
- Central hub for all debug operations
- Manages message queue and processing thread(s)
- Supports both built-in and custom schedulers
- Thread-safe message sending and handler registration

#### `DebugSubitem`
- Represents a debuggable component/module
- Automatically generates unique IDs
- Supports hierarchical categorization
- Provides convenience methods: `log()`, `log_info()`, `log_warning()`, `log_error()`

#### `DebugSubscriber`
- Allows selective message filtering by category
- Callback-based message delivery
- Thread-safe subscription management

#### `DebugMessage`
- Immutable message representation
- Automatic timestamp generation
- JSON serialization support

### Message Flow

```
Application Code
    ↓
send_message() / subitem->log()
    ↓
Message Queue (thread-safe)
    ↓
stdexec Processing Loop
    ↓
Handlers & Subscribers
    ↓
Your Callback Functions
```

## Integration with stdexec

This library leverages stdexec's powerful abstractions:

- **Senders/Receivers**: Asynchronous message processing
- **Schedulers**: Flexible execution context management
- **Thread Pools**: Efficient concurrent message handling
- **Pipelines**: Composable async operations with `|` operator

### Key stdexec Concepts Used

```cpp
// Scheduling work
auto work = stdexec::schedule(scheduler)
    | stdexec::then([](){ /* process messages */ });

// Starting detached work
stdexec::start_detached(std::move(work));

// Waiting for completion
stdexec::sync_wait(std::move(sender));

// Concurrent execution
stdexec::when_all(sender1, sender2, sender3);
```

## JSON Message Format

All messages are structured as JSON:

```json
{
  "message": "Connection established",
  "data": {
    "host": "example.com",
    "port": 8080
  },
  "timestamp": 1699360800000,
  "subitem_id": "a1b2c3d4e5f6g7h8",
  "subitem_name": "NetworkModule",
  "level": "info"
}
```

## API Reference

### Debugger Class

#### Initialization
```cpp
void init(size_t num_threads = 1);
template<typename Scheduler>
void init_with_scheduler(Scheduler scheduler);
```

#### Message Sending
```cpp
void send_message(const std::string& category, 
                  const std::string& message, 
                  const json& data = {});
```

#### Handler Registration
```cpp
using MessageHandler = std::function<void(const json&)>;
void register_handler(const std::string& category, 
                      MessageHandler handler);
```

#### Subscriber Management
```cpp
std::shared_ptr<DebugSubscriber> 
    create_subscriber(const std::string& category);

std::shared_ptr<DebugSubscriber> 
    get_subscriber(const std::string& name);
```

#### Subitem Management
```cpp
std::shared_ptr<DebugSubitem> 
    create_subitem(const std::string& name, 
                   const std::string& parent_category = "");

std::vector<std::shared_ptr<DebugSubitem>> 
    get_all_subitems() const;
```

#### Control
```cpp
void shutdown();
bool is_running() const;
```

### DebugSubitem Class

```cpp
void log(const std::string& message, const json& data = {});
void log_info(const std::string& message, const json& data = {});
void log_warning(const std::string& message, const json& data = {});
void log_error(const std::string& message, const json& data = {});

const std::string& name() const;
const std::string& parent_category() const;
const std::string& id() const;
```

### DebugSubscriber Class

```cpp
using Callback = std::function<void(const json&)>;

void subscribe(Callback callback);
void unsubscribe();
const std::string& category() const;
```

## Examples

See the `examples/` directory for complete working examples:

- **basic_usage.cpp**: Simple message sending and handler registration
- **subitem_management.cpp**: Component-level debugging with subitems
- **advanced_stdexec.cpp**: Custom schedulers and concurrent task debugging

Build and run examples:

```bash
cd build
./basic_usage
./subitem_management
./advanced_stdexec
```

## Best Practices

1. **Initialize Early**: Call `init()` at application startup
2. **Shutdown Gracefully**: Always call `shutdown()` before exit
3. **Use Subitems**: Create subitems for each major component
4. **Category Naming**: Use hierarchical names like "app.network.tcp"
5. **JSON Data**: Keep data payloads small and structured
6. **Thread Safety**: All public APIs are thread-safe
7. **Handler Performance**: Keep handlers fast; offload heavy work

## Performance Considerations

- Messages are queued and processed asynchronously
- Lock contention is minimized with fine-grained locking
- JSON serialization happens in the sender thread
- Consider message volume in production environments
- Use subscribers for filtered processing

## Thread Safety

All public APIs are thread-safe:
- ✅ `send_message()` - lock-free queue push
- ✅ `register_handler()` - mutex-protected
- ✅ `create_subitem()` - mutex-protected
- ✅ `subscribe()` - mutex-protected

## Troubleshooting

### Build Issues

**stdexec not found**: Ensure CMake can fetch from GitHub
```bash
cmake -DFETCHCONTENT_FULLY_DISCONNECTED=OFF ..
```

**C++23 not supported**: Update your compiler
```bash
cmake -DCMAKE_CXX_COMPILER=g++-13 ..
```

### Runtime Issues

**Messages not appearing**: Ensure debugger is initialized and handlers are registered before sending messages

**Shutdown hangs**: Make sure all async work completes before calling `shutdown()`

## License

This project uses:
- NVIDIA stdexec (Apache 2.0)
- nlohmann/json (MIT)

## References

- [NVIDIA stdexec GitHub](https://github.com/NVIDIA/stdexec)
- [P2300 - std::execution Proposal](https://wg21.link/p2300)
- [nlohmann/json Documentation](https://json.nlohmann.me/)

## Contributing

This is an example implementation. Feel free to adapt it to your needs:
- Add custom message filters
- Implement message persistence
- Add network-based debugging
- Create visualization tools
- Extend with more log levels

---

**Note**: This library is designed for debugging and diagnostics. For production logging, consider dedicated logging frameworks like spdlog or Boost.Log.
