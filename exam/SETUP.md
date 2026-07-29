# BBO 3.0 Online Exam — setup guide

Everything is built. You need to do three things: create the Google Sheet backend,
paste one URL into `config.js`, and set the exam date. Budget about 20 minutes.

---

## Step 1 — Create the Google Sheet and backend (10 min)

1. Go to <https://sheets.new> and name the sheet **BBO 3.0 Exam Data**.
2. **Extensions → Apps Script**. Delete the sample `function myFunction() {}`.
3. Open `apps-script/Code.gs` from this repository, copy **all** of it, paste it in.
4. Click **Save** (disk icon).
5. In the function dropdown at the top choose **setup**, then click **Run**.
   - Google asks for permission the first time: *Review permissions → choose your
     account → Advanced → Go to (project name) → Allow*. This is normal; the script
     is yours and runs under your own account.
   - You should see a confirmation listing the tabs it created and "Answer key
     loaded: 50 questions".
6. Click **Deploy → New deployment**.
   - Click the gear next to "Select type" and pick **Web app**.
   - **Description:** `BBO 3.0 exam`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` ← must be *Anyone*, not "Anyone with Google account"
   - Click **Deploy**, then **copy the Web app URL**. It ends in `/exec`.

> Whenever you edit `Code.gs` afterwards you must click
> **Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy**,
> otherwise the live site keeps running the old code.

## Step 2 — Connect the website (2 min)

Open `exam/config.js` and set:

```js
API_URL: "https://script.google.com/macros/s/AKfy....../exec",   // from step 1
START_ISO: "2026-08-29T21:00:00+06:00",                          // your exam date, 9:00 PM
```

`START_ISO` must keep the `+06:00` on the end — that is what pins it to
Bangladesh time regardless of where the participant's device thinks it is.

Then set the **same** date in `apps-script/Code.gs` (`CONFIG.START_ISO`) and redeploy.

## Step 3 — Push it live (1 min)

In GitHub Desktop: commit the changed files and click **Push origin**.
About a minute later the exam is live at <https://olympiad.biopc.org/exam/>.

---

## Test it before exam day

Set `START_ISO` to two minutes from now, push, and take the exam yourself on a
phone. Check that a row appears in the **Registrations** tab, that **Autosave**
fills up while you answer, that **Submissions** gets your paper, and that the
confirmation email arrives. Then set the real date back.

Run **BBO 3.0 Exam → Show live stats** from the sheet menu at any time to see how
many people have registered and submitted.

---

## On exam day

| Time | What to do |
|---|---|
| Day before | Announce the link. Registration is open (24 h before start). |
| 8:30 PM | Open the sheet, run **Show live stats**, watch registrations arrive. |
| 9:00 PM | Exam unlocks by itself. Nobody needs to press anything. |
| 9:50 PM | Papers auto-submit. Watch **Submissions** fill up over the next few minutes. |
| 10:00 PM | Check **Submissions** count against **Registrations**. |
| After | Run **BBO 3.0 Exam → Grade all papers**. |

## Grading

From the sheet menu choose **BBO 3.0 Exam → Grade all papers**. It creates a
**Results** tab, ranked, with marks, percentage and PASS/FAIL at 40%.

Two columns need your eye:

- **Source = RECOVERED** — the candidate's paper never reached the server, so the
  script rebuilt it from their last autosave. These are valid papers; they just
  came from the backup path.
- **Flag = DUPLICATE EMAIL** — the same email sat the exam twice (usually two
  devices). The earliest paper is kept and ranked; check these by hand.

---

## The email problem — read this before exam day

Requirement: 2,000 confirmation emails. Google's sending limits are:

| Account type | Emails per day |
|---|---|
| Free Gmail (`@gmail.com`) | **100** |
| Google Workspace (paid) | **1,500** |

So a free Gmail account cannot email 2,000 people, and Workspace cannot do it in
a single day either. The script handles this gracefully — it queues every email
and sends as many as the quota allows, every 5 minutes, picking up where it left
off the next day. Nothing is lost, but delivery would be spread over several days.

Your realistic options:

1. **Skip the email** (simplest). Set `SEND_EMAILS: false` in `Code.gs`. Every
   candidate still sees an on-screen confirmation with a submission ID, which is
   proof of submission. Announce results as planned.
2. **Google Workspace** (~$6/month, one month). Gets you 1,500/day — send in two
   batches across two days.
3. **A proper email service** — Brevo or Resend both have free tiers around
   300/day, and paid plans in the $10–25 range send all 2,000 at once. This needs
   a small change to the sending function; tell me if you want it and I will wire
   it up.

Option 1 is what I would pick: the confirmation is already on screen, and the
email adds little for the cost and hassle.

---

## What this system does and does not stop

**It does stop** casual cheating: text selection, copy, cut, paste, right-click,
Ctrl+C/P/S/U, F12 and the devtools shortcuts, printing, and it logs every time a
candidate leaves the exam tab (visible to you in the `TabSwitches` column).

**It cannot stop** a determined cheat. Anyone can photograph the screen with a
second phone and type the question into an AI tool, and no browser-based exam can
prevent that — not this one, not Google Forms, not any commercial equivalent.
Real defences are a live proctored video call, or a short window with randomised
question order (already enabled via `SHUFFLE_QUESTIONS`).

Treat `TabSwitches` and `CopyAttempts` as review signals, not automatic
disqualification: on mobile, a notification or an incoming call also counts as
leaving the tab.

---

## If something goes wrong during the exam

**Candidates report the page will not load.** Check the Apps Script deployment is
set to "Anyone". Their answers are safe on their device regardless.

**A candidate's device died mid-exam.** Tell them to reopen the same link *on the
same device and browser* — answers are stored locally and they resume with the
correct time remaining. On a different device they start blank, but the clock
still ends at 9:50 PM.

**Submissions look lower than registrations.** Do not panic and do not tell
anyone they failed to submit. Run **Grade all papers** — it recovers papers from
autosave automatically and marks them RECOVERED.

**The server was overloaded and rejected saves.** The page keeps retrying with a
backoff and keeps everything locally, so candidates lose nothing. The final
submission is what matters, and it retries for as long as the tab stays open.
