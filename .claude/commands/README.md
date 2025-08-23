# Claude Code Commands - Convex Full-Stack Development

Autonomous agent system commands for comprehensive full-stack feature development with validation loops.

## 🌟 **START HERE: Primary Command**

### **`@feature-complete` - Your Go-To Command**
**Use this for 90% of development requests.** This is the main command developers should use for any feature work.

- ✅ Takes features from concept to fully validated completion across the entire stack
- ✅ Works autonomously until feature is fully working, tested, and verified  
- ✅ Includes comprehensive validation across schema, functions, and components
- ✅ Automatically retries up to 5 times if issues are found
- ✅ Self-healing with intelligent issue detection and resolution

**When to use:** Almost always - for new features, improvements, bug fixes, or any development work.

```bash
@feature-complete user-dashboard "Users can view their profile" "Dashboard shows user activity"
@feature-complete task-management "Create, edit, delete tasks" "Real-time updates"  
@feature-complete auth-system "OAuth login with Google/GitHub" "User roles and permissions"
```

---

## 🔧 **Specialized Commands** 
*Use these only for specific scenarios:*

### **`@agent-orchestrate`** - Multi-System Features
**When to use:** Complex features requiring multiple specialist agents (schema + backend + frontend + auth + etc.)
```bash
@agent-orchestrate "e-commerce-platform" "Complete shopping cart with payment processing and inventory"
```

### **`@test-comprehensive`** - Testing Only  
**When to use:** You just want testing/validation of existing code without changes
```bash
@test-comprehensive --fix-issues
```

### **`@performance-audit`** - Performance Analysis
**When to use:** You need performance analysis, optimization, and monitoring setup
```bash
@performance-audit --optimize --monitor
```

### **`@schema-migrate`** - Database Changes
**When to use:** You need to modify existing schemas with proper migration strategies
```bash
@schema-migrate user-profiles "Add social media links and preferences"
```

### **`@health-check`** - System Diagnostics
**When to use:** System maintenance, diagnostics, or investigating issues
```bash
@health-check --deep --auto-fix
```

## 🚀 **Decision Tree: Which Command Should I Use?**

```
Is this a development request (new feature, improvement, bug fix)?
├─ YES → Use @feature-complete (90% of cases)
└─ NO → Is this...
    ├─ Complex multi-system epic? → @agent-orchestrate
    ├─ Testing existing code only? → @test-comprehensive  
    ├─ Performance optimization needed? → @performance-audit
    ├─ Schema changes required? → @schema-migrate
    └─ System diagnostics needed? → @health-check
```

## 📋 **Common Usage Patterns**

### Typical Developer Workflow
```bash
# 1. Most common - develop any feature
@feature-complete user-dashboard "Users can view their profile" "Dashboard shows user activity"

# 2. For complex multi-system features  
@agent-orchestrate "e-commerce-platform" "Complete shopping cart with payment processing"

# 3. Periodic system maintenance
@health-check --deep --auto-fix
```

### Testing & Validation Only
```bash
# Test existing code without changes
@test-comprehensive --fix-issues

# Performance analysis and optimization  
@performance-audit --optimize --monitor

# Schema changes with migration
@schema-migrate user-profiles "Add social media links"
```

## Autonomous Full-Stack Workflows

### Feature Development Pipeline
1. **`@feature-complete`** - End-to-end autonomous implementation
   - Schema design and optimization
   - Function generation with type safety
   - Component creation with real-time integration
   - Authentication integration if needed
   - Comprehensive testing and validation

2. **Automatic Validation Phases**:
   - **Functional**: Requirement verification and user workflow validation
   - **Integration**: Schema, functions, and components work together seamlessly  
   - **Performance**: Query performance, bundle size, page load times
   - **Type Safety**: No TypeScript errors across the stack
   - **Accessibility**: WCAG compliance and usability standards
   - **Cross-Browser**: Chrome, Firefox, Safari compatibility

### Multi-Agent Coordination
1. **`@agent-orchestrate`** - Epic breakdown and task assignment
2. **Automatic agent coordination** - Parallel implementation with validation
   - **Schema Manager** → Database design and optimization
   - **Function Generator** → API layer with authentication
   - **React Builder** → Components with real-time updates
   - **Auth Specialist** → Authentication and authorization
   - **Performance Engineer** → Optimization and monitoring
3. **Integration testing** - Cross-system compatibility verification
4. **Performance validation** - Load testing and optimization

## Full-Stack Integration Features

### Convex-Specific Patterns
- **Real-Time Components**: Automatic subscription management and optimistic updates
- **Type-Safe APIs**: End-to-end type safety from schema to components
- **Authentication Integration**: OAuth providers with role-based access control
- **File Storage**: Upload, processing, and CDN integration
- **Search and Filtering**: Optimized queries with proper indexing

### React Integration
- **Component Architecture**: Reusable components with proper prop interfaces
- **State Management**: Integration with Convex real-time data
- **Form Handling**: Validation, submission, and error handling
- **Loading States**: Skeleton loaders and progressive enhancement
- **Error Boundaries**: Graceful error handling and recovery

### Development Experience
- **Hot Reloading**: Instant feedback during development
- **Type Safety**: Comprehensive TypeScript integration
- **Testing**: Unit, integration, and end-to-end test generation
- **Documentation**: Automatic documentation generation
- **Performance Monitoring**: Real-time performance tracking

## Validation Phases

All commands integrate comprehensive validation:

- **Functional**: User workflow validation and requirement verification
- **Integration**: Schema, functions, and components work together seamlessly
- **Performance**: < 3s page loads, < 500ms queries, optimized bundle sizes
- **Type Safety**: 100% TypeScript compliance with no errors
- **Accessibility**: WCAG 2.1 compliance and usability testing
- **Cross-Browser**: Chrome, Firefox, Safari compatibility testing

## Autonomous Retry System

Commands automatically retry on failure:
- **Up to 5 retry attempts** with intelligent issue analysis
- **Self-healing mechanisms** for common issues:
  - Import resolution and dependency updates
  - Type annotation corrections
  - Query optimization suggestions
  - Component prop fixes
  - Build configuration adjustments
- **Escalation rules** for unresolvable problems
- **Agent reassignment** for specialized issue resolution

## Success Metrics

### Development Quality
- **95%+ test coverage** across all layers (schema, functions, components)
- **100% TypeScript compliance** with no errors or warnings
- **Zero production-breaking deployments** through comprehensive validation
- **Complete feature validation** before approval

### Performance Standards
- **Page load times** < 3 seconds on 3G networks
- **Query response times** < 500ms for 95% of requests
- **Bundle size optimization** with automatic code splitting
- **Real-time update latency** < 100ms for user interactions

### User Experience
- **Accessibility compliance** with WCAG 2.1 standards
- **Cross-browser compatibility** with major browsers
- **Responsive design** for mobile, tablet, and desktop
- **Error handling** with user-friendly messages and recovery options

## Development Environment Integration

### Build System
- **Vite integration** for fast development and optimized builds
- **TypeScript compilation** with strict type checking
- **ESLint and Prettier** for code quality and consistency
- **Convex development server** for real-time backend updates

### Testing Infrastructure
- **Unit testing** with Jest and React Testing Library
- **Integration testing** with Convex function testing
- **End-to-end testing** with Playwright or Cypress
- **Performance testing** with Lighthouse and custom metrics

### Deployment Pipeline
- **Convex deployment** with automatic schema migrations
- **Frontend deployment** with optimized builds
- **Environment management** for development, staging, and production
- **Monitoring and alerting** for production health