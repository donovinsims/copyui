# Third-party notices

copyui is MIT-licensed (see `LICENSE`). It also contains code and material from the
following MIT-licensed projects. Their notices are reproduced below, as their licences
require.

## affectui — free, MIT-licensed components

- Source: https://github.com/flohoeller/affectui
- Copyright (c) 2026 Florian Höller
- Licence: MIT

Vendored files (behaviour unchanged, only the header comment and token mapping added):

| File | Upstream file |
| --- | --- |
| `src/components/ui/CodeBlock.tsx` | `components/code-block.tsx` |
| `src/components/ui/ReactionBar.tsx` | `components/reaction-bar.tsx` |

Everything else in `src/components/ui/` is copyui's own implementation. The visual
language was studied by measuring the rendered affectui.com interface (computed styles,
geometry, timings); no Pro (paid) component, asset or source file was copied, and no
affectui brand asset ships with copyui. Components that exist in both projects share a
name and a purpose, not source code, except for the two files listed above.

The upstream `--aui-*` custom properties those two files read are mapped onto copyui's
tokens in `src/styles/tokens.css`, so they follow the app's light and dark themes.

### MIT License

```
MIT License

Copyright (c) 2026 Florian Höller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Superpowers skills — `skills/`

- Source: https://github.com/obra/superpowers
- Copyright (c) 2025 Jesse Vincent
- Licence: MIT (full text at `skills/LICENSE`)
- Vendored commit: `22f0b463e7a5e579904dd6211a520321035526f7`

Copied as-is for offline use by agents working on copyui. Nothing in `skills/` is
imported by the app, the registry generator or the build.

### MIT License

```
MIT License

Copyright (c) 2025 Jesse Vincent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Names and trademarks

affectUI, Superpowers and any other product names are the property of their respective
owners. copyui is not affiliated with, endorsed by or sponsored by any of them.
