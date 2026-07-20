# Adepa Job Portal — Backend (Stage 1: Project Setup)

Express + MongoDB backend for the Adepa job portal. This is stage 1: the server boots,
connects to MongoDB Atlas, and exposes a health check. Auth, jobs, and applications routes
come in later stages.

## 1. Install dependencies

```bash
npm install
```

## 2. Set up MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **free (M0) cluster** — any provider/region is fine.
3. Under **Database Access**, create a database user with a username and password
   (save these — you'll need them in your connection string).
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`) — fine for development; we can restrict this later for production.
5. Once the cluster is ready, click **Connect** → **Drivers** → copy the connection string.
   It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual database user credentials, and
   add a database name before the `?`, e.g. `.../adepa?retryWrites=true...`

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:
- `MONGODB_URI` — the connection string from step 2
- `JWT_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

## 4. Run the server

```bash
npm run dev
```

You should see:
```
MongoDB connected: cluster0-shard-xx.xxxxx.mongodb.net
Adepa API running on http://localhost:5000
Health check: http://localhost:5000/api/health
```

Visit `http://localhost:5000/api/health` in your browser — you should see a JSON response
confirming the API is running.

## Project structure

```
src/
├── config/       # DB connection, other service configs
├── controllers/  # Route handler logic (added in later stages)
├── middleware/   # Auth guards, error handling
├── models/       # Mongoose schemas (added in later stages)
├── routes/       # Express route definitions (added in later stages)
├── utils/        # Helper functions
├── app.js        # Express app + middleware setup
└── server.js     # Entry point — loads env, connects DB, starts server
```

## Next stage

Stage 2 adds the **User model and authentication** — register/login for job seekers and
employers, password hashing with bcrypt, and JWT-based sessions.
