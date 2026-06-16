import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { HttpsProxyAgent } from 'https-proxy-agent';

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

// Get Proxy Agent if configured
function getFetchAgent() {
  const proxyUrl = process.env.ASSET_FETCH_PROXY || process.env.HTTPS_PROXY;
  return proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
}

/**
 * Generate an image using the self-hosted Flux.1-dev model on Modal.
 */
async function generateFluxImage(request: FluxRequest, filename: string): Promise<boolean> {
  const modalKey = process.env.MODAL_KEY;
  const modalSecret = process.env.MODAL_SECRET;

  if (!modalKey || !modalSecret) {
    console.error(`❌ Cannot generate ${filename}: MODAL_KEY or MODAL_SECRET is missing in .env`);
    return false;
  }

  const outPath = path.join(assetsDir, filename);
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skipping generation, file already exists: ${filename}`);
    return true;
  }

  console.log(`🎨 Generating image with Flux: "${request.prompt}"...`);
  
  try {
    const agent = getFetchAgent();
    const response = await fetch("https://ahmadkhalid236997--flux-api-model-web.modal.run", {
      method: "POST",
      agent,
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
    } as any);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Saved generated image to public/assets/${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate image:`, error);
    return false;
  }
}

/**
 * Search Wikimedia Commons and enforce license.
 */
async function fetchWikimediaImage(query: string, filename: string): Promise<string | null> {
  const outPath = path.join(assetsDir, filename);
  const agent = getFetchAgent();

  console.log(`🔍 Searching Wikimedia for: "${query}"...`);
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=File:${encodeURIComponent(query)}&srnamespace=6&format=json`;
    const searchRes = await fetch(searchUrl, { agent } as any);
    const searchData = await searchRes.json() as any;

    if (!searchData.query?.search?.length) {
      console.warn(`⚠️ No Wikimedia results found for "${query}"`);
      return null;
    }

    // Try up to 3 results to find a valid license
    for (let i = 0; i < Math.min(3, searchData.query.search.length); i++) {
      const title = searchData.query.search[i].title;

      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
      const infoRes = await fetch(imageInfoUrl, { agent } as any);
      const infoData = await infoRes.json() as any;
      
      const pages = infoData.query.pages;
      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId].imageinfo?.[0];

      if (!imageInfo) continue;

      const imageUrl = imageInfo.url;
      const ext = imageInfo.extmetadata || {};
      const licenseShort = ext.LicenseShortName?.value || "Unknown";
      const artist = ext.Artist?.value?.replace(/<[^>]*>?/gm, '') || "Unknown author"; // Strip HTML

      let accepted = false;
      const l = licenseShort.toLowerCase();
      
      if (l.includes("pd") || l.includes("public domain") || l.includes("cc0")) {
        accepted = true;
      } else if (l.includes("cc by") || l.includes("cc-by")) {
        // Enforce SA override
        if (l.includes("sa") && process.env.ALLOW_SA !== "true") {
          console.warn(`   ⏭️ Skipping result ${i+1}: CC BY-SA (ShareAlike) is disabled by default.`);
          continue;
        }
        accepted = true;
      }

      if (!accepted) {
        console.warn(`   ⏭️ Skipping result ${i+1}: Unacceptable license (${licenseShort})`);
        continue;
      }

      // Download
      if (!fs.existsSync(outPath)) {
        console.log(`⬇️  Downloading ${imageUrl} (License: ${licenseShort})...`);
        const imgRes = await fetch(imageUrl, { agent } as any);
        const arrayBuffer = await imgRes.arrayBuffer();
        fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
      } else {
        console.log(`⏭️  File ${filename} exists, skipping download.`);
      }

      // Return attribution string
      const attribution = `"${title.replace('File:', '')}" by ${artist} is licensed under ${licenseShort}. Source: ${imageUrl}`;
      return attribution;
    }
    
    console.warn(`⚠️ No acceptable licenses found for "${query}" on Wikimedia.`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to fetch Wikimedia image:`, error);
    return null;
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
  
  // 1. Check audio files
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  const silencePath = path.join(audioDir, 'silence.mp3');
  const ensureAudio = (filename: string) => {
    if (!filename) return;
    const p = path.join(audioDir, filename);
    if (!fs.existsSync(p)) {
      console.log(`⚠️  Audio file ${filename} not found, using silence fallback.`);
      if (fs.existsSync(silencePath)) fs.copyFileSync(silencePath, p);
    }
  };

  if (storyboard.bgMusic) ensureAudio(storyboard.bgMusic);

  const credits: string[] = [];

  const scenes = storyboard.scenes || [];
  for (const scene of scenes) {
    if (scene.sfx) ensureAudio(scene.sfx);

    const visuals = scene.visuals || (scene.visual ? [scene.visual] : []);
    for (const visual of visuals) {
      if (!visual.directive) continue;
      
      let directive;
      try { directive = JSON.parse(visual.directive); } catch (e) { continue; }

      const isHistorical = ["archiveMontage", "archivalPhoto", "newspaper", "document"].includes(visual.type) 
                           || (visual.type === "cinematicPhoto" && directive.caption?.toLowerCase().includes("history"));

      const resolveImage = async (filename: string, promptInfo: string) => {
        let success = false;
        if (isHistorical) {
           // Try Wikimedia First
           const query = promptInfo || filename.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
           const attribution = await fetchWikimediaImage(query, filename);
           if (attribution) {
             credits.push(attribution);
             success = true;
           }
        }
        
        // Fallback or purely illustrative
        if (!success) {
           const prompt = promptInfo ? promptInfo + ", high quality, detailed" : filename.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
           const genOk = await generateFluxImage({ prompt }, filename);
           if (genOk) credits.push(`Generative imagery for "${prompt}" produced via Flux.1-dev`);
        }
      };

      if (visual.type === "cinematicPhoto" && directive.imageRef) {
        await resolveImage(directive.imageRef, directive.caption);
      } 
      else if (visual.type === "archiveMontage" && directive.images) {
        for (const img of directive.images) {
           await resolveImage(img, "");
        }
      }
      else if (["archivalPhoto", "newspaper", "document"].includes(visual.type) && directive.imageRef) {
        await resolveImage(directive.imageRef, directive.headline || directive.caption || "");
      }
    }
  }

  if (credits.length > 0) {
    const creditsStr = "# Video Credits\n\n" + credits.map(c => "- " + c).join('\n');
    fs.writeFileSync(path.join(process.cwd(), 'CREDITS.md'), creditsStr);
    console.log("📝 Generated CREDITS.md");
  }

  console.log("✅ Asset fetching complete!");
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--test') {
    console.log("Running asset fetcher test...");
    const cr = await fetchWikimediaImage("Apollo 11 launch", "apollo11.jpg");
    console.log(cr);
  } else {
    await processStoryboardAssets();
  }
}

main();
