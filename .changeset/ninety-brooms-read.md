---
"@effect-best-practices/website": patch
---

Fix AudioContext errors and sound queueing issues. Sounds now wait for first user interaction (click/keydown/touch) before playing, preventing console warnings and simultaneous playback of queued sounds. Also fixed negative blur filter values in animations.