import { GoogleGenAI } from '@google/genai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function cleanMarkdown(text) {
  return text.replace(/^```markdown\n|```$/gi, '').trim();
}

async function runWikiEngine() {
  const wikiDir = './.wiki';
  const statePath = path.join(wikiDir, 'wiki_state.json');
  const indexPath = path.join(wikiDir, 'index.md');
  const tagsPath = './tags.txt'; // Forced .txt extension

  const currentCommit = execSync('git rev-parse --short HEAD').toString().trim();

  // ==========================================
  // GENERATE OPTIMIZED STRUCTURAL TAGS MAP
  // ==========================================
  console.log("🏷️  Compiling codebase structural tags database...");
  
  // 1. Compile source files into tags.txt, explicitly excluding lockfiles and models
  execSync('ctags -f tags.txt -R --exclude=node_modules --exclude=.git --exclude=.wiki --exclude=package-lock.json --exclude=my-logic-model --exclude=*.json .');

  // 2. Read the source code tags
  let structuralIndex = fs.readFileSync(tagsPath, 'utf8');

  // 3. Explicitly append package.json contents so Gemini tracks environment settings
  if (fs.existsSync('./package.json')) {
    const packageJsonContent = fs.readFileSync('./package.json', 'utf8');
    structuralIndex += `\n\n--- CRITICAL ENVIRONMENT CONFIGURATION (package.json) ---\n${packageJsonContent}`;
  }

  // ==========================================
  // PHASE 1: INITIALIZATION
  // ==========================================
  if (!fs.existsSync(statePath)) {
    console.log("📁 No wiki directory found. Initializing master index mapping...");
    fs.mkdirSync(wikiDir, { recursive: true });

    console.log("🧠 Sending structural tokens and project settings to Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an advanced documentation architect. Analyze this codebase structural map and core configuration file:
        ${structuralIndex}

        Generate a single master markdown file detailing the file architecture, structural definitions, global variables, and entry paths.
        Explicitly document if the project behaves as CommonJS or ES Modules based on the configuration provided.
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
  // PHASE 2: INCREMENTAL SYNC
  // ==========================================
  console.log("🔄 Existing Wiki configuration found. Checking file changes...");
  const wikiState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  
  const gitDiffRaw = execSync(`git diff ${wikiState.last_synced_commit} HEAD`).toString();
  if (!gitDiffRaw.trim()) {
    console.log("✅ No adjustments detected since your last sync. Tag structures match!");
    return;
  }

  const currentIndex = fs.readFileSync(indexPath, 'utf8');

  console.log("🧠 Updating code architecture definitions based on new layouts...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Here is our current master index documentation framework:
      ${currentIndex}

      Here is the updated structural index map and environment configuration:
      ${structuralIndex}

      Analyze the token and configuration changes. Update the master index documentation to match the latest structural blueprint.
      Format the response as raw markdown text.
    `,
  });

  fs.writeFileSync(indexPath, cleanMarkdown(response.text));

  wikiState.last_synced_commit = currentCommit;
  wikiState.version = parseFloat((wikiState.version + 0.1).toFixed(1));
  fs.writeFileSync(statePath, JSON.stringify(wikiState, null, 2));

  console.log(`✨ Wiki safely updated to Version ${wikiState.version} at commit [${currentCommit}]!`);
}

runWikiEngine().catch(console.error);