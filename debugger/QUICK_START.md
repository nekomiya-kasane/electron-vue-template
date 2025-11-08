# Quick Start Guide

## 5-Minute Setup

### 1. Build the Project

```powershell
# Windows PowerShell
.\build.ps1

# Or manually with CMake
mkdir build && cd build
cmake ..
cmake --build .
```

### 2. Run an Example

```powershell
# Windows
.\build\Release\basic_usage.exe

# Linux/Mac
./build/basic_usage
```

### 3. Integrate into Your Project

#### Option A: Add as Subdirectory

```cmake
# Your CMakeLists.txt
add_subdirectory(path/to/debugger)
target_link_libraries(your_target PRIVATE debugger)
```

#### Option B: Install and Find

```bash
cd debugger/build
cmake --install . --prefix /usr/local

# In your CMakeLists.txt
find_package(debugger REQUIRED)
target_link_libraries(your_target PRIVATE debugger::debugger)
```

## Minimal Working Example

```cpp
#include <debugger/debugger.hpp>
#include <thread>
#include <chrono>

int main() {
    using namespace debugger;
    using namespace std::chrono_literals;
    
    // 1. Initialize
    Debugger::instance().init(1);
    
    // 2. Register handler
    Debugger::instance().register_handler("app", 
        [](const auto& msg) {
            std::cout << msg.dump(2) << std::endl;
        });
    
    // 3. Send messages
    Debugger::instance().send_message("app", "Hello", {
        {"key", "value"}
    });
    
    // 4. Wait and cleanup
    std::this_thread::sleep_for(100ms);
    Debugger::instance().shutdown();
    
    return 0;
}
```

## Common Patterns

### Pattern 1: Module-Level Debugging

```cpp
class MyModule {
    std::shared_ptr<debugger::DebugSubitem> debug_;
    
public:
    MyModule() {
        debug_ = debugger::Debugger::instance()
            .create_subitem("MyModule", "app");
    }
    
    void do_work() {
        debug_->log_info("Starting work");
        // ... your code ...
        debug_->log_info("Work complete");
    }
};
```

### Pattern 2: Filtered Logging

```cpp
// Subscribe to specific categories
auto sub = debugger::Debugger::instance()
    .create_subscriber("errors");

sub->subscribe([](const auto& msg) {
    // Only receives "errors" category messages
    log_to_file(msg);
});
```

### Pattern 3: Async Task Debugging

```cpp
auto task = stdexec::schedule(scheduler)
    | stdexec::then([] {
        debugger::Debugger::instance().send_message(
            "task", "Processing", {{"id", 123}});
        // ... async work ...
    });

stdexec::sync_wait(std::move(task));
```

## Key APIs

| Function | Purpose |
|----------|---------|
| `init(n)` | Start debugger with n threads |
| `send_message(cat, msg, data)` | Send debug message |
| `register_handler(cat, fn)` | Handle messages by category |
| `create_subitem(name, parent)` | Create component debugger |
| `create_subscriber(cat)` | Subscribe to category |
| `shutdown()` | Stop debugger gracefully |

## Troubleshooting

**Q: Messages not appearing?**  
A: Ensure you call `init()` before sending messages and wait before `shutdown()`.

**Q: Build fails with C++23 errors?**  
A: Update your compiler: GCC 12+, Clang 15+, or MSVC 19.30+.

**Q: CMake can't find stdexec?**  
A: Ensure you have internet access for FetchContent to download dependencies.

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore [examples/](examples/) for more use cases
- Check [debugger.hpp](include/debugger/debugger.hpp) for complete API

## Support

For issues or questions:
1. Check the examples directory
2. Review the README.md
3. Examine the header files for API details

---

Happy debugging! 🐛
