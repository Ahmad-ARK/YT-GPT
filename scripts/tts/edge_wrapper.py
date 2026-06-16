import asyncio
import edge_tts
import sys
import json

async def _main():
    text = sys.argv[1]
    voice = "en-US-AriaNeural"
    output_file = sys.argv[2]
    
    communicate = edge_tts.Communicate(text, voice)
    
    boundaries = []
    with open(output_file, "wb") as file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                file.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                start_ms = chunk["offset"] / 10000
                duration_ms = chunk["duration"] / 10000
                text_chunk = chunk["text"]
                words = text_chunk.split()
                if not words:
                    continue
                total_chars = sum(len(w) for w in words)
                current_time = start_ms
                for word in words:
                    word_duration = (len(word) / total_chars) * duration_ms
                    boundaries.append({
                        "word": word,
                        "startMs": int(current_time),
                        "endMs": int(current_time + word_duration)
                    })
                    current_time += word_duration
            elif chunk["type"] == "WordBoundary":
                start_ms = chunk["offset"] / 10000
                duration_ms = chunk["duration"] / 10000
                boundaries.append({
                    "word": chunk["text"],
                    "startMs": int(start_ms),
                    "endMs": int(start_ms + duration_ms)
                })
    
    print(json.dumps(boundaries))

if __name__ == "__main__":
    asyncio.run(_main())
