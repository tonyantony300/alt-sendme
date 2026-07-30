---
name: Report a bug
about: Describe something that isn't working correctly
title: ''
labels:
  - 'type: bug'
assignees: ''
---

<!--
Before filing, please check:
https://github.com/tonyantony300/dashbeam/blob/main/docs/troubleshooting.md
It's organised by symptom and covers every platform.
-->

## What seems to be going wrong?

Please describe what's happening and what you would have expected instead.

## How can we reproduce this?

1.
2.
3.

## Your environment

- DashBeam version:
- OS and version (e.g. macOS 14, Windows 11, Fedora 41, Android 14):
- How you installed it (.AppImage, .deb, .rpm, Flatpak, .msi, .exe, .dmg, .apk):
- Did it work in an earlier version? If so, which:

**If the problem involves sending or receiving files**, please also tell us:

- The other device's platform and version:
- Relay mode (Settings → Network → Relay servers) — Automatic, Custom, or Disabled:
- Does **Test connection** succeed on both devices?

**If the problem is visual** — a blank window, rendering glitches, missing UI — and
you're on Linux:

- Desktop environment, and Wayland or X11 (`echo $XDG_SESSION_TYPE`):
- Graphics hardware (`fastfetch --pipe` or `inxi -GSx`):

## Logs

Logs make almost every report faster to resolve. See
[collecting logs](https://github.com/tonyantony300/dashbeam/blob/main/docs/troubleshooting.md#collecting-logs)
for the command to use on your platform, then paste the output or attach the file.

<details>
<summary>dashbeam.log</summary>

```
paste here
```

</details>

## Anything else you'd like to share?

Screenshots or any extra details are always appreciated (optional).
