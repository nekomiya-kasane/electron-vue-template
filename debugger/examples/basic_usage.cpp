#include <debugger/debugger.hpp>
#include <debugger/subscriber.hpp>
#include <iostream>
#include <thread>
#include <chrono>

using namespace debugger;
using namespace std::chrono_literals;

int main() {
    std::cout << "=== Basic Debugger Usage Example ===" << std::endl;
    
    // Initialize the debugger with 2 worker threads
    Debugger::instance().init(2);
    
    // Register a handler for "network" category
    Debugger::instance().register_handler("network", [](const json& msg) {
        std::cout << "[NETWORK] " << msg.dump(2) << std::endl;
    });
    
    // Register a handler for "database" category
    Debugger::instance().register_handler("database", [](const json& msg) {
        std::cout << "[DATABASE] " << msg.dump(2) << std::endl;
    });
    
    // Send some messages
    Debugger::instance().send_message("network", "Connection established", {
        {"host", "example.com"},
        {"port", 8080}
    });
    
    Debugger::instance().send_message("database", "Query executed", {
        {"query", "SELECT * FROM users"},
        {"rows", 42},
        {"duration_ms", 15}
    });
    
    // Use the convenience macro
    DEBUG_LOG("network", "Data received", 
        {"bytes", 1024},
        {"protocol", "HTTP/1.1"}
    );
    
    // Wait a bit for messages to be processed
    std::this_thread::sleep_for(100ms);
    
    std::cout << "\n=== Subscriber Example ===" << std::endl;
    
    // Create a subscriber for "network" category
    auto network_sub = Debugger::instance().create_subscriber("network");
    network_sub->subscribe([](const json& msg) {
        std::cout << "[SUBSCRIBER] Network event: " << msg.dump() << std::endl;
    });
    
    // Send more network messages
    Debugger::instance().send_message("network", "Request sent", {
        {"method", "GET"},
        {"url", "/api/users"}
    });
    
    std::this_thread::sleep_for(100ms);
    
    // Shutdown the debugger
    Debugger::instance().shutdown();
    
    std::cout << "\n=== Debugger shutdown complete ===" << std::endl;
    
    return 0;
}
