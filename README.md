# Convex Coder - Self-Hosted Convex Application for Coder Workspaces

A Convex chat application optimized for deployment in Coder workspaces with self-hosted backend support. This application automatically integrates with Coder workspace resources (PostgreSQL and S3) for a seamless development experience.

## Features

- **Self-hosted Convex backend** with Docker Compose
- **Automatic integration** with Coder workspace PostgreSQL database
- **S3 storage integration** using Coder workspace S3 bucket
- **Real-time chat functionality** powered by Convex
- **React + TypeScript frontend** with Vite
- **Convex Dashboard** for monitoring and debugging

## Architecture

This application is designed to run in a Coder workspace and leverages:
- **PostgreSQL**: Workspace-provided database for Convex backend
- **S3**: Workspace-provided object storage for files and exports
- **Docker**: Runs the self-hosted Convex backend and dashboard
- **Vite**: Fast development server for the React frontend

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Files

The Coder workspace will automatically configure environment files, but you can also set them up manually:

```bash
# Copy environment templates
cp .env.local.example .env.local
cp .env.docker.example .env.docker
```

### 3. Start the Application

```bash
# Start the self-hosted Convex backend (uses workspace PostgreSQL & S3)
pnpm run docker:up

# In a new terminal, start the frontend development server
pnpm dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Convex Backend**: http://localhost:3210
- **Convex Dashboard**: http://localhost:6791

## Coder Workspace Integration

When running in a Coder workspace, this application automatically:

1. **Uses workspace PostgreSQL** for the Convex backend database
2. **Uses workspace S3** for file storage and exports
3. **Configures environment variables** from workspace settings
4. **Sets up Docker networking** for service communication

### Environment Variables

The following environment variables are automatically configured from your Coder workspace:

- `PGURI`: PostgreSQL connection string
- `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: S3 credentials
- `S3_BUCKET_NAME`: S3 bucket for storage
- `S3_ENDPOINT`: S3 endpoint URL

## Development Commands

```bash
# Frontend development
pnpm dev                  # Start Vite dev server
pnpm build               # Build for production

# Convex backend management
pnpm run docker:up       # Start self-hosted backend
pnpm run docker:down     # Stop backend containers
pnpm run docker:logs     # View backend logs

# Convex functions
pnpm run deploy-functions  # Deploy functions to backend
pnpm run dev:backend      # Run Convex dev server

# Code quality
pnpm run lint            # Run ESLint
pnpm run typecheck       # TypeScript type checking
pnpm run format          # Format code with Prettier
```

## Project Structure

```
convex-coder/
├── convex/              # Convex backend functions
│   ├── chat.ts         # Chat message handlers
│   └── _generated/     # Auto-generated Convex files
├── src/                # React frontend
│   ├── App.tsx        # Main chat component
│   ├── main.tsx       # Application entry point
│   └── index.css      # Styles
├── docker-compose.yml  # Self-hosted Convex services
├── .env.local.example  # Frontend environment template
├── .env.docker.example # Backend environment template
└── vite.config.mts    # Vite configuration
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
- Verify backend is healthy: `curl http://localhost:3210/version`
- Check `.env.local` has correct `VITE_CONVEX_URL`
- Ensure admin key is generated: `pnpm run docker:generate-admin-key`

### Database connection errors
- Verify PostgreSQL credentials: `psql $PGURI -c 'SELECT 1'`
- Check `.env.docker` has correct `DATABASE_URL` and `POSTGRES_URL`

### S3 storage issues
- Verify S3 credentials are set in environment
- Check bucket exists: `echo $S3_BUCKET_NAME`
- Ensure S3 endpoint is accessible

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