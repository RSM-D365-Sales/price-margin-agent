# demo-kit — booth video and presenter kit

Everything needed to put Price Margin Alerts (the app's ribbon calls it the
*Pricing & Margin Workspace*) into the IFPA looping reel and to walk someone
through the live demo. Built the same way as `../sales-prorate/demo-kit` and
`../grower-harvesting/demo-kit`.

| File | What it is |
|---|---|
| `scenes.mjs` | **Video source of truth:** scene order, seconds per scene, captions, voice-over lines, title-card labels. Edit this, then re-run the scripts below. |
| `record.mjs` | Drives the running app with Playwright and records the tour (1920×1080) plus the title card, converts to MP4, and joins them into the reel. |
| `write-script.mjs` | Regenerates `voiceover-script.md`, injects the script into `cheat-sheet.html`, and writes the single-file `price-margin-alerts-cheat-sheet.html`. |
| `scratch-vo.mjs` | Lays a Windows text-to-speech read over the tour so pacing can be checked before a real voice is recorded. |
| `subtitle-reel.mjs` | Burns the narration into the reel as subtitles (bottom-right) for a muted show-floor screen. |
| `shot.mjs` | Screenshots every page at the recording viewport, for a quick visual check before recording. |
| `voiceover-script.md` | Generated. The narrator's copy with timecodes. |
| `interstitial.html` | The 12 s "Up next" title card. Same card as the other Bluestem apps; labels come in on the query string (`?next=`, `?tag=`, `?eyebrow=`, `?nodes=`, and `?erp=` / `?link=` for the D365 node). |
| `cheat-sheet.html` | Presenter cheat sheet source: click path, what to say, cast, Q&A, resets, plus the voice-over script (injected from `scenes.mjs`). |
| `price-margin-alerts-cheat-sheet.html` | **Generated.** The same sheet as one self-contained file (fonts and logos inlined). This is the one to share with the team. |
| `assets/` | Poppins woff2 and the RSM marks so the HTML pages work offline. |
| `out/` | Rendered videos, frames and timing JSON (git-ignored). |

## Data

The app is static: `src/data/mockData.ts` is the dataset and every date hangs
off `AS_OF` in `src/lib/config.ts`. The tour and the cheat sheet quote figures
as of **2026-10-08**. If you move `AS_OF` or change the data, re-check the
numbers in `scenes.mjs` (`vo` and `onScreen`) and `cheat-sheet.html`, then
re-record.

## Render the video

```powershell
# 1. serve a production build (the dev server hangs on this OneDrive checkout;
#    set env vars from PowerShell, not Git Bash, which rewrites BASE_PATH=/)
$env:BASE_PATH = '/'; npm run build
npx vite preview --port 5197 --strictPort      # leave running

# 2. check and record (new terminal)
node demo-kit/shot.mjs                          # optional: out/check-*.png
node demo-kit/record.mjs                        # tour + title card + reel → demo-kit/out/
node demo-kit/record.mjs --only frames          # pull check frames from the MP4s
node demo-kit/write-script.mjs                  # voiceover-script.md + cheat sheets
node demo-kit/scratch-vo.mjs                    # optional: TTS pacing check
node demo-kit/subtitle-reel.mjs                 # reel with narration subtitles
```

Port 5197 is the default because 5198/5199 are often held by the other VIBE
apps' servers; pass `--base http://localhost:NNNN` to `record.mjs` and
`shot.mjs` to use another.

`record.mjs` uses Playwright's full Chromium (`channel: 'chromium'`) so the
recording matches a real browser. For MP4 it needs an ffmpeg with libx264: set
`$env:FFMPEG`, put `ffmpeg` on PATH, or `pip install imageio-ffmpeg`. Without
one you still get WebM. Playwright is a devDependency of this repo
(`npm install` once).

The recorder never mutates data: it navigates, ticks filters, switches tabs and
selects, and opens and cancels the Email and Draft-new-price dialogs. It never
clicks Send email, Create case, Confirm & execute new price, Accept, Dismiss,
Go live or Save settings.

## Outputs

| File | Length | Use |
|---|---|---|
| `out/price-margin-alerts-tour.mp4` | 71 s | The captioned tour |
| `out/interstitial.mp4` | 12 s | "Up next" title card |
| `out/price-margin-alerts-reel.mp4` | 83 s | Title card + tour — the booth loop clip |
| `out/price-margin-alerts-reel-subtitled.mp4` | 83 s | Same, with the narration burned in for a muted screen |
| `out/price-margin-alerts-tour-scratch-vo.mp4` | 71 s | Tour with the TTS scratch read (pacing check only) |

## Change the script

Edit `scenes.mjs`, then:

```powershell
node demo-kit/write-script.mjs    # refresh voiceover-script.md and see the wpm check
node demo-kit/record.mjs          # re-record so the cuts land on the new timecodes
node demo-kit/subtitle-reel.mjs   # re-burn the subtitles
```

Keep each scene's narration under `seconds × 2.5` words; the generator flags any
line that is over. If a page's layout changes, the scene list in `scenes.mjs`
and the `actions` map in `record.mjs` are the only two things to rewrite; the
overlay, timing runner, MP4 conversion, reel join and title card carry over.
