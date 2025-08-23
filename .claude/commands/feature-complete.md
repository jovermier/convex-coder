---
name: "Feature Complete"
description: "Autonomously develop and validate a full-stack feature using the Orchestrator to coordinate specialist agents"
---

# Feature Complete Command

Triggers the Orchestrator agent to coordinate multiple specialist agents for complete autonomous full-stack feature development.

## Usage
```
@feature-complete <feature-name> [requirements...]
```

## Examples
```
@feature-complete user-dashboard "View profile" "Edit settings" "Activity history"
@feature-complete task-management "CRUD operations" "Real-time updates" "Task filtering"
@feature-complete file-upload "Upload files" "Progress tracking" "File preview"
```

## How It Works

The command delegates to the **Orchestrator** agent, which then:

1. **Analyzes Requirements** - Breaks down the feature into specialized tasks
2. **Delegates to Specialists** - Routes work to appropriate agents:
   - `Convex Schema Manager` - Database schema design
   - `Convex Function Generator` - Backend functions
   - `React Convex Builder` - React components
   - `Convex Auth Specialist` - Authentication (if needed)
   - `Fullstack Feature Creator` - Simple features (when appropriate)
3. **Coordinates Testing** - Uses `Web Testing Specialist` for validation
4. **Optimizes Performance** - Uses `Performance Engineer` for optimization
5. **Iterates Until Success** - Autonomous retry loops with fixes

## Agent Coordination Flow

```
User Request
    ↓
@feature-complete command
    ↓
Orchestrator Agent (coordinator)
    ├→ convex-schema-manager (schema)
    ├→ convex-function-generator (backend)
    ├→ react-convex-builder (frontend)
    ├→ convex-auth-specialist (auth if needed)
    ├→ Web Testing Specialist (testing)
    └→ Performance Engineer (optimization)
    
All agents work in parallel when possible,
with autonomous loops until success.
```

## Success Criteria

The feature is complete when:
- All specialist agents report success
- Web Testing Specialist validates everything works
- Performance Engineer confirms targets are met
- No regressions detected
- All requirements verified

## Key Difference from Direct Implementation

This command uses **orchestrated multi-agent collaboration** rather than a single agent trying to do everything. This ensures:
- Better specialization and quality
- Parallel execution for speed
- Comprehensive testing and optimization
- Proper separation of concerns

The Orchestrator never implements code directly - it only coordinates the specialist agents who are experts in their domains.