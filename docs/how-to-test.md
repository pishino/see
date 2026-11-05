# How to test See

Written for someone who has never run a web project before. You don't need to understand any of the code. You
need a browser, and you need to follow the steps in order.

There are three ways to look at See. Pick the first one that works for you.

| Way | You install | You need | Best for |
| --- | --- | --- | --- |
| **A. The live website** (GitHub Pages) | Nothing | The publish step to be green (see below) | Everyday testing. Just open a link. |
| **B. In your browser, on GitHub** (Codespaces) | Nothing | A GitHub account in good standing | Testing before A works. It runs a private copy of See for you. A billing lock on the account probably blocks this too. |
| **C. On your own computer** | Node.js and Git | About 20 minutes the first time | Testing the latest work, and working offline. Doesn't depend on GitHub billing at all. |

Everything below is for the web app. The phone apps are covered at the end.

---

## A. The live website

### 1. Check that the website is actually published

Merging into `main` makes GitHub build the site. The build is called the **Pages** workflow.

1. Open https://github.com/pishino/see/actions
2. Look at the newest line called **Pages**.
   - A **green tick**: the site is live. Go to step 2.
   - A **red cross**: the build failed. Go to "If the Pages line is red" below.
   - A **yellow dot**: it is still building. Wait two to five minutes and refresh.

### If the Pages line is red

Click the red line, then click **build** in the list on the left. The reason is written in red near the top of
the page, in the box labelled **Annotations**.

**"The job was not started because your account is locked due to a billing issue."** This is the one we hit.
GitHub has locked the account, and while it's locked no workflow can run, so nothing gets published. Nothing is
wrong with See. Only you can fix it:

1. Open https://github.com/settings/billing (or: your profile picture › **Settings** › **Billing and
   licensing**). The names change a little over time.
2. Look for a failed payment, an unpaid balance or a warning banner. Update the payment method or pay what's
   owed.
3. If nothing there explains it (for instance you've never paid GitHub anything), contact GitHub Support at
   https://support.github.com/contact, choose billing, and quote the sentence above.
4. When the lock is lifted, go to the **Actions** tab › **Pages** (left side) › **Run workflow** › choose
   `main` › **Run workflow**, or ask Claude to start it. Wait for the green tick.

While the account is locked, use way C. It runs on your own computer and doesn't touch GitHub billing. Way B
probably won't work either, because Codespaces is billed through the same account.

Other messages you might see:

- **Actions being disabled or restricted**: open the repository › **Settings** › **Actions** › **General**,
  choose **Allow all actions and reusable workflows**, and save.
- **Your account being flagged**: that is GitHub's decision. Contact GitHub Support.
- **A message about "ubuntu-latest" moving to Ubuntu 26**: a notice, not an error. Ignore it.
- Anything else: copy the red text and send it to Claude.

### 2. One-time setting (you've done this)

Repository › **Settings** › **Pages** › **Build and deployment** › **Source** must say **GitHub Actions**. If it
says "Deploy from a branch", change it.

### 3. Open the site

Once the tick is green:

| What | Link |
| --- | --- |
| The web app's front page | https://pishino.github.io/see/ |
| Straight into the app | https://pishino.github.io/see/app |
| The phone app, running in your browser | https://pishino.github.io/see/phone/ |
| The six emails See sends | https://pishino.github.io/see/emails |
| Terms and Privacy | https://pishino.github.io/see/terms and https://pishino.github.io/see/privacy |

If you see a GitHub "404" page right after the first green tick, wait a minute and refresh. The first publish
can take a moment.

### 4. Getting new work onto the site

I save my work on a separate branch, `claude/funny-archimedes-oox8kk`. The website only shows `main`. So after
I tell you there's new work:

1. Open https://github.com/pishino/see/pulls and click **New pull request**.
2. Set **base: main** and **compare: claude/funny-archimedes-oox8kk**.
3. Click **Create pull request**, then **Merge pull request**, then **Confirm merge**.
4. Open the **Actions** tab and wait for the new **Pages** line to turn green (a few minutes).
5. Reload the site. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac) so the browser doesn't show the
   old copy.

Or just ask Claude to open the pull request for you.

---

## B. In your browser, on GitHub (Codespaces)

A Codespace is a computer GitHub lends you for a while. It runs a private copy of See, and nothing is
installed on your own machine. GitHub gives free accounts a monthly allowance. Stop the Codespace when you're
done so it doesn't use it up.

1. Open https://github.com/pishino/see
2. Above the file list, click the branch button (it says **main**) and choose
   **claude/funny-archimedes-oox8kk**. That's the branch with the latest work.
3. Click the green **Code** button › **Codespaces** tab › **Create codespace on claude/funny-archimedes-oox8kk**.
4. Wait a minute or two. You'll get a page that looks like a code editor. At the bottom is a panel called
   **Terminal**. Click inside it.
5. Type these two lines, pressing **Enter** after each. The first takes a few minutes and prints a lot of text.
   That's normal.

   ```bash
   npm install
   ```

   ```bash
   npm run dev
   ```

6. When it says `Local: http://localhost:5173/`, a small pop-up appears in the corner saying the app is
   running. Click **Open in Browser**. If it doesn't appear, open the **Ports** tab next to Terminal, find
   **5173**, and click the little globe icon.
7. To stop: click inside the Terminal and press **Ctrl+C**. To close the Codespace, go to
   https://github.com/codespaces and choose **Stop codespace**.

---

## C. On your own computer

### One-time setup

1. **Node.js**: download the **LTS** version from https://nodejs.org and run the installer. Accept the
   defaults.
2. **Git**: download from https://git-scm.com/downloads and run the installer. Accept the defaults.
3. Open a terminal:
   - **Windows**: press the Windows key, type **PowerShell**, press Enter.
   - **Mac**: press Cmd+Space, type **Terminal**, press Enter.
4. Check both are installed. Each should print a version number:

   ```bash
   node -v
   ```

   ```bash
   git --version
   ```

### Get See and run it

Type each of these, pressing **Enter** after each, and wait for one to finish before the next:

```bash
git clone https://github.com/pishino/see.git
```

```bash
cd see
```

```bash
git checkout claude/funny-archimedes-oox8kk
```

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173 in your browser. To stop it, click the terminal and press **Ctrl+C**.

### Getting new work later

In the same folder:

```bash
git pull
```

```bash
npm install
```

```bash
npm run dev
```

---

## A ten-minute tour

Do these in order. Each says what you should see. If something differs, note which step and what happened.

1. **Front page.** Scroll it. After a moment a cookie bar appears at the bottom. Click **Choose**: a panel
   opens with Needed (always on), Measure and Personal ads. Click **Save**.
2. **Sign up.** Click **Start ranking** (top right). There are four steps: what you rank, the code, what you link, your first
   list. Type any email. For the code, **type any six numbers**, for example `123456`. There is no real email
   yet, so anything works. You can skip linking services.
3. **Your charts.** You land in the app. The bar down the left is the side bar. Rest the pointer on it and it
   opens. Click a list such as **Videos of the year**.
4. **Reorder.** Grab the six dots at the right of a row and drag it up or down. The numbers and the green and
   orange arrows update. You can also click the dots, press **Space**, then use the arrow keys.
5. **The row that's gone.** One row is greyed out with "Removed from YouTube. It keeps No. 4; play is off." and
   a **Find another** link. That's the "a song disappeared" case.
6. **The list menu.** Click the **•••** button at the top right of a list. You should see Pin, Share, Size,
   Make it a poll, Invite people and Delete. Try **Delete**, then click **Undo** in the message that appears.
7. **Polls.** Click the second icon in the side bar. Open a poll and play it: you pick between two things
   until one is left. The poll marked **AD** is a sponsored one.
8. **Find.** Click the magnifying glass and search for a song, film or person.
9. **Settings.** Click your picture at the bottom of the side bar, then **Settings** in the menu that opens. Try Appearance (Dark, Light,
   Flare) and text size. Under connected services you'll see Spotify, YouTube and others. Without app keys they
   run as a demo.
10. **Share.** Open a list's **•••** menu › **Share…**. Copy the link and open it in a private window. That's
    what someone who has never used See sees: a page where they can rank the same list.

Also worth a look: `/emails` (the six emails), `/terms` and `/privacy` (Terms start with "The short version"),
and `/phone/` (the phone app in your browser; make the window narrow).

### What is real and what is pretend

- **Real**: everything you see and click, including dragging, polls, sharing links, the emails and the
  appearance settings.
- **Pretend, for now**: accounts. Whatever you create lives only in the browser you made it in. Another
  browser, another device or a private window starts empty. There is no real email code, and nothing syncs
  between people. Everyone you see in lists and polls is sample data.
- **Needs keys**: connecting Spotify, YouTube, Reddit, Apple Music and Discord for real needs app keys from
  each service. `integrations.md` in this folder explains how. Without keys they run as a demo.

### Starting over

Your lists are saved in the browser. To wipe them: click the padlock (or the sliders icon) in the address bar
› **Site settings** › **Delete data**. Or open a private window for a fresh start.

---

## The phone apps

- **In a browser**: the `/phone/` link above runs the real phone app. It can't do vibration, push messages or
  the phone's own share sheet.
- **On a real phone**: on your computer, follow way C, then run `npm run start -w @see/mobile`. A QR code
  appears. Install **Expo Go** from the App Store or Google Play, open it, and scan the QR code. The phone and
  computer must be on the same Wi-Fi.
- The desktop app (`apps/desktop`) needs extra tools and is explained in `docs/platforms.md`.

---

## When something goes wrong

| What you see | What to do |
| --- | --- |
| The Pages line on the Actions tab is red | See "If the Pages line is red", above. "Account is locked due to a billing issue" means fix billing, or use way C. |
| A GitHub "404" at `pishino.github.io/see/` | Wait a minute. Then check **Settings › Pages** says Source: GitHub Actions, and that the Actions tab has a green tick. |
| The site looks old | Hard reload: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac). Then check you merged the latest pull request. |
| `npm: command not found` | Node.js isn't installed. Do the one-time setup again, then close and reopen the terminal. |
| `git: command not found` | Git isn't installed. Same fix. |
| `Port 5173 is already in use` | An old copy is still running. Click its terminal and press **Ctrl+C**, then run `npm run dev` again. |
| A white page in the browser | Press **F12**, click **Console**, and send Claude a screenshot of any red text. |
| Anything else | Send Claude the exact words on the screen. A screenshot is best. |
