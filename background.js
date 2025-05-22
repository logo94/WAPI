function handleApiRequest(url, method = 'GET', customHeaders = {}, body = null, callback) {

    const isSparqlRequest = url.includes('query.wikidata.org/sparql');

    const options = {
        method: method,
        headers: new Headers(customHeaders),
    };

    // Se è una richiesta SPARQL, non includere le credenziali
    if (!isSparqlRequest) {
        options.credentials = 'include';  // Gestione credenziali per altri endpoint
    } else {
        options.credentials = 'same-origin';  // No credenziali per le richieste SPARQL
    }

    // Se è una richiesta POST, aggiungi il corpo
    if (method === 'POST' && body) {
        if (url.includes('wikidata.org')){
            options.body = body;
            options.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        } else {
            options.body = JSON.stringify(body);
        }
        
    }

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nella risposta HTTP: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            callback({ success: true, data: data });
        })
        .catch(error => {
            console.error('Errore fetch:', error);
            callback({ success: false, error: error.message });
        });
}

// Ascolto connessioni via port (comunicazione lunga)
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "waping") {
        port.onMessage.addListener(function(msg) {
            if (msg.event === "wapi_request") {
                const base = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=";
                const tail = "&format=json&language=it&uselang=it&type=item&limit=10";
                const fullUrl = base + encodeURIComponent(msg.text) + tail;

                handleApiRequest(
                    fullUrl,
                    'GET',
                    { 'Accept': 'application/json' }, 
                    null,
                    (response) => {
                    if (response.success && response.data?.search) {
                        const filterList = response.data.search.map((ent) => ({
                            id: ent.id,
                            label: ent.label,
                            description: ent.description,
                            uri: ent.concepturi
                        }));
                        port.postMessage({ event: "wapi_response", entities: filterList });
                    } else {
                        port.postMessage({ event: "wapi_response", entities: [] });
                    }
                });
                
            } else if (msg.event === "wapi_request_properties") {

                const query = `
                SELECT ?relatedProp ?relatedPropLabel ?relatedPropDescription 
                WHERE {
                    {
                        wd:${msg.text.toUpperCase()} wdt:P1659 ?relatedProp .
                    } UNION {
                        ?relatedProp wdt:P1659 wd:${msg.text.toUpperCase()} .
                    }
                    SERVICE wikibase:label {
                        bd:serviceParam wikibase:language "[AUTO_LANGUAGE],it,en".
                        ?relatedProp rdfs:label ?relatedPropLabel ;
                                    schema:description ?relatedPropDescription .
                    }
                }
                `;

                const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query);

                handleApiRequest(
                    url,
                    'GET',
                    { 'Accept': 'application/sparql-results+json' }, 
                    null,
                    (response) => {
                        console.log(response)
                    if (response.success && response.data.results?.bindings) {
                        const filterList = response.data.results.bindings.map((prop) => ({
                            id: prop.relatedProp.value.split("/").pop(),
                            label: prop.relatedPropLabel?.value || "",
                            description: prop.relatedPropDescription?.value || "",
                            uri: prop.relatedProp.value
                        }));
                        port.postMessage({ event: "wapi_response_properties", properties: filterList });
                    } else {
                        port.postMessage({ event: "wapi_response_properties", properties: [] });
                    }
                });
            }
        });
    }
});

// Ascolto richieste dirette (messaggi brevi)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "proxy-api") {
        handleApiRequest(request.url, request.method, request.headers, request.body, sendResponse);
        return true;
    }
});
