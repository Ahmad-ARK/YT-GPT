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
I need a highly engaging, fast-paced 60-second video storyboard on the topic: "${topic}".

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
2. The pacing must be fast—each scene should be 4000ms to 8000ms long. Total around 6-8 scenes.
3. The 'narration' should be written like a captivating Vox or Johnny Harris video essay.
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
    
    // Clean up markdown code blocks if the model accidentally includes them
    if (jsonString.startsWith("\`\`\`json")) {
      jsonString = jsonString.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
    }
    
    const storyboard = JSON.parse(jsonString);
    
    const outputPath = path.join(process.cwd(), "public", "storyboard.json");
    fs.writeFileSync(outputPath, JSON.stringify(storyboard, null, 2));
    
    console.log(`✅ Successfully generated and saved to ${outputPath}`);
    console.log(`To build the video, run: npm run build\n`);
    
  } catch (err) {
    console.error("Failed to generate storyboard:", err);
  }
}

const args = process.argv.slice(2);
const topic = args.join(" ") || "The History of the Internet";

generateStoryboard(topic);
