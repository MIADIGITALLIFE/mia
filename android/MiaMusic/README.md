# MIA MUSIC — Android

An Android-native player for the music already published in the Mia website repository.

## Current catalogue
- 8 original tracks from the website's Music Room
- 2 separate ambient tracks: Mia Background and The Forest of Dreams
- Audio streams from the existing public GitHub repository; no duplicate MP3 upload is needed

## Playback
- AndroidX Media3 / ExoPlayer
- Background playback through MediaSessionService
- Lock-screen and notification media controls
- Network streaming; offline caching is a planned next phase

## Build
Open this directory in Android Studio, or run:

```bash
gradle assembleDebug
```

The debug APK is generated at `app/build/outputs/apk/debug/app-debug.apk`.

## Important
This is the initial Android player foundation, not yet a verified release APK. The GitHub Actions build must pass before distribution. An administrator upload portal and remote catalogue editor are separate follow-up work.
