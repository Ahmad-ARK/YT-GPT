import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: Please set GEMINI_API_KEY in your .env file or environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const schemaPath = path.join(process.cwd(), "src", "types", "schema.ts");
const schemaText = fs.readFileSync(schemaPath, "utf-8");

const scenesPath = path.join(process.cwd(), "SCENES.md");
const scenesText = fs.readFileSync(scenesPath, "utf-8");

async function generateStoryboard(topic: string) {
  console.log(`\n🎬 Generating documentary storyboard for topic: "${topic}"...\n`);

  const prompt = `
You are an expert documentary filmmaker and technical JSON architect.
I need a highly engaging, fast-paced video storyboard on the topic: "${topic}".

Here is the Scene Catalog that defines exactly how to use our visual engine:
\`\`\`markdown
${scenesText}
\`\`\`

Here is the TypeScript schema definition for the output I require:
\`\`\`typescript
${schemaText}
\`\`\`

REQUIREMENTS:
1. Return ONLY valid JSON that satisfies the Storyboard interface. No markdown blocks, no intro, no outro text. JUST JSON.
2. Generate 6-8 scenes. Each scene should have a 'narration' field with rich, captivating writing like a Vox or Johnny Harris video essay. Do NOT limit your word count.
3. Use the 'visuals' array (NOT the legacy 'visual' field) for EVERY scene. Each scene MUST have a 'visuals' array.
4. When narration is long or could benefit from visual variety, pack MULTIPLE visuals into the 'visuals' array with appropriate weights. For example, open with a titleCard (weight 0.3) then cut to a map (weight 0.7).
5. Title cards should ALWAYS be paired with another visual — never leave a titleCard alone for an entire long narration.
6. The 'onScreenText' should be a SHORT headline (3-8 words max), NOT a repeat of the narration.
7. Do NOT set durationMs — our TTS pipeline will calculate it automatically from the narration audio.
8. For scenes that require images (like 'cinematicPhoto' or 'archiveMontage'), invent a descriptive filename for the 'imageRef' field (e.g. "roman-colosseum.jpg" or "cyberpunk-city-neon.png"). Our asset pipeline will automatically download or AI-generate these images based on the filename you invent!
9. Incorporate our newest scene types at least once if they fit the topic: 'countdown', 'infographic', 'ranking', and 'cinematicPhoto'.
10. Add a 'bgMusic' field to the root of the JSON (e.g. "tense-orchestral.mp3" or "lofi-beats.mp3").
11. Add an 'sfx' field to specific scenes that need sound effects (e.g. "whoosh.mp3", "heartbeat.mp3", "explosion.mp3"). Only use SFX where it adds impact.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    let jsonString = response.text || "";
    
    if (jsonString.startsWith("\`\`\`json")) {
      jsonString = jsonString.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
    }
    // Handle case where it just starts with ``` without the word json
    if (jsonString.startsWith("\`\`\`")) {
      jsonString = jsonString.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
    }
    
    const storyboard = JSON.parse(jsonString);
    
    const outputPath = path.join(process.cwd(), "public", "storyboard.json");
    fs.writeFileSync(outputPath, JSON.stringify(storyboard, null, 2));
    
    console.log(`✅ Successfully generated and saved to ${outputPath}`);
    console.log(`\nNext Steps:`);
    console.log(`1. Run 'npm run fetch-assets' to download/generate images`);
    console.log(`2. Run 'npm run tts' to generate narration audio`);
    console.log(`3. Run 'npm run build' to render the final video\n`);
    
  } catch (err) {
    console.error("Failed to generate storyboard:", err);
  }
}

const args = process.argv.slice(2);
const topic = args.join(" ") || "The History of the Internet";

generateStoryboard(topic);
