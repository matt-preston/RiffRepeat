const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const issue = github.context.payload.issue;
    const title = issue.title;
    const body = issue.body;
    const labels = issue.labels.map(l => l.name);
    
    console.log(`Processing Issue: "${title}"`);

    const dataPath = path.join(process.cwd(), 'data/songs.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    let actionTaken = false;
    let labelToAdd = null;

    // Detect action type
    if (title.startsWith('[New Song]:') || labels.includes('new-song')) {
      console.log('Detected: New Song');
      const songTitle = extractField(body, 'Song Title');
      const artist = extractField(body, 'Artist');
      let category = (extractField(body, 'Category') || '').toLowerCase().trim();
      const notes = extractField(body, 'Notes') || '';
      
      if (!songTitle || !artist) throw new Error('Missing title or artist');

      // Validate category
      if (category !== 'acoustic' && category !== 'electric') {
        console.log(`Invalid category "${category}", defaulting to acoustic`);
        category = 'acoustic';
      }

      const id = songTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (data.songs.find(s => s.id === id)) {
        console.log(`Song with id "${id}" already exists.`);
      } else {
        data.songs.push({
          id,
          title: songTitle,
          artist,
          category,
          notes,
          addedAt: new Date().toISOString(),
          sessions: []
        });
        actionTaken = true;
        labelToAdd = 'new-song';
      }
    } else if (title.startsWith('[Log Practice]:') || labels.includes('log-practice')) {
      console.log('Detected: Log Practice');
      const songId = extractField(body, 'Song ID');
      const date = extractField(body, 'Date');

      if (!songId || !date) throw new Error('Missing song ID or date');

      const song = data.songs.find(s => s.id === songId);
      if (!song) throw new Error(`Song not found: ${songId}`);

      song.sessions.push({ date });
      actionTaken = true;
      labelToAdd = 'log-practice';
    } else if (title.startsWith('[Delete Song]:') || labels.includes('delete-song')) {
      console.log('Detected: Delete Song');
      const songId = extractField(body, 'Song ID');
      
      if (!songId) throw new Error('Missing song ID');

      const initialLength = data.songs.length;
      data.songs = data.songs.filter(s => s.id !== songId);
      
      if (data.songs.length < initialLength) {
        console.log(`Deleted song with id: ${songId}`);
        actionTaken = true;
        labelToAdd = 'delete-song';
      }
    }

    if (actionTaken) {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log('Successfully updated data/songs.json');

      if (labelToAdd && !labels.includes(labelToAdd)) {
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
        await octokit.rest.issues.addLabels({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: issue.number,
          labels: [labelToAdd]
        });
      }
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

function extractField(body, fieldName) {
  const regex = new RegExp(`### ${fieldName}\\s+([\\s\\S]*?)(?=\\n###|\\r\\n###|$)`, 'i');
  const match = body.match(regex);
  if (match) {
    const value = match[1].trim();
    return value === '_No response_' ? '' : value;
  }
  return null;
}

run();
