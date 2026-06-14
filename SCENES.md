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
