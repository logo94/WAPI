// Get Wikidata Entity info 
const get_entity_info = async (wikiuri) => {

    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikiuri}.json`)
    const wiki = await res.json()
    
    let wikibody = Object.values(wiki.entities)[0]
    let lastmod = wikibody.modified.split("T")[0] // Last modification log
    let sitelinks_count = Object.keys(wikibody.sitelinks).length // Number of sitelinks
    let statements_count = (JSON.stringify(wikibody.claims).match(new RegExp("statement", "g")) || []).length // Number of statements
    
    return `${statements_count} statements, ${sitelinks_count} sitelinks - ${lastmod}`

}

// Listen for connection
chrome.runtime.onConnect.addListener(function(port) {
    
    // Connect to extension channel
    console.assert(port.name === "waping");
    port.onMessage.addListener(function(msg) {

        if (msg.event === "wapi_request") {

            // URL creation
            let url = "https://www.wikidata.org/w/api.php"
            url += `?action=wbsearchentities`
            url += `&search=${msg.text}`
            url += `&format=json`
            url += `&language=it`
            url += `&uselang=it`
            url += `&type=item`
            url += `&limit=10`
            url += `&origin=*`

            // Wikidata API Call
            fetch(url)
            .then((response) => response.json())
            .then(async (data) => {

                try {
                    
                    // Result mapping
                    const filterList = Promise.all(data['search'].map(async (ent) => ({
                        id: ent.id,
                        label: ent.label,
                        description: ent.description,
                        uri: ent.concepturi,
                        info: await get_entity_info(ent.id)
                    }))) 
                    
                    // Send array of objects as response to popup.js
                    port.postMessage({event: "wapi_response", entities: await filterList});                   

                } catch {

                    // Send empty array as response to popup.js
                    port.postMessage({event: "wapi_response", entities: []});
                }

            });
        }
    });
});
