[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![](https://img.shields.io/node/v/11.0.0.svg?style=flat)

# edl-to-json
A parser that walks basic EDL files to look for audio extensions and returns a JSON with their filenames and source-in source-out record-in record-out timestamps

### Simple rundown

Sometimes you need exact timecodes for when things are to appear in sound-based timelines, primarily for closed captioning. This simple script is intended to help figure out timing for CC in internet video, via JSON.

### Warnings
This package makes use of `Array.prototype.flat`, which is only supported in node.js 11^.
