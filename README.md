# Maera TDS

Open source traffic distribution system.

## Stack

- **Tracker**: Node.js + Fastify (high-performance redirect engine)
- **API**: Node.js + Fastify (REST API)
- **Admin**: React + Vite (SPA dashboard)
- **Database**: PostgreSQL 16
- **Queue**: Redis + BullMQ

## Quick Start

\`\`\`bash

# Install dependencies

pnpm install

# Start infrastructure

docker compose -f docker-compose.dev.yml up -d

# Setup database

pnpm db:migrate
pnpm db:seed

# Start development

pnpm dev
\`\`\`

## License

MIT
\`\`\`
