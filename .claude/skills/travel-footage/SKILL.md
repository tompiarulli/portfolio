---
name: travel-footage
description: Inspect, name and encode footage for the Travel player's channels. Use when Tom drops clips or photos into assets/review/<channel>/ or a batch into assets/inbox/, asks to process or rename them, asks where they were shot, or wants channels set up.
---

# Travel footage

The pipeline itself is documented in CONTRIBUTING.md (under `src/lib/site.ts`) and at the top of `scripts/travel.mjs`. This is the routine around it: work out what each file shows, name it, encode it, check it.

## Privacy

Footage moves from `assets/inbox/` (raw) to `assets/review/<channel>/` (sorted, named, trimmed), both ignored by git, and only Tom's approval puts a master, stripped of sound and metadata, into `assets/travel/<channel>/`, which is committed; see the top of `scripts/travel-approve.mjs`. The originals in the inbox and under review carry GPS. Read the coordinates locally to work out places, and keep them local: never send them, or frames from the footage, to a web search, geocoder, map or any other service. Place them from what you know of the city and from the frames; where you can't, say so and ask Tom.

## A batch: sorting the inbox into channels

Tom may drop footage from many places at once into `assets/inbox/` (ignored by git, like `assets/review/`). Sort it into channels before anything else:

1. Read every file's coordinates and time, as in Inspect below, into one table (`/tmp/travel-inbox.tsv`, outside the repo).
2. Group the files into places: close together (the same city or area, roughly within 30 km) and close in time. Two visits to one place years apart are worth asking about: one channel or two. Tom decides how fine to split (a city each, or a road trip as one); if he hasn't said, propose a channel per city.
3. Files with no coordinates (sent through a messaging app, screen recordings, some edited exports) go with the trip whose dates they fall inside; any that don't, list for Tom.
4. Show Tom the proposal and wait for a yes: per channel, the place, region, `lat`/`lon`, folder name, how many files and the dates; then the files you couldn't place. Flag anything that's probably not travel footage (a screen recording, a photo of a receipt) rather than sorting it.
5. Once he's agreed, make each `assets/review/<channel>/` and move its files in with `mv -n`. What's left in the inbox stays there for Tom.
6. Then work through the channels one at a time, each from Inspect to its own commit, so a batch is never one huge commit and each channel can be checked before the next.

A batch of hundreds of clips is hundreds of megabytes in Git LFS and an hour or more of encoding. Say so before starting one that large, so Tom can check his LFS quota and trim the set first.

## 1. Inspect

For each file in `assets/review/<channel>/`, read where and when it was shot. `mdls` (Spotlight) reads videos and photos alike:

```bash
cd assets/review/<channel>
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

## 3. Approve

Tom trims each file (and crops any flagged portrait shot), then approves it: ask him to run `pnpm travel:approve <channel>` in his own terminal (it refuses to run without one) and wait for him to say it's done. Never approve for him, copy files into `assets/travel/` yourself, edit `scripts/travel.approved.json`, or use `--no-verify`. What he says no to stays under review, with no master, and never reaches the site.

## 4. Encode

```bash
pnpm travel <channel>
```

It encodes from the approved masters in `assets/travel/<channel>/` only what's new or changed and deletes outputs whose master is gone, then rewrites `src/lib/travel.gen.ts`. Encoding uses x264's slowest preset, so a batch takes a few minutes; give the command a long timeout.

## 5. Check

- Every master and output is silent with no location tags:

  ```bash
  for f in assets/travel/<channel>/* public/travel/<channel>/*.mp4; do
    echo "$f audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f" | wc -l | tr -d ' ')"
  done
  ffprobe -v error -show_entries format_tags:stream_tags -of compact <one>   # no location or camera tags
  ```

- Sizes: the script prints each channel's total. Clips run near 100 KB a second, capped near 190; a total well above that per second of footage means something in the settings changed.
- `travel.gen.ts` lists the channel under its folder name.

## A new channel

A channel is a folder of masters in `assets/travel/` plus an entry in `channels` in `src/lib/site.ts`: `place`, `region` (freeform: a town and state, a country), `lat` and `lon` to two decimals for the readouts, and `clips: travel.<folder> ?? []`. `about` is the Info panel's copy, which is Tom's to write; leave it out unless he gives it. Ask where in the list it goes if he hasn't said, since that's the order they're tuned in. A channel Tom says isn't ready yet gets `disabled: true`: its footage stays committed, and it's off the player until he takes the flag out.

The Player tests mock the first channel's footage and give every other channel none, so new footage doesn't break them.

## Committing

The pre-commit hook and CI check every master against `scripts/travel.approved.json`, and every file in `public/travel/` against an approved master. The masters, `scripts/travel.approved.json`, the encoded clips, `travel.gen.ts` and any `site.ts` change go in one commit, `feat(content): ...` for a new channel or `feat(content)`/`fix(content)` for footage changes. Nothing from `assets/inbox/` or `assets/review/` ever goes in. Propose the message and wait for a yes, as for any commit.
