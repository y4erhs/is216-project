# Campus Compass

Campus Compass helps SMU students find campus events and plan them with friends. SMU events are announced across many Telegram channels and tracked separately from personal calendars, so students miss events and struggle to find a time that suits everyone. Campus Compass puts events, recommendations, group planning and calendars in one place.

- **Git repository:** https://github.com/y4erhs/is216-project
- **Running locally:** http://localhost:5173

## Team

| Name | GitHub |
|---|---|
| Harshitha | harshitha904 |
| Shreya | y4erhs |
| Giselle Yu | giselleyjh86-boop |
| Makayla Aileen Santoso | aiieens |
| Stephanie | steph-heic |
| Wai Linn Aung | WaiLinn-Aung |

## Features

- **Discover:** browse all events this month, AI picks in "For you" (refreshed daily, with "Less like this"), or tabs for your interests.
- **Search:** find events by keyword, category and date.
- **Activity tracking:** mark events as interested, attending or attended, and keep notes on each one.
- **Reminders and alerts:** set a reminder per event, and choose which in-app alerts you get on your Profile.
- **Lobbies:** invite friends, pitch events, reply, and register as a group.
- **Shared calendar:** see lobby events, plans and when members are busy, with empty days marked as free.
- **Plans:** create and edit your own plans, invite friends, and get warned about clashes.
- **Google Calendar:** connect your account to sync plans and events you're attending.
- **Friends:** send and accept friend requests.
- **Accounts:** sign up with an @smu.edu.sg email, or use Continue with Google with an SMU account.
- **Telegram event import:** a bot reads posts in Telegram channels and uses AI to turn them into events.
- **Responsive design:** works on phone, tablet and desktop.

## Tech stack

- **Frontend:** Vue 3, Vite, Pinia, Vue Router, Bootstrap
- **Backend:** Node.js, Express, Mongoose, node-cron, Multer
- **Database:** MongoDB Atlas
- **External services:** Google Sign-In and Calendar, an OpenAI-compatible AI API, Telegram Bot API (grammY)
- **Testing:** Playwright

## Project structure

```text
client/                 Vue app
  src/views/            Pages
  src/components/       Shared components
  src/stores/           Pinia stores
  src/composables/      Shared logic
  src/utils/            Helpers, including the server address (api.js)
  tests/                Playwright tests
server/                 Express API
  app.js                Starts the server and scheduled jobs
  telegramBot.js        Telegram bot
  src/routes/           API routes
  src/controllers/      Request handlers
  src/services/         Calendar, plans, recommendations and Telegram parsing
  src/models/           MongoDB models
  uploads/              Default picture and Telegram event images (profile pictures are in the database)
```

## Set up

You need **Node.js 22 or newer** (tested on 24) and **npm**.

### 1. Get the code

```bash
git clone https://github.com/y4erhs/is216-project.git
```

```bash
cd is216-project
```

If you're using the submitted zip, unzip it and open that folder instead.

### 2. Install the packages

```bash
cd server && npm install
```

```bash
cd ../client && npm install
```

### 3. Add the server settings

Create a file at `server/config.env`. It is not in Git because it holds private keys.

```text
DB=<MongoDB connection string>
OPENAI_API_KEY=<AI API key>
OPENAI_MODEL=<AI model name>
OPENAI_BASE_URL=<AI API address, only if not using OpenAI directly>
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
CLIENT_URL=http://localhost:5173
TELEGRAM_BOT_TOKEN=<Telegram bot token>
```

| Setting | Needed for |
|---|---|
| `DB` | Required. The server won't start without a database. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Required. The API key is needed to start the server, and AI powers "For you" and Telegram parsing. |
| `CLIENT_URL` | Required. Used for links and redirects back to the app. |
| `GOOGLE_*` | Google sign-in and Calendar sync. |
| `TELEGRAM_BOT_TOKEN` | Optional. Without it, the bot stays off and the rest of the app still works. |

### 4. Set up Google (only to use Google features)

In Google Cloud Console, open your OAuth client and add both of these under **Authorized redirect URIs**:

```text
http://localhost:8000/auth/google/callback
http://localhost:8000/auth/google/signin/callback
```

While the app is in Testing mode on the consent screen, add each person's Google email as a **Test user**. Continue with Google only accepts `@smu.edu.sg` accounts.

## Run the app

Use two terminals.

**Terminal 1, the server (http://localhost:8000):**

```bash
cd server && npm run dev
```

**Terminal 2, the client (http://localhost:5173):**

```bash
cd client && npm run dev
```

Open http://localhost:5173. The server address defaults to `http://localhost:8000`. To change it, copy `client/.env.example` to `client/.env` and edit `VITE_API_URL`.

## Test accounts

| Username | Password | Notes |
|---|---|---|
| `<TO FILL IN>` | `<TO FILL IN>` | Account with friends, lobbies and events set up |
| `<TO FILL IN>` | `<TO FILL IN>` | Second account, for testing invites between two people |

You can also create a new account on the Sign Up page with any email ending in `@smu.edu.sg`.

## Test the app

### Automated tests

```bash
cd client && npx playwright install
```

```bash
cd client && npx playwright test
```

```bash
cd client && npx playwright show-report
```

`client/tests/example.spec.js` is currently Playwright's starter example and does not test this app yet.

### Manual test cases

Start the server and client first, then log in with a test account.

| # | Area | Steps | Expected result |
|---|---|---|---|
| 1 | Sign up | Sign up with a non-SMU email | Refused: the email must end with @smu.edu.sg |
| 2 | Sign up | Sign up with an SMU email, course, year and interests | Account is created, and the course and year show on Profile and in the sidebar |
| 3 | Log in | Log in with a wrong password | Shows "Invalid username or password" |
| 4 | Log in | Open `/profile` while logged out | Goes to the login page, then back to Profile after logging in |
| 5 | Google | Use Continue with Google with a non-SMU account | Refused, with a message to use an SMU account |
| 6 | Discover | Open the All, For you and interest tabs | Each tab shows matching events |
| 7 | Discover | Click "Less like this" on a For you event | The event is removed from the list |
| 8 | Reminders | Open an upcoming event and set a reminder | The reminder shows as set, and an alert appears in the bell when it's due |
| 9 | Alerts | Turn off Lobby activity on Profile, then get invited to a lobby | No alert is created |
| 10 | Alerts | Set the default reminder time on Profile, then open an event | Remind Me starts on that time |
| 11 | Lobbies | Create a lobby and invite a friend | The friend gets an invite and can accept or decline |
| 12 | Shared calendar | Open a lobby's Shared Calendar | Days with anything on are not green, and empty days are green |
| 13 | Plans | Create a plan that overlaps an event you're attending | A schedule overlap alert appears on My Calendar |
| 14 | Google Calendar | Connect Google and press Sync now | Attending events and plans appear in Google Calendar |
| 15 | Responsive | Open each page at phone width | The menu works and nothing scrolls sideways |

## AI use declaration

This declaration follows FAQ 20 of the project brief.

`<TO FILL IN: each team member adds any other parts that relied solely on AI, or removes any part above they wrote themselves.>`

Separately, the app itself calls an AI model at runtime to generate recommendations and to read Telegram posts.
