# RevealCraft Project Settings

## Memory Management (Issue #1421 Workaround)

To prevent JavaScript heap out of memory crashes:

- **Maximum 2 concurrent tool calls** in a single message to reduce memory pressure
- **Break tasks into micro-steps** - implement one small feature at a time
- **Use incremental development** - complete each step fully before moving to next
- **Avoid large file processing** - read files in chunks or limit file sizes
- **Clear context frequently** - finish one area completely before starting another

## Task Management Strategy

- Use TodoWrite for sequential task tracking (not parallel execution)
- Complete each todo item fully before starting the next
- Prefer single file edits over multi-file changes
- Implement features incrementally with frequent testing
- If memory issues persist, restart the session and continue from last completed task

## VTT Implementation Approach

- Start with core schema updates
- Implement one VTT feature at a time (maps → tokens → lighting → fog of war)
- Test each feature individually before adding complexity
- Use small, focused commits for each completed feature
