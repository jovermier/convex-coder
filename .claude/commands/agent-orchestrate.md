---
name: "Agent Orchestrate"
description: "Coordinate multiple agents for complex full-stack feature implementation with validation loops"
---

# Agent Orchestrate Command

Coordinates multiple specialist agents for complex full-stack feature development in Convex applications.

## Usage
```
@agent-orchestrate <epic-name> <description>
```

## Examples
```
@agent-orchestrate "e-commerce-platform" "Complete shopping cart with payment processing and inventory management"
@agent-orchestrate "real-time-chat" "Multi-room chat system with file sharing and user presence"
@agent-orchestrate "admin-dashboard" "Comprehensive admin interface with analytics and user management"
@agent-orchestrate "content-management" "CMS with rich text editing, media library, and publishing workflow"
```

## Agent Coordination Flow

### 1. Epic Planning
- **Orchestrator**: Breaks down epic into implementable full-stack tasks
- **Full-Stack Feature Creator**: Defines end-to-end feature architecture
- **Convex Schema Manager**: Designs database schema and relationships

### 2. Implementation Assignment
- **Convex Function Generator**: API layer with queries, mutations, and actions
- **React Convex Builder**: Frontend components with real-time integration
- **Convex Auth Specialist**: Authentication and authorization systems
- **Frontend UI Specialist**: Advanced UI patterns and interactions
- **Backend Integration Specialist**: External API and service integrations
- **Performance Engineer**: Optimization and monitoring implementation

### 3. Validation Checkpoints
- **Pre-Implementation**: Architecture review and baseline capture
- **Mid-Implementation**: Incremental validation and integration testing
- **Pre-Integration**: Cross-system compatibility verification
- **Pre-Release**: Full regression suite and performance validation
- **Post-Deployment**: Monitoring setup and health checks

### 4. Quality Assurance
- **Web Testing Specialist**: Comprehensive testing across all layers
- **Frontend Testing Engineer**: Component testing and user interaction validation
- **Backend Testing Engineer**: API testing and data integrity verification
- **Performance Testing Agent**: Load testing and optimization validation

## Autonomous Coordination

### Task Dependencies
- Automatic dependency resolution and sequencing
- Schema-first development ensures type safety
- Component dependencies mapped to function availability
- Integration points clearly defined and validated

### Resource Balancing
- Intelligent task distribution across specialized agents
- Parallel development where possible
- Sequential development where dependencies require it
- Continuous validation to catch integration issues early

### Conflict Resolution
- Architectural decision facilitation through structured ADRs
- Type safety enforcement across all layers
- Performance budget management and enforcement
- Code style and pattern consistency

### Progress Tracking
- Real-time milestone monitoring with automated reporting
- Dependency graph visualization and blocker identification
- Resource utilization tracking and optimization
- Quality metric dashboards and alerting

## Full-Stack Coordination Patterns

### Schema-Driven Development
```typescript
// 1. Schema Manager designs data layer
const userSchema = {
  users: { name: "string", email: "string", role: "union" },
  posts: { title: "string", content: "string", userId: "id" }
};

// 2. Function Generator creates API layer
const functions = generateCRUD(userSchema);

// 3. React Builder creates components
const components = generateComponents(functions);

// 4. Integration validation
validateFullStack(schema, functions, components);
```

### Authentication Flow Coordination
```typescript
// 1. Auth Specialist sets up providers and flows
const authConfig = setupOAuth(['google', 'github']);

// 2. Schema Manager adds user tables
const authSchema = addAuthTables(baseSchema);

// 3. Function Generator adds protected functions
const protectedFunctions = addAuthentication(functions);

// 4. React Builder adds auth components
const authComponents = generateAuthUI(authConfig);
```

### Real-Time Feature Coordination
```typescript
// 1. Schema Manager designs real-time data structures
const realtimeSchema = optimizeForSubscriptions(baseSchema);

// 2. Function Generator creates subscription patterns
const subscriptions = generateSubscriptions(realtimeSchema);

// 3. React Builder creates real-time components
const realtimeComponents = generateRealtimeUI(subscriptions);

// 4. Performance Engineer optimizes update patterns
const optimizedUpdates = optimizeRealtimePerformance(realtimeComponents);
```

## Issue Escalation and Resolution

### Automatic Escalation Triggers
```typescript
const ESCALATION_RULES = [
  {
    condition: 'TypeScript compilation errors',
    threshold: 10,
    action: 'AUTO_RETRY',
    assignTo: 'Convex Schema Manager'
  },
  {
    condition: 'Component integration failures',
    threshold: 5,
    action: 'AGENT_REASSIGNMENT',
    reassignTo: 'Full-Stack Feature Creator'
  },
  {
    condition: 'Authentication flow broken',
    threshold: 1,
    action: 'PRIORITY_ESCALATION',
    assignTo: 'Convex Auth Specialist'
  },
  {
    condition: 'Performance degradation > 30%',
    threshold: 1,
    action: 'IMMEDIATE_ESCALATION',
    assignTo: 'Performance Engineer'
  },
  {
    condition: 'Cross-agent architectural conflicts',
    threshold: 1,
    action: 'ARCHITECTURE_REVIEW',
    assignTo: 'Full-Stack Feature Creator'
  }
];
```

### Resolution Strategies
- **Type Safety Issues**: Schema review and regeneration
- **Performance Problems**: Query optimization and caching strategies
- **Integration Failures**: Contract validation and interface alignment
- **Authentication Issues**: Flow testing and provider configuration
- **UI/UX Problems**: Component redesign and user workflow validation

## Communication and Handoff Protocols

### Agent-to-Agent Communication
```typescript
interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  deliverable: Deliverable;
  validationCriteria: ValidationRule[];
  dependencies: Dependency[];
  timeline: Timeline;
}

// Example handoff
const schemaToFunction: AgentHandoff = {
  fromAgent: 'Convex Schema Manager',
  toAgent: 'Convex Function Generator',
  deliverable: {
    type: 'SCHEMA_DEFINITION',
    files: ['convex/schema.ts'],
    types: 'Generated types available'
  },
  validationCriteria: [
    'Schema compiles without errors',
    'All required indexes defined',
    'Types are properly exported'
  ],
  dependencies: [],
  timeline: { estimated: '2 hours', deadline: '4 hours' }
};
```

### Quality Gates
- **Schema Validation**: Type safety and performance optimization
- **Function Validation**: API contract compliance and security review
- **Component Validation**: Accessibility and performance standards
- **Integration Validation**: End-to-end workflow testing
- **Performance Validation**: Load testing and monitoring setup

## Success Metrics and Monitoring

### Development Velocity
- Feature completion time vs. estimates
- Agent coordination efficiency scores
- Rework rates and quality indicators
- Dependency resolution success rates

### Quality Indicators
- Test coverage across all layers
- Type safety compliance (100% target)
- Performance budget adherence
- Accessibility standards compliance
- Security vulnerability scanning results

### Coordination Effectiveness
- Agent handoff success rates
- Communication overhead reduction
- Conflict resolution time
- Escalation frequency and resolution effectiveness