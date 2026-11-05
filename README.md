# Campus Compass

Campus Compass helps SMU students find campus events and plan them with friends. SMU events are announced across many Telegram channels and tracked separately from personal calendars, so students miss events and struggle to find a time that suits everyone. Campus Compass puts events, recommendations, group planning and calendars in one place.

- **Git repository:** https://github.com/harshitha904/is216-project
- **Live site:** https://is216-project-zeta.vercel.app
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
- **Password reset:** get a reset link by email, which expires after an hour.
- **Telegram event import:** a bot reads posts in Telegram channels and uses AI to turn them into events.
- **Responsive design:** works on phone, tablet and desktop.

## Tech stack

- **Frontend:** Vue 3, Vite, Pinia, Vue Router, Bootstrap
- **Backend:** Node.js, Express, Mongoose, node-cron, Multer, JWT, bcryptjs
- **Database:** MongoDB Atlas
- **External services:** Google Sign-In and Calendar, an OpenAI-compatible AI API, Telegram Bot API (grammY), EmailJS
- **Hosting:** Vercel (client), Render (server)
- **Testing:** Playwright

## Project structure

```text
client/                 Vue app
  src/views/            Pages
  src/components/       Shared components
  src/stores/           Pinia stores
  src/composables/      Shared logic
  src/utils/            Helpers, including the server address (api.js)
  e2e/                  Playwright tests
server/                 Express API
  app.js                Starts the server and scheduled jobs
  telegramBot.js        Telegram bot
  src/routes/           API routes
  src/controllers/      Request handlers
  src/services/         Calendar, plans, recommendations, Telegram parsing and email
  src/models/           MongoDB models
  uploads/              Default picture and Telegram event images (profile pictures are in the database)
```

## Set up

You need **Node.js 22 or newer** (tested on 24) and **npm**.

### 1. Get the code

```bash
git clone https://github.com/harshitha904/is216-project.git
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
JWT_SECRET=<long random text>
TELEGRAM_BOT_TOKEN=<Telegram bot token>
EMAILJS_SERVICE_ID=<EmailJS service ID>
EMAILJS_TEMPLATE_ID=<EmailJS template ID>
EMAILJS_PUBLIC_KEY=<EmailJS public key>
EMAILJS_PRIVATE_KEY=<EmailJS private key>
```

| Setting | Needed for |
|---|---|
| `DB` | Required. The server won't start without a database. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Required. The API key is needed to start the server, and AI powers "For you" and Telegram parsing. |
| `CLIENT_URL` | Required. Used for links and redirects back to the app. |
| `JWT_SECRET` | Required. Signs login tokens. Use any long random text, e.g. from `openssl rand -hex 32`. |
| `GOOGLE_*` | Google sign-in and Calendar sync. |
| `TELEGRAM_BOT_TOKEN` | Optional. Without it, the bot stays off and the rest of the app still works. |
| `EMAILJS_*` | Optional. Used to email password reset links. Without them, the link is printed in the server's logs. |

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
| testuser | Testuser1234. | Account with empty states for friends and lobbies |
| Testuser2 | Testuser1234. | Second account, for testing invites between two people |
| Testuser3 | Testuser1234. | Third account, for testing invites between two people |

You can also create a new account on the Sign Up page with any email ending in `@smu.edu.sg`.

## Test the app

### Automated tests

The Playwright tests are in `client/e2e`. They cover sign up, log in, Discover, activity tracking, calendar, lobbies, friends, notifications and Profile.

Start the server and client first, because the tests don't start them. The tests log in as `Testuser2` and `testuser`.

```bash
cd client && npx playwright install
```

```bash
cd client && npx playwright test
```

```bash
cd client && npx playwright show-report
```

`client/e2e/example.spec.js` is Playwright's starter example. It opens playwright.dev and does not test this app.

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
| 16 | Password reset | On the Log In page, open Password Reset, enter the account's email, then open the emailed link and set a new password | You can log in with the new password |

### Telegram bot

The bot runs on the live server, so test it with the live site.

1. Open https://is216-project-zeta.vercel.app first. The server sleeps when it isn't used, and the bot only replies once it's awake. This can take up to a minute.
2. In Telegram, search for **@smu_events_a2z_bot** and add it to a group/channel where you can make announcements (as an admin, can disable permissions), and then send an announcent, for example:

   > Python Workshop! Learn the basics of Python. Saturday 21 November 2026, 2pm to 4pm at SCIS 1 Seminar Room 2-1. Register here: https://example.com

   You can attach a poster image too.
3. Wait a few seconds, then log in and search for the event, or find it on Discover.

| Test | Expected result |
|---|---|
| Send an event post | A new event appears, with the title, date, time, location and link filled in |
| Send a post with a poster | The poster shows as the event's image |
| Send a message that isn't an event, e.g. "Hi everyone" | No event is created |
| Edit the post you sent | The same event updates, and no new event is created |
| Send a reminder for the same event (within 30 minutes of its start time) | No duplicate event is created |

Clubs can also add the bot as an admin of their channel, and it reads every post the same way.

**Running locally:** only one copy of a bot can run at a time. To test locally, create your own bot with @BotFather and put its token in `TELEGRAM_BOT_TOKEN`. Using the team's token locally would stop the live bot from getting messages.

## Note on group registration

When the host presses **Register Group** in a lobby, Campus Compass registers the group inside the app. Every member who accepted is marked as attending, the event shows under Attending in their Activity Tracking, and it's added to their Google Calendar if they've linked it.

It does not sign the members up on the club's own registration form. Each member still opens the event's registration link and signs up there.

We first wanted Register Group to fill in and submit the club's form for every member. We didn't build it, for two reasons:

- **Each club uses a different form.** Most are Google Forms or similar, with different questions, so there's no single way to fill them in.
- **The forms ask for details we don't store,** such as student ID and phone number. Collecting these would mean storing more personal data than the app needs.

With more time, we would let members choose to save these details, then fill in the forms whose questions we can recognise, with each member confirming before it's sent.

## AI use declaration

•	Explaining coding errors and debugging hints
•	Boilerplate code generation – starter code and code snippets
•	Generating End-to-End test cases, sample inputs, or mock data

Separately, the app itself calls an AI model at runtime to generate recommendations and to read Telegram posts.
