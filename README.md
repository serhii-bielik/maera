# Maera TDS

Open source traffic distribution system.

## Stack

- **Tracker**: Node.js + Fastify (high-performance redirect engine)
- **API**: Node.js + Fastify (REST API)
- **Admin**: React + Vite (SPA dashboard)
- **Database**: PostgreSQL 16
- **Queue**: Redis + BullMQ

## Quick Start

# Install dependencies

```bash
pnpm install
```

# Start infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

# Setup database

```bash
pnpm db:migrate
pnpm db:seed
```

# Start development

```bash
pnpm dev
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
