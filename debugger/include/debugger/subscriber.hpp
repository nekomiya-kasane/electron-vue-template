#pragma once

#include <nlohmann/json.hpp>
#include <functional>
#include <string>
#include <vector>
#include <mutex>

namespace debugger {

using json = nlohmann::json;

class DebugSubscriber {
public:
    using Callback = std::function<void(const json&)>;

    explicit DebugSubscriber(std::string category);
    ~DebugSubscriber();

    // Subscribe to messages from this subscriber
    void subscribe(Callback callback);

    // Unsubscribe from messages
    void unsubscribe();

    // Get the category this subscriber is listening to
    const std::string& category() const { return category_; }

    // Called by Debugger to deliver messages
    void deliver(const json& message);

private:
    std::string category_;
    Callback callback_;
    std::mutex mutex_;
    bool subscribed_{false};
};

} // namespace debugger
