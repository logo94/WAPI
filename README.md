# WAPI

WAPI is a browser extension that enables quick searches on Wikidata by leveraging the Wikidata API. Once a candidate is found, its ID can be easily copied and pasted wherever needed. 

The extension offers three main features:
- Search for items by ID or label;
- Search for properties related to a given starting property;
- A router to bypass CORS restrictions (e.g., for WikiPlayground)

## How it works


### Items search

Item search is performed by querying the Wikidata REST API Endpoint `https://www.wikidata.org/w/api.php`. 


The query includes the following parameters:
- `action=wbsearchentities`
- `search={input_label}`
- `language=en` (edit for other languages: `en`, `it`, `ge`...)
- `uselang=en` (edit for other languages: `en`, `it`, `ge`...)
- `type=item`
- `limit=10` (edit for more results)
- `format=json`



### Related properties search

This feature allows you to retrieve semantically related properties to a given starting property in Wikidata, using a SPARQL query:

```
SELECT ?relatedProp ?relatedPropLabel ?relatedPropDescription 
WHERE {
  {
    wd:${input_prop} wdt:P1659 ?relatedProp .
  } UNION {
    ?relatedProp wdt:P1659 wd:${input_prop} .
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en,it".
    ?relatedProp rdfs:label ?relatedPropLabel ;
                 schema:description ?relatedPropDescription .
  }
}

```


The query supports both direct and inverse relationships via the property P1659 ("see also") identifying properties that:
- are linked from the starting property using wdt:P1659
- link to the starting property using wdt:P1659 (inverse relationship)

This enables extending or enriching SPARQL queries with semantically similar properties, improving the coverage and relevance of the data retrieved from Wikidata.

The returned list of related properties can then be suggested to the user for query refinement, or directly included in broader SPARQL queries, e.g.:

```
VALUES ?property { wdt:P50 wdt:P2679 wdt:P8242 }

```


### Router

For web applications running in the browser (e.g., GitHub Pages), it is necessary to bypass the CORS restrictions enforced by Wikidata.
To avoid relying on a backend server, the extension—considered a trusted origin—performs the API calls on behalf of the web page and returns the retrieved data back to it.

The extension injects a script into the web pages, which intercepts API requests from the page, forwards them to the extension, and then delivers the response back to the page.

The following diagram illustrates how the extension acts as a proxy to bypass CORS restrictions when accessing the Wikidata API from a browser-based web application.

```
+-----------------+        postMessage         +-------------------+         HTTP Request          +---------------+
|                 | ------------------------>  |                   | ---------------------------> |                |
|  Web Page (e.g. |                            |  Extension (BG/CI)|                              |   Wikidata API |
| GitHub Pages)   |                            |                   | <--------------------------- |                |
|                 | <------------------------  |                   |         HTTP Response        |                |
+-----------------+        postMessage         +-------------------+                              +----------------+
           |                                                                  
           |                                                                  
           |  Injected script listens for messages from the page,            
           |  relays them to the extension, and passes back the response     

```


To use the extension as router is possible to import a function directly as CDN: `https://cdn.jsdelivr.net/gh/logo94/wapiFetch@main/index.js`

More details can be found in a dedicated repository [wapiFetch](https://github.com/logo94/wapiFetch)



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
