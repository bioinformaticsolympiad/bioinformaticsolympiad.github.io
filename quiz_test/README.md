# BioPC ApexExam | Official Dynamic 10-MCQ Competitive Platform

An enterprise-grade, high-performance Single-Page Application (SPA) conducted and held by **BioPC (Bio Programming Community)** for **10-question, 10-minute** competitive examinations with an **Administrator-controlled start window**, Kahoot-style speed bonus scoring, real-time **Top 5 Rank Leaderboard**, strict **Chrome "Ask Gemini" & AI Proctoring Guard**, and synchronized Google Sheets database integration.

---

## Key Features

1. **Held by BioPC (Bio Programming Community):**
   - Official BioPC platform branding across all registration portals, rules guidelines, examination suites, results scorecards, retake request portals, and administrative command cockpits.
   - Standardized examination protocol and proctoring integrity rules enforced by BioPC.

2. **Top 5 Rank Leaderboard (Multi-Participant Attendee Standings):**
   - **Multi-Participant Ranking Engine:** Displays the Top 5 candidates ranked by Combined Kahoot Score (Base Score $\times$ 10,000 + Speed Bonus Points), Speed Bonus, and Completion Time.
   - **Podium & Medal Indicators:** 🥇 1st Gold, 🥈 2nd Silver, 🥉 3rd Bronze, 4th, and 5th badges with Candidate Name, Department, Base Score, Speed Points, and Total Completion Time.
   - **Triple-View Integration:**
     - **Post-Exam Scorecard (`#viewResults`):** Displays the full Top 5 Leaderboard alongside a **Personal Standing Box** showing the participant's exact rank among all attendees (e.g., *Rank #2 of 14 Candidates*).
     - **Candidate Waiting Lobby (`#viewWaitingLobby`):** Live Top 5 standings showing completed candidates while waiting for test start.
     - **Admin Cockpit (`#tabLeaderboard`):** Prominent **Top 5 Champions Podium Cards** displayed above the detailed submissions table.

3. **Chrome "Ask Gemini" & AI Prohibition Proctor Guard:**
   - **Zero-Tolerance AI Policy:** Under BioPC Examination Protocol, consulting AI models or activating browser AI sidebar assistants (such as Chrome's *"Ask Gemini"* side panel, right-clicking to consult Gemini, or copying question prompts) is strictly prohibited.
   - **Exam HUD Visual Guard:** Active examination HUD features the `#hudAiGuardPill` (`AI Guard: No Gemini`) with pulsing real-time indicator.
   - **Automatic Window-Blur & Departure Lockout:** Clicking Chrome's sidebar "Ask Gemini" button or unfocusing the exam window immediately stops all exam timers, terminates the active attempt, flags the candidate record with `aiViolation: true`, and logs a `CRITICAL` audit event (`AI_GEMINI_VIOLATION`).
   - **Mandatory Admin Authorization for 2nd Attempt:** Locked candidates are immediately redirected to the **Retake Permission Portal** displaying a high-visibility red `#retakeAiAlertBanner` explaining the AI lockout. Candidates cannot resume or re-enter without submitting an authorization request to the BioPC Administrator.
   - **Admin Cockpit AI Violation Highlighting:** In the Admin Cockpit under Retake Requests, any request resulting from an AI or Gemini infraction is flagged with a prominent red badge: `[AI / GEMINI VIOLATION]`. Administrators have sole authority to grant access for a 2nd exam attempt or permanently deny access.

4. **Dual-Role Architectural Model:**
   - **Participant Portal:** Full Name, Institution, Department / Academic Major, Email, and 11-digit Bangladeshi Phone validation (`013-019`).
   - **Dynamic Waiting Lobby:** Real-time polling (every 3.5s) holding participants until the Admin flips the exam state to `OPEN`.
   - **Decentralized 10-Minute Personal Timer:** High-precision timestamp delta countdown unaffected by browser tab throttling or reloads.
   - **Candidate Department Identity:** Department/Major badge is persistently rendered in the candidate Exam HUD, Post-Exam Results card, and Retake Permission view.
   - **Advanced Administrator Command Cockpit:**
     - Protected by a secret passkey (`admin123` by default, customizable in Cockpit).
     - **One-Click Excel Download (`.csv`):** Native Excel-compatible download with UTF-8 BOM encoding for both Submissions Leaderboard and Candidate Rosters, including Department columns.
     - **Question Bank Studio (Full CRUD):** View, add, edit, and delete MCQs in real-time. Changes immediately update both the admin panel and live candidate examination sessions. Includes instant "Reset to Defaults".
     - **Candidate Management:** Search candidates by name, institution, department, email, phone, or token; filter by status (`REGISTERED`, `IN_EXAM`, `SUBMITTED`, `DISQUALIFIED`); unlock locked sessions; and disqualify cheating candidates.
     - **Submission Inspector:** Detailed question-by-question candidate response inspection modal showing selected choice, correct answer, response time, and speed bonus earned.
     - **Admin Security & Disaster Recovery Center:**
        - **Granular Tab Resets:** Instant toolbar reset buttons across all sections (`Submissions Leaderboard`, `Active Candidates Roster`, `Retake Requests Queue`, `Question Bank Studio`, and `Proctoring Audit Log`).
        - **🔴 Master Platform Factory Reset (`#btnMasterPlatformReset` & Header `Reset All`):** 1-click comprehensive wipe that purges submissions, purges candidates, resets the retake queue, clears audit logs, restores default 10 MCQs, locks exam status, and clears client runtime storage.
        - **Aligned Cockpit Header:** Auto-refresh intervals, manual Sync, Reset All, and Logout are strictly aligned in a single sleek toolbar row.
        - Change secret passkey directly from the UI.

5. **Strict Linear Progression & Immediate Points Reveal:**
   - **One-by-One Sequential Flow:** Candidates cannot switch or skip between questions. Question 1 must be answered before Question 2 unlocks, ensuring strict linear progression.
   - **Locked Answer & Immediate Score Feedback:**
     - The moment an option is chosen, the question locks to prevent alteration.
     - An animated **Immediate Feedback Card** reveals whether the choice is correct (🎯) or incorrect (❌), showing the awarded **Base Accuracy (+1.0 Mark or 0.0)**, **Speed Bonus Points**, response time, and detailed explanation.
     - The top HUD live-updates candidate score (`Score: X.0 / 10`) with celebratory pulse animations alongside the cumulative speed bonus.
     - Future questions in the Question Matrix remain locked until previous questions are completed.

6. **Kahoot-Style Speed Scoring Formula:**
   - **Base Score:** 1.0 mark per correct answer (Max: 10.0 marks).
   - **Speed Bonus:**
     $$\text{Bonus Points} = \max\left(50, \text{round}\left(\left(1 - \frac{\text{Response Time (ms)}}{60000}\right) \times 1000\right)\right)$$
     - Rapid response (e.g. 5 sec): $\approx 917$ pts
     - Medium response (e.g. 30 sec): $\approx 500$ pts
     - Slower responses: decays down to 50 pts
     - *Bonus points are only awarded if the chosen answer is correct!*
   - **Combined Tie-Breaker Score:**
     $$\text{Combined Score} = (\text{Base Score} \times 10000) + \text{Total Speed Bonus}$$

3. **Strict Single Attempt Policy & Retake Permission System:**
   - **1-Attempt Policy:** Once a candidate completes and submits an exam, they are permanently blocked from re-registering or launching a second attempt.
   - **Retake Permission Portal:** If an attempt limit is detected upon return or re-entry, the system presents the candidate with the Attempt Lock Screen (`#viewRetakePermission`).
   - **Permission Request Workflow:** Candidates who faced abnormal disruptions (e.g. power outage, sudden crash) can submit a detailed reason directly to the Administrator Cockpit.
   - **Live Radar Synchronization:** While awaiting authorization, candidate screens display a live polling radar checking server authorization every 3.5 seconds.
   - **Admin Cockpit Authorization Controls:**
     - Administrators see a real-time badge and dedicated **Retake Requests Tab**.
     - Admins can review the candidate's submitted reason and click **"Grant Access (Approve)"** or **"Deny (Reject)"**.
     - **Approval:** Clears previous submission answers, resets the candidate's session for a fresh exam attempt, and live-unlocks the candidate's screen to launch their new exam.
     - **Denial:** Permanently locks the candidate's portal, confirming their initial score as final.

4. **Active Proctoring & Anti-Cheat:**
   - Detects window minimization, tab switching, and `blur` events.
   - Triggers an instant on-screen warning modal, increments strike count, and posts an event directly to the `AuditLogs` Google Sheet.

5. **Hybrid Backend Architecture:**
   - **Built-in Standalone Simulator:** Test the entire dual-role flow immediately out of the box in your browser without deploying a backend first.
   - **Google Sheets & Google Apps Script (`Code.gs`):** Connects to your live spreadsheet with one-click automated schema creation.

---

## Google Sheets & Apps Script Setup Guide

Follow these simple steps to link your live Google Spreadsheet:

### Step 1: Create a New Google Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com) and create a **Blank spreadsheet**.
2. Name it e.g., `ApexExam_Database`.

### Step 2: Open Apps Script
1. In the top menu, click **Extensions** &rarr; **Apps Script**.
2. Delete any boilerplate code inside `Code.gs`.
3. Copy the entire contents of [`Code.gs`](Code.gs) from this repository and paste it into the editor.
4. Click **Save** (Ctrl+S or the floppy disk icon).

### Step 3: Run One-Click Initialization
1. In the toolbar function dropdown, select **`setupSheets`**.
2. Click **Run**.
3. Google will ask for authorization on the first run:
   - Click **Review permissions** &rarr; Select your Google account.
   - Click **Advanced** &rarr; **Go to Untitled project (unsafe)** &rarr; **Allow**.
4. Return to your Google Sheet: you will see **4 fully formatted tabs** created automatically:
   - **`Config`**: Contains `ExamStatus` (`LOCKED`), `ExamDurationMinutes` (`10`), and `AdminKey` (`admin123`).
   - **`Participants`**: Logs candidate registration records and status.
   - **`Submissions`**: Records final scores, speed bonuses, tab switches, and answers JSON.
   - **`AuditLogs`**: Records live proctoring strikes and tab blur events.

### Step 4: Deploy as Web App
1. At the top right of the Apps Script editor, click **Deploy** &rarr; **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment:
   - **Description:** `ApexExam Production Backend`
   - **Execute as:** `Me (your_email@gmail.com)`
   - **Who has access:** `Anyone` *(Crucial: allows participants to register and submit)*
4. Click **Deploy**.
5. Copy the **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Connect Web App URL to Frontend
1. Open the web application (`index.html`) in your browser.
2. Click the **Settings** gear icon in the top right header.
3. Select **Live Google Sheets** mode.
4. Paste your **Web App URL** into the field and click **Save & Apply**.
5. You can click **Test Connection** to confirm connectivity!

---

## File Structure

```
├── index.html        # Unified Single-Page Application (5 views & modals)
├── style.css         # Modern dark-mode glassmorphic design system
├── script.js         # State machine, Kahoot speed formula, proctoring & sync
├── Code.gs           # Google Apps Script backend router & DB controllers
└── README.md         # Deployment & architecture documentation
```

---

## Default Credentials & Testing Shortcuts

- **Admin Secret Passkey:** `admin123` (Can be modified in Google Sheets `Config` tab).
- **Bangladeshi Phone Validation:** Requires an 11-digit number starting with `013`-`019` (e.g. `01712345678`).
- **Exam Hotkeys:** Use keyboard keys `A`, `B`, `C`, `D` to choose options; Left/Right arrow keys to cycle questions.
