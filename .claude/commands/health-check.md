---
name: "Health Check"
description: "Comprehensive system health diagnostics and autonomous issue resolution for Convex applications"
---

# Health Check Command

Delegates comprehensive system health diagnostics to the Performance Engineer agent for autonomous monitoring and issue resolution.

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

## Agent Delegation

The Performance Engineer agent autonomously handles:
- Multi-layer health diagnostics (application, performance, security, infrastructure)
- Real-time monitoring and alerting setup
- Autonomous issue detection and resolution
- Performance optimization and bottleneck identification
- System recovery actions and preventive maintenance

## Success Criteria

The Performance Engineer agent ensures:
- All system layers are healthy and performing within established thresholds
- Autonomous issue detection and resolution with minimal system downtime
- Continuous monitoring and alerting for proactive maintenance
- Comprehensive health reporting with actionable recommendations
- Security vulnerabilities are identified and addressed promptly
- Performance optimization maintains optimal system responsiveness

All diagnostic implementations, fix generation logic, monitoring setup, and alerting rules are handled autonomously by the agent rather than the command.