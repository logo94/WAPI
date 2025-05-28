# WAPI

WAPI is a browser extension that enables quick searches on Wikidata by leveraging the Wikidata API. Once a candidate is found, its ID can be easily copied and pasted wherever needed. 

The extension offers three main features:
- Search for items by ID or label;
- Search for properties related to a given starting property;
- A router to bypass CORS restrictions (e.g., for [WikiPlayground](https://labaib.github.io/WikiPlayground2.0/))


> More details can be found in [wiki](https://github.com/logo94/WAPI/wiki/WAPI)



## Local development

For local development or to enable domains other than the predefined ones, you need to download the repository and update the `manifest.json`

To enable the extension as a router for a webpage, you need to include the domain of the page the extension should have access to:

```
"content_scripts": [
{
    "matches": [
        "https://logo94.github.io/*",
        "https://labaib.github.io/*"
    ],
    "js": ["content.js"],
    "run_at": "document_start"
    }
],
```

To enable requests to domains other than Wikidata, VIAF, and OPAC SBN, you need to modify the following block:
```
"host_permissions": [
    "https://www.wikidata.org/*",
    "http://viaf.org/*",
    "https://opac.sbn.it/*"
]
```
