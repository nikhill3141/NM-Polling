# NM Polling

NM Polling is a full-stack live polling platform built for fast audience decisions. A creator can sign up, create a poll with multiple questions and options, share a public link, collect responses in real time, and publish visual results when ready.

## Core Idea

Most polling tools either feel too slow for live rooms or expose results before the creator is ready. NM Polling focuses on the complete event flow:

- Create a poll with title, description, expiry, mandatory questions, and options.
- Generate a public share link using a unique poll token.
- Let participants vote without needing an account for anonymous polls.
- Track anonymous votes with a browser device ID plus IP checks to reduce repeated votes from the same device.
- Broadcast result updates live with Socket.io.
- Give creators a dashboard with result visualizations, published-state control, and poll status.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Realtime: Socket.io
- Authentication: JWT access tokens and refresh tokens
- Frontend: Vite, React, lucide-react
- Styling: Custom responsive CSS with light and dark mode

## Project Structure

```text
NM Polling/
  src/
    common/
      config/db.js
      middleware/auth.js
      middleware/error-handler.js
      utils/token.js
    modules/
      User/
      Poll/
      Question/
      Option/
      Response/
      PollLink/
    server.js
  Fronted/
    src/
      components/
        AuthPanel.jsx
        BrandName.jsx
        FeatureCard.jsx
        PollResults.jsx
        ResultQuestion.jsx
        StatsGrid.jsx
        ThemeButton.jsx
      constants/
        demoPoll.js
      pages/
        DashboardPage.jsx
        LandingPage.jsx
        PublicPollPage.jsx
      services/
        api.js
      utils/
        authStorage.js
        device.js
        routing.js
      App.jsx
      main.jsx
      styles.css
    index.html
    package.json
  package.json
  .env
```

## Features

### Landing and Dashboard Flow

- The root page is a minimal interactive landing page with a bold NM Polling brand name, product flow, feature cards, CTA, and footer.
- The landing page does not show login or signup forms directly.
- CTA buttons route users to `/dashboard`.
- The dashboard can be previewed before login.
- Poll creation and management are locked until the creator logs in or signs up from the dashboard auth gate.

### Creator Authentication

- Signup and login
- HTTP-only token cookies
- Access token and refresh token flow
- Refresh token rotation
- Logout clears server-side refresh token records
- Protected creator dashboard APIs

### Poll Creation

Creators can configure:

- Poll title
- Description
- Expiry time
- Anonymous or authenticated response mode
- Multiple questions
- Multiple options per question
- Mandatory questions

### Public Poll Links

Every poll gets a unique token and public URL:

```text
http://localhost:5173/polls/:token
```

Participants can open the link, vote, and view results once the creator publishes them.

### Realtime Results

Socket.io rooms are created per poll token:

```text
poll-{token}
```

When a response is submitted, the backend emits updated result data to everyone in that poll room.

### Device-Based Vote Protection

For anonymous polls, the frontend creates a browser device ID and sends it with the vote. The backend stores that ID in the response record and uses a unique index to prevent repeated answers to the same question from the same device. IP-based checks are also kept as a fallback.

This helps reduce multiple votes from the same browser/device while preserving anonymous participation.

### Result Publishing

Creators control when results are public:

- While unpublished, participants can vote but public results stay hidden.
- After publishing, participants see the live result board.
- Closed or expired polls stop accepting new responses.

### Dashboard Visualization

The frontend dashboard includes:

- Total polls
- Active polls
- Total responses
- Published result count
- Top choice percentage
- Donut-style leading-option chart
- Per-option percentage bars
- Poll status badges
- Copyable public share link
- Dark mode toggle

## API Overview

### User Routes

```http
POST /api/users/signup
POST /api/users/login
POST /api/users/refresh-token
POST /api/users/logout
GET  /api/users/me
```

### Creator Poll Routes

```http
POST  /api/polls
GET   /api/polls
GET   /api/polls/:pollId
PATCH /api/polls/:pollId/publish
PATCH /api/polls/:pollId/close
```

### Public Poll Routes

```http
GET  /api/public/polls/:token
POST /api/public/polls/:token/responses
```

## Environment Variables

Create or update `.env` in the root folder:

```env
DB_CONNECTION_URL=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
JWT_SERECT_KEY=your_jwt_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

The project currently supports `JWT_SERECT_KEY` because that name already existed in the code. `JWT_SECRET_KEY` is also supported by the token utility.

## Run Locally

Install backend dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

Install frontend dependencies:

```bash
cd Fronted
npm install
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Important MongoDB Note

If MongoDB Atlas rejects the connection, add your current IP address in Atlas Network Access or use a local MongoDB connection string. The app will not start until MongoDB accepts the connection.

## Demo Flow

1. Open the NM Polling landing page.
2. Create a creator account or log in.
3. Build a poll with at least one question and two options.
4. Copy the generated public link.
5. Open the public link in another browser/device.
6. Submit a vote.
7. Watch the creator dashboard update.
8. Publish results to show the public live result board.

## Why This Is Hackathon Ready

- It solves a clear real-time audience feedback problem.
- It includes authentication, poll creation, public sharing, and result visualization.
- It uses Socket.io for live result updates.
- It includes vote integrity using device and IP tracking.
- It gives creators control over when results are visible.
- It has a polished landing page, dark mode, and dashboard analytics for presentation impact.
