// note, it should only handle network package that has json string and has "framework": "System"
// inherience, extension, implementation edges should have different line type (say dashed/solid)

{
    "framework": "System",
    "command": "meta-class:create",
    "payload": {
        "name": "xxx"
    }
}
// create a vertex with name xxx, 

{
    "framework": "System",
    "command": "meta-class:set-type",
    "payload": {
        "name": "xxx",
        "type": "component"
    }
}
// modify vertex type, causing changing its color, type has differnet-color candidates: [unknown, component, interface, tie, boa, data-extension, code-extension, transient-extension, cache-extension], use similar colors for the 4 extensions， different colors for others, if no type provided, use unknown.

{
    "framework": "System",
    "command": "meta-class:set-parent",
    "payload": {
        "name": "xxx",
        "parent": "yyy"
    }
}
// create an edge from xxx to yyy of type inherience if not already exists, if parent is none, delete the edge from xxx to its original parent, there should be only one parent for a vertex



{
    "framework": "System",
    "command": "meta-class:add-extension",
    "payload": {
        "name": "xxx",
        "extension": "yyy",
        "type": "data"
    }
}
// create an edge from yyy to xxx of type extension if not already exists. there are 4 types: [data, cache, transient, code], give each kind a distinct color to the edge. if no type provides, use yyy's type. if yyy's type changed, also this the edge's style

{
    "framework": "System",
    "command": "meta-class:remove-extension",
    "payload": {
        "name": "xxx",
        "extension": "yyy"
    }
}
// remove the extension type edge from yyy to xxx

{
    "framework": "System",
    "command": "meta-class:add-interface",
    "payload": {
        "name": "xxx",
        "interface": "yyy",
        "type": "tie"
    }
}
// create an edge from xxx to yyy of type implementation if not already exists. there are 3 types: [tie, tie-chain, boa], give each kind a distinct color to the edge.

{
    "framework": "System",
    "command": "meta-class:remove-interface",
    "payload": {
        "name": "xxx",
        "interface": "yyy"
    }
}
// remove the implementation type edge from yyy to xxx

{
    "framework": "System",
    "command": "query:start-query",
    "payload": {
    }
}
// set a flag to flag entering query mode and cancel all highlights before

{
    "framework": "System",
    "command": "query:end-query",
    "payload": {
        "result": "ok"
    }
}
// cancel the entering query mode flag. if result is ok, highlight the last querier and last interface with green, if result is failed, highlight them red. if result is cached, highlight them yellow

{
    "framework": "System",
    "command": "query:clear-query-history",
    "payload": {
    }
}
// cancel all existing highlights

{
    "framework": "System",
    "command": "query:set-querier",
    "payload": {
        "name": "xxx"
    }
}
// only for query mode. highlight the vertex of name xxx with color A for the first time and lighter color A for the afterwards. keep all history highlights.

{
    "framework": "System",
    "command": "query:set-interface",
    "payload": {
        "name": "xxx"
    }
}
// only for query mode. highlight the vertex of name xxx with color B for the first time and lighter color B for the afterwards. keep all history highlights.
