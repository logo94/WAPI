// Listen for connection
chrome.runtime.onConnect.addListener(function(port) {
    
    // Connect to extension channel
    console.assert(port.name === "waping");
    port.onMessage.addListener(function(msg) {

        if (msg.event === "wapi_request") {

            // URL creation
            let url_start = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search="
            let url_end = "&format=json&language=it&uselang=it&type=item&limit=10&origin=*"

            // Wikidata API Call
            fetch(url_start + msg.text + url_end)
            .then((response) => response.json())
            .then(data => {
                
                try {
                    // Map response 
                    const filterList = data['search'].map((ent) => ({
                        id: ent.id,
                        label: ent.label,
                        description: ent.description,
                        uri: ent.concepturi
                    }))

                    // Send response to extension
                    port.postMessage({event: "wapi_response", entities: filterList});
                } catch {
                    port.postMessage({event: "wapi_response", entities: []});
                }

            });
        }
    });
});