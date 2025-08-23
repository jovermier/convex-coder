---
name: "Test Comprehensive"
description: "Execute comprehensive testing suite across all layers with autonomous issue detection and resolution"
---

# Test Comprehensive Command

Delegates comprehensive testing to the Web Testing Specialist agent for autonomous execution and issue resolution.

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

## Agent Delegation

The Web Testing Specialist agent autonomously handles:
- Multi-layer test execution (schema, functions, components, e2e, performance)
- Issue detection and classification across all testing layers
- Autonomous fix generation and application with validation
- Performance benchmarking and optimization recommendations
- Security scanning and accessibility compliance verification

## Success Criteria

The Web Testing Specialist agent ensures:
- All tests pass across schema, function, component, e2e, and performance layers
- Autonomous issue detection and resolution with minimal manual intervention  
- Performance benchmarks meet established thresholds
- Security vulnerabilities are identified and addressed
- Accessibility standards (WCAG AA) are maintained
- Comprehensive reporting and regression detection

All test execution flows, fix generation logic, configuration management, and escalation rules are handled autonomously by the agent rather than the command.