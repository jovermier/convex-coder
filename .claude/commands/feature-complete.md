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

## Autonomous Implementation Flow

```typescript
async function executeFeatureComplete(featureName: string, requirements: string[]) {
  // Phase 1: Planning and Architecture
  const plan = await orchestrator.planFullStackFeature(featureName, requirements);
  
  // Phase 2: Schema Design
  const schema = await schemaManager.designSchema(plan.dataRequirements);
  
  // Phase 3: Backend Functions
  const functions = await functionGenerator.createFunctions(schema, plan.apiRequirements);
  
  // Phase 4: Frontend Components
  const components = await reactBuilder.createComponents(functions, plan.uiRequirements);
  
  // Phase 5: Integration and Testing
  const validation = await testingAgent.validateFullFeature(featureName, requirements);
  
  // Phase 6: Autonomous Retry if Issues Found
  if (!validation.passed) {
    return await orchestrator.autonomousRetry(featureName, validation.issues);
  }
  
  return { status: 'COMPLETED', validation };
}
```

## Retry and Self-Healing

### Issue Detection
- Build/compilation failures
- TypeScript type errors
- Test failures (unit, integration, e2e)
- Performance regressions
- Accessibility violations
- Runtime errors

### Automatic Fixes
- Import resolution and dependency updates
- Type annotation corrections
- Query optimization suggestions
- Component prop fixes
- CSS and styling adjustments
- Error boundary implementations

### Escalation Rules
- **Build failures**: Auto-retry with dependency analysis
- **Type errors**: Progressive type fixing with incremental validation
- **Test failures**: Test-driven debugging with targeted fixes
- **Performance issues**: Query optimization and bundle analysis
- **Multiple failures**: Revert and retry with alternative approach
- **Max retries exceeded**: Human escalation with detailed analysis

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

## Monitoring and Metrics

### Performance Tracking
- Bundle size monitoring
- Query performance measurement
- Page load time analysis
- Memory usage tracking

### Quality Metrics
- Test coverage reporting
- Type coverage analysis
- Accessibility score tracking
- Code quality metrics

### User Experience
- Feature adoption tracking
- Error rate monitoring
- Performance impact analysis
- User feedback integration