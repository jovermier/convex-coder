#!/bin/bash

# Quick context update utility for agents
# Usage: ./scripts/update-context.sh <agent-name> <action> <content>

set -e

AGENT_NAME="$1"
ACTION="$2"
shift 2
CONTENT="$*"

CONTEXT_DIR="./context/${AGENT_NAME}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure agent context exists
if [ ! -d "$CONTEXT_DIR" ]; then
    echo "🔧 Initializing context for $AGENT_NAME..."
    node scripts/context-manager.js init "$AGENT_NAME"
fi

case "$ACTION" in
    "session-start")
        echo "📝 Starting new session for $AGENT_NAME"
        echo "" >> "$CONTEXT_DIR/work-history.md"
        echo "### Session: $(date '+%Y-%m-%d')" >> "$CONTEXT_DIR/work-history.md"
        echo "**Started**: $TIMESTAMP" >> "$CONTEXT_DIR/work-history.md"
        echo "**Task**: $CONTENT" >> "$CONTEXT_DIR/work-history.md"
        echo "" >> "$CONTEXT_DIR/work-history.md"
        ;;
    
    "session-end")
        echo "✅ Ending session for $AGENT_NAME"
        echo "**Completed**: $TIMESTAMP" >> "$CONTEXT_DIR/work-history.md"
        echo "" >> "$CONTEXT_DIR/work-history.md"
        ;;
        
    "add-effective-command")
        echo "✅ Adding effective command for $AGENT_NAME"
        echo "" >> "$CONTEXT_DIR/commands-effective.md"
        echo "### Command: $(date '+%Y-%m-%d')" >> "$CONTEXT_DIR/commands-effective.md"
        echo "\`\`\`bash" >> "$CONTEXT_DIR/commands-effective.md"
        echo "$CONTENT" >> "$CONTEXT_DIR/commands-effective.md"
        echo "\`\`\`" >> "$CONTEXT_DIR/commands-effective.md"
        echo "**Usage Notes**: _Added automatically during session_" >> "$CONTEXT_DIR/commands-effective.md"
        echo "" >> "$CONTEXT_DIR/commands-effective.md"
        ;;
        
    "add-problematic-command")
        echo "⚠️  Adding problematic command for $AGENT_NAME"
        echo "" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "### Issue: $(date '+%Y-%m-%d')" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "\`\`\`bash" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "# PROBLEMATIC:" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "$CONTENT" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "\`\`\`" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "**Problem**: _Encountered during session, needs investigation_" >> "$CONTEXT_DIR/commands-problematic.md"
        echo "" >> "$CONTEXT_DIR/commands-problematic.md"
        ;;
        
    "update-state")
        echo "🔄 Updating current state for $AGENT_NAME"
        # Backup current state
        cp "$CONTEXT_DIR/current-state.md" "$CONTEXT_DIR/current-state.md.bak"
        # Update timestamp in current state
        sed -i "s/\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: $TIMESTAMP/" "$CONTEXT_DIR/current-state.md"
        # Add update note
        echo "" >> "$CONTEXT_DIR/current-state.md"
        echo "### Latest Update: $(date '+%Y-%m-%d')" >> "$CONTEXT_DIR/current-state.md"
        echo "$CONTENT" >> "$CONTEXT_DIR/current-state.md"
        echo "" >> "$CONTEXT_DIR/current-state.md"
        ;;
        
    "add-todo")
        echo "📋 Adding todo item for $AGENT_NAME"
        echo "- [ ] $CONTENT (Added: $(date '+%Y-%m-%d'))" >> "$CONTEXT_DIR/todo-future.md"
        ;;
        
    "mark-todo-done")
        echo "✅ Marking todo as done for $AGENT_NAME"
        # This is a simple approach - in practice, agents might need more sophisticated todo management
        sed -i "s/- \[ \] $CONTENT/- [x] $CONTENT (Completed: $(date '+%Y-%m-%d'))/" "$CONTEXT_DIR/todo-future.md"
        ;;
        
    "add-learning")
        echo "🧠 Adding learning for $AGENT_NAME"
        echo "" >> "$CONTEXT_DIR/work-history.md"
        echo "#### Lesson Learned ($(date '+%Y-%m-%d')):" >> "$CONTEXT_DIR/work-history.md"
        echo "$CONTENT" >> "$CONTEXT_DIR/work-history.md"
        echo "" >> "$CONTEXT_DIR/work-history.md"
        ;;
        
    *)
        echo "Usage: ./scripts/update-context.sh <agent-name> <action> <content>"
        echo ""
        echo "Available actions:"
        echo "  session-start <task-description>     - Start a new work session"
        echo "  session-end                         - End current work session"
        echo "  add-effective-command <command>     - Record a command that worked well"
        echo "  add-problematic-command <command>   - Record a command that had issues"
        echo "  update-state <status-update>        - Update current project understanding"
        echo "  add-todo <todo-item>               - Add a future work item"
        echo "  mark-todo-done <todo-item>         - Mark a todo as completed"
        echo "  add-learning <insight>             - Record a lesson learned"
        echo ""
        echo "Example:"
        echo "  ./scripts/update-context.sh web-testing-specialist session-start 'Testing task management features'"
        echo "  ./scripts/update-context.sh web-testing-specialist add-effective-command 'playwright test --ui'"
        exit 1
        ;;
esac

echo "📁 Context updated in: $CONTEXT_DIR"