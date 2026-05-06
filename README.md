# Riff Repeat 🎸

A lightweight, serverless guitar practice tracker powered by GitHub Pages, Issues, and Actions.

## Setup Instructions

### 1. Repository Settings
To ensure the automation works correctly, you need to grant the GitHub Action write permissions:
1. Go to **Settings** > **Actions** > **General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Click **Save**.

### 2. Enable GitHub Pages
1. Go to **Settings** > **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder.
4. Click **Save**.
5. Once deployed, your dashboard will be available at `https://<your-username>.github.io/<repo-name>/`.

### 3. Usage
- **View Progress**: Open your GitHub Pages URL to see your songs and practice stats.
- **Add a Song**: Click "+ Add New Song" on the dashboard. It will open a GitHub Issue template. Fill it out and submit.
- **Log Practice**: Click "Log Practice" next to any song. It will open a pre-filled issue. Submit it, and the GitHub Action will update your data automatically.

## How it works
- **Frontend**: A static HTML file using Alpine.js and Tailwind CSS.
- **Data Store**: `data/songs.json` holds all your songs and practice sessions.
- **Automation**: A GitHub Action (`.github/workflows/process-practice.yml`) triggers whenever you open a "New Song" or "Log Practice" issue. It runs a Node.js script to update the JSON file and commits it back to your repo.
