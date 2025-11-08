#pragma once

#include <stdexec/execution.hpp>
#include <exec/static_thread_pool.hpp>
#include <string>
#include <memory>
#include <unordered_map>
#include <functional>
#include <nlohmann/json.hpp>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <atomic>
#include <vector>

namespace debugger {

using json = nlohmann::json;

class DebugMessage;
class DebugSubscriber;

// Subitem represents a debuggable component or module in your application
class DebugSubitem {
public:
    DebugSubitem(std::string name, std::string parent_category = "")
        : name_(std::move(name))
        , parent_category_(std::move(parent_category))
        , id_(generate_id()) {}

    const std::string& name() const { return name_; }
    const std::string& parent_category() const { return parent_category_; }
    const std::string& id() const { return id_; }

    void log(const std::string& message, const json& data = {});
    void log_error(const std::string& message, const json& data = {});
    void log_warning(const std::string& message, const json& data = {});
    void log_info(const std::string& message, const json& data = {});

private:
    static std::string generate_id();
    std::string name_;
    std::string parent_category_;
    std::string id_;
};

class Debugger {
public:
    using MessageHandler = std::function<void(const json&)>;
    using SubscriberMap = std::unordered_map<std::string, std::shared_ptr<DebugSubscriber>>;
    using SubitemMap = std::unordered_map<std::string, std::shared_ptr<DebugSubitem>>;

    static Debugger& instance() {
        static Debugger instance;
        return instance;
    }

    // Prevent copying and assignment
    Debugger(const Debugger&) = delete;
    Debugger& operator=(const Debugger&) = delete;

    // Initialize the debugger with default thread pool
    void init(size_t num_threads = 1);

    // Initialize the debugger with a custom scheduler
    template<typename Scheduler>
    void init_with_scheduler(Scheduler scheduler);

    // Shutdown the debugger
    void shutdown();

    // Check if debugger is running
    bool is_running() const { return running_.load(); }

    // Send a debug message
    void send_message(const std::string& category, const std::string& message, const json& data = {});

    // Register a message handler for a specific category
    void register_handler(const std::string& category, MessageHandler handler);

    // Create a subscriber for a specific category
    std::shared_ptr<DebugSubscriber> create_subscriber(const std::string& category);

    // Get a subscriber by name
    std::shared_ptr<DebugSubscriber> get_subscriber(const std::string& name);

    // Create a debug subitem for component-level debugging
    std::shared_ptr<DebugSubitem> create_subitem(const std::string& name, const std::string& parent_category = "");

    // Get all subitems
    std::vector<std::shared_ptr<DebugSubitem>> get_all_subitems() const;

    // Get the internal thread pool (if using default initialization)
    exec::static_thread_pool* get_thread_pool() { return thread_pool_.get(); }

private:
    Debugger() = default;
    ~Debugger();

    struct Message {
        std::string category;
        json data;
        std::chrono::system_clock::time_point timestamp;
    };

    void process_messages();
    void process_message(const Message& msg);
    void start_processing_loop();

    mutable std::mutex mutex_;
    std::condition_variable cv_;
    std::queue<Message> message_queue_;
    std::unordered_map<std::string, MessageHandler> handlers_;
    SubscriberMap subscribers_;
    SubitemMap subitems_;
    std::atomic<bool> running_{false};
    stdexec::in_place_stop_source stop_source_;
    std::unique_ptr<exec::static_thread_pool> thread_pool_;
    bool owns_thread_pool_{false};
};

// Template implementation
template<typename Scheduler>
void Debugger::init_with_scheduler(Scheduler scheduler) {
    if (running_.load()) return;
    
    running_.store(true);
    owns_thread_pool_ = false;
    
    // Create a sender that processes messages in a loop
    auto work = stdexec::schedule(scheduler)
        | stdexec::then([this] {
            while (running_.load()) {
                std::unique_lock lock(mutex_);
                cv_.wait(lock, [this] { 
                    return !message_queue_.empty() || !running_.load();
                });
                
                if (!running_.load() && message_queue_.empty()) {
                    break;
                }
                
                process_messages();
            }
        });

    // Start the work detached
    stdexec::start_detached(std::move(work));
}

// Helper macro for easy message sending
#define DEBUG_LOG(category, message, ...) \
    debugger::Debugger::instance().send_message(category, message, {__VA_ARGS__})

} // namespace debugger
