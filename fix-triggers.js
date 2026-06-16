const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;
  
  content = content.replace(/getTriggerFrame\(\s*scene\.narration\s*,/g, 'getTriggerFrame(scene,');
  content = content.replace(/getTriggerFrame\(\s*narration\s*,/g, 'getTriggerFrame(scene,');
  
  // also fix InfographicScene and RankingScene function signature from previous instruction
  content = content.replace(/export function getTriggerFrame\(narration: string/g, 'export function getTriggerFrame(scene: any');
  
  if (content !== original) {
    fs.writeFileSync(p, content);
    console.log('Updated', file);
  }
}
