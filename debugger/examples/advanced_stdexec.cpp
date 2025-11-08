#include <debugger/debugger.hpp>
#include <stdexec/execution.hpp>
#include <exec/static_thread_pool.hpp>
#include <iostream>
#include <thread>
#include <chrono>

using namespace debugger;
using namespace std::chrono_literals;

// Example showing how to use custom schedulers with the debugger
int main() {
    std::cout << "=== Advanced stdexec Integration Example ===" << std::endl;
    
    // Create a custom thread pool for the application
    exec::static_thread_pool app_pool(4);
    auto app_scheduler = app_pool.get_scheduler();
    
    // Initialize debugger with its own thread pool
    Debugger::instance().init(2);
    
    // Register handlers
    Debugger::instance().register_handler("async_task", [](const json& msg) {
        std::cout << "[ASYNC] " << msg.dump(2) << std::endl;
    });
    
    std::cout << "\n--- Running Concurrent Tasks with Debugging ---\n" << std::endl;
    
    // Create multiple concurrent tasks that log debug information
    auto task1 = stdexec::schedule(app_scheduler)
        | stdexec::then([] {
            Debugger::instance().send_message("async_task", "Task 1 started", {
                {"task_id", 1},
                {"thread_id", std::hash<std::thread::id>{}(std::this_thread::get_id())}
            });
            
            std::this_thread::sleep_for(50ms);
            
            Debugger::instance().send_message("async_task", "Task 1 processing", {
                {"task_id", 1},
                {"progress", 50}
            });
            
            std::this_thread::sleep_for(50ms);
            
            Debugger::instance().send_message("async_task", "Task 1 completed", {
                {"task_id", 1},
                {"result", "success"}
            });
            
            return 42;
        });
    
    auto task2 = stdexec::schedule(app_scheduler)
        | stdexec::then([] {
            Debugger::instance().send_message("async_task", "Task 2 started", {
                {"task_id", 2},
                {"thread_id", std::hash<std::thread::id>{}(std::this_thread::get_id())}
            });
            
            std::this_thread::sleep_for(30ms);
            
            Debugger::instance().send_message("async_task", "Task 2 completed", {
                {"task_id", 2},
                {"result", "success"}
            });
            
            return 100;
        });
    
    auto task3 = stdexec::schedule(app_scheduler)
        | stdexec::then([] {
            Debugger::instance().send_message("async_task", "Task 3 started", {
                {"task_id", 3},
                {"thread_id", std::hash<std::thread::id>{}(std::this_thread::get_id())}
            });
            
            std::this_thread::sleep_for(70ms);
            
            Debugger::instance().send_message("async_task", "Task 3 completed", {
                {"task_id", 3},
                {"result", "success"}
            });
            
            return 256;
        });
    
    // Run all tasks concurrently and wait for results
    auto all_tasks = stdexec::when_all(std::move(task1), std::move(task2), std::move(task3));
    
    auto [r1, r2, r3] = stdexec::sync_wait(std::move(all_tasks)).value();
    
    std::cout << "\n--- Task Results ---" << std::endl;
    std::cout << "Task 1 result: " << r1 << std::endl;
    std::cout << "Task 2 result: " << r2 << std::endl;
    std::cout << "Task 3 result: " << r3 << std::endl;
    
    // Wait for debug messages to be processed
    std::this_thread::sleep_for(200ms);
    
    // Demonstrate using a subitem in an async context
    std::cout << "\n--- Async Subitem Example ---\n" << std::endl;
    
    auto subitem = Debugger::instance().create_subitem("AsyncWorker", "tasks");
    
    auto async_work = stdexec::schedule(app_scheduler)
        | stdexec::then([subitem] {
            subitem->log_info("Async work started");
            std::this_thread::sleep_for(50ms);
            subitem->log_info("Async work completed", {
                {"duration_ms", 50}
            });
        });
    
    stdexec::sync_wait(std::move(async_work));
    
    std::this_thread::sleep_for(100ms);
    
    // Shutdown
    Debugger::instance().shutdown();
    
    std::cout << "\n=== Example complete ===" << std::endl;
    
    return 0;
}
