#include <debugger/debugger.hpp>
#include <debugger/message.hpp>
#include <debugger/subscriber.hpp>
#include <stdexec/execution.hpp>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <random>

namespace debugger {

// DebugSubitem implementation
std::string DebugSubitem::generate_id() {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 15);
    
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (int i = 0; i < 16; ++i) {
        ss << std::setw(1) << dis(gen);
    }
    return ss.str();
}

void DebugSubitem::log(const std::string& message, const json& data) {
    json log_data = data;
    log_data["subitem_id"] = id_;
    log_data["subitem_name"] = name_;
    log_data["level"] = "debug";
    
    std::string category = parent_category_.empty() ? name_ : parent_category_ + "." + name_;
    Debugger::instance().send_message(category, message, log_data);
}

void DebugSubitem::log_error(const std::string& message, const json& data) {
    json log_data = data;
    log_data["subitem_id"] = id_;
    log_data["subitem_name"] = name_;
    log_data["level"] = "error";
    
    std::string category = parent_category_.empty() ? name_ : parent_category_ + "." + name_;
    Debugger::instance().send_message(category, message, log_data);
}

void DebugSubitem::log_warning(const std::string& message, const json& data) {
    json log_data = data;
    log_data["subitem_id"] = id_;
    log_data["subitem_name"] = name_;
    log_data["level"] = "warning";
    
    std::string category = parent_category_.empty() ? name_ : parent_category_ + "." + name_;
    Debugger::instance().send_message(category, message, log_data);
}

void DebugSubitem::log_info(const std::string& message, const json& data) {
    json log_data = data;
    log_data["subitem_id"] = id_;
    log_data["subitem_name"] = name_;
    log_data["level"] = "info";
    
    std::string category = parent_category_.empty() ? name_ : parent_category_ + "." + name_;
    Debugger::instance().send_message(category, message, log_data);
}

// Debugger implementation
void Debugger::init(size_t num_threads) {
    if (running_.load()) return;
    
    // Create internal thread pool
    thread_pool_ = std::make_unique<exec::static_thread_pool>(num_threads);
    owns_thread_pool_ = true;
    running_.store(true);
    
    // Get scheduler from thread pool
    auto scheduler = thread_pool_->get_scheduler();
    
    // Start the message processing loop using stdexec
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

void Debugger::shutdown() {
    if (!running_.load()) return;
    
    running_.store(false);
    cv_.notify_all();
    stop_source_.request_stop();
    
    // Wait for thread pool to finish if we own it
    if (owns_thread_pool_ && thread_pool_) {
        // Thread pool destructor will wait for all work to complete
        thread_pool_.reset();
    }
}

void Debugger::send_message(const std::string& category, const std::string& message, const json& data) {
    if (!running_.load()) return;

    {
        std::lock_guard lock(mutex_);
        message_queue_.push({
            category,
            {
                {"message", message},
                {"data", data}
            },
            std::chrono::system_clock::now()
        });
    }
    cv_.notify_one();
}

void Debugger::register_handler(const std::string& category, MessageHandler handler) {
    std::lock_guard lock(mutex_);
    handlers_[category] = std::move(handler);
}

std::shared_ptr<DebugSubscriber> Debugger::create_subscriber(const std::string& category) {
    std::lock_guard lock(mutex_);
    auto it = subscribers_.find(category);
    if (it != subscribers_.end()) {
        return it->second;
    }
    
    auto subscriber = std::make_shared<DebugSubscriber>(category);
    subscribers_[category] = subscriber;
    return subscriber;
}

std::shared_ptr<DebugSubscriber> Debugger::get_subscriber(const std::string& name) {
    std::lock_guard lock(mutex_);
    auto it = subscribers_.find(name);
    return it != subscribers_.end() ? it->second : nullptr;
}

std::shared_ptr<DebugSubitem> Debugger::create_subitem(const std::string& name, const std::string& parent_category) {
    std::lock_guard lock(mutex_);
    
    std::string key = parent_category.empty() ? name : parent_category + "." + name;
    auto it = subitems_.find(key);
    if (it != subitems_.end()) {
        return it->second;
    }
    
    auto subitem = std::make_shared<DebugSubitem>(name, parent_category);
    subitems_[key] = subitem;
    return subitem;
}

std::vector<std::shared_ptr<DebugSubitem>> Debugger::get_all_subitems() const {
    std::lock_guard lock(mutex_);
    std::vector<std::shared_ptr<DebugSubitem>> result;
    result.reserve(subitems_.size());
    
    for (const auto& [key, subitem] : subitems_) {
        result.push_back(subitem);
    }
    
    return result;
}

void Debugger::process_messages() {
    std::unique_lock lock(mutex_);
    while (!message_queue_.empty()) {
        auto msg = std::move(message_queue_.front());
        message_queue_.pop();
        
        // Release the lock while processing the message
        lock.unlock();
        process_message(msg);
        lock.lock();
    }
}

void Debugger::process_message(const Message& msg) {
    // First, check for a direct handler
    {
        std::lock_guard lock(mutex_);
        auto it = handlers_.find(msg.category);
        if (it != handlers_.end()) {
            it->second(msg.data);
        }
    }
    
    // Then notify subscribers
    auto sub = get_subscriber(msg.category);
    if (sub) {
        sub->deliver(msg.data);
    }
}

Debugger::~Debugger() {
    shutdown();
}

} // namespace debugger
