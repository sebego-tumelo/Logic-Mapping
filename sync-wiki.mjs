import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Force the SDK to look strictly for your developer API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cleanMarkdown(text) {
  return text.replace(/^```markdown\n|```$/gi, '').trim();
}

async function runWikiEngine() {
  const wikiDir = './.wiki';
  const statePath = path.join(wikiDir, 'wiki_state.json');
  const indexPath = path.join(wikiDir, 'index.md');
  const tagsPath = './tags';

  // Grab the current Git Commit SHA
  const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();

  // ==========================================
  // GENERATE CODEBASE TAG INDEX MAP
  // ==========================================
  console.log("🏷️  Compiling codebase structural tags database...");
  // Generates a tag index file excluding node_modules and hidden folders
  execSync('ctags -R --exclude=node_modules --exclude=.git --exclude=.wiki --exclude=package-lock.json --exclude=my-logic-model --exclude=*.json .');

  if (!fs.existsSync(tagsPath)) {
    console.error("❌ Failed to compile structural tag tokens.");
    return;
  }
  
  const tagStructureIndex = fs.readFileSync(tagsPath, 'utf8');

  // ==========================================
  // PHASE 1: INITIALIZATION (If .wiki doesn't exist)
  // ==========================================
  if (!fs.existsSync(statePath)) {
    console.log("📁 No wiki directory found. Initializing master index mapping...");
    fs.mkdirSync(wikiDir, { recursive: true });

    console.log("🧠 Sending structural token tag maps to Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an advanced documentation architect. Analyze this universal ctags structural code token map:
        ${tagStructureIndex}

        Generate a single master markdown file detailing the file architecture, definitions, global variables, and entry paths.
        Format the response as raw markdown text.
      `,
    });

    fs.writeFileSync(indexPath, cleanMarkdown(response.text));
    
    const initialState = { version: 1.0, last_synced_commit: currentCommit };
    fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2));

    console.log(`✨ Success! Created tag-based tracking baseline at commit [${currentCommit}].`);
    return;
  }

  // ==========================================
  // PHASE 2: INCREMENTAL SYNC WITH TAG DRIFT
  // ==========================================
  console.log("🔄 Existing Wiki tracking configuration found. Checking file changes...");
  const wikiState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  
  const gitDiffRaw = execSync(`git diff ${wikiState.last_synced_commit} HEAD`).toString();
  if (!gitDiffRaw.trim()) {
    console.log("✅ No adjustments detected since your last sync. Tag structures match!");
    return;
  }

  const currentIndex = fs.readFileSync(indexPath, 'utf8');

  console.log("🧠 Updating code architecture definitions based on new tag layouts...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Here is our current master index documentation framework:
      ${currentIndex}

      Here is the updated universal token index map showing precisely how the code definitions look right now:
      ${tagStructureIndex}

      Analyze the tag changes and update the master index documentation to match the latest structural blueprint.
      Format the response as raw markdown text.
    `,
  });

  fs.writeFileSync(indexPath, cleanMarkdown(response.text));

  // Advance tracking checkpoints
  wikiState.last_synced_commit = currentCommit;
  wikiState.version = parseFloat((wikiState.version + 0.1).toFixed(1));
  fs.writeFileSync(statePath, JSON.stringify(wikiState, null, 2));

  console.log(`✨ Wiki safely updated to Version ${wikiState.version} at commit [${currentCommit}]!`);
}

runWikiEngine().catch(console.error);