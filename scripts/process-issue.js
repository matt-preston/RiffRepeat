const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const issue = github.context.payload.issue;
    const labels = issue.labels.map(l => l.name);
    const body = issue.body;

    const dataPath = path.join(process.cwd(), 'data/songs.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (labels.includes('new-song')) {
      const title = extractField(body, 'Song Title');
      const artist = extractField(body, 'Artist');
      
      if (!title || !artist) throw new Error('Missing title or artist');

      const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (data.songs.find(s => s.id === id)) {
        console.log(`Song with id ${id} already exists.`);
      } else {
        data.songs.push({
          id,
          title,
          artist,
          addedAt: new Date().toISOString(),
          sessions: []
        });
      }
    } else if (labels.includes('log-practice')) {
      const songId = extractField(body, 'Song ID');
      const date = extractField(body, 'Date');
      const notes = extractField(body, 'Notes') || '';

      if (!songId || !date) throw new Error('Missing song ID or date');

      const song = data.songs.find(s => s.id === songId);
      if (!song) throw new Error(`Song not found: ${songId}`);

      song.sessions.push({ date, notes });
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('Successfully updated data/songs.json');

  } catch (error) {
    core.setFailed(error.message);
  }
}

function extractField(body, fieldName) {
  // GitHub Issue forms use ### Label\n\nValue or similar structures
  const regex = new RegExp(`### ${fieldName}\\s+([\\s\\S]*?)(?=\\n###|$)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

run();
