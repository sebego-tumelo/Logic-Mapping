import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
const apiKey = import.meta.env.GEMINI_API_KEY;

// Initialize the Gemini API client using your Codespace environment variable
const ai = new GoogleGenAI({ apiKey });

async function runWikiEngine() {
  const wikiDir = './.wiki';
  const statePath = path.join(wikiDir, 'wiki_state.json');
  const indexPath = path.join(wikiDir, 'index.md');

  // Grab the current Git Commit SHA right now
  const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();

  // ==========================================
  // PHASE 1: INITIALIZATION (If .wiki doesn't exist)
  // ==========================================
  if (!fs.existsSync(statePath)) {
    console.log("📁 No wiki directory found. Initializing codebase-snapshot...");
    
    // 1. Force create the folder structure
    fs.mkdirSync(wikiDir, { recursive: true });

    // 2. Run Repomix programmatically via CLI to create the full code map
    console.log("📦 Running Repomix to pack raw source files...");
    execSync('npx repomix --output codebase-snapshot.xml');

    // 3. Read the generated code bundle
    const codeSnapshot = fs.readFileSync('codebase-snapshot.xml', 'utf8');

    console.log("🧠 Sending full snapshot to Gemini to generate your Initial Wiki...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this full codebase snapshot:
        ${codeSnapshot}

        Generate a single master markdown file detailing the file architecture, domain dependencies, and API entry points.
        Format the response as raw markdown. Do not wrap it in triple backticks blocks.
      `,
    });

    // 4. Save files to your workspace
    fs.writeFileSync(indexPath, response.text);
    
    const initialState = { version: 1.0, last_synced_commit: currentCommit };
    fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2));

    // Optional: clean up the heavy xml file to keep codespace clean
    fs.unlinkSync('codebase-snapshot.xml');

    console.log(`✨ Success! Created initial wiki tracking baseline at commit [${currentCommit}].`);
    return;
  }

  // ==========================================
  // PHASE 2: INCREMENTAL UPDATE (If .wiki exists)
  // ==========================================
  console.log("🔄 Existing Wiki found. Calculating incremental changes...");
  const wikiState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  
  // Calculate git diff since the last recorded baseline commit
  const gitDiff = execSync(`git diff ${wikiState.last_synced_commit} HEAD`).toString();
  
  if (!gitDiff.trim()) {
    console.log("✅ No code changes detected since your last sync. Wiki is current!");
    return;
  }

  const currentIndex = fs.readFileSync(indexPath, 'utf8');

  console.log("🧠 Sending delta patch updates to Gemini API...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Here is our current master index documentation:
      ${currentIndex}

      Here are the lines of raw code that changed in our project since the last documentation build:
      ${gitDiff}

      Rewrite the master index documentation to accurately reflect these code modifications. Maintain the broad structure.
      Format the response as raw markdown text. Do not wrap it in markdown code blocks.
    `,
  });

  // Overwrite the documentation with the newly adjusted structure
  fs.writeFileSync(indexPath, response.text);

  // Advance our Git tracking checkpoint to current state
  wikiState.last_synced_commit = currentCommit;
  wikiState.version = parseFloat((wikiState.version + 0.1).toFixed(1));
  fs.writeFileSync(statePath, JSON.stringify(wikiState, null, 2));

  console.log(`✨ Wiki safely bumped to Version ${wikiState.version} at commit [${currentCommit}]!`);
}

runWikiEngine().catch(console.error);