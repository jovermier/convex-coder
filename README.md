# Convex Coder - Self-Hosted Convex Application for Coder Workspaces

A full-stack application with Convex backend optimized for deployment in Coder workspaces with self-hosted backend support. Features real-time task management and chat functionality with automatic integration with Coder workspace resources (PostgreSQL and S3).

## Features

- **Self-hosted Convex backend** with Docker Compose
- **Task Management System** with real-time updates
- **Real-time chat functionality** powered by Convex  
- **React + TypeScript frontend** with Vite and Tailwind CSS
- **Automatic environment setup** with `generate-env.js`
- **Convex Dashboard** for monitoring and debugging
- **Automatic integration** with Coder workspace PostgreSQL database
- **Local file storage** (S3 disabled due to DNS resolution issues)

## Architecture

This application is designed to run in a Coder workspace and leverages:
- **PostgreSQL**: Workspace-provided database for Convex backend
- **S3**: Workspace-provided object storage for files and exports
- **Docker**: Runs the self-hosted Convex backend and dashboard
- **Vite**: Fast development server for the React frontend

## Quick Start

### 1. Install Dependencies

```bash
# IMPORTANT: Use Convex v1.24.8 (v1.26.1 has issues with self-hosted deployments)
pnpm install
```

### 2. Generate Environment Configuration

Use the automated setup script to configure environment files and start Docker containers:

```bash
# Automatically setup environment and start services  
npm run generate-env

# OR manually copy templates if needed
cp .env.local.example .env.local
cp .env.docker.example .env.docker
```

### 3. Start the Backend Services

```bash
# Start the self-hosted Convex backend (uses workspace PostgreSQL)
pnpm run docker:up

# Generate admin key (first time only)
pnpm run docker:generate-admin-key

# Update .env.local with the admin key from above
```

### 4. Deploy Convex Functions

```bash
# Deploy functions to the self-hosted backend
npx convex dev --once

# OR run in development mode with file watching
npx convex dev
```

### 5. Start the Frontend

```bash
# In a new terminal, start the frontend development server
pnpm dev
```

### 6. Access the Application

In a Coder workspace:
- **Frontend**: `https://main--convex-coder--[username].coder.hahomelabs.com/`
- **Convex Backend**: `https://convex-backend--main--convex-coder--[username].coder.hahomelabs.com/`
- **Convex Dashboard**: `https://convex-dashboard--main--convex-coder--[username].coder.hahomelabs.com/`

For local development:
- **Frontend**: http://localhost:5173
- **Convex Backend**: http://localhost:3210
- **Convex Dashboard**: http://localhost:6791

## Coder Workspace Integration

When running in a Coder workspace, this application automatically:

1. **Uses workspace PostgreSQL** for the Convex backend database
2. **Uses local Docker volumes** for file storage (S3 disabled due to DNS issues)
3. **Configures environment variables** from workspace settings
4. **Sets up Docker networking** for service communication

### Environment Variables

The following environment variables are automatically configured from your Coder workspace:

- `PGURI`: PostgreSQL connection string
- `S3_*` variables: Currently disabled due to DNS resolution issues in Docker containers

## Development Commands

```bash
# Environment setup
npm run generate-env     # Auto-configure environment and start Docker

# Frontend development
pnpm dev                 # Start Vite dev server
pnpm build              # Build for production

# Convex backend management
pnpm run docker:up      # Start self-hosted backend
pnpm run docker:down    # Stop backend containers
pnpm run docker:logs    # View backend logs
pnpm run docker:generate-admin-key  # Get admin key for dashboard

# Self-hosted Convex development (Coder workspace)
pnpm dev:backend:self-hosted  # Watch and regenerate types for self-hosted
pnpm deploy:self-hosted       # Deploy functions to self-hosted backend

# Convex functions
pnpm run deploy-functions # Deploy functions to backend
pnpm run dev:backend     # Run Convex dev server

# Code quality
pnpm run lint           # Run ESLint
pnpm run typecheck      # TypeScript type checking
pnpm run format         # Format code with Prettier
pnpm run check          # Run both typecheck and lint
```

## Project Structure

```
convex-coder/
├── convex/                    # Convex backend functions
│   ├── chat.ts               # Chat message handlers  
│   ├── tasks.ts              # Task management functions
│   ├── users.ts              # User management functions
│   ├── schema.ts             # Database schema
│   └── _generated/           # Auto-generated Convex files
├── src/                      # React frontend
│   ├── components/           # React components
│   │   ├── TaskCard.tsx     # Task display component
│   │   ├── TaskForm.tsx     # Task creation form
│   │   └── TaskList.tsx     # Task list with search
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Tailwind CSS styles
├── generate-env.js           # Auto-configure environment
├── seed-data.js             # Database seeding script
├── docker-compose.yml       # Self-hosted Convex services
├── .env.local.example       # Frontend environment template
├── .env.docker.example      # Backend environment template
└── vite.config.mts         # Vite configuration
```

## How It Works

1. **Docker Compose** starts the Convex backend and dashboard containers
2. **Convex backend** connects to the workspace PostgreSQL database
3. **S3 integration** provides file storage capabilities
4. **Vite dev server** serves the React frontend
5. **Real-time updates** flow through the Convex WebSocket connection

## Troubleshooting

### Backend won't start
- Check Docker is running: `docker ps`
- View logs: `pnpm run docker:logs`
- Ensure PostgreSQL is accessible: `echo $PGURI`

### Frontend connection issues
- Verify backend is healthy: `curl https://your-backend-url/version`
- Check `.env.local` has correct `VITE_CONVEX_URL` and `CONVEX_SELF_HOSTED_URL`
- Ensure admin key is generated and added to `.env.local`
- For Coder workspaces: Use the correct URLs with your workspace name

### Convex Functions Not Deploying

**Known Issue with v1.26.1:** If you see this error when running `convex dev`:
```
TypeError: Cannot read properties of undefined (reading 'length')
```

**Solution:**
1. Downgrade to Convex v1.24.8: `pnpm add convex@1.24.8`
2. Ensure S3 variables are disabled in `.env.docker` (set to empty)
3. Reset the backend if previously initialized with S3:
   ```bash
   docker-compose down -v
   docker-compose --env-file .env.docker up -d
   pnpm run docker:generate-admin-key
   # Update .env.local with new admin key
   npx convex dev --once
   ```

### Backend Storage Type Mismatch

If you see an error about database being initialized with S3 but backend started with Local:

**Solution:**
1. Stop and remove all containers and volumes: `docker-compose down -v`
2. Start fresh: `docker-compose --env-file .env.docker up -d`
3. Generate new admin key and update `.env.local`
4. Deploy functions again: `npx convex dev --once`

### Database connection errors
- Verify PostgreSQL credentials: `psql $PGURI -c 'SELECT 1'`
- Check `.env.docker` has correct `DATABASE_URL` and `POSTGRES_URL`

### S3 DNS Resolution Issues

**Known Issue:** Docker containers cannot resolve internal Coder workspace S3 endpoints.

**Current Workaround:** S3 is disabled. Files are stored locally in Docker volumes instead.

For detailed documentation about these issues and workarounds, see: `docs/CONVEX_SELF_HOSTED_ISSUE.md`

## Deployment Notes

This application is designed for development in Coder workspaces. For production deployment:

1. **Change `INSTANCE_SECRET`** in `.env.docker` to a secure value
2. **Configure proper SSL/TLS** for production endpoints
3. **Set up persistent volumes** for Docker containers
4. **Configure backup strategies** for PostgreSQL and S3

## Contributing

Contributions are welcome! Please ensure:
- Code passes linting: `pnpm run lint`
- TypeScript checks pass: `pnpm run typecheck`
- Code is formatted: `pnpm run format`

## License

MIT

## Support

For issues specific to:
- **Convex**: See [Convex documentation](https://docs.convex.dev/)
- **Coder workspaces**: Check workspace logs and Coder documentation
- **This application**: Open an issue in the repository