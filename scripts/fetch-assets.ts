import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Ensure the assets directory exists
const assetsDir = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

interface FluxRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
}

/**
 * Generate an image using the self-hosted Flux.1-dev model on Modal.
 * Requires MODAL_KEY and MODAL_SECRET in the .env file.
 */
async function generateFluxImage(request: FluxRequest, filename: string): Promise<void> {
  const modalKey = process.env.MODAL_KEY;
  const modalSecret = process.env.MODAL_SECRET;

  if (!modalKey || !modalSecret) {
    console.error(`❌ Cannot generate ${filename}: MODAL_KEY or MODAL_SECRET is missing in .env`);
    return;
  }

  const outPath = path.join(assetsDir, filename);
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skipping generation, file already exists: ${filename}`);
    return;
  }

  console.log(`🎨 Generating image with Flux: "${request.prompt}"...`);
  
  try {
    const response = await fetch("https://ahmadkhalid236997--flux-api-model-web.modal.run", {
      method: "POST",
      headers: {
        "Modal-Key": modalKey,
        "Modal-Secret": modalSecret,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        width: 1920,
        height: 1080,
        steps: 30,
        guidance: 3.5,
        ...request
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Saved generated image to public/assets/${filename}`);
  } catch (error) {
    console.error(`❌ Failed to generate image:`, error);
  }
}

/**
 * Search Wikimedia Commons for an image and download the first result.
 */
async function fetchWikimediaImage(query: string, filename: string): Promise<void> {
  const outPath = path.join(assetsDir, filename);
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skipping fetch, file already exists: ${filename}`);
    return;
  }

  console.log(`🔍 Searching Wikimedia for: "${query}"...`);
  try {
    // 1. Search for files matching the query
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=File:${encodeURIComponent(query)}&srnamespace=6&format=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;

    if (!searchData.query?.search?.length) {
      console.warn(`⚠️ No Wikimedia results found for "${query}"`);
      return;
    }

    const title = searchData.query.search[0].title;

    // 2. Get the image URL
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
    const infoRes = await fetch(imageInfoUrl);
    const infoData = await infoRes.json() as any;
    
    const pages = infoData.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId].imageinfo[0].url;

    // 3. Download the image
    console.log(`⬇️  Downloading ${imageUrl}...`);
    const imgRes = await fetch(imageUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outPath, buffer);
    
    console.log(`✅ Saved Wikimedia image to public/assets/${filename}`);
  } catch (error) {
    console.error(`❌ Failed to fetch Wikimedia image:`, error);
  }
}

async function processStoryboardAssets() {
  const storyboardPath = path.join(process.cwd(), 'public', 'storyboard.json');
  if (!fs.existsSync(storyboardPath)) {
    console.error("❌ storyboard.json not found!");
    return;
  }

  console.log("📂 Scanning storyboard.json for required assets...");
  const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
  
  // 1. Check audio files (bgMusic, sfx)
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const silencePath = path.join(audioDir, 'silence.mp3');
  
  const ensureAudio = (filename: string) => {
    if (!filename) return;
    const p = path.join(audioDir, filename);
    if (!fs.existsSync(p)) {
      console.log(`⚠️  Audio file ${filename} not found, using silence fallback.`);
      if (fs.existsSync(silencePath)) {
        fs.copyFileSync(silencePath, p);
      }
    }
  };

  if (storyboard.bgMusic) ensureAudio(storyboard.bgMusic);

  const scenes = storyboard.scenes || [];
  for (const scene of scenes) {
    if (scene.sfx) ensureAudio(scene.sfx);

    const visuals = scene.visuals || (scene.visual ? [scene.visual] : []);
    for (const visual of visuals) {
      if (!visual.directive) continue;
      
      let directive;
      try {
        directive = JSON.parse(visual.directive);
      } catch (e) {
        continue;
      }

      if (visual.type === "cinematicPhoto" && directive.imageRef) {
        const prompt = directive.caption ? directive.caption + ", high quality, detailed" : directive.imageRef.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
        await generateFluxImage({ prompt }, directive.imageRef);
      } 
      else if (visual.type === "archiveMontage" && directive.images) {
        for (const img of directive.images) {
           const prompt = img.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
           await generateFluxImage({ prompt }, img);
        }
      }
    }
  }
  console.log("✅ Asset fetching complete!");
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--test') {
    console.log("Running asset fetcher test...");
    await fetchWikimediaImage("Apollo 11 launch", "apollo11.jpg");
    await generateFluxImage({ prompt: "A cinematic shot of a futuristic neon city, rain, 4k, hyperrealistic" }, "cybercity.png");
  } else {
    await processStoryboardAssets();
  }
}

main();
