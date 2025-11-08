# Debugger Library - Documentation Index

## 📚 Start Here

New to this project? Follow this reading order:

1. **[SUMMARY.md](SUMMARY.md)** ⭐ START HERE
   - Project overview
   - What was built
   - Key features at a glance
   - 5 minutes

2. **[QUICK_START.md](QUICK_START.md)** 🚀
   - 5-minute setup
   - Minimal working example
   - Common patterns
   - 10 minutes

3. **[README.md](README.md)** 📖
   - Comprehensive guide
   - Full API reference
   - Best practices
   - 30 minutes

## 🏗️ Architecture & Design

4. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**
   - Directory layout
   - File descriptions
   - Design decisions
   - Integration patterns
   - 15 minutes

5. **[ARCHITECTURE.md](ARCHITECTURE.md)**
   - System diagrams
   - Component interactions
   - Threading model
   - Performance analysis
   - 30 minutes

## 💻 Code

### Headers (include/debugger/)
- **[debugger.hpp](include/debugger/debugger.hpp)** - Main API
- **[message.hpp](include/debugger/message.hpp)** - Message class
- **[subscriber.hpp](include/debugger/subscriber.hpp)** - Subscriber pattern

### Implementation (src/)
- **[debugger.cpp](src/debugger.cpp)** - Core implementation
- **[message.cpp](src/message.cpp)** - Message implementation
- **[subscriber.cpp](src/subscriber.cpp)** - Subscriber implementation

### Examples (examples/)
- **[basic_usage.cpp](examples/basic_usage.cpp)** - Simple usage
- **[subitem_management.cpp](examples/subitem_management.cpp)** - Component debugging
- **[advanced_stdexec.cpp](examples/advanced_stdexec.cpp)** - Advanced patterns

## 🔧 Build & Deploy

- **[CMakeLists.txt](CMakeLists.txt)** - Build configuration
- **[build.ps1](build.ps1)** - Windows build script
- **[.gitignore](.gitignore)** - Git ignore rules

## 📋 Quick Reference

### Build Commands

```bash
# Windows
.\build.ps1

# Linux/Mac
mkdir build && cd build
cmake ..
cmake --build .
```

### Run Examples

```bash
# Windows
.\build\Release\basic_usage.exe
.\build\Release\subitem_management.exe
.\build\Release\advanced_stdexec.exe

# Linux/Mac
./build/basic_usage
./build/subitem_management
./build/advanced_stdexec
```

### Integration

```cmake
add_subdirectory(path/to/debugger)
target_link_libraries(your_app PRIVATE debugger)
```

## 🎯 By Use Case

### "I want to understand the project"
→ Read: SUMMARY.md → README.md

### "I want to use it in my project"
→ Read: QUICK_START.md → README.md (API Reference section)

### "I want to understand the design"
→ Read: PROJECT_STRUCTURE.md → ARCHITECTURE.md

### "I want to see working code"
→ Look at: examples/ directory

### "I want to extend it"
→ Read: ARCHITECTURE.md → PROJECT_STRUCTURE.md (Extension Points)

### "I want to debug build issues"
→ Read: README.md (Troubleshooting section)

## 🔍 By Topic

### stdexec Integration
- README.md - "Integration with stdexec" section
- ARCHITECTURE.md - "stdexec Integration Points" section
- advanced_stdexec.cpp - Working example

### Thread Safety
- ARCHITECTURE.md - "Synchronization Primitives" section
- README.md - "Thread Safety" section
- debugger.hpp - Implementation details

### Performance
- ARCHITECTURE.md - "Performance Characteristics" section
- PROJECT_STRUCTURE.md - "Performance Characteristics" section
- README.md - "Performance Considerations" section

### JSON Messages
- README.md - "JSON Message Format" section
- ARCHITECTURE.md - "Data Structures" section
- message.hpp - Implementation

### Subitems
- README.md - "Using Subitems" section
- subitem_management.cpp - Complete example
- debugger.hpp - DebugSubitem class

## 📊 Project Statistics

```
Documentation: 5 files, ~42 KB, ~1,500 lines
Code:          6 files, ~15 KB, ~500 lines
Examples:      3 files, ~12 KB, ~350 lines
Build:         2 files, ~3 KB
Total:         16 files, ~72 KB, ~2,350 lines
```

## 🎓 Learning Path

### Beginner (1 hour)
1. Read SUMMARY.md
2. Read QUICK_START.md
3. Build and run basic_usage.cpp
4. Modify basic_usage.cpp to add your own message

### Intermediate (3 hours)
1. Read README.md fully
2. Run all examples
3. Read PROJECT_STRUCTURE.md
4. Integrate into a small test project
5. Create your own subitem

### Advanced (1 day)
1. Read ARCHITECTURE.md
2. Study the implementation files
3. Understand the threading model
4. Implement a custom extension
5. Optimize for your use case

## 🔗 External Resources

### NVIDIA stdexec
- GitHub: https://github.com/NVIDIA/stdexec
- Proposal: https://wg21.link/p2300
- Documentation: https://developer.nvidia.com/hpc-sdk

### nlohmann/json
- GitHub: https://github.com/nlohmann/json
- Documentation: https://json.nlohmann.me/

### C++23
- Standard: https://en.cppreference.com/w/cpp/23
- Compiler support: https://en.cppreference.com/w/cpp/compiler_support

## 🆘 Getting Help

### Build Issues
1. Check README.md - Troubleshooting section
2. Verify C++23 compiler support
3. Ensure internet access for FetchContent

### Usage Questions
1. Check QUICK_START.md for common patterns
2. Review examples/ directory
3. Read README.md API Reference

### Design Questions
1. Read ARCHITECTURE.md
2. Review PROJECT_STRUCTURE.md
3. Study the header files

## ✅ Checklist for New Users

- [ ] Read SUMMARY.md
- [ ] Read QUICK_START.md
- [ ] Build the project successfully
- [ ] Run basic_usage example
- [ ] Run subitem_management example
- [ ] Run advanced_stdexec example
- [ ] Read README.md
- [ ] Integrate into test project
- [ ] Create your first subitem
- [ ] Register your first handler

## 📝 Document Metadata

| Document | Size | Lines | Purpose |
|----------|------|-------|---------|
| SUMMARY.md | 12 KB | ~350 | Project overview |
| QUICK_START.md | 3.5 KB | ~120 | Fast setup guide |
| README.md | 11 KB | ~400 | Main documentation |
| PROJECT_STRUCTURE.md | 8.8 KB | ~300 | Structure & design |
| ARCHITECTURE.md | 17.8 KB | ~600 | Deep dive |
| INDEX.md | 5 KB | ~200 | This file |

## 🎯 Next Steps

After reading the documentation:

1. **Build** the project
2. **Run** the examples
3. **Integrate** into your code
4. **Extend** with custom features
5. **Share** your experience

---

**Welcome to the Debugger Library!** 🎉

Start with [SUMMARY.md](SUMMARY.md) and happy debugging!
