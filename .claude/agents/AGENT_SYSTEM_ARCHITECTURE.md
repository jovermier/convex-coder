# Claude Code Agent System Architecture

## Overview

The Claude Code agent system uses **7 specialized agents** coordinated by an Orchestrator to deliver complete full-stack features autonomously. Each agent has a specific expertise and works in autonomous loops until success.

## Agent Hierarchy

```
┌─────────────────────────────────────────┐
│           ORCHESTRATOR                  │
│   (Coordinates all specialist agents)   │
└─────────────┬───────────────────────────┘
              │
              ├── convex-schema-manager (Database schema)
              ├── convex-function-generator (Backend functions)
              ├── react-convex-builder (React components)
              ├── convex-auth-specialist (Authentication)
              ├── fullstack-feature-creator (Simple features)
              ├── Web Testing Specialist (Testing)
              └── Performance Engineer (Optimization)
```

## Complete Agent Roster

### 1. Orchestrator
- **File name**: `orchestrator.md`
- **Name in Task tool**: `"Orchestrator"`
- **Role**: Coordinates multiple agents, never implements
- **When used**: Complex features, epics, multi-layer work
- **Key capability**: Parallel agent coordination via Task tool

### 2. Convex Schema Manager
- **File name**: `convex-schema-manager.md`
- **Name in Task tool**: `"Convex Schema Manager"`
- **Role**: Database schema design and optimization
- **When used**: Schema creation, indexes, migrations
- **Autonomous**: Loops until schema compiles and validates

### 3. Convex Function Generator
- **File name**: `convex-function-generator.md`
- **Name in Task tool**: `"Convex Function Generator"`
- **Role**: Backend queries, mutations, actions
- **When used**: All backend logic and API endpoints
- **Autonomous**: Loops until functions work correctly

### 4. React Convex Builder
- **File name**: `react-convex-builder.md`
- **Name in Task tool**: `"React Convex Builder"`
- **Role**: React components with Convex integration
- **When used**: UI components, real-time updates
- **Autonomous**: Loops until components render properly

### 5. Convex Auth Specialist
- **File name**: `convex-auth-specialist.md`
- **Name in Task tool**: `"Convex Auth Specialist"`
- **Role**: Authentication and authorization
- **When used**: OAuth, login, permissions, roles
- **Autonomous**: Loops until auth flows work securely

### 6. Fullstack Feature Creator
- **File name**: `fullstack-feature-creator.md`
- **Name in Task tool**: `"Fullstack Feature Creator"`
- **Role**: Implements complete simple features
- **When used**: Small self-contained features, quick MVPs
- **Autonomous**: Loops until feature works end-to-end

### 7. Web Testing Specialist
- **File name**: `web-testing-specialist.md`
- **Name in Task tool**: `"Web Testing Specialist"`
- **Role**: Comprehensive testing and validation
- **When used**: All testing needs, visual regression
- **Autonomous**: Loops until all tests pass

### 8. Performance Engineer
- **File name**: `performance-engineer.md`
- **Name in Task tool**: `"Performance Engineer"`
- **Role**: Performance optimization and monitoring
- **When used**: Speed optimization, bundle size, monitoring
- **Autonomous**: Loops until performance targets met

## Command → Agent Routing

| Command | Routes To | Then Delegates To |
|---------|-----------|-------------------|
| `@feature-complete` | Orchestrator | All relevant specialists |
| `@agent-orchestrate` | Orchestrator | All relevant specialists |
| `@test-comprehensive` | Web Testing Specialist | (works directly) |
| `@health-check` | Performance Engineer | (works directly) |

## Proper Agent Delegation Pattern

### CORRECT Way (Orchestrator delegates):

```javascript
// Orchestrator receives feature request
async function orchestrateFeature(requirements) {
  // Delegates to specialists
  await Task({
    subagent_type: "convex-schema-manager",
    description: "Design schema",
    prompt: "Create user profile schema..."
  });
  
  await Task({
    subagent_type: "convex-function-generator",
    description: "Create backend",
    prompt: "Implement CRUD operations..."
  });
  
  await Task({
    subagent_type: "react-convex-builder",
    description: "Build UI",
    prompt: "Create profile components..."
  });
  
  await Task({
    subagent_type: "Web Testing Specialist",
    description: "Test feature",
    prompt: "Test profile functionality..."
  });
}
```

### INCORRECT Way (single agent tries everything):

```javascript
// ❌ WRONG - One agent shouldn't do everything
async function doEverything() {
  // Trying to handle schema, backend, frontend, testing
  // This leads to poor quality and no specialization
}
```

## Autonomous Loop Pattern

Every agent follows this pattern:

```typescript
async function autonomousAgentLoop() {
  while (iteration < maxIterations) {
    // 1. Try implementation
    const result = await implement();
    
    // 2. Validate
    const valid = await validate();
    
    // 3. If successful, exit
    if (valid) return SUCCESS;
    
    // 4. Otherwise, fix and retry
    await autoFix();
    iteration++;
  }
}
```

## Sequential Execution

The Orchestrator runs tasks sequentially to prevent memory issues:

```javascript
// Run tasks one at a time to avoid heap overflow
const schema = await Task({ subagent_type: "convex-schema-manager", ... });
const auth = await Task({ subagent_type: "convex-auth-specialist", ... });
const baseline = await Task({ subagent_type: "Performance Engineer", ... });
```

## Key Improvements Made

### 1. Fixed Duplicate Agent Issue
- **Before**: fullstack-feature-creator.md was a duplicate of orchestrator
- **After**: Distinct fullstack-feature-creator for individual features

### 2. Enabled Proper Delegation
- **Before**: Orchestrator tried to implement everything itself
- **After**: Orchestrator only coordinates, specialists implement

### 3. Corrected Agent Names
- **Before**: Inconsistent naming (kebab-case vs Title Case)
- **After**: Exact names that Task tool recognizes

### 4. Established Clear Roles
- **Before**: Overlapping responsibilities
- **After**: Each agent has distinct expertise

## Usage Examples

### Complex Feature (uses Orchestrator + multiple agents):
```
@feature-complete shopping-cart "Add to cart" "View cart" "Checkout" "Payment processing"
```

### Simple Feature (Orchestrator may delegate to fullstack-feature-creator):
```
@feature-complete notes "Basic CRUD for notes"
```

### Testing Only:
```
@test-comprehensive "Test the shopping cart feature"
```

### Performance Check:
```
@health-check "Analyze current performance metrics"
```

## Success Metrics

- ✅ All agents work in autonomous loops
- ✅ Orchestrator delegates 100% of implementation
- ✅ Specialist agents handle their domains
- ✅ Parallel execution when possible
- ✅ Every feature tested and optimized
- ✅ No single agent doing everything

## Files to Apply

To activate this improved system:

1. Replace `.claude/agents/orchestrator.md` with `orchestrator-final.md`
2. Replace `.claude/agents/fullstack-feature-creator.md` with `fullstack-feature-creator-final.md`
3. Replace `.claude/commands/feature-complete.md` with `feature-complete-fixed.md`
4. Replace `.claude/hooks/user-prompt-submit-hook` with `user-prompt-submit-hook-fixed`

This creates a properly orchestrated multi-agent system where each agent specializes in their domain and works autonomously until success.