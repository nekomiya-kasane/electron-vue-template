cmake_minimum_required(VERSION 3.25)
project(debugger LANGUAGES CXX)

# Require C++23
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Use FetchContent to download dependencies
include(FetchContent)

# Fetch NVIDIA stdexec
FetchContent_Declare(
    stdexec
    GIT_REPOSITORY https://github.com/NVIDIA/stdexec.git
    GIT_TAG main
    GIT_SHALLOW TRUE
)

# Fetch nlohmann_json
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
    GIT_SHALLOW TRUE
)

# Configure options before making available
set(JSON_BuildTests OFF CACHE INTERNAL "")
set(JSON_Install OFF CACHE INTERNAL "")
set(STDEXEC_BUILD_EXAMPLES OFF CACHE INTERNAL "")
set(STDEXEC_BUILD_TESTS OFF CACHE INTERNAL "")

# Make dependencies available
FetchContent_MakeAvailable(stdexec json)

# Debugger library
add_library(debugger
    src/debugger.cpp
    src/message.cpp
    src/subscriber.cpp
)

target_include_directories(debugger
    PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
        $<INSTALL_INTERFACE:include>
    PRIVATE
        src
)

target_link_libraries(debugger
    PUBLIC
        STDEXEC::stdexec
        nlohmann_json::nlohmann_json
)

# Install rules
install(TARGETS debugger
    EXPORT debugger-targets
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)

install(DIRECTORY include/ DESTINATION include)

# Export targets
install(EXPORT debugger-targets
    FILE debugger-config.cmake
    NAMESPACE debugger::
    DESTINATION lib/cmake/debugger
)

# Package config
include(CMakePackageConfigHelpers)
configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/debugger-config.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/debugger-config.cmake
    INSTALL_DESTINATION lib/cmake/debugger
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/debugger-config.cmake
    DESTINATION lib/cmake/debugger
)

# Examples (optional)
option(BUILD_EXAMPLES "Build example programs" ON)

if(BUILD_EXAMPLES)
    add_executable(basic_usage examples/basic_usage.cpp)
    target_link_libraries(basic_usage PRIVATE debugger)
    
    add_executable(subitem_management examples/subitem_management.cpp)
    target_link_libraries(subitem_management PRIVATE debugger)
    
    add_executable(advanced_stdexec examples/advanced_stdexec.cpp)
    target_link_libraries(advanced_stdexec PRIVATE debugger)
endif()
