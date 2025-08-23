# Agent Context Storage System

This directory contains persistent context for each autonomous agent, enabling them to learn from previous work and maintain continuity across sessions.

## Quick Start for Agents

### Initialize Your Context
```bash
# Initialize context for your agent (first time only)
node scripts/context-manager.js init <your-agent-name>

# Or initialize all agents at once
node scripts/context-manager.js init
```

### Session Workflow
```bash
# 1. Start session
./scripts/update-context.sh <agent-name> session-start "Working on task management testing"

# 2. Work and record discoveries
./scripts/update-context.sh <agent-name> add-effective-command "playwright test --ui"
./scripts/update-context.sh <agent-name> add-learning "Visual regression needs 0.2 threshold for font differences"

# 3. End session
./scripts/update-context.sh <agent-name> session-end
```

## Directory Structure

```
context/
├── README.md                           # This file
├── orchestrator/                       # Central coordination agent context
├── convex-schema-manager/              # Database schema management context
├── convex-function-generator/          # Query/mutation/action generation context  
├── react-convex-builder/               # React component creation context
├── convex-auth-specialist/             # Authentication & authorization context
├── fullstack-feature-creator/          # End-to-end feature development context
├── web-testing-specialist/             # Comprehensive testing context
└── performance-engineer/               # Performance optimization context
```

## Context File Structure (per agent)

Each agent directory contains:

```
agent-name/
├── current-state.md                    # Current project understanding and status
├── work-history.md                     # Previous work completed and lessons learned
├── commands-effective.md               # Commands that work well for this agent
├── commands-problematic.md             # Commands that have issues or limitations
├── patterns-successful.md              # Code patterns and approaches that work
├── patterns-avoid.md                   # Patterns to avoid based on experience
├── todo-future.md                      # Future work items and improvements needed
├── dependencies.md                     # Key dependencies and integrations
└── custom-processes.md                 # Agent-specific workflows beyond base capabilities
```

## Usage Guidelines

### For Agents

#### Session Management
```bash
# Start a new work session
./scripts/update-context.sh <agent-name> session-start "Brief description of task"

# End work session
./scripts/update-context.sh <agent-name> session-end
```

#### During Work
1. **Session Start**: Read current-state.md and work-history.md first
2. **Reference Context**: Check commands-effective.md and patterns-successful.md for proven approaches
3. **Problem Solving**: Review commands-problematic.md and patterns-avoid.md to avoid known issues
4. **Record Discoveries**: Log effective and problematic commands as you encounter them

#### Real-time Context Updates
```bash
# Record effective commands immediately when they work
./scripts/update-context.sh <agent-name> add-effective-command "npm run test:visual --update-snapshots"

# Record problematic commands when they fail
./scripts/update-context.sh <agent-name> add-problematic-command "playwright test --headed # causes CI failures"

# Update current understanding
./scripts/update-context.sh <agent-name> update-state "Successfully integrated Playwright MCP for visual regression"

# Add future work items
./scripts/update-context.sh <agent-name> add-todo "Implement cross-browser visual regression baselines"

# Record insights and lessons learned
./scripts/update-context.sh <agent-name> add-learning "Convex real-time updates require 5s timeout for network delays"
```

#### Context-Aware Decision Making
```typescript
// Example: Agent checks context before choosing approach
const context = await this.loadAgentContext();
const effectiveCommands = context.effectiveCommands;

if (effectiveCommands.includes('playwright test --ui')) {
  // Use UI mode for debugging based on previous success
  await this.runCommand('playwright test --ui');
} else {
  // Fall back to default approach
  await this.runCommand('playwright test');
}
```

### For Orchestrator
1. **Coordination**: Use dependency information for task assignment
2. **Quality Control**: Monitor context updates for completeness
3. **Optimization**: Identify cross-agent improvements from context patterns

### For Developers
1. **Debugging**: Review agent context to understand decision-making
2. **Improvement**: Add manual context when agents miss important details
3. **Monitoring**: Track context quality and update frequency

## Context Management Principles

### 1. **Continuous Learning**
- Agents update context after each significant task
- Record both successes and failures with detailed reasoning
- Track performance metrics and optimization opportunities

### 2. **Context Freshness**
- Current state is updated with every session
- Work history accumulates but prioritizes recent work
- Future todos are refined based on changing project needs

### 3. **Command Intelligence**
- Effective commands are documented with usage examples
- Problematic commands include workarounds or alternatives
- Context-specific command variations are recorded

### 4. **Pattern Recognition**
- Successful patterns include implementation details and rationale
- Anti-patterns document why certain approaches failed
- Patterns evolve based on project-specific learnings

### 5. **Cross-Agent Communication**
- Dependencies track which agents work together frequently
- Shared patterns and commands are cross-referenced
- Integration points are documented for better coordination

## Context Update Triggers

### Automatic Updates (Built into Agent Workflows)
- After completing any task (success or failure)
- When encountering new commands or patterns
- Upon discovering dependencies or integrations
- When performance metrics change significantly

### Manual Updates (Via Scripts)
- Project architecture changes
- New requirements or constraints
- External dependency updates
- Process improvements or optimizations

## Available Commands

### Context Manager (Full Control)
```bash
# Initialize agent context
node scripts/context-manager.js init <agent-name>

# Update specific context file
node scripts/context-manager.js update <agent-name> <file-name> <append|prepend|replace> <content>

# List available agents
node scripts/context-manager.js list
```

### Quick Updates (Convenience)
```bash
# Session management
./scripts/update-context.sh <agent-name> session-start <task>
./scripts/update-context.sh <agent-name> session-end

# Command tracking
./scripts/update-context.sh <agent-name> add-effective-command <command>
./scripts/update-context.sh <agent-name> add-problematic-command <command>

# State and learning
./scripts/update-context.sh <agent-name> update-state <update>
./scripts/update-context.sh <agent-name> add-learning <insight>

# Todo management  
./scripts/update-context.sh <agent-name> add-todo <item>
./scripts/update-context.sh <agent-name> mark-todo-done <item>
```

This context system ensures agents become increasingly effective and specialized for this specific project while maintaining their general capabilities.