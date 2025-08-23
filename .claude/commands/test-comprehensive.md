---
name: "Test Comprehensive"
description: "Execute comprehensive testing suite across all layers with autonomous issue detection and resolution"
---

# Test Comprehensive Command

Executes comprehensive testing validation across schema, functions, components, and user workflows with autonomous issue resolution.

## Usage
```
@test-comprehensive [--fix-issues] [--layer=<schema|functions|components|e2e|performance|all>]
```

## Examples
```
@test-comprehensive --fix-issues
@test-comprehensive --layer=components --fix-issues
@test-comprehensive --layer=performance
@test-comprehensive --layer=e2e
```

## Testing Layers

### Schema Layer Testing
- **Validation Tests**: Field types, constraints, and relationships
- **Index Efficiency**: Query performance with current indexes
- **Data Integrity**: Referential integrity and constraint validation
- **Migration Safety**: Schema change impact analysis

### Function Layer Testing
- **Unit Tests**: Individual function logic and edge cases
- **Integration Tests**: Function interactions and data flow
- **Authentication Tests**: Protected function access control
- **Performance Tests**: Response times and resource usage
- **Error Handling**: Proper error responses and recovery

### Component Layer Testing
- **Render Tests**: Component rendering with various props and states
- **Interaction Tests**: User interactions and event handling
- **Real-time Tests**: Convex subscription updates and state management
- **Accessibility Tests**: WCAG compliance and screen reader compatibility
- **Visual Regression Tests**: UI consistency and layout validation

### End-to-End Testing
- **User Journey Tests**: Complete workflows from start to finish
- **Authentication Flows**: Login, logout, and protected route access
- **CRUD Workflows**: Create, read, update, delete operations
- **Cross-browser Tests**: Chrome, Firefox, Safari compatibility
- **Mobile Responsiveness**: Touch interactions and viewport adaptation

### Performance Testing
- **Load Testing**: Concurrent user simulation and system limits
- **Stress Testing**: Breaking point identification and recovery
- **Bundle Analysis**: JavaScript bundle size and optimization
- **Query Performance**: Database query efficiency and optimization
- **Real-time Performance**: Subscription latency and update frequency

### Security Testing
- **Authentication Security**: Token validation and session management
- **Authorization Tests**: Role-based access control verification
- **Input Validation**: SQL injection and XSS protection
- **Data Privacy**: GDPR compliance and data handling verification

## Autonomous Issue Resolution

### Issue Detection Categories
```typescript
interface IssueCategory {
  BUILD_FAILURES: {
    typeErrors: TypeScript compilation errors;
    importErrors: Module resolution failures;
    configurationErrors: Build tool misconfigurations;
  };
  TEST_FAILURES: {
    unitTestFailures: Component and function test failures;
    integrationFailures: Cross-system integration issues;
    e2eFailures: User workflow test failures;
  };
  PERFORMANCE_ISSUES: {
    slowQueries: Database query performance problems;
    largeBundle: Bundle size exceeding thresholds;
    slowComponents: Component rendering performance issues;
  };
  ACCESSIBILITY_VIOLATIONS: {
    wcagViolations: WCAG compliance issues;
    keyboardNavigation: Keyboard accessibility problems;
    screenReader: Screen reader compatibility issues;
  };
  SECURITY_VULNERABILITIES: {
    authenticationIssues: Authentication flow problems;
    authorizationIssues: Access control violations;
    dataExposure: Unauthorized data access;
  };
}
```

### Autonomous Fix Generation
```typescript
const autonomousFixing = {
  // Type error resolution
  fixTypeErrors: async (errors: TypeScriptError[]) => {
    const fixes = [];
    for (const error of errors) {
      switch (error.code) {
        case 2304: // Cannot find name
          fixes.push(await generateImportFix(error));
          break;
        case 2339: // Property does not exist
          fixes.push(await generatePropertyFix(error));
          break;
        case 2345: // Argument type mismatch
          fixes.push(await generateTypeFix(error));
          break;
      }
    }
    return fixes;
  },
  
  // Performance optimization fixes
  fixPerformanceIssues: async (issues: PerformanceIssue[]) => {
    const fixes = [];
    for (const issue of issues) {
      switch (issue.type) {
        case 'SLOW_QUERY':
          fixes.push(await generateIndexOptimization(issue));
          break;
        case 'LARGE_COMPONENT':
          fixes.push(await generateComponentOptimization(issue));
          break;
        case 'BUNDLE_SIZE':
          fixes.push(await generateBundleOptimization(issue));
          break;
      }
    }
    return fixes;
  },
  
  // Accessibility fixes
  fixAccessibilityIssues: async (violations: AccessibilityViolation[]) => {
    const fixes = [];
    for (const violation of violations) {
      switch (violation.rule) {
        case 'color-contrast':
          fixes.push(await generateColorContrastFix(violation));
          break;
        case 'missing-alt-text':
          fixes.push(await generateAltTextFix(violation));
          break;
        case 'keyboard-navigation':
          fixes.push(await generateKeyboardNavigationFix(violation));
          break;
      }
    }
    return fixes;
  }
};
```

### Fix Application and Validation
```typescript
const fixApplication = {
  applyFixes: async (fixes: AutoFix[]) => {
    const results = [];
    for (const fix of fixes) {
      try {
        const result = await applyFix(fix);
        
        // Validate fix doesn't break anything
        const validation = await validateFix(fix, result);
        
        results.push({
          fix,
          applied: true,
          validation,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          fix,
          applied: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    return results;
  },
  
  rollbackFailedFixes: async (failedFixes: FailedFix[]) => {
    for (const failed of failedFixes) {
      await rollbackFix(failed.fix);
    }
  }
};
```

## Test Execution Flow

### Phase 1: Pre-test Setup
1. **Environment Preparation**: Test database setup and isolation
2. **Dependency Validation**: Ensure all dependencies are available
3. **Configuration Validation**: Verify test configuration correctness
4. **Baseline Capture**: Document current application state

### Phase 2: Layer-by-Layer Testing
1. **Schema Validation**: Database structure and optimization testing
2. **Function Testing**: API layer comprehensive validation
3. **Component Testing**: UI component and interaction testing
4. **Integration Testing**: Cross-layer compatibility verification
5. **End-to-End Testing**: Complete user workflow validation

### Phase 3: Issue Analysis and Resolution
1. **Issue Classification**: Categorize and prioritize detected issues
2. **Fix Generation**: Autonomous fix creation based on issue patterns
3. **Fix Application**: Apply fixes with safety validation
4. **Re-testing**: Validate fixes don't introduce regressions
5. **Rollback Handling**: Revert unsuccessful fixes

### Phase 4: Performance and Security Validation
1. **Performance Benchmarking**: Measure and validate performance metrics
2. **Security Scanning**: Validate security controls and data protection
3. **Accessibility Audit**: Ensure WCAG compliance and usability
4. **Cross-browser Verification**: Test compatibility across browsers

### Phase 5: Reporting and Monitoring
1. **Comprehensive Reporting**: Detailed test results and recommendations
2. **Regression Detection**: Identify performance or functionality regressions
3. **Monitoring Setup**: Configure ongoing monitoring and alerts
4. **Documentation Update**: Update test documentation and baselines

## Test Configuration

### Coverage Requirements
```typescript
const coverageThresholds = {
  statements: 85,
  branches: 80,
  functions: 85,
  lines: 85,
  // Convex-specific coverage
  schemaValidation: 100,
  functionAuthentication: 100,
  componentProps: 90
};
```

### Performance Thresholds
```typescript
const performanceThresholds = {
  database: {
    queryResponseTime: 200, // ms
    indexUsage: 0.95, // 95% of queries use indexes
  },
  functions: {
    responseTime: 500, // ms
    memoryUsage: 512, // MB
    errorRate: 0.001 // 0.1%
  },
  frontend: {
    firstContentfulPaint: 1500, // ms
    largestContentfulPaint: 2500, // ms
    bundleSize: 250 * 1024, // 250KB gzipped
    componentRenderTime: 16 // ms (60fps)
  },
  realtime: {
    subscriptionLatency: 100, // ms
    updatePropagation: 50 // ms
  }
};
```

### Accessibility Requirements
```typescript
const accessibilityRequirements = {
  wcagLevel: 'AA',
  colorContrast: 4.5, // minimum contrast ratio
  keyboardNavigation: true,
  screenReaderCompatibility: true,
  semanticHTML: true,
  ariaLabels: true
};
```

## Integration with Development Workflow

### Continuous Integration
- **Pre-commit**: Fast unit tests and linting
- **Pull Request**: Comprehensive testing with autonomous fixes
- **Main Branch**: Full validation suite with performance testing
- **Deployment**: Production readiness verification

### Test Reporting
- **Real-time Dashboard**: Live test results and progress
- **Issue Tracking**: Automatic issue creation and resolution tracking
- **Performance Trends**: Historical performance data and regression detection
- **Coverage Reports**: Code coverage across all layers with trend analysis

### Autonomous Escalation
```typescript
const escalationRules = {
  criticalFailures: {
    condition: 'Build failures or critical security vulnerabilities',
    action: 'Immediate notification and fix attempt',
    retries: 3
  },
  performanceRegressions: {
    condition: 'Performance degradation > 20%',
    action: 'Performance engineer assignment',
    retries: 2
  },
  testFailures: {
    condition: 'Test failure rate > 10%',
    action: 'Autonomous fixing with validation',
    retries: 5
  },
  accessibilityViolations: {
    condition: 'New accessibility violations introduced',
    action: 'Automatic fix generation and application',
    retries: 3
  }
};
```

This comprehensive testing system ensures full application validation while providing autonomous issue resolution to maintain development velocity and code quality.