# Step-by-step setup

Do these in order. You need your code pushed to GitHub (e.g. in a repo named `ticket-price-tracker`).

---

## Step 1: Push your code to GitHub

If you haven't already:

1. Create a new repository on GitHub (e.g. **ticket-price-tracker**). Don't add a README or .gitignore — the project already has them.
2. On your computer, in the project folder, run in a terminal:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ticket-price-tracker.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username. If your default branch is `master`, use `master` instead of `main`.

---

## Step 2: Choose which games to track

1. Open the file **`config/games.json`** in this repo (in your editor or on GitHub).
2. Change **`ticketQuantity`** to how many tickets you want to search for (e.g. `2` for a pair).
3. Edit the **`games`** list:
   - Each game needs: **id** (short unique slug), **name**, **date** (e.g. `2024-12-12`), **venue**, and **sources**.
   - **sources** are the event URLs from each site. To get them:
     - Go to **TickPick.com** or **Gametime.co**, find the game, copy the URL from your browser.
     - Put the TickPick URL under `"tickpick"` and the Gametime URL under `"gametime"`. You can omit one if you don't use that site.
   - Example for one game:
     ```json
     {
       "id": "celtics-lakers-jan",
       "name": "Celtics vs Lakers",
       "date": "2025-01-15",
       "venue": "TD Garden",
       "sources": {
         "tickpick": "https://www.tickpick.com/buy-...",
         "gametime": "https://gametime.co/..."
       }
     }
     ```
4. Save the file. If you're editing on GitHub: click **Commit changes**. If you're editing locally: commit and push (e.g. `git add config/games.json`, `git commit -m "Update games"`, `git push`).

---

## Step 3: Turn on GitHub Pages (so the site is live)

1. On GitHub, open **your repo** (e.g. `github.com/YOUR_USERNAME/ticket-price-tracker`).
2. Click **Settings** (top menu of the repo).
3. In the left sidebar, click **Pages** (under "Code and automation").
4. Under **"Build and deployment"**:
   - **Source**: choose **"Deploy from a branch"**.
   - **Branch**: choose **main** (or **master** if that's your default), and set the folder to **/docs**.
   - Click **Save**.
5. Wait a minute or two. GitHub will show a message like "Your site is live at `https://YOUR_USERNAME.github.io/ticket-price-tracker/`". Open that link — at first the page may say "No games configured" or "Loading…" until you run the scraper (next step).

---

## Step 4: Run the scraper so the page has real prices

The page needs data. A GitHub Action runs the scraper and saves the results.

1. On GitHub, open your repo.
2. Click the **Actions** tab (top menu).
3. In the left sidebar, click **"Update ticket prices"** (the workflow name).
4. Click the **"Run workflow"** button (right side), then **"Run workflow"** again in the dropdown.
5. Wait a few minutes. The workflow will turn green when it's done. It scrapes TickPick and Gametime for each game in your config and commits the results.
6. Refresh your GitHub Pages URL (from Step 3). You should see games and prices. If you still see "No games" or empty data, check that **config/games.json** was saved and that the workflow run succeeded (green check on the Actions tab).

---

## Step 5: You're done

- **View your tracker:** `https://YOUR_USERNAME.github.io/ticket-price-tracker/`
- **Update prices again anytime:** Actions → "Update ticket prices" → Run workflow.
- **Automatic updates:** The same workflow runs once per day on a schedule, so prices refresh automatically.
- **Change games later:** Edit `config/games.json` and push (or edit on GitHub). The next time the workflow runs (or when you run it manually), the new games will be included.
