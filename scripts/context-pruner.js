#!/usr/bin/env node

/**
 * Context Pruner for Autonomous Agents
 * 
 * Prevents infinite context growth by intelligently summarizing and pruning
 * agent context files while preserving important information.
 */

const fs = require("fs").promises;
const path = require("path");

const CONTEXT_ROOT = path.join(__dirname, "../context");

// Files that should never be pruned (contain core knowledge)
const PROTECTED_FILES = [
  'core-knowledge.md',
  'dependencies.md' // Usually contains critical integration info
];

const MAX_ENTRIES = {
  "work-history.md": { sessions: 20, totalLines: 1000 },
  "commands-effective.md": { commands: 50, totalLines: 800 },
  "commands-problematic.md": { commands: 30, totalLines: 600 },
  "current-state.md": { updates: 10, totalLines: 500 },
  "todo-future.md": { todos: 100, totalLines: 400 }
};

class ContextPruner {
  constructor(agentName) {
    this.agentName = agentName;
    this.contextDir = path.join(CONTEXT_ROOT, agentName);
  }

  async pruneAllFiles() {
    console.log(`🧹 Pruning context for ${this.agentName}...`);
    
    // First, extract and preserve core knowledge before pruning
    try {
      const { KnowledgeManager } = require('./context-knowledge-manager.js');
      const knowledgeManager = new KnowledgeManager(this.agentName);
      await knowledgeManager.extractAndRefineKnowledge();
      console.log(`🧠 Core knowledge extracted and preserved`);
    } catch (error) {
      console.warn(`⚠️  Could not extract core knowledge: ${error.message}`);
    }
    
    for (const [fileName, limits] of Object.entries(MAX_ENTRIES)) {
      const filePath = path.join(this.contextDir, fileName);
      
      try {
        // Skip protected files
        if (PROTECTED_FILES.includes(fileName)) {
          console.log(`  🔒 Protected ${fileName} from pruning`);
          continue;
        }
        
        if (await this.fileExists(filePath)) {
          const pruned = await this.pruneFile(filePath, fileName, limits);
          if (pruned) {
            console.log(`  ✂️  Pruned ${fileName}`);
          }
        }
      } catch (error) {
        console.warn(`  ⚠️  Could not prune ${fileName}: ${error.message}`);
      }
    }
    
    console.log(`✅ Context pruning completed for ${this.agentName}`);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async pruneFile(filePath, fileName, limits) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check if pruning is needed
    if (lines.length <= limits.totalLines) {
      return false; // No pruning needed
    }
    
    console.log(`  📊 ${fileName}: ${lines.length} lines (limit: ${limits.totalLines})`);
    
    let prunedContent;
    
    switch (fileName) {
      case "work-history.md":
        prunedContent = await this.pruneWorkHistory(content, limits);
        break;
      case "commands-effective.md":
        prunedContent = await this.pruneCommands(content, limits, true);
        break;
      case "commands-problematic.md":
        prunedContent = await this.pruneCommands(content, limits, false);
        break;
      case "current-state.md":
        prunedContent = await this.pruneCurrentState(content, limits);
        break;
      case "todo-future.md":
        prunedContent = await this.pruneTodos(content, limits);
        break;
      default:
        return false;
    }
    
    if (prunedContent && prunedContent !== content) {
      // Backup original before pruning
      await fs.writeFile(`${filePath}.backup`, content);
      await fs.writeFile(filePath, prunedContent);
      return true;
    }
    
    return false;
  }

  async pruneWorkHistory(content, limits) {
    const lines = content.split('\n');
    const sections = this.extractSections(content, '### Session:');
    
    if (sections.length <= limits.sessions) {
      return content;
    }
    
    // Keep most recent sessions + create summary of older ones
    const recentSections = sections.slice(0, limits.sessions);
    const oldSections = sections.slice(limits.sessions);
    
    // Create summary of old sessions
    const summary = this.summarizeOldSessions(oldSections);
    
    // Reconstruct content
    const header = lines.slice(0, this.findLineIndex(lines, '### Session:')).join('\n');
    const recentContent = recentSections.join('\n\n');
    
    return `${header}\n\n${summary}\n\n${recentContent}`.trim();
  }

  async pruneCommands(content, limits, isEffective) {
    const lines = content.split('\n');
    const commands = this.extractCommands(content);
    
    if (commands.length <= limits.commands) {
      return content;
    }
    
    // Group similar commands and keep the most recent/frequent ones
    const groupedCommands = this.groupSimilarCommands(commands);
    const consolidatedCommands = this.consolidateCommands(groupedCommands, limits.commands);
    
    // Reconstruct file
    const header = this.extractHeader(content);
    const commandsSection = consolidatedCommands.map(cmd => cmd.content).join('\n\n');
    
    return `${header}\n\n${commandsSection}`;
  }

  async pruneCurrentState(content, limits) {
    const lines = content.split('\n');
    const updates = this.extractSections(content, '### Latest Update:');
    
    if (updates.length <= limits.updates) {
      return content;
    }
    
    // Keep most recent updates and create a consolidated state summary
    const recentUpdates = updates.slice(0, limits.updates);
    const oldUpdates = updates.slice(limits.updates);
    
    // Extract key insights from old updates
    const consolidatedInsights = this.extractKeyInsights(oldUpdates);
    
    // Reconstruct with consolidated insights
    const header = this.extractHeader(content);
    const insightsSection = consolidatedInsights.length > 0 
      ? `\n### Consolidated Insights\n${consolidatedInsights.join('\n')}\n`
      : '';
    const recentSection = recentUpdates.join('\n\n');
    
    return `${header}${insightsSection}\n${recentSection}`.trim();
  }

  async pruneTodos(content, limits) {
    const lines = content.split('\n');
    
    // Remove completed todos (marked with [x])
    const activeLines = lines.filter(line => {
      if (line.includes('- [x]')) return false; // Remove completed
      return true;
    });
    
    if (activeLines.length <= limits.totalLines) {
      return activeLines.join('\n');
    }
    
    // If still too long, prioritize by sections
    const sections = {
      immediate: [],
      medium: [],
      longterm: []
    };
    
    let currentSection = 'immediate';
    for (const line of activeLines) {
      if (line.includes('Immediate Priority')) currentSection = 'immediate';
      else if (line.includes('Medium Priority')) currentSection = 'medium';
      else if (line.includes('Long-term')) currentSection = 'longterm';
      
      sections[currentSection].push(line);
    }
    
    // Keep all immediate, limit others
    const prunedSections = {
      immediate: sections.immediate,
      medium: sections.medium.slice(0, 30),
      longterm: sections.longterm.slice(0, 20)
    };
    
    return Object.values(prunedSections).flat().join('\n');
  }

  // Helper methods
  extractSections(content, marker) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.startsWith(marker)) {
        if (inSection && currentSection.length > 0) {
          sections.push(currentSection.join('\n'));
        }
        currentSection = [line];
        inSection = true;
      } else if (inSection) {
        currentSection.push(line);
      }
    }
    
    if (inSection && currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }
    
    return sections;
  }

  extractCommands(content) {
    // Extract command blocks between ```bash and ```
    const commands = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let currentCommand = [];
    
    for (const line of lines) {
      if (line.includes('```bash') || line.includes('```')) {
        if (inCodeBlock) {
          if (currentCommand.length > 0) {
            commands.push({
              command: currentCommand.join('\n'),
              content: currentCommand.join('\n')
            });
          }
          currentCommand = [];
        }
        inCodeBlock = !inCodeBlock;
      } else if (inCodeBlock) {
        currentCommand.push(line);
      }
    }
    
    return commands;
  }

  groupSimilarCommands(commands) {
    const groups = new Map();
    
    for (const cmd of commands) {
      const key = this.getCommandKey(cmd.command);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(cmd);
    }
    
    return groups;
  }

  getCommandKey(command) {
    // Normalize command to group similar ones
    return command
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/--\w+=[^\s]*/g, '--option') // Normalize options
      .split(' ')[0]; // Get base command
  }

  consolidateCommands(groupedCommands, limit) {
    const consolidated = [];
    
    for (const [key, commands] of groupedCommands) {
      if (consolidated.length >= limit) break;
      
      // Take most recent example of each command type
      const recent = commands[commands.length - 1];
      consolidated.push(recent);
    }
    
    return consolidated.slice(0, limit);
  }

  extractHeader(content) {
    const lines = content.split('\n');
    const headerEnd = this.findLineIndex(lines, /^##[^#]|^###/);
    return lines.slice(0, headerEnd === -1 ? 5 : headerEnd).join('\n');
  }

  findLineIndex(lines, pattern) {
    for (let i = 0; i < lines.length; i++) {
      if (typeof pattern === 'string' && lines[i].includes(pattern)) {
        return i;
      } else if (pattern instanceof RegExp && pattern.test(lines[i])) {
        return i;
      }
    }
    return -1;
  }

  summarizeOldSessions(sessions) {
    const totalSessions = sessions.length;
    const tasks = sessions.map(s => this.extractTaskFromSession(s)).filter(Boolean);
    const uniqueTasks = [...new Set(tasks)];
    
    return `## Archived Sessions Summary
**Sessions Archived**: ${totalSessions}
**Key Tasks Worked On**: ${uniqueTasks.slice(0, 10).join(', ')}
**Archive Date**: ${new Date().toISOString().split('T')[0]}

*Older detailed session history has been archived to prevent context overflow.*`;
  }

  extractTaskFromSession(sessionContent) {
    const match = sessionContent.match(/\*\*Task\*\*:\s*([^\n]+)/);
    return match ? match[1].trim() : null;
  }

  extractKeyInsights(updates) {
    const insights = [];
    for (const update of updates) {
      // Extract key insights from old updates
      const lines = update.split('\n');
      for (const line of lines) {
        if (line.includes('Successfully') || 
            line.includes('Key insight') || 
            line.includes('Important') ||
            line.includes('Critical')) {
          insights.push(`- ${line.trim()}`);
        }
      }
    }
    return [...new Set(insights)].slice(0, 10); // Dedupe and limit
  }
}

// CLI interface
async function main() {
  const [,, action, agentName] = process.argv;
  
  if (action === 'prune') {
    if (agentName) {
      const pruner = new ContextPruner(agentName);
      await pruner.pruneAllFiles();
    } else {
      // Prune all agents
      const agents = ['orchestrator', 'convex-schema-manager', 'convex-function-generator', 
                     'react-convex-builder', 'convex-auth-specialist', 'fullstack-feature-creator', 
                     'web-testing-specialist', 'performance-engineer'];
      
      for (const agent of agents) {
        const pruner = new ContextPruner(agent);
        await pruner.pruneAllFiles();
      }
    }
  } else {
    console.log(`
Context Pruner Usage:

  Prune specific agent:
    node scripts/context-pruner.js prune <agent-name>

  Prune all agents:
    node scripts/context-pruner.js prune

This prevents infinite context growth by:
- Summarizing old work history
- Consolidating duplicate commands  
- Removing completed todos
- Limiting file sizes while preserving key insights
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ContextPruner };