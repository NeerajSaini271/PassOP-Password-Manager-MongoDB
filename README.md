<p align="center">
  <img src="./public/NexLockrLogo.svg" alt="NexLockr shield logo" width="120" />
</p>

<h1 align="center">NexLockr</h1>

<p align="center">
  An authenticated, owner-isolated credential vault with AES-256-GCM encrypted password storage.
</p>

<p align="center">
  Built with React, Express, MongoDB, Tailwind CSS, and Vite.
</p>

<p align="center">
  <a href="https://nexlockr.vercel.app"><strong>Live Demo</strong></a>
  ·
  <a href="https://nexlockr-api.onrender.com/api/health"><strong>API Health</strong></a>
</p>

---

## Overview

NexLockr is a full-stack encrypted credential vault built as a standalone application and presented in my professional portfolio.

> [!WARNING]
> NexLockr demonstrates authentication, account isolation, and authenticated encryption. It has not undergone an independent security audit and should not be treated as a commercial password manager. Use only fictional demonstration credentials in the public deployment.

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="./public/screenshots/home-dark.png" alt="NexLockr Home page in dark mode" width="100%" />
    </td>
    <td width="50%" valign="top">
      <img src="./public/screenshots/home-light.png" alt="NexLockr Home page in light mode" width="100%" />
    </td>
  </tr>
</table>

## Security model

- Account passwords are protected with Node.js `scrypt` and unique random salts.
- Saved credential passwords are encrypted with AES-256-GCM before MongoDB storage.
- Every encrypted value has a random initialization vector and authentication tag.
- Encryption keys are supplied only through backend environment variables.
- Sessions use random bearer tokens, while only SHA-256 token hashes are stored.
- Every credential query includes the authenticated owner identifier.
- Registration and sign-in routes have stricter rate limits.
- Helmet security headers and restricted CORS origins protect the API.
- Request bodies are limited to 16 KB.
- Expired sessions are removed through a MongoDB TTL index.
- The API waits for MongoDB before accepting requests.
- Graceful shutdown closes the HTTP server and MongoDB connection.
- Legacy plaintext records are not exposed by the new API.

## Features

- Registration, sign-in, sign-out, and expiring sessions
- Owner-isolated encrypted credentials
- Create, update, delete, reveal, search, and copy actions
- Strict URL and request validation
- Loading, empty, error, and busy states
- Responsive credential cards
- Keyboard-accessible controls
- Persistent light and dark themes
- Responsive desktop and mobile navigation
- Focused backend security and API integration tests
- Netlify-ready frontend and Render-ready backend

## Technology stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Toastify

### Backend

- Node.js
- Express
- MongoDB
- Helmet
- Node.js Crypto

## Local setup

### Requirements

- Node.js 20.19 or later
- npm
- MongoDB

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd backend
npm install
```

### Configure environment files

Create the local environment files from the examples:

```text
.env.example -> .env
backend/.env.example -> backend/.env
```

Generate a local backend encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Never commit the generated encryption key.

### Start the backend

```bash
cd backend
npm start
```

### Start the frontend

In another terminal:

```bash
npm run dev
```

## Environment variables

### Frontend

```text
VITE_API_BASE_URL
```

The origin of the deployed API, such as:

```text
http://localhost:3000
```

### Backend

```text
MONGO_URI
DB_NAME
FRONTEND_ORIGIN
VAULT_ENCRYPTION_KEY
SESSION_HOURS
PORT
NODE_ENV
```

## Testing and validation

Run backend syntax validation:

```bash
cd backend
npm run check
```

Run the focused backend security and API tests:

```bash
npm test
```

Run frontend linting from the repository root:

```bash
npm run lint
```

Create a production frontend build:

```bash
npm run build
```

The focused backend test suite covers:

- Password hashing and verification
- AES-256-GCM encryption and decryption
- Ciphertext and authentication-tag tampering
- Credential and URL validation
- Rate limiting
- Registration and invalid login rejection
- Missing authentication rejection
- Encrypted credential persistence
- Credential CRUD
- Invalid credential identifiers
- Logout and session invalidation
- Cross-account owner isolation

## Deployment

NexLockr is deployed with the following production services:

- **Frontend:** [Vercel](https://nexlockr.vercel.app)
- **Backend API:** [Render](https://nexlockr-api.onrender.com)
- **API health check:** [nexlockr-api.onrender.com/api/health](https://nexlockr-api.onrender.com/api/health)
- **Database:** MongoDB Atlas

The production frontend uses:

```text
VITE_API_BASE_URL=https://nexlockr-api.onrender.com
```

The Render service uses the Vercel production origin in `FRONTEND_ORIGIN`. Never commit `.env` files, database credentials, or production encryption keys.

> [!IMPORTANT]
> Keep `VAULT_ENCRYPTION_KEY` stable after deployment. Changing the key makes previously encrypted credential passwords unreadable.

## Legacy data

The earlier implementation stored records without authentication or encryption in the `PassOP.passwords` collection.

Clear that legacy collection after preserving only clearly fictional records. If any genuine password was ever entered, change the password at the original service.

## Author

**Neeraj Kumar Saini**<br>
MERN Stack Developer

[GitHub](https://github.com/NeerajSaini271)
