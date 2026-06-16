import { EdgeTTS } from 'node-edge-tts';

async function test() {
  const tts = new EdgeTTS({ saveSubtitles: true });
  await tts.ttsPromise('Hello world, this is a beautiful day for building a pipeline.', 'test-node.mp3');
  console.log("done");
}
test();
