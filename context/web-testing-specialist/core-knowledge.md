# Web Testing Specialist - Core Knowledge

## Codebase Analysis - Convex Coder Application

### Architecture Overview
- **Framework**: React + TypeScript + Vite
- **Backend**: Convex (real-time database and serverless functions)
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: Convex queries/mutations with real-time updates
- **File Storage**: Convex file storage integration

### Key Components
- **Chat System**: Multiple chat implementations (working, smart, simple)
- **File Upload**: Direct file upload with status tracking
- **Theme Support**: Dark/light mode toggle
- **Error Handling**: Error boundary component
- **Authentication**: User system integration

### Testing Context
- **Unit Tests**: Component-level testing needed
- **Integration Tests**: Convex function and query testing required
- **E2E Tests**: User workflow validation
- **Performance Tests**: Bundle size and load time optimization
- **Visual Regression**: UI consistency across changes

### Critical Areas for Testing
1. Real-time chat functionality
2. File upload and storage
3. Authentication flows
4. Cross-component state management
5. Error handling and recovery
6. Theme switching
7. Mobile responsiveness