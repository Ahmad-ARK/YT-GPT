# Documentary Pipeline Scene Catalog

This document defines the available visual scene types that the rendering engine supports, what they look like, and exactly how to format their `directive` JSON string.

## 1. Title Card (`titleCard`)
**Use Case:** The opening hook of the documentary. Sets the mood with slow cinematic zooming and bold typography.
**Directive Format:**
```json
{
  "title": "Main bold text (e.g., 'The Fall of Rome')",
  "subtitle": "Smaller sub-text below the title"
}
```

## 2. 3D Map (`map`)
**Use Case:** Showing geographic scale, troop movements, or highlighting specific cities/events. It renders a 3D tilted map of the earth with red pins dropping at specific latitude/longitude coordinates, connecting to elevated text labels.
**Important:** Do NOT use this if you just want to show a map without points of interest. It is designed to highlight specific `locations`.
**Directive Format:**
```json
{
  "locations": [
    {"lat": 41.9, "lng": 12.5, "label": "Rome"},
    {"lat": 44.0, "lng": 28.0, "label": "Goths cross Danube (376 AD)"}
  ]
}
```

## 3. 3D Globe (`globe`)
**Use Case:** Showing global reach, international connections, or planetary scale. It renders a 3D spinning globe in space, complete with oceans and landmasses. You can drop pins and draw flight paths/connections between cities that wrap around the sphere.
**Directive Format:**
```json
{
  "startRotation": [0, -20, 0],
  "endRotation": [-90, -20, 0],
  "locations": [
    {"lat": 48.85, "lng": 2.35, "label": "Paris", "triggerWord": "paris"},
    {"lat": 51.5, "lng": -0.1, "label": "London", "triggerWord": "london"}
  ],
  "connections": [
    {"from": [2.35, 48.85], "to": [-0.1, 51.5], "triggerWord": "conflict"}
  ]
}
```

## 3. Timeline (`timeline`)
**Use Case:** Demonstrating a sequence of historical events. A vertical timeline line draws down the screen, and events pop in as the line reaches them.
**Directive Format:**
```json
{
  "events": [
    {"year": "1914", "title": "World War I begins"},
    {"year": "1945", "title": "United Nations formed"}
  ]
}
```

## 4. Stat Counter (`stat`)
**Use Case:** Driving home a massive number or statistic. Renders a giant number that counts up dynamically with spring physics to hit its target.
**Directive Format:**
```json
{
  "value": 476,
  "prefix": "AD ",
  "suffix": "",
  "label": "Deposition of Romulus Augustulus"
}
```

## 5. Quote Card (`quoteCard`)
**Use Case:** Presenting a powerful quote from a historical figure. The quote is typed out on screen with a typewriter effect, followed by the author's name sliding in.
**Directive Format:**
```json
{
  "quote": "History is written by the victors.",
  "author": "Winston Churchill",
  "context": "1940s"
}
```

## 6. Animated Chart (`chart`)
**Use Case:** Showing growth or comparison over time using a bar chart. Bars animate upward sequentially.
**Directive Format:**
```json
{
  "title": "Nations Formed",
  "data": [
    {"label": "1800", "value": 10},
    {"label": "1900", "value": 45},
    {"label": "2000", "value": 195}
  ]
}
```

## 7. Archive Montage (`archiveMontage`)
**Use Case:** Giving a human or historical face to the narrative. Displays a sequence of 3 photos dropping onto the screen like scattered polaroids, each with a slow Ken Burns zoom effect.
**Directive Format:**
```json
{}
```
*(No directive needed. Instead, you MUST populate the `assets` array with exactly 3 working Pexels image URLs. DO NOT use Wikimedia/Wikipedia URLs as they are blocked by CORS).*

## 8. Comparison Split-Screen (`comparison`)
**Use Case:** Side-by-side contrast (Before/After, East vs West, Old vs New). Features background images with Ken Burns zoom, and bullet points that animate in *exactly* when the narrator says a specific word. The panels themselves also pop forward and highlight when spoken about.
**Directive Format:**
```json
{
  "title": "The Cold War Divide",
  "left": { 
    "title": "United States", 
    "subtitle": "Capitalism & Democracy",
    "triggerWord": "states",
    "imageRef": "https://images.pexels.com/...",
    "points": [
      { "text": "Free Market", "triggerWord": "capitalism" },
      { "text": "NATO Alliance", "triggerWord": "allies" }
    ]
  },
  "right": { 
    "title": "Soviet Union", 
    "subtitle": "Communism & State Control",
    "triggerWord": "soviet",
    "imageRef": "https://images.pexels.com/...",
    "points": [
      { "text": "Command Economy", "triggerWord": "economy" },
      { "text": "Warsaw Pact", "triggerWord": "conflict" }
    ]
  }
}
```

## 9. Newspaper Headline (`newspaper`)
**Use Case:** A dramatic historical turning point. A vintage newspaper spins and slams onto the screen with a loud impact. Built dynamically in CSS (no image required).
**Directive Format:**
```json
{
  "paperName": "THE DAILY CHRONICLE",
  "date": "JULY 21, 1969",
  "headline": "MAN WALKS ON MOON",
  "subhead": "Neil Armstrong takes a giant leap for mankind."
}
```

## 10. Classified/Historical Document (`document`)
**Use Case:** Presenting primary sources, declassified files, treaties, letters, or memos. An aged, textured document with torn edges, coffee stains, and fold creases slides onto screen. A classification stamp slams down, and a red underline highlights key phrases in sync with the narration.

**⚠️ CRITICAL: The `text` field is the actual content printed on the document. It MUST be contextually relevant to the topic being discussed in the narration. Write it as if it were a real excerpt from a real historical document, memo, letter, or report related to the subject. Do NOT use generic placeholder text. For example:**
- If the narration discusses the Cuban Missile Crisis, the document text should read like a real CIA intelligence briefing about Soviet missiles in Cuba.
- If the narration discusses a treaty, the document text should read like an excerpt from that treaty.
- If the narration discusses a letter, write it as if quoting from that actual letter.

**Directive Format:**
```json
{
  "title": "CENTRAL INTELLIGENCE AGENCY",
  "date": "22 OCTOBER 1962",
  "classification": "TOP SECRET",
  "refNumber": "CIA-NIE-85-3-62",
  "text": "Photographic evidence confirms the presence of medium-range ballistic missile launch sites in the San Cristobal area of western Cuba. These installations are believed to be capable of delivering nuclear warheads to targets within the continental United States.",
  "highlights": [
    { "match": "medium-range ballistic missile launch sites", "triggerWord": "missiles" },
    { "match": "delivering nuclear warheads", "triggerWord": "nuclear" }
  ],
  "signature": "John McCone, Director"
}
```
**Fields:**
- `title` — The issuing agency or document header (e.g. "CENTRAL INTELLIGENCE AGENCY", "DEPARTMENT OF STATE", "OFFICE OF THE PRESIDENT")
- `date` — Date on the document, written naturally (e.g. "22 OCTOBER 1962")
- `classification` — Stamp text (e.g. "TOP SECRET", "CONFIDENTIAL", "EYES ONLY"). Defaults to "TOP SECRET".
- `refNumber` — A realistic-looking document reference number for authenticity
- `text` — **The body content. Must be relevant to the narration context.** Write 1-3 sentences as if quoting from the real document.
- `highlights` — Array of `{ match, triggerWord }`. `match` must exactly match a substring in `text`. The red underline draws when the narrator says `triggerWord`.
- `signature` — Optional signature line at the bottom

## 11. Countdown Timer (`countdown`)
**Use Case:** Building dramatic tension — deadlines, time-critical events, launch sequences. A large ticking number counts down with a depleting circular progress ring and pulsing red glow that intensifies as zero approaches.
**Directive Format:**
```json
{
  "from": 13,
  "to": 0,
  "label": "DAYS TO NUCLEAR WAR",
  "suffix": "days"
}
```
**Fields:**
- `from` — Starting number (e.g. 13)
- `to` — Ending number (e.g. 0)
- `label` — Text displayed above the number (e.g. "DAYS TO NUCLEAR WAR")
- `suffix` — Unit displayed below the number (e.g. "days", "hours", "seconds")

## 12. Infographic Dashboard (`infographic`)
**Use Case:** Showing multiple data points simultaneously — human costs, economic impacts, comparative statistics. A grid of glass-morphism cards, each with an emoji icon, a counting number, and a label. Items appear one-by-one triggered by narration.
**Directive Format:**
```json
{
  "title": "The Human Cost of War",
  "items": [
    { "icon": "💀", "value": "50M", "label": "Lives Lost", "triggerWord": "casualties" },
    { "icon": "💰", "value": "$4T", "label": "Economic Cost", "triggerWord": "cost" },
    { "icon": "🏠", "value": "70M", "label": "Displaced", "triggerWord": "displaced" }
  ]
}
```
**Fields:**
- `title` — Dashboard heading
- `items[]` — Array of 3-6 data points, each with `icon` (emoji), `value` (display string like "50M" or "$4T"), `label` (description), and `triggerWord` (narration word that triggers this card's entrance)

## 13. Ranked List (`ranking`)
**Use Case:** Top-N lists, deadliest battles, most powerful empires, largest economies. Items slide in one by one from the right, with gold/silver/bronze accents for top 3 ranks. Broadcast-style graphics.
**Directive Format:**
```json
{
  "title": "Deadliest Conflicts in History",
  "items": [
    { "rank": 1, "label": "World War II", "value": "70-85M", "triggerWord": "second" },
    { "rank": 2, "label": "Mongol Conquests", "value": "40M", "triggerWord": "mongol" },
    { "rank": 3, "label": "World War I", "value": "20M", "triggerWord": "first" }
  ]
}
```
**Fields:**
- `title` — List heading
- `items[]` — Array of ranked entries, each with `rank` (number), `label` (name), `value` (stat/number), and `triggerWord` (narration word that triggers this item's slide-in)
- Top 3 ranks automatically get gold/silver/bronze color accents

## 14. Cinematic Photo (`cinematicPhoto`)
**Use Case:** Showing a single historical or AI-generated image with dramatic Ken Burns panning, heavy vignette, and film grain. Excellent for setting the mood or showing actual historical footage fetched via the asset pipeline.
**Directive Format:**
```json
{
  "imageRef": "apollo11.jpg",
  "caption": "Apollo 11 Launch, 1969",
  "motion": "zoom-out"
}
```
**Fields:**
- `imageRef` — The filename of the image in the `public/assets` folder. The asset generation pipeline will generate or fetch this image automatically if configured.
- `caption` — Optional. Small text displayed at the bottom of the image.
- `motion` — The Ken Burns motion path. Valid options: `"zoom-in"`, `"zoom-out"`, `"pan-left"`, `"pan-right"`, `"pan-up"`, `"pan-down"`.

---

### 🔥 Multi-Visual Segments (Critical for Quality)

Instead of attaching a single `visual` to a scene, you can use a `visuals` array to pack multiple visual cuts into one narration block. The audio plays continuously while the visuals cut between each other. This is how professional documentaries are edited!

**Use `visuals` when:**
- A narration block is long (>10 seconds) and a single visual would feel static
- You want to open with a titleCard and immediately cut to supporting visuals
- You want to show a stat and then a chart back-to-back under one flowing sentence

**Each visual gets a `weight`** that controls what fraction of the scene duration it receives. The weights are relative — they don't need to add up to any specific number.

**Example: A 15-second narration with 3 visual cuts:**
```json
{
  "id": "scene-01",
  "narration": "The Roman Empire, at its peak, stretched across three continents. From the British Isles to the deserts of North Africa, its reach was unmatched in the ancient world.",
  "onScreenText": "The Reach of Rome",
  "visuals": [
    { "type": "titleCard", "directive": "{\"title\": \"The Roman Empire\", \"subtitle\": \"At Its Peak\"}", "weight": 0.3 },
    { "type": "map", "directive": "{\"locations\": [{\"lat\": 51.5, \"lng\": -0.1, \"label\": \"Britannia\"}, {\"lat\": 36.8, \"lng\": 10.2, \"label\": \"Carthage\"}]}", "weight": 0.7 }
  ]
}
```
In this example, the titleCard gets ~30% of the time (4.5 seconds) and the map gets ~70% (10.5 seconds). The narration plays uninterrupted across both.

**Rules:**
- If you use `visuals` (array), do NOT also include a `visual` (singular) field.
- If you use `visual` (singular, legacy), that's fine too — it works as before.
- Every entry in `visuals` must have a `type`, `directive`, and `weight`.
- Title cards should generally have a low weight (0.2–0.35) when paired with other visuals.
- Data-heavy visuals (timeline, chart, map) should get higher weights (0.5–0.8).
