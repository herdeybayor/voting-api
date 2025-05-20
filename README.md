# Voting API System

A backend API for a role-based voting system built with NestJS, PostgreSQL, and Drizzle ORM.

## Project Overview

This API powers a voting system where users can create competitions, add candidates (options), and vote. The system supports different user roles with varying permissions:

### User Roles

- **Super Admin**
  - Can view all competitions
  - Can delete any competition (for moderation purposes)
- **Regular Users**
  - Can create, update, and delete their own competitions
  - Can create options within their own competitions
  - Can view competitions and their options
  - Can vote in competitions
  - Can update their profile (name, email, password, profile picture)

## Tech Stack

- **Backend**: NestJS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI
- **File Storage**: AWS S3 for storing profile pictures and other uploads
- **Email**: SMTP service for email verification
- **Containerization**: Docker & Docker Compose

## Project Setup

### Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose

### Local Development Setup

1. Clone the repository

```bash
git clone <repository-url>
cd voting-api
```

2. Copy the example environment file and configure it

```bash
cp .env.example .env
```

3. Install dependencies

```bash
npm install
```

4. Run the development server

```bash
npm run start:dev
```

The API will be available at http://localhost:4000 and the Swagger documentation at http://localhost:4000/docs.

### Database Migrations

The application supports automatic database migrations using Drizzle ORM:

1. To generate migrations after schema changes:

```bash
npm run db:generate
```

This will create migration files in the `drizzle` directory.

2. To apply migrations manually:

```bash
npm run db:migrate
```

3. To enable automatic migrations on application startup, set in your `.env` file:

```
AUTO_MIGRATE_DB=true
```

When enabled, the application will automatically apply pending migrations from the `drizzle` directory when it starts.

4. To view the database with Drizzle Studio:

```bash
npm run db:studio
```

### Using Docker

To run the entire application stack (API, PostgreSQL, and SMTP server) with Docker:

```bash
docker-compose up -d
```

This will start:

- The voting API on port 4000
- PostgreSQL database on port 5436 (configurable in .env)
- SMTP4Dev (for local email testing) on port 8025 (web UI) and 1025 (SMTP)

## API Documentation

The complete API documentation is available as a Swagger/OpenAPI interface at:

```
http://localhost:4000/docs
```

Postman Collection:

```
http://localhost:4000/docs-json
```

The documentation includes:

- Authentication endpoints
- User management
- Competition creation and management
- Voting operations
- Role-based permissions

## Key Features

- **JWT Authentication**: Secure authentication mechanism with refresh tokens
- **Role-Based Access Control**: Permissions management based on user roles
- **Competition Management**: Create, update, view and delete competitions
- **Voting**: One vote per user per competition
- **User Management**: Profile updates, password resets
- **File Storage**: Direct upload to AWS S3 for profile pictures and other files
- **Social Authentication**: Google and Apple OAuth support

## Database Schema

The application uses the following main entities:

- Users (regular users and admins)
- Competitions
- Options (candidates within competitions)
- Votes

Relations are managed through properly defined foreign keys with cascade deletion where appropriate.

## Environment Variables

See `.env.example` for the complete list of required environment variables. The essential ones include:

- Database connection details
  - `POSTGRES_SSL`: Set to `true` for SSL connections to PostgreSQL. The application uses `{ rejectUnauthorized: false }` for SSL configuration, which allows connections to self-signed certificates.
- JWT secrets and expiration times
- SMTP configuration for emails
- AWS S3 configuration for file uploads
- `AUTO_MIGRATE_DB` to control automatic database migrations

## License

[MIT License](LICENSE)
