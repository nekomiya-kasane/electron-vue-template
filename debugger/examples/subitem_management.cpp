#include <debugger/debugger.hpp>
#include <iostream>
#include <thread>
#include <chrono>
#include <vector>

using namespace debugger;
using namespace std::chrono_literals;

// Simulate a large application with multiple components
class NetworkModule {
public:
    NetworkModule() {
        subitem_ = Debugger::instance().create_subitem("NetworkModule", "application");
    }
    
    void connect(const std::string& host, int port) {
        subitem_->log_info("Connecting to server", {
            {"host", host},
            {"port", port}
        });
        
        // Simulate connection
        std::this_thread::sleep_for(50ms);
        
        subitem_->log_info("Connection established", {
            {"host", host},
            {"port", port},
            {"connection_id", "conn_12345"}
        });
    }
    
    void send_data(const std::string& data) {
        subitem_->log("Sending data", {
            {"size", data.size()},
            {"data_preview", data.substr(0, std::min(size_t(20), data.size()))}
        });
    }
    
    void handle_error(const std::string& error) {
        subitem_->log_error("Network error occurred", {
            {"error", error},
            {"retry_count", 3}
        });
    }

private:
    std::shared_ptr<DebugSubitem> subitem_;
};

class DatabaseModule {
public:
    DatabaseModule() {
        subitem_ = Debugger::instance().create_subitem("DatabaseModule", "application");
    }
    
    void execute_query(const std::string& query) {
        subitem_->log_info("Executing query", {
            {"query", query}
        });
        
        // Simulate query execution
        std::this_thread::sleep_for(30ms);
        
        subitem_->log_info("Query completed", {
            {"query", query},
            {"rows_affected", 15},
            {"duration_ms", 30}
        });
    }
    
    void transaction_begin() {
        subitem_->log("Transaction started", {
            {"isolation_level", "READ_COMMITTED"}
        });
    }
    
    void transaction_commit() {
        subitem_->log("Transaction committed", {
            {"success", true}
        });
    }

private:
    std::shared_ptr<DebugSubitem> subitem_;
};

class CacheModule {
public:
    CacheModule() {
        subitem_ = Debugger::instance().create_subitem("CacheModule", "application");
    }
    
    void cache_hit(const std::string& key) {
        subitem_->log("Cache hit", {
            {"key", key},
            {"ttl_remaining", 300}
        });
    }
    
    void cache_miss(const std::string& key) {
        subitem_->log_warning("Cache miss", {
            {"key", key},
            {"will_fetch_from_db", true}
        });
    }

private:
    std::shared_ptr<DebugSubitem> subitem_;
};

int main() {
    std::cout << "=== Subitem Management Example ===" << std::endl;
    
    // Initialize debugger with 3 worker threads for better concurrency
    Debugger::instance().init(3);
    
    // Register a global handler to log all messages
    Debugger::instance().register_handler("application.NetworkModule", [](const json& msg) {
        std::cout << "[APP/NETWORK] " << msg["message"] << std::endl;
    });
    
    Debugger::instance().register_handler("application.DatabaseModule", [](const json& msg) {
        std::cout << "[APP/DATABASE] " << msg["message"] << std::endl;
    });
    
    Debugger::instance().register_handler("application.CacheModule", [](const json& msg) {
        std::cout << "[APP/CACHE] " << msg["message"] << std::endl;
    });
    
    // Create module instances
    NetworkModule network;
    DatabaseModule database;
    CacheModule cache;
    
    std::cout << "\n--- Simulating Application Activity ---\n" << std::endl;
    
    // Simulate various operations
    network.connect("api.example.com", 443);
    cache.cache_miss("user:123");
    database.execute_query("SELECT * FROM users WHERE id = 123");
    cache.cache_hit("user:456");
    network.send_data("POST /api/users HTTP/1.1\nContent-Length: 256\n\n{...}");
    
    database.transaction_begin();
    database.execute_query("UPDATE users SET last_login = NOW() WHERE id = 123");
    database.transaction_commit();
    
    network.handle_error("Connection timeout after 30 seconds");
    
    // Wait for all messages to be processed
    std::this_thread::sleep_for(200ms);
    
    // Display all registered subitems
    std::cout << "\n--- Registered Subitems ---" << std::endl;
    auto subitems = Debugger::instance().get_all_subitems();
    for (const auto& subitem : subitems) {
        std::cout << "  - " << subitem->name() 
                  << " (ID: " << subitem->id() 
                  << ", Parent: " << (subitem->parent_category().empty() ? "none" : subitem->parent_category())
                  << ")" << std::endl;
    }
    
    // Shutdown
    Debugger::instance().shutdown();
    
    std::cout << "\n=== Example complete ===" << std::endl;
    
    return 0;
}
