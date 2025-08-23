---
name: "Health Check"
description: "Comprehensive system health diagnostics and autonomous issue resolution for Convex applications"
---

# Health Check Command

Performs comprehensive system health diagnostics across all layers of the Convex application with autonomous issue detection and resolution.

## Usage
```
@health-check [--deep] [--auto-fix] [--layer=<all|schema|functions|frontend|infrastructure>]
```

## Examples
```
@health-check --deep --auto-fix
@health-check --layer=schema --auto-fix
@health-check --layer=infrastructure
@health-check --deep
```

## Health Check Layers

### Application Health
- **Build Status**: Compilation success and dependency resolution
- **Type Safety**: TypeScript compilation without errors or warnings
- **Function Availability**: All Convex functions responding correctly
- **Database Connectivity**: Schema validation and query execution
- **Authentication Status**: OAuth providers and user session management
- **Real-time Connectivity**: WebSocket connections and subscription health

### Performance Health
- **Query Performance**: Database query response times and optimization
- **Bundle Performance**: JavaScript bundle size and loading times
- **Memory Usage**: Application memory consumption and leak detection
- **CPU Utilization**: Processing efficiency and resource usage
- **Network Performance**: API response times and bandwidth usage
- **Real-time Performance**: Subscription latency and update propagation

### Security Health
- **Authentication Security**: Token validation and session management
- **Authorization Controls**: Role-based access control verification
- **Data Protection**: Encryption and privacy compliance
- **Vulnerability Scanning**: Dependency security audit
- **Input Validation**: Protection against injection attacks
- **HTTPS Configuration**: SSL/TLS certificate and configuration validation

### Infrastructure Health
- **CDN Performance**: Content delivery network status and cache hit rates
- **Database Health**: Connection pool status and query performance
- **Storage Systems**: File storage availability and performance
- **Monitoring Systems**: Health check endpoints and alerting status
- **Backup Systems**: Data backup integrity and recovery procedures

## Diagnostic Categories

### Build and Dependency Health
```typescript
interface BuildHealthCheck {
  compilation: {
    typescript: CompilationStatus;
    bundling: BundleStatus;
    dependencies: DependencyStatus;
  };
  configuration: {
    convexConfig: ConfigurationStatus;
    environmentVariables: EnvironmentStatus;
    buildTools: BuildToolStatus;
  };
  codeQuality: {
    linting: LintingStatus;
    formatting: FormattingStatus;
    typecheck: TypeCheckStatus;
  };
}

const buildDiagnostics = {
  checkCompilation: async () => {
    const results = [];
    
    // TypeScript compilation
    const tsResult = await runTypeScriptCheck();
    results.push({
      check: 'TypeScript Compilation',
      status: tsResult.success ? 'HEALTHY' : 'UNHEALTHY',
      details: tsResult.errors || 'No errors',
      severity: tsResult.errors?.length > 0 ? 'HIGH' : 'NONE'
    });
    
    // Bundle build
    const bundleResult = await runBundleBuild();
    results.push({
      check: 'Bundle Build',
      status: bundleResult.success ? 'HEALTHY' : 'UNHEALTHY',
      details: bundleResult.size ? `Bundle size: ${bundleResult.size}KB` : bundleResult.error,
      severity: bundleResult.size > 500 ? 'MEDIUM' : 'NONE'
    });
    
    // Dependency audit
    const depResult = await auditDependencies();
    results.push({
      check: 'Dependency Security',
      status: depResult.vulnerabilities === 0 ? 'HEALTHY' : 'UNHEALTHY',
      details: `${depResult.vulnerabilities} vulnerabilities found`,
      severity: depResult.criticalVulnerabilities > 0 ? 'CRITICAL' : 'LOW'
    });
    
    return results;
  }
};
```

### Database and Schema Health
```typescript
const databaseDiagnostics = {
  checkSchemaHealth: async () => {
    const results = [];
    
    // Schema validation
    const schemaResult = await validateConvexSchema();
    results.push({
      check: 'Schema Validation',
      status: schemaResult.valid ? 'HEALTHY' : 'UNHEALTHY',
      details: schemaResult.errors || 'Schema is valid',
      severity: schemaResult.errors?.length > 0 ? 'HIGH' : 'NONE'
    });
    
    // Index efficiency
    const indexResult = await analyzeIndexUsage();
    results.push({
      check: 'Index Efficiency',
      status: indexResult.efficiency > 0.8 ? 'HEALTHY' : 'DEGRADED',
      details: `Index usage: ${Math.round(indexResult.efficiency * 100)}%`,
      severity: indexResult.efficiency < 0.5 ? 'HIGH' : 'MEDIUM'
    });
    
    // Query performance
    const queryResult = await analyzeQueryPerformance();
    results.push({
      check: 'Query Performance',
      status: queryResult.avgResponseTime < 200 ? 'HEALTHY' : 'DEGRADED',
      details: `Average response time: ${queryResult.avgResponseTime}ms`,
      severity: queryResult.avgResponseTime > 1000 ? 'HIGH' : 'MEDIUM'
    });
    
    // Data integrity
    const integrityResult = await checkDataIntegrity();
    results.push({
      check: 'Data Integrity',
      status: integrityResult.valid ? 'HEALTHY' : 'UNHEALTHY',
      details: integrityResult.issues || 'Data integrity verified',
      severity: integrityResult.issues?.length > 0 ? 'CRITICAL' : 'NONE'
    });
    
    return results;
  }
};
```

### Function and API Health
```typescript
const functionDiagnostics = {
  checkFunctionHealth: async () => {
    const results = [];
    const functions = await getAllConvexFunctions();
    
    for (const func of functions) {
      // Function response test
      const responseTest = await testFunctionResponse(func);
      results.push({
        check: `Function: ${func.name}`,
        status: responseTest.success ? 'HEALTHY' : 'UNHEALTHY',
        details: responseTest.error || `Response time: ${responseTest.responseTime}ms`,
        severity: responseTest.error ? 'HIGH' : responseTest.responseTime > 1000 ? 'MEDIUM' : 'NONE'
      });
      
      // Authentication test (if protected)
      if (func.requiresAuth) {
        const authTest = await testFunctionAuthentication(func);
        results.push({
          check: `Auth: ${func.name}`,
          status: authTest.properlyProtected ? 'HEALTHY' : 'UNHEALTHY',
          details: authTest.details,
          severity: !authTest.properlyProtected ? 'CRITICAL' : 'NONE'
        });
      }
    }
    
    return results;
  },
  
  checkAPIEndpoints: async () => {
    const results = [];
    const endpoints = await getHTTPEndpoints();
    
    for (const endpoint of endpoints) {
      const healthTest = await testEndpointHealth(endpoint);
      results.push({
        check: `Endpoint: ${endpoint.path}`,
        status: healthTest.status === 200 ? 'HEALTHY' : 'UNHEALTHY',
        details: `HTTP ${healthTest.status}: ${healthTest.message}`,
        severity: healthTest.status >= 500 ? 'CRITICAL' : healthTest.status >= 400 ? 'HIGH' : 'NONE'
      });
    }
    
    return results;
  }
};
```

### Frontend and UI Health
```typescript
const frontendDiagnostics = {
  checkUIHealth: async () => {
    const results = [];
    
    // Bundle analysis
    const bundleAnalysis = await analyzeBundleHealth();
    results.push({
      check: 'Bundle Size',
      status: bundleAnalysis.size < 250 * 1024 ? 'HEALTHY' : 'DEGRADED',
      details: `Bundle size: ${Math.round(bundleAnalysis.size / 1024)}KB`,
      severity: bundleAnalysis.size > 500 * 1024 ? 'HIGH' : 'MEDIUM'
    });
    
    // Component health
    const componentHealth = await checkComponentHealth();
    results.push({
      check: 'Component Rendering',
      status: componentHealth.allHealthy ? 'HEALTHY' : 'DEGRADED',
      details: `${componentHealth.healthyCount}/${componentHealth.totalCount} components healthy`,
      severity: componentHealth.criticalFailures > 0 ? 'HIGH' : 'MEDIUM'
    });
    
    // Accessibility check
    const a11yCheck = await checkAccessibility();
    results.push({
      check: 'Accessibility',
      status: a11yCheck.violations === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
      details: `${a11yCheck.violations} WCAG violations found`,
      severity: a11yCheck.criticalViolations > 0 ? 'HIGH' : 'MEDIUM'
    });
    
    // Real-time connectivity
    const realtimeCheck = await checkRealtimeConnectivity();
    results.push({
      check: 'Real-time Updates',
      status: realtimeCheck.connected ? 'HEALTHY' : 'UNHEALTHY',
      details: `WebSocket status: ${realtimeCheck.status}`,
      severity: !realtimeCheck.connected ? 'HIGH' : 'NONE'
    });
    
    return results;
  }
};
```

## Autonomous Issue Resolution

### Automatic Fix Generation
```typescript
const autonomousHealing = {
  generateFixes: async (healthIssues: HealthIssue[]) => {
    const fixes = [];
    
    for (const issue of healthIssues) {
      switch (issue.category) {
        case 'BUILD_FAILURE':
          fixes.push(await generateBuildFix(issue));
          break;
        case 'DEPENDENCY_VULNERABILITY':
          fixes.push(await generateSecurityFix(issue));
          break;
        case 'PERFORMANCE_DEGRADATION':
          fixes.push(await generatePerformanceFix(issue));
          break;
        case 'SCHEMA_ISSUE':
          fixes.push(await generateSchemaFix(issue));
          break;
        case 'FUNCTION_ERROR':
          fixes.push(await generateFunctionFix(issue));
          break;
        case 'ACCESSIBILITY_VIOLATION':
          fixes.push(await generateAccessibilityFix(issue));
          break;
      }
    }
    
    return fixes;
  },
  
  applyFixes: async (fixes: AutoFix[]) => {
    const results = [];
    
    for (const fix of fixes) {
      try {
        // Apply the fix
        const applyResult = await applyFix(fix);
        
        // Validate the fix doesn't break anything
        const validationResult = await validateFix(fix);
        
        // Re-run health check for this specific area
        const healthRecheck = await recheckHealth(fix.category);
        
        results.push({
          fix,
          applied: true,
          validation: validationResult,
          healthImprovement: healthRecheck.improved,
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
  }
};
```

### System Recovery Actions
```typescript
const systemRecovery = {
  // Database recovery actions
  recoverDatabase: async (issues: DatabaseIssue[]) => {
    const actions = [];
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'SLOW_QUERIES':
          actions.push(await optimizeSlowQueries(issue));
          break;
        case 'INDEX_MISSING':
          actions.push(await addMissingIndexes(issue));
          break;
        case 'DATA_INTEGRITY':
          actions.push(await repairDataIntegrity(issue));
          break;
      }
    }
    
    return actions;
  },
  
  // Function recovery actions
  recoverFunctions: async (issues: FunctionIssue[]) => {
    const actions = [];
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'FUNCTION_TIMEOUT':
          actions.push(await optimizeFunctionPerformance(issue));
          break;
        case 'AUTHENTICATION_FAILURE':
          actions.push(await fixAuthenticationIssue(issue));
          break;
        case 'ERROR_RATE_HIGH':
          actions.push(await improveErrorHandling(issue));
          break;
      }
    }
    
    return actions;
  },
  
  // Infrastructure recovery actions
  recoverInfrastructure: async (issues: InfrastructureIssue[]) => {
    const actions = [];
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'CDN_PERFORMANCE':
          actions.push(await optimizeCDNConfiguration(issue));
          break;
        case 'CACHE_INEFFICIENCY':
          actions.push(await improveCachingStrategy(issue));
          break;
        case 'MONITORING_DOWN':
          actions.push(await restoreMonitoring(issue));
          break;
      }
    }
    
    return actions;
  }
};
```

## Health Monitoring and Alerting

### Continuous Health Monitoring
```typescript
const healthMonitoring = {
  setupContinuousMonitoring: async () => {
    return {
      realTimeMetrics: await setupRealTimeHealthMetrics(),
      alerting: await setupHealthAlerts(),
      dashboards: await createHealthDashboards(),
      reporting: await setupHealthReporting()
    };
  },
  
  healthAlertRules: {
    critical: {
      buildFailures: 'Immediate alert on build failures',
      securityVulnerabilities: 'Immediate alert on critical vulnerabilities',
      dataIntegrityIssues: 'Immediate alert on data corruption',
      authenticationFailures: 'Immediate alert on auth system failures'
    },
    warning: {
      performanceDegradation: 'Alert on 20% performance decrease',
      highErrorRates: 'Alert on error rate > 1%',
      accessibilityViolations: 'Alert on new WCAG violations',
      dependencyUpdates: 'Alert on available security updates'
    },
    info: {
      bundleSizeIncrease: 'Notify on bundle size increase > 10%',
      testFailures: 'Notify on test suite failures',
      cacheHitDecrease: 'Notify on cache hit rate decrease',
      documentationUpdates: 'Notify on required documentation updates'
    }
  }
};
```

## Health Check Reports

### Comprehensive Health Report
```typescript
interface HealthReport {
  overall: {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'CRITICAL';
    score: number; // 0-100
    timestamp: string;
  };
  categories: {
    build: HealthCategoryResult;
    database: HealthCategoryResult;
    functions: HealthCategoryResult;
    frontend: HealthCategoryResult;
    security: HealthCategoryResult;
    performance: HealthCategoryResult;
    infrastructure: HealthCategoryResult;
  };
  issues: HealthIssue[];
  fixes: AutoFixResult[];
  recommendations: HealthRecommendation[];
  trends: HealthTrend[];
}
```

This comprehensive health check system ensures continuous system reliability while providing autonomous issue resolution to maintain optimal application health.