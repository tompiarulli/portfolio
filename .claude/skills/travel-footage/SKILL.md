---
name: travel-footage
description: Inspect, name and encode footage for a Travel player channel. Use when Tom drops clips or photos into assets/travel/<channel>/, asks to process or rename them, asks where they were shot, or wants a new channel set up.
---

# Travel footage

The pipeline itself is documented in CONTRIBUTING.md (under `src/lib/site.ts`) and at the top of `scripts/travel.mjs`. This is the routine around it: work out what each file shows, name it, encode it, check it.

## Privacy

The originals in `assets/travel/` carry GPS, which is why the folder is ignored by git and the encode strips all metadata. Read the coordinates locally to work out places, and keep them local: never send them, or frames from the footage, to a web search, geocoder, map or any other service. Place them from what you know of the city and from the frames; where you can't, say so and ask Tom.

## 1. Inspect

For each file in `assets/travel/<channel>/`, read where and when it was shot. `mdls` (Spotlight) reads videos and photos alike:

```bash
cd assets/travel/<channel>
for f in *; do
  printf '%s\t' "$f"
  mdls -raw -name kMDItemLatitude "$f"; printf '\t'
  mdls -raw -name kMDItemLongitude "$f"; printf '\t'
  mdls -raw -name kMDItemContentCreationDate "$f"; echo
done
```

For videos, `ffprobe -v error -show_entries format_tags=com.apple.quicktime.location.ISO6709 -of csv=p=0 <file>` also gives the altitude in metres, which tells a lookout or deck from the street below it.

Then look at them. Pull a frame from each into a scratch folder outside the repo and tile them into one contact sheet, so a single image read covers the batch:

```bash
mkdir -p /tmp/travel-frames
for f in IMG_*.MOV; do
  ffmpeg -v error -y -ss 2 -i "$f" -frames:v 1 -vf scale=480:270:force_original_aspect_ratio=increase,crop=480:270 "/tmp/travel-frames/${f%.*}.jpg"
done
# Then hstack each row of three and vstack the rows into one grid.jpg.
```

The crop matches what the player shows (16:9 from the middle), so a portrait shot whose subject is off-centre shows up here. Flag those to Tom: he crops them by hand before encoding.

## 2. Name

The player's strip shows each clip's file name, so the name says what it shows: lowercase words with underscores (`olympic_sculpture_park`). Keep the original extension; the script slugs the rest.

- Name the place or the thing, the way someone from there would say it (`elliott_bay`, not `seattle_water`). A time of day or a detail only when it tells two clips apart (`bay_sunset`, `park_sunset`).
- Several clips from one spot get names for what each one shows (`chihuly_glass`, `glass_floats`, `glasshouse`), never `_1`, `_2`.
- Don't reuse a name already in the folder; the script refuses two files that slug the same.
- Files Tom has already named are his: leave them.

Unless Tom has asked you to rename them outright, show him a table first (file, place, time, proposed name, and a note on anything you're unsure of) and wait for a yes. Rename with `mv -n`, so nothing is overwritten.

## 3. Encode

```bash
pnpm travel <channel>
```

It encodes only what's new or renamed and deletes outputs whose source is gone, then rewrites `src/lib/travel.gen.ts`. Encoding uses x264's slowest preset, so a batch takes a few minutes; give the command a long timeout.

## 4. Check

- Every output is silent with no location tags:

  ```bash
  cd public/travel/<channel>
  for f in *.mp4; do
    echo "$f audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f" | wc -l | tr -d ' ')"
  done
  ffprobe -v error -show_entries format_tags -of compact <one>.mp4   # no location key
  ```

- Sizes: the script prints each channel's total. Clips run near 100 KB a second, capped near 190; a total well above that per second of footage means something in the settings changed.
- `travel.gen.ts` lists the channel under its folder name.

## A new channel

A channel is a folder in `assets/travel/` plus an entry in `channels` in `src/lib/site.ts`: `place`, `region` (freeform: a town and state, a country), `lat` and `lon` to two decimals for the readouts, and `clips: travel.<folder> ?? []`. `about` is the Info panel's copy, which is Tom's to write; leave it out unless he gives it. Ask where in the list it goes if he hasn't said, since that's the order they're tuned in.

The Player tests mock the first channel's footage and give every other channel none, so new footage doesn't break them.

## Committing

The encoded clips, `travel.gen.ts` and any `site.ts` change go in one commit, `feat(content): ...` for a new channel or `feat(content)`/`fix(content)` for footage changes. The sources never go in. Propose the message and wait for a yes, as for any commit.
