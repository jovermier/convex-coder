---
name: "Feature Complete"
description: "Autonomously develop and validate a full-stack feature until fully working, tested, and verified"
---

# Feature Complete Command

Orchestrates complete autonomous full-stack feature development with comprehensive validation for Convex applications.

## Usage
```
@feature-complete <feature-name> [requirements...]
```

## Examples
```
@feature-complete user-dashboard "Users can view their profile" "Dashboard shows user activity" "Settings are editable"
@feature-complete task-management "Create, edit, delete tasks" "Real-time updates" "Task filtering and search"
@feature-complete file-upload "Users can upload files" "Files are stored securely" "Download and preview available"
@feature-complete auth-system "OAuth login with Google/GitHub" "User roles and permissions" "Protected routes work"
```

## Process
1. **Baseline Capture**: Application state and functional documentation
2. **Implementation**: Autonomous task breakdown and execution across full stack
3. **Comprehensive Testing**: 6-phase validation system
4. **Functional Verification**: Before/after feature comparison
5. **Autonomous Retry**: Up to 5 retry attempts with self-healing
6. **Final Verification**: Complete requirement validation

## Validation Phases
- **Functional**: Requirement verification and user workflow validation
- **Integration**: Schema, functions, and components work together seamlessly  
- **Performance**: Page load times, query performance, bundle size
- **Type Safety**: No TypeScript errors across the stack
- **Accessibility**: WCAG compliance and usability standards
- **Cross-Browser**: Chrome, Firefox, Safari compatibility

## Success Criteria
- All requirements met and verified
- No functional regressions detected
- Performance within acceptable limits (< 3s page loads, < 500ms queries)
- All tests passing (unit, integration, e2e)
- TypeScript compilation successful with no errors
- Documentation and types updated

## Full-Stack Orchestration

### Schema Layer
- Database schema design and validation
- Proper indexing for query performance
- Migration scripts and data consistency

### Function Layer  
- Type-safe queries and mutations
- Proper authentication and authorization
- Error handling and validation
- Performance optimization

### Component Layer
- React components with real-time updates
- Proper loading and error states
- Responsive design and accessibility
- Form handling and user feedback

### Integration Layer
- End-to-end feature workflows
- Cross-component communication
- Data flow validation
- User experience testing

## Agent-Level Autonomous Flow

The Orchestrator agent handles all autonomous implementation logic including:
- Epic breakdown and task coordination
- Specialist agent assignment and validation
- Continuous integration testing
- Autonomous retry mechanisms with self-healing
- Comprehensive validation loops until success

All autonomous behavior is managed by the individual agents rather than command-level orchestration.

## Integration Points

### With Convex
- Automatic schema generation and validation
- Real-time query and mutation testing
- Authentication flow validation
- File upload and storage testing

### With React
- Component lifecycle validation
- Hook usage verification
- State management testing
- Event handling validation

### With TypeScript
- End-to-end type safety verification
- Generated type validation
- Interface consistency checking
- Generic type resolution

## Success Tracking

All monitoring and metrics are handled by the specialist agents:
- **Performance Engineer**: Bundle size, query performance, memory usage
- **Web Testing Specialist**: Test coverage, quality metrics, accessibility
- **Orchestrator**: Overall feature completion, user experience validation

Commands focus on triggering agent workflows rather than implementing monitoring logic.