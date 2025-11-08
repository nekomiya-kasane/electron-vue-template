# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ NetworkModule│  │DatabaseModule│  │  CacheModule │         │
│  │              │  │              │  │              │         │
│  │  DebugSubitem│  │  DebugSubitem│  │  DebugSubitem│         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Debugger Core (Singleton)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Message Queue                          │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                │  │
│  │  │ Msg1 │→ │ Msg2 │→ │ Msg3 │→ │ Msg4 │→  ...          │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         stdexec Processing Loop (Thread Pool)            │  │
│  │                                                           │  │
│  │  while (running) {                                       │  │
│  │    wait_for_messages();                                  │  │
│  │    process_messages();                                   │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Message Router                               │  │
│  │                                                           │  │
│  │  ┌─────────────┐         ┌──────────────┐               │  │
│  │  │  Handlers   │         │ Subscribers  │               │  │
│  │  │  Map        │         │  Map         │               │  │
│  │  │             │         │              │               │  │
│  │  │ "network" → │         │ "database" → │               │  │
│  │  │   handler1  │         │   subscriber1│               │  │
│  │  │             │         │              │               │  │
│  │  │ "database"→ │         │ "network"  → │               │  │
│  │  │   handler2  │         │   subscriber2│               │  │
│  │  └─────────────┘         └──────────────┘               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Output Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Console    │  │   Log File   │  │   Network    │         │
│  │   Output     │  │   Writer     │  │   Socket     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### 1. Message Sending Flow

```
Application Code
      │
      │ subitem->log_info("message", data)
      │
      ▼
DebugSubitem
      │
      │ Enriches with: subitem_id, subitem_name, level
      │
      ▼
Debugger::send_message()
      │
      │ Creates Message{category, json_data, timestamp}
      │
      ▼
Message Queue (thread-safe push)
      │
      │ notify_one()
      │
      ▼
stdexec Processing Thread (wakes up)
```

### 2. Message Processing Flow

```
Processing Thread (stdexec loop)
      │
      │ cv_.wait() → wakes up
      │
      ▼
process_messages()
      │
      │ Dequeue all pending messages
      │
      ▼
For each message:
      │
      ├─→ Check Handlers Map
      │   │
      │   └─→ If found: handler(json_data)
      │
      └─→ Check Subscribers Map
          │
          └─→ If found: subscriber->deliver(json_data)
                │
                └─→ callback(json_data)
```

### 3. Subitem Hierarchy

```
Application
    │
    ├─→ NetworkModule
    │       │
    │       ├─→ TCPConnection
    │       │
    │       └─→ HTTPClient
    │
    ├─→ DatabaseModule
    │       │
    │       ├─→ ConnectionPool
    │       │
    │       └─→ QueryExecutor
    │
    └─→ CacheModule
            │
            └─→ MemoryCache

Category naming:
- "application.NetworkModule"
- "application.NetworkModule.TCPConnection"
- "application.DatabaseModule"
```

## Threading Model

### Default Initialization (Built-in Thread Pool)

```
Main Thread                    Debugger Thread(s)
    │                                │
    │ init(2)                        │
    │─────────────────────────────→  │
    │                                │ Creates thread_pool(2)
    │                                │ Starts processing loop
    │                                │
    │ send_message()                 │
    │─────────────────────────────→  │
    │         (queue push)           │
    │                                │ Processes message
    │                                │ Calls handlers
    │                                │
    │ send_message()                 │
    │─────────────────────────────→  │
    │                                │
    │                                │
    │ shutdown()                     │
    │─────────────────────────────→  │
    │                                │ Stops loop
    │                                │ Waits for queue drain
    │                                │
    │←───────────────────────────────│
    │         (returns)              │
```

### Custom Scheduler (User-Provided Thread Pool)

```
Main Thread              App Thread Pool        Debugger Processing
    │                         │                        │
    │ create app_pool(4)      │                        │
    │────────────────────────→│                        │
    │                         │                        │
    │ init_with_scheduler()   │                        │
    │─────────────────────────┼───────────────────────→│
    │                         │                        │ Uses app scheduler
    │                         │                        │ Starts processing
    │                         │                        │
    │ send_message()          │                        │
    │─────────────────────────┼───────────────────────→│
    │                         │                        │
    │                         │←───────────────────────│
    │                         │  (scheduled work)      │
    │                         │                        │
    │                         │ Executes on pool thread│
    │                         │────────────────────────→│
```

## Data Structures

### Message Structure

```cpp
struct Message {
    std::string category;                           // "network", "database"
    json data;                                      // Structured payload
    std::chrono::system_clock::time_point timestamp; // When created
};
```

### JSON Message Format

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

### Internal Maps

```cpp
// Handler registry
std::unordered_map<std::string, MessageHandler> handlers_;
// Key: category, Value: callback function

// Subscriber registry
std::unordered_map<std::string, std::shared_ptr<DebugSubscriber>> subscribers_;
// Key: category, Value: subscriber object

// Subitem registry
std::unordered_map<std::string, std::shared_ptr<DebugSubitem>> subitems_;
// Key: "parent.name", Value: subitem object
```

## Synchronization Primitives

### Mutex Protection

```
mutex_ protects:
├─ message_queue_
├─ handlers_
├─ subscribers_
└─ subitems_

Strategy: Fine-grained locking
- Lock held only during map/queue operations
- Released before calling user callbacks
- Prevents deadlocks
```

### Condition Variable

```
cv_ is used for:
├─ Notifying processing thread of new messages
└─ Waking up on shutdown

Predicate:
- !message_queue_.empty() || !running_
```

### Atomic Flag

```
std::atomic<bool> running_
- Lock-free check for shutdown
- Safe from any thread
- Used in hot paths
```

## stdexec Integration Points

### Sender/Receiver Pattern

```cpp
// Create a sender
auto work = stdexec::schedule(scheduler)
    | stdexec::then([this] {
        // Processing logic
    });

// Start it detached (fire and forget)
stdexec::start_detached(std::move(work));
```

### Scheduler Abstraction

```cpp
template<typename Scheduler>
void init_with_scheduler(Scheduler scheduler) {
    // Works with any stdexec scheduler:
    // - exec::static_thread_pool::scheduler
    // - exec::inline_scheduler
    // - Custom schedulers
}
```

### Composition

```cpp
// Debugger can be used in stdexec pipelines
auto task = stdexec::schedule(sched)
    | stdexec::then([] {
        Debugger::instance().send_message(...);
        return process_data();
    })
    | stdexec::then([](auto result) {
        Debugger::instance().send_message(...);
        return result;
    });
```

## Memory Management

### Ownership Model

```
Debugger (singleton)
    │
    ├─→ owns: thread_pool_ (unique_ptr)
    │
    ├─→ owns: message_queue_ (value)
    │
    ├─→ owns: handlers_ (value, stores std::function)
    │
    ├─→ shares: subscribers_ (shared_ptr)
    │   │
    │   └─→ User holds shared_ptr
    │
    └─→ shares: subitems_ (shared_ptr)
        │
        └─→ User holds shared_ptr
```

### Lifetime Guarantees

1. **Debugger**: Lives for entire program (singleton)
2. **Subitems**: Live as long as user holds shared_ptr
3. **Subscribers**: Live as long as user holds shared_ptr
4. **Messages**: Copied into queue, destroyed after processing
5. **Thread Pool**: Destroyed on shutdown (waits for work completion)

## Error Handling Strategy

### No Exceptions in Hot Path

```cpp
// Message sending never throws
void send_message(...) {
    if (!running_.load()) return;  // Silent fail if shutdown
    // ... queue push (noexcept)
}
```

### User Callback Isolation

```cpp
// Exceptions in user callbacks are caught
try {
    handler(msg.data);
} catch (const std::exception& e) {
    // Log error, continue processing
}
```

## Performance Characteristics

### Latency

```
send_message() latency:
├─ Atomic load: ~1-5 ns
├─ Mutex lock: ~20-50 ns (uncontended)
├─ Queue push: ~10-20 ns
├─ Mutex unlock: ~20-50 ns
└─ Condition notify: ~100-500 ns
Total: ~150-600 ns (sub-microsecond)
```

### Throughput

```
Theoretical maximum:
- Single thread: ~1-2M messages/sec
- Multi-thread: ~500K-1M messages/sec (contention)

Practical:
- Depends on handler complexity
- JSON serialization: ~100K-500K messages/sec
```

### Memory

```
Per message: ~200-500 bytes
├─ std::string category: ~32 bytes
├─ json data: ~100-400 bytes (varies)
└─ timestamp: 8 bytes

Queue overhead: ~16 bytes per message
Handler map: ~48 bytes per handler
Subitem: ~128 bytes per subitem
```

## Scalability Considerations

### Vertical Scaling (More Threads)

```
Benefits:
✓ Better throughput for CPU-bound handlers
✓ Reduced latency under load

Limitations:
✗ Contention on mutex
✗ Cache coherence overhead
✗ Diminishing returns beyond 4-8 threads
```

### Horizontal Scaling (Multiple Instances)

```
Not directly supported, but can be achieved via:
- Category-based sharding
- Multiple debugger instances (requires code changes)
- Network-based aggregation
```

## Extension Architecture

### Adding Custom Transports

```cpp
// Register a handler that forwards to network
Debugger::instance().register_handler("remote", 
    [&socket](const json& msg) {
        socket.send(msg.dump());
    });
```

### Adding Filters

```cpp
// Wrap handler with filter
auto filtered_handler = [](const json& msg) {
    if (msg["level"] == "error") {
        original_handler(msg);
    }
};
```

### Adding Persistence

```cpp
// Register database writer
Debugger::instance().register_handler("persistent",
    [&db](const json& msg) {
        db.insert("debug_log", msg);
    });
```

## Comparison with Alternatives

### vs. Traditional Logging (spdlog, log4cpp)

```
Debugger Library:
✓ Async by design (stdexec)
✓ Structured data (JSON)
✓ Component hierarchy (subitems)
✓ Subscriber pattern
✗ Not optimized for file I/O
✗ No log rotation

Traditional Logging:
✓ Mature, battle-tested
✓ File rotation, compression
✓ Multiple sinks
✗ Often string-based
✗ Less structured
```

### vs. Tracing Systems (OpenTelemetry)

```
Debugger Library:
✓ Lightweight
✓ Simple integration
✓ No external dependencies
✗ No distributed tracing
✗ No span context

Tracing Systems:
✓ Distributed tracing
✓ Span relationships
✓ Industry standard
✗ Complex setup
✗ Performance overhead
```

---

**This architecture is designed for:**
- Development and debugging scenarios
- Structured diagnostic logging
- Component-level observability
- Modern C++ codebases using stdexec

**Not designed for:**
- High-frequency production logging
- Distributed system tracing
- Long-term log storage
- Compliance/audit logging
