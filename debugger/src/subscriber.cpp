#include <debugger/subscriber.hpp>

namespace debugger {

DebugSubscriber::DebugSubscriber(std::string category)
    : category_(std::move(category)) {}

DebugSubscriber::~DebugSubscriber() {
    unsubscribe();
}

void DebugSubscriber::subscribe(Callback callback) {
    std::lock_guard lock(mutex_);
    callback_ = std::move(callback);
    subscribed_ = true;
}

void DebugSubscriber::unsubscribe() {
    std::lock_guard lock(mutex_);
    subscribed_ = false;
    callback_ = nullptr;
}

void DebugSubscriber::deliver(const json& message) {
    std::lock_guard lock(mutex_);
    if (subscribed_ && callback_) {
        callback_(message);
    }
}

} // namespace debugger
