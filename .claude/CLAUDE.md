# RevealCraft Project Settings

## Test-Driven Development (TDD) Requirements

**MANDATORY**: Before completing ANY work, you MUST ensure ALL of the following quality checks pass:

### 1. Testing (Primary Focus)
- **Write tests FIRST** before implementing features
- Run tests frequently during development (not just at the end)
- Run `npm test` or `npm run test` for unit tests
- Run e2e tests if available (check package.json for e2e scripts)
- ALL tests must pass - no exceptions
- Add unit tests for all new functions and components
- Add integration/e2e tests for user-facing features

### 2. Type Checking
- Run `npm run typecheck` (or equivalent TypeScript check)
- Fix ALL TypeScript errors and warnings
- Ensure proper typing for all new code

### 3. Linting
- Run `npm run lint` (or equivalent ESLint check)
- Fix ALL linting errors and warnings
- Follow established code style patterns

### 4. Code Formatting
- Run `npm run format` (or equivalent Prettier check)
- Ensure consistent code formatting across the project

### 5. Build Verification
- Run build command to ensure production readiness
- Verify no build errors or warnings

**FAILURE POLICY**: If any check fails, DO NOT mark task as complete. Fix all issues and re-run checks.

## Parallel Processing Strategy

### Smart Parallelization for Better Performance
- **Run independent tasks in parallel** - Tasks without dependencies can execute simultaneously
- **Sequential for dependent tasks** - Tasks that depend on each other must run in order
- **Batch parallel operations** - Process multiple similar items in parallel batches
- **Memory-aware parallelization** - Heavy operations (E2E tests, browser tests) run separately

### Parallel Execution Patterns
- **Phase-based parallelization**: Group independent tasks by phase
  - Phase 1: All setup tasks (schema, auth, baseline) - run in parallel
  - Phase 2: Backend implementation (depends on Phase 1) - run after
  - Phase 3: Frontend implementation (depends on Phase 2) - run after
  - Phase 4: Testing & optimization - can run in parallel

### When to Use Parallel Processing
- **File operations**: Read/write multiple independent files simultaneously
- **Test execution**: Run unit and integration tests in parallel
- **Analysis tasks**: Analyze different aspects of code simultaneously
- **Independent API calls**: Make multiple unrelated API requests together
- **Validation checks**: Run multiple validation rules in parallel

### When to Avoid Parallel Processing
- **Memory-intensive operations**: Browser automation, large file processing
- **Dependent operations**: Tasks that need results from previous tasks
- **Resource-limited scenarios**: When system resources are constrained
- **Ordered operations**: When sequence matters for correctness

## Task Management Strategy

- Use TodoWrite for task tracking and organization
- Execute independent tasks in parallel for better performance
- Maintain sequential execution for dependent tasks
- Batch similar operations when possible
- Monitor memory usage and adjust parallelization accordingly

## TDD Development Workflow
1. **Start with tests**: Write failing tests for the feature/fix
2. **Implement**: Write minimal code to make tests pass
3. **Refactor**: Clean up code while keeping tests passing
4. **Quality gate**: Run ALL checks (tests, typecheck, lint, format, build)
5. **Verify**: Only complete when ALL quality gates pass

## VTT Implementation Approach

- Start with core schema updates
- Implement one VTT feature at a time (maps → tokens → lighting → fog of war)
- Test each feature individually before adding complexity
- Use small, focused commits for each completed feature
