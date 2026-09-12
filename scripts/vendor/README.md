# scripts/vendor

Third-party and generated code the page depends on. These files are minified
or generated, so they are not meant to be read or edited. To change one,
replace it with a fresh copy from its source.

| File | What it is | Version | Source | Licence |
| --- | --- | --- | --- | --- |
| `react.production.min.js` | React, UMD production build | 18.3.1 | https://unpkg.com/react@18.3.1/umd/react.production.min.js | MIT |
| `react-dom.production.min.js` | ReactDOM, UMD production build | 18.3.1 | https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js | MIT |
| `dc-runtime.js` | Runtime that renders the `<x-dc>` template in `index.html` | — | Generated from `dc-runtime/src/*.ts` (not in this repo); extracted from the original bundled `index.html` in commit `ca08751` | Not stated in the file |

Readable React source: https://github.com/facebook/react/tree/v18.3.1

## How they are loaded

`index.html` loads, in this order: React, ReactDOM, `../scripts.js`, then
`dc-runtime.js`. The runtime uses the React already on the page. If React were
missing, it would fetch the two unpkg URLs above instead, so the local copies
save a request to a third-party CDN.

## Integrity

Both React files are byte-identical to the official builds: their SHA-384
hashes match the integrity hashes pinned in `dc-runtime.js` (`REACT_SRI` and
`REACT_DOM_SRI`).

| File | SHA-384 |
| --- | --- |
| `react.production.min.js` | `sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z` |
| `react-dom.production.min.js` | `sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1` |

To check a file:

```sh
openssl dgst -sha384 -binary react.production.min.js | openssl base64 -A
```

## Updating React

`dc-runtime.js` is built against React 18.3.1 (see `REACT_URL` in that file).
Keep the local React files at the same version, download replacements from
the URLs above, and re-check the hashes.
