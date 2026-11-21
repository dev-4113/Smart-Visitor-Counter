# VisitFlow – Smart Visitor Counter

VisitFlow is a web-based visitor dashboard with administrator login, visitor registration, visitor statistics, activity history, search/date filters, a traffic chart, and CSV export.

## Project structure

- `index.html`, `login.html` – dashboard and admin login pages
- `style.css` – responsive dashboard styling
- `script.js`, `login.js` – frontend behavior
- `server.js` – Express API and admin authentication
- `db.js` – MySQL connection using environment variables
- `create-admin.js` – creates an admin account with a bcrypt password hash
- `database/schema.sql` – database tables used by the backend
- `.env.example` – sample environment configuration (contains placeholders only)

## Requirements

- Node.js and npm
- MySQL Server

## Local setup

1. Create the database and tables by running `database/schema.sql` in MySQL Workbench or the MySQL command line.
2. Copy `.env.example` to a new file named `.env`.
3. Fill in the real MySQL connection values and set a long, unique `JWT_SECRET` in `.env`. Never commit `.env`.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Create an administrator:

   ```bash
   npm run create-admin
   ```

   Enter the admin email and a password of at least 8 characters when prompted.

6. Start the API:

   ```bash
   npm start
   ```

7. Open the frontend through a local web server (for example, the VS Code Live Server extension) and visit `login.html`. The API defaults to `http://localhost:5000`.

## API routes

- `GET /` – server status
- `GET /api/health` – API health check
- `POST /api/admin/login` – administrator login
- `GET /api/admin/profile` – validates the bearer token
- `POST /api/visitors` – registers a visitor and records an activity
- `GET /api/visitors` – retrieves visitor records
- `GET /api/activities` – retrieves recent activity records

## Before deployment

The frontend currently uses `http://localhost:5000`. Change the API base URLs in `login.js`, `index.html`, and `script.js` to your deployed backend URL before using a hosted frontend.

GitHub is for source-code hosting; it does not automatically host the Node.js API or MySQL database. Deploy the backend and database separately, configure environment variables in the hosting provider, and restrict CORS to your frontend origin for production.

## Security

- `.env` is excluded by `.gitignore`; commit `.env.example` only.
- Do not upload passwords, JWT secrets, database dumps containing personal data, or admin credentials.
- The database connection reads credentials from environment variables.
- Rotate any credentials that were previously shared or exposed.
