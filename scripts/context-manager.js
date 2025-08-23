#!/usr/bin/env node

/**
 * Context Manager Script for Autonomous Agents
 *
 * This script helps agents initialize and manage their context directories
 * Usage: node scripts/context-manager.js <action> <agent-name> [options]
 */

const fs = require("fs").promises;
const path = require("path");

const CONTEXT_ROOT = path.join(__dirname, "../context");
const AGENT_NAMES = [
  "orchestrator",
  "convex-schema-manager",
  "convex-function-generator",
  "react-convex-builder",
  "convex-auth-specialist",
  "fullstack-feature-creator",
  "web-testing-specialist",
  "performance-engineer",
];

const CONTEXT_FILES = [
  "current-state.md",
  "work-history.md",
  "commands-effective.md",
  "commands-problematic.md",
  "patterns-successful.md",
  "patterns-avoid.md",
  "todo-future.md",
  "dependencies.md",
  "custom-processes.md",
  "core-knowledge.md",
];

const FILE_TEMPLATES = {
  "current-state.md": `# {AGENT_NAME} - Current State

## Project Understanding
**Last Updated**: {TIMESTAMP}

### Current Project Status
_Update this section each session with your understanding of the project state_

### Current Capabilities
_Document what you can currently do effectively_

### Active Work Items
_List what you're currently working on_

### Key Constraints
_Note any limitations or constraints affecting your work_

### Environment Context
_Document relevant environment details, dependencies, versions, etc._
`,

  "work-history.md": `# {AGENT_NAME} - Work History

## Recent Sessions
_Add new entries at the top for each work session_

### Session: {TIMESTAMP}
**Task**: _Brief description of what was worked on_

#### Accomplished
- _List completed items_

#### Lessons Learned
- _Key insights from this session_

#### Performance Metrics
- _Relevant metrics if applicable_

## Historical Context
_Longer-term context that provides background_
`,

  "commands-effective.md": `# {AGENT_NAME} - Effective Commands

## Command Categories
_Organize by the types of commands that work well_

### Example Category
\`\`\`bash
# Example effective command
command --option value
\`\`\`

**Usage Notes**: _Why this works well and when to use it_

_Add new effective commands as you discover them_
`,

  "commands-problematic.md": `# {AGENT_NAME} - Problematic Commands

## Known Issues and Workarounds
_Document commands that don't work well and alternatives_

### Issue: _Brief description_
\`\`\`bash
# PROBLEMATIC: Command that causes issues
problematic-command
\`\`\`

**Problem**: _What goes wrong_

**Workaround**:
\`\`\`bash
# BETTER: Alternative approach
better-command --option
\`\`\`

_Add new problematic patterns as you encounter them_
`,

  "patterns-successful.md": `# {AGENT_NAME} - Successful Patterns

## Code Patterns
_Document code patterns and approaches that work well_

### Pattern Name
\`\`\`typescript
// Example successful pattern
const example = () => {
  // Implementation
};
\`\`\`

**Why Effective**: _Explanation of why this pattern works well_

**When to Use**: _Circumstances where this pattern applies_

_Add new successful patterns as you develop them_
`,

  "patterns-avoid.md": `# {AGENT_NAME} - Patterns to Avoid

## Anti-Patterns
_Document patterns that cause problems_

### Anti-Pattern Name
\`\`\`typescript
// AVOID: Problematic pattern
const badExample = () => {
  // What not to do
};
\`\`\`

**Why Problematic**: _Explanation of issues this causes_

**Better Approach**:
\`\`\`typescript
// PREFER: Better alternative
const goodExample = () => {
  // Recommended approach
};
\`\`\`

_Add new anti-patterns as you discover them_
`,

  "todo-future.md": `# {AGENT_NAME} - Future Work Items

## Immediate Priority (Next Session)
- [ ] _High priority items for next work session_

## Medium Priority (Within 2-3 Sessions)
- [ ] _Important items for near future_

## Long-term Goals (Future Sprints)
- [ ] _Longer-term improvements and features_

## Dependencies and Blockers
- **External Dependencies**: _What you're waiting on from other agents_
- **Technical Blockers**: _Technical issues that need resolution_

## Success Metrics
- [ ] _How you'll measure success of future work_

_Keep this updated with your evolving understanding of needed work_
`,

  "dependencies.md": `# {AGENT_NAME} - Dependencies

## Agent Dependencies
_Other agents you work with frequently_

### Agent Name
**Relationship**: _How you work together_
**Integration Points**: _Specific areas of collaboration_
**Communication Needs**: _What information you need from them_

## Technical Dependencies
_Libraries, services, tools you depend on_

### Dependency Name
**Version**: _Current version you're using_
**Purpose**: _What you use it for_
**Constraints**: _Any limitations or requirements_

## Data Dependencies
_Files, databases, APIs you need access to_

_Update as your understanding of dependencies evolves_
`,

  "custom-processes.md": `# {AGENT_NAME} - Custom Processes

## Agent-Specific Workflows
_Processes beyond your base capabilities_

### Process Name
**When to Use**: _Circumstances that trigger this process_
**Steps**:
1. _Step one_
2. _Step two_
3. _etc._

**Expected Outcome**: _What this process achieves_

## Optimization Strategies
_Ways you've learned to work more effectively_

## Quality Checks
_Additional validation you perform beyond standard workflows_

_Document new processes as you develop them_
`,

  "core-knowledge.md": `# {AGENT_NAME} - Core Knowledge Base

## Overview
This file contains fundamentally important knowledge that should never be lost during context pruning. It's automatically maintained and refined based on importance scoring.

**Last Updated**: {TIMESTAMP}
**Status**: Automatically managed - do not edit manually

## Core Knowledge Categories

### Project Architecture
_Critical architectural decisions and technical stack information_

### Critical Constraints  
_Fundamental limitations and requirements that must always be respected_

### Proven Patterns
_Successful approaches and patterns that work well for this project_

### Anti-Patterns
_Approaches and patterns that should be avoided_

### Integration Points
_How this agent integrates with other agents and system components_

---

**Note**: This file is automatically populated by the Knowledge Manager based on patterns detected across all context files. It preserves the most important insights to ensure core understanding persists across sessions.

_Run \`npm run knowledge:extract {AGENT_NAME}\` to update this knowledge base._
`,
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function createContextFile(agentDir, fileName, agentName) {
  const filePath = path.join(agentDir, fileName);

  // Check if file already exists
  try {
    await fs.access(filePath);
    console.log(`  ⚠️  ${fileName} already exists, skipping`);
    return;
  } catch {
    // File doesn't exist, create it
  }

  const template = FILE_TEMPLATES[fileName];
  if (!template) {
    console.log(`  ❌ No template found for ${fileName}`);
    return;
  }

  const content = template
    .replace(/{AGENT_NAME}/g, agentName)
    .replace(/{TIMESTAMP}/g, new Date().toISOString().split("T")[0]);

  await fs.writeFile(filePath, content);
  console.log(`  ✅ Created ${fileName}`);
}

async function initializeAgent(agentName) {
  console.log(`\n🤖 Initializing context for: ${agentName}`);

  // Validate agent name
  if (!AGENT_NAMES.includes(agentName)) {
    console.log(
      `❌ Unknown agent name. Valid agents: ${AGENT_NAMES.join(", ")}`,
    );
    return;
  }

  // Create agent directory
  const agentDir = path.join(CONTEXT_ROOT, agentName);
  await ensureDirectoryExists(agentDir);
  console.log(`📁 Created directory: ${agentDir}`);

  // Create context files
  for (const fileName of CONTEXT_FILES) {
    await createContextFile(agentDir, fileName, agentName);
  }

  console.log(`✅ Agent context initialized: ${agentName}`);
}

async function initializeAllAgents() {
  console.log("🚀 Initializing context for all agents...");

  await ensureDirectoryExists(CONTEXT_ROOT);

  for (const agentName of AGENT_NAMES) {
    await initializeAgent(agentName);
  }

  console.log("\n🎉 All agent contexts initialized!");
}

async function updateContextFile(agentName, fileName, updateType, content) {
  const filePath = path.join(CONTEXT_ROOT, agentName, fileName);

  try {
    const existingContent = await fs.readFile(filePath, "utf8");
    let newContent;

    switch (updateType) {
      case "append":
        newContent = existingContent + "\n\n" + content;
        break;
      case "prepend":
        newContent = content + "\n\n" + existingContent;
        break;
      case "replace":
        newContent = content;
        break;
      default:
        console.log(`❌ Unknown update type: ${updateType}`);
        return;
    }

    await fs.writeFile(filePath, newContent);
    console.log(`✅ Updated ${agentName}/${fileName}`);
  } catch (error) {
    console.log(`❌ Error updating context: ${error.message}`);
  }
}

async function main() {
  const [, , action, agentName, ...args] = process.argv;

  switch (action) {
    case "init":
      if (agentName) {
        await initializeAgent(agentName);
      } else {
        await initializeAllAgents();
      }
      break;

    case "update": {
      const [fileName, updateType, ...contentArgs] = args;
      const content = contentArgs.join(" ");
      await updateContextFile(agentName, fileName, updateType, content);
      break;
    }

    case "list":
      console.log("Available agents:");
      AGENT_NAMES.forEach((name) => console.log(`  - ${name}`));
      break;

    default:
      console.log(`
Context Manager Usage:

  Initialize all agents:
    node scripts/context-manager.js init

  Initialize specific agent:
    node scripts/context-manager.js init <agent-name>

  Update context file:
    node scripts/context-manager.js update <agent-name> <file-name> <append|prepend|replace> <content>

  List available agents:
    node scripts/context-manager.js list

Available agents: ${AGENT_NAMES.join(", ")}
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeAgent,
  initializeAllAgents,
  updateContextFile,
  AGENT_NAMES,
  CONTEXT_FILES,
};
