#pragma once

#include <nlohmann/json.hpp>
#include <string>
#include <chrono>

namespace debugger {

class DebugMessage {
public:
    DebugMessage(std::string category, std::string message, nlohmann::json data = {})
        : timestamp_(std::chrono::system_clock::now())
        , category_(std::move(category))
        , message_(std::move(message))
        , data_(std::move(data)) {}

    [[nodiscard]] nlohmann::json to_json() const {
        return {
            {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
                              timestamp_.time_since_epoch()).count()},
            {"category", category_},
            {"message", message_},
            {"data", data_}
        };
    }

    [[nodiscard]] const std::string& category() const { return category_; }
    [[nodiscard]] const std::string& message() const { return message_; }
    [[nodiscard]] const nlohmann::json& data() const { return data_; }
    [[nodiscard]] auto timestamp() const { return timestamp_; }

private:
    std::chrono::system_clock::time_point timestamp_;
    std::string category_;
    std::string message_;
    nlohmann::json data_;
};

} // namespace debugger
