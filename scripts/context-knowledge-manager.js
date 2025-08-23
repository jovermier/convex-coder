#!/usr/bin/env node

/**
 * Knowledge Manager for Agent Context
 *
 * Identifies, preserves, and AI-refines fundamentally important context
 * that should never be pruned or lost across sessions.
 */

const fs = require("fs").promises;
const path = require("path");

const CONTEXT_ROOT = path.join(__dirname, "../context");

// Knowledge categories that are fundamentally important
const KNOWLEDGE_CATEGORIES = {
  PROJECT_ARCHITECTURE: {
    weight: 10,
    keywords: [
      "architecture",
      "structure",
      "design pattern",
      "framework",
      "stack",
      "convex",
      "react",
    ],
    patterns: [
      /tech stack/i,
      /architecture/i,
      /key dependencies/i,
      /project structure/i,
    ],
  },
  CRITICAL_CONSTRAINTS: {
    weight: 9,
    keywords: [
      "constraint",
      "limitation",
      "requirement",
      "must",
      "cannot",
      "always",
      "never",
    ],
    patterns: [
      /must (not|never|always)/i,
      /critical/i,
      /breaking change/i,
      /backwards compatibility/i,
    ],
  },
  PROVEN_PATTERNS: {
    weight: 8,
    keywords: [
      "pattern",
      "best practice",
      "proven",
      "successful",
      "works well",
      "recommended",
    ],
    patterns: [
      /this (pattern|approach) works/i,
      /proven (pattern|approach)/i,
      /best practice/i,
    ],
  },
  ANTI_PATTERNS: {
    weight: 8,
    keywords: [
      "avoid",
      "never",
      "breaks",
      "causes issues",
      "problematic",
      "dangerous",
    ],
    patterns: [
      /(never|don't|avoid) (use|do)/i,
      /causes (problems|issues)/i,
      /breaks/i,
    ],
  },
  INTEGRATION_POINTS: {
    weight: 7,
    keywords: [
      "integration",
      "connects",
      "depends on",
      "works with",
      "requires",
    ],
    patterns: [
      /integrates with/i,
      /depends on/i,
      /requires.*agent/i,
      /works with/i,
    ],
  },
  PERFORMANCE_INSIGHTS: {
    weight: 6,
    keywords: [
      "performance",
      "optimization",
      "slow",
      "fast",
      "bottleneck",
      "efficient",
    ],
    patterns: [
      /performance (issue|improvement)/i,
      /(slow|fast) (query|render)/i,
      /optimization/i,
    ],
  },
  DEBUGGING_INSIGHTS: {
    weight: 6,
    keywords: [
      "debug",
      "troubleshoot",
      "error",
      "fix",
      "solution",
      "workaround",
    ],
    patterns: [/to (debug|fix|solve)/i, /error.*solution/i, /workaround/i],
  },
};

class KnowledgeManager {
  constructor(agentName) {
    this.agentName = agentName;
    this.contextDir = path.join(CONTEXT_ROOT, agentName);
    this.knowledgeFile = path.join(this.contextDir, "core-knowledge.md");
  }

  async extractAndRefineKnowledge() {
    console.log(`🧠 Extracting core knowledge for ${this.agentName}...`);

    try {
      // Read all context files
      const contextFiles = await this.readAllContextFiles();

      // Extract important knowledge items
      const knowledgeItems =
        await this.identifyImportantKnowledge(contextFiles);

      // Refine and categorize knowledge
      const refinedKnowledge = await this.refineKnowledge(knowledgeItems);

      // Update core knowledge file
      await this.updateCoreKnowledge(refinedKnowledge);

      console.log(`✅ Core knowledge updated for ${this.agentName}`);
      return refinedKnowledge;
    } catch (error) {
      console.error(
        `❌ Error extracting knowledge for ${this.agentName}:`,
        error.message
      );
      return null;
    }
  }

  async readAllContextFiles() {
    const contextFiles = {};
    const fileNames = [
      "current-state.md",
      "work-history.md",
      "commands-effective.md",
      "commands-problematic.md",
      "patterns-successful.md",
      "patterns-avoid.md",
      "dependencies.md",
      "custom-processes.md",
    ];

    for (const fileName of fileNames) {
      const filePath = path.join(this.contextDir, fileName);
      try {
        contextFiles[fileName] = await fs.readFile(filePath, "utf8");
      } catch {
        contextFiles[fileName] = "";
      }
    }

    return contextFiles;
  }

  async identifyImportantKnowledge(contextFiles) {
    const knowledgeItems = [];

    for (const [fileName, content] of Object.entries(contextFiles)) {
      if (!content) continue;

      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("#")) continue;

        const importance = this.calculateImportanceScore(line, lines, i);

        if (importance.score >= 5) {
          // Threshold for "important"
          knowledgeItems.push({
            content: line,
            context: this.getContextAround(lines, i, 2),
            source: fileName,
            importance: importance.score,
            categories: importance.categories,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return knowledgeItems.sort((a, b) => b.importance - a.importance);
  }

  calculateImportanceScore(line, lines, lineIndex) {
    let score = 0;
    const categories = [];

    for (const [category, config] of Object.entries(KNOWLEDGE_CATEGORIES)) {
      let categoryScore = 0;

      // Check keywords
      for (const keyword of config.keywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          categoryScore += 1;
        }
      }

      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(line)) {
          categoryScore += 2;
        }
      }

      if (categoryScore > 0) {
        categories.push(category);
        score += categoryScore * (config.weight / 10);
      }
    }

    // Boost score for certain contexts
    const context = this.getContextAround(lines, lineIndex, 1);
    if (this.isInImportantSection(context)) {
      score *= 1.5;
    }

    // Boost for length (more detailed items are often more important)
    if (line.length > 100) {
      score += 1;
    }

    // Boost for code examples
    if (line.includes("```") || line.includes("`")) {
      score += 1;
    }

    return { score, categories };
  }

  getContextAround(lines, centerIndex, radius) {
    const start = Math.max(0, centerIndex - radius);
    const end = Math.min(lines.length, centerIndex + radius + 1);
    return lines.slice(start, end).join("\n");
  }

  isInImportantSection(context) {
    const importantSections = [
      /key constraints/i,
      /critical/i,
      /important/i,
      /architecture/i,
      /core concept/i,
      /fundamental/i,
      /essential/i,
      /never.*always/i,
    ];

    return importantSections.some((pattern) => pattern.test(context));
  }

  async refineKnowledge(knowledgeItems) {
    console.log(`🔍 Refining ${knowledgeItems.length} knowledge items...`);

    // Group similar knowledge items
    const grouped = this.groupSimilarKnowledge(knowledgeItems);

    // Consolidate each group
    const refined = {};

    for (const [category, items] of Object.entries(grouped)) {
      refined[category] = await this.consolidateKnowledgeGroup(items, category);
    }

    return refined;
  }

  groupSimilarKnowledge(items) {
    const groups = {};

    for (const item of items) {
      for (const category of item.categories) {
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
      }
    }

    return groups;
  }

  async consolidateKnowledgeGroup(items, category) {
    // Remove duplicates and consolidate similar items
    const unique = this.removeDuplicateKnowledge(items);

    // Sort by importance
    unique.sort((a, b) => b.importance - a.importance);

    // Take top items for this category
    const topItems = unique.slice(0, 10);

    return {
      category,
      description: this.getCategoryDescription(category),
      items: topItems.map((item) => ({
        knowledge: item.content,
        importance: Math.round(item.importance * 10) / 10,
        source: item.source,
        lastUpdated: item.timestamp,
      })),
      lastRefined: new Date().toISOString(),
    };
  }

  removeDuplicateKnowledge(items) {
    const seen = new Set();
    const unique = [];

    for (const item of items) {
      const normalized = this.normalizeKnowledge(item.content);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(item);
      }
    }

    return unique;
  }

  normalizeKnowledge(content) {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  getCategoryDescription(category) {
    const descriptions = {
      PROJECT_ARCHITECTURE:
        "Core architectural decisions and technical stack choices that define the project structure",
      CRITICAL_CONSTRAINTS:
        "Fundamental limitations and requirements that must always be respected",
      PROVEN_PATTERNS:
        "Successful approaches and patterns that work well for this project",
      ANTI_PATTERNS:
        "Approaches and patterns that should be avoided as they cause problems",
      INTEGRATION_POINTS:
        "How this agent integrates with other agents and system components",
      PERFORMANCE_INSIGHTS:
        "Key performance characteristics and optimization strategies",
      DEBUGGING_INSIGHTS:
        "Common issues and their solutions for troubleshooting",
    };

    return descriptions[category] || "Important knowledge for this category";
  }

  async updateCoreKnowledge(refinedKnowledge) {
    const content = this.generateKnowledgeFile(refinedKnowledge);
    await fs.writeFile(this.knowledgeFile, content);
    console.log(`📝 Core knowledge file updated: ${this.knowledgeFile}`);
  }

  generateKnowledgeFile(refinedKnowledge) {
    let content = `# ${this.agentName} - Core Knowledge Base

## Overview
This file contains fundamentally important knowledge that should never be lost during context pruning. It's automatically refined and updated based on patterns detected across all context files.

**Last Refined**: ${new Date().toISOString().split("T")[0]}
**Knowledge Categories**: ${Object.keys(refinedKnowledge).length}

---

`;

    for (const [category, data] of Object.entries(refinedKnowledge)) {
      if (data.items.length === 0) continue;

      content += `## ${category
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase())}

**Description**: ${data.description}
**Items**: ${data.items.length}
**Last Updated**: ${data.lastRefined.split("T")[0]}

`;

      for (const item of data.items) {
        content += `### Knowledge Item (Importance: ${item.importance})
**Source**: ${item.source}
**Content**: ${item.knowledge}

`;
      }

      content += "---\n\n";
    }

    content += `## Knowledge Refinement Process

This knowledge base is automatically maintained by:
1. **Extraction**: Scanning all context files for high-importance content
2. **Scoring**: Using weighted criteria to identify critical knowledge
3. **Categorization**: Grouping knowledge by type and purpose
4. **Consolidation**: Removing duplicates and ranking by importance
5. **Refinement**: Regular updates to keep knowledge current and relevant

**Protection**: This file is protected from automatic pruning and maintains the agent's core understanding across all sessions.
`;

    return content;
  }

  async loadCoreKnowledge() {
    try {
      const content = await fs.readFile(this.knowledgeFile, "utf8");
      return this.parseCoreKnowledge(content);
    } catch {
      return null; // No core knowledge file exists yet
    }
  }

  parseCoreKnowledge(content) {
    // Parse the knowledge file to extract structured knowledge
    const knowledge = {};
    const sections = content.split("## ").slice(1); // Skip overview

    for (const section of sections) {
      const lines = section.split("\n");
      const category = lines[0].trim().toUpperCase().replace(/\s+/g, "_");

      if (category === "KNOWLEDGE_REFINEMENT_PROCESS") continue;

      const items = [];
      let currentItem = null;

      for (const line of lines) {
        if (line.startsWith("### Knowledge Item")) {
          if (currentItem) items.push(currentItem);
          currentItem = { importance: 0, source: "", content: "" };

          const importanceMatch = line.match(/Importance: ([\d.]+)/);
          if (importanceMatch) {
            currentItem.importance = parseFloat(importanceMatch[1]);
          }
        } else if (line.startsWith("**Source**:")) {
          if (currentItem) {
            currentItem.source = line.replace("**Source**:", "").trim();
          }
        } else if (line.startsWith("**Content**:")) {
          if (currentItem) {
            currentItem.content = line.replace("**Content**:", "").trim();
          }
        }
      }

      if (currentItem) items.push(currentItem);
      knowledge[category] = items;
    }

    return knowledge;
  }
}

// CLI interface
async function main() {
  const [, , action, agentName] = process.argv;

  switch (action) {
    case "extract":
      if (agentName) {
        const manager = new KnowledgeManager(agentName);
        await manager.extractAndRefineKnowledge();
      } else {
        console.log(
          "Usage: node scripts/context-knowledge-manager.js extract <agent-name>"
        );
      }
      break;

    case "extract-all": {
      const agents = [
        "orchestrator",
        "convex-schema-manager",
        "convex-function-generator",
        "react-convex-builder",
        "convex-auth-specialist",
        "fullstack-feature-creator",
        "web-testing-specialist",
        "performance-engineer",
      ];

      for (const agent of agents) {
        const manager = new KnowledgeManager(agent);
        await manager.extractAndRefineKnowledge();
      }
      break;
    }

    case "load":
      if (agentName) {
        const manager = new KnowledgeManager(agentName);
        const knowledge = await manager.loadCoreKnowledge();
        console.log(JSON.stringify(knowledge, null, 2));
      } else {
        console.log(
          "Usage: node scripts/context-knowledge-manager.js load <agent-name>"
        );
      }
      break;

    default:
      console.log(`
Core Knowledge Manager Usage:

  Extract and refine knowledge for specific agent:
    node scripts/context-knowledge-manager.js extract <agent-name>

  Extract knowledge for all agents:
    node scripts/context-knowledge-manager.js extract-all

  Load core knowledge for agent:
    node scripts/context-knowledge-manager.js load <agent-name>

This system:
- Automatically identifies fundamentally important knowledge
- Categorizes knowledge by type and importance
- Protects critical information from being pruned
- Refines knowledge over time to stay current
- Enables agents to maintain core understanding across sessions
`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { KnowledgeManager };
