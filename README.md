# Pastebin-Lite

A simple pastebin application that allows users to create and share text pastes with optional expiry times and view limits.

## Features

- Create text pastes with unique shareable URLs
- Optional time-based expiry (TTL)
- Optional view-count limits
- Automatic paste expiration when constraints are met
- Clean HTML rendering with XSS protection
- RESTful API

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript

## Persistence Layer

This application uses **PostgreSQL** as its persistence layer, managed through Prisma ORM. PostgreSQL was chosen because:
- It provides reliable ACID-compliant transactions
- Works seamlessly in serverless environments (with proper connection pooling)
- Supports complex queries and indexing for efficient paste retrieval
- Easy to deploy on platforms like Vercel with Vercel Postgres or external providers like Neon, Supabase, or Railway

## Local Development

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database (local or cloud)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pastebin-lite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   DATABASE_URL="postgresql://neondb_owner:npg_a0No8pAqtJPE@ep-dry-sound-a1idmul1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   PORT=3000
   BASE_URL=http://localhost:3000
   TEST_MODE=0
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

### Running in Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## API Endpoints

### Health Check
```
GET /api/healthz
```
Returns `{ "ok": true }` if the service and database are healthy.

### Create a Paste
```
POST /api/pastes
Content-Type: application/json

{
  "content": "Your text here",
  "ttl_seconds": 3600,  // optional
  "max_views": 10       // optional
}
```

Response:
```json
{
  "id": "abc123",
  "url": "https://your-app.com/p/abc123"
}
```

### Get a Paste (API)
```
GET /api/pastes/:id
```

Response:
```json
{
  "content": "Your text here",
  "remaining_views": 9,
  "expires_at": "2026-01-01T00:00:00.000Z"
}
```

### View a Paste (HTML)
```
GET /p/:id
```
Returns an HTML page with the paste content.

## Design Decisions

1. **ID Generation**: Used `nanoid` for generating short, URL-safe unique IDs (10 characters)

2. **View Counting**: The API endpoint (`/api/pastes/:id`) decrements the view count, while the HTML view (`/p/:id`) does not count as a view for consistency in testing

3. **Expiry Logic**: 
   - Pastes are checked for expiry on retrieval
   - Both time-based and view-based constraints are evaluated
   - Paste becomes unavailable when either constraint is met

4. **Test Mode**: Supports deterministic time testing via `TEST_MODE=1` and `x-test-now-ms` header

5. **Security**: 
   - XSS protection via HTML escaping
   - Helmet.js for security headers
   - HPP for parameter pollution prevention

6. **Database Schema**: Simple single-table design with fields for content, view limits, and expiry timestamps

## Testing
The application supports automated testing with deterministic time:

Set TEST_MODE=1 in environment variables
Send requests with x-test-now-ms header containing milliseconds since epoch
The application will use this time for expiry calculations


## Project Structure

```
src/
├── index.ts           # Entry point
├── app.ts             # Express app configuration
├── controller/        # Request handlers
├── service/           # Business logic
├── routes/            # API routes
└── prisma/
    └── schema.prisma  # Database schema
```

## License

ISC