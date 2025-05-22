document.addEventListener('DOMContentLoaded', function () {

    // Porta per canale di comunicazione
    let port;

    // HTML Elements
    const wapiDesc = document.getElementById('wapi_desc');
    const btnItems = document.getElementById("btn_show_items");
    const btnProps = document.getElementById("btn_show_properties");
    const inputURI = document.getElementById('uri_input');
    const btnSearch = document.getElementById('btn_search_entities');
    const resultList = document.getElementById('uri_list');
    const breakLine = document.getElementById('break_line');

    if (!port) {
        port = chrome.runtime.connect({ name: "waping" });
    }

    // No items found row
    const notfoundElement = document.createElement("li");
    notfoundElement.className = "list-group-item mx-2 text-center py-2";
    const notfoundText = document.createElement("p");
    notfoundText.className = "mb-0 fw-normal fst-italic";
    notfoundText.textContent = "No items found";
    notfoundElement.appendChild(notfoundText);

    // No properties found row
    const notfoundPropElement = document.createElement("li");
    notfoundPropElement.className = "list-group-item mx-2 text-center py-2";
    const notfoundPropText = document.createElement("p");
    notfoundPropText.className = "mb-0 fw-normal fst-italic";
    notfoundPropText.textContent = "No related properties found";
    notfoundPropElement.appendChild(notfoundPropText);

    // Advance research button row
    const advRowElement = document.createElement("li");
    advRowElement.className = "list-group-item mx-2 text-center py-2";
    const advText = document.createElement("p");
    advText.className = "mb-0 fw-normal fst-italic";
    const advLink = document.createElement("a");
    advLink.href = "https://www.wikidata.org/w/index.php?search=&title=Special%3ASearch";
    advLink.target = "_blank";
    advLink.className = "text-decoration-none";
    advLink.textContent = "Advanced search...";
    advText.appendChild(advLink);
    advRowElement.appendChild(advText);

    // Link to Wikidata entity creation page row
    const addElement = document.createElement("li");
    addElement.className = "list-group-item mx-2 text-center py-2";
    const addText = document.createElement("p");
    addText.className = "mb-0 fw-normal fst-italic";
    const addLink = document.createElement("a");
    addLink.href = "https://www.wikidata.org/wiki/Special:NewItem";
    addLink.target = "_blank";
    addLink.className = "text-decoration-none";
    addLink.textContent = "+ New item";
    addText.appendChild(addLink);
    addElement.appendChild(addText);

    // Copy icon
    const copyIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
    </svg>
    `

    // Nav handler
    btnItems.addEventListener("click", () => {
        wapiDesc.innerText = "Wikidata Item ID finder"
        inputURI.placeholder = "QXX, Label, Alias"
        btnSearch.hidden = false
        document.getElementById('btn_search_properties').hidden = true
        btnItems.classList.add("active-tab");
        btnProps.classList.remove("active-tab");
    });

    btnProps.addEventListener("click", () => {
        wapiDesc.innerText = "Wikidata Related properties finder"
        inputURI.placeholder = "PXX"
        btnSearch.hidden = true
        document.getElementById('btn_search_properties').hidden = false
        btnProps.classList.add("active-tab");
        btnItems.classList.remove("active-tab");
    });
    
    // Gestione pressione 'Enter' su inputURI
    inputURI.addEventListener("keypress", function (event) {
        if (event.key === 'Enter') {
            if (btnItems.classList.contains("active-tab")) {
                btnSearch.click();
            } else if (btnProps.classList.contains("active-tab")) {
                document.getElementById('btn_search_properties').click();
            }
        }
    });

    // ENTITIES request
    btnSearch.addEventListener('click', function() {
        resultList.innerHTML = ""
        port.postMessage({event: "wapi_request", text: inputURI.value });
    });

    // PROPERTIES request
    document.getElementById('btn_search_properties').addEventListener('click', function () {
        resultList.innerHTML = ""
        port.postMessage({ event: "wapi_request_properties", text: inputURI.value });        
    });
    
    // Response handler
    port.onMessage.addListener(function(msg) {

        // If Entities response
        if (msg.event === "wapi_response") {
            breakLine.style.display = "block"
            if (msg.entities.length > 0) {
                setList(msg.entities);
                resultList.appendChild(advRowElement)
                resultList.appendChild(addElement)
            } else {
                resultList.appendChild(notfoundElement)
                resultList.appendChild(advRowElement)
                resultList.appendChild(addElement)
            }
        
        // If Properties response
        } else if (msg.event === "wapi_response_properties") {
            breakLine.style.display = "none"
            if (msg.properties.length > 0) {
                let entityElement = document.createElement("li")
                entityElement.className = "list-group-item mx-2"
                let textArea = document.createElement("textarea");
                const sparqlValueBlock = `{ ${msg.properties.map(p => `wdt:${p.id}`).join(' ')} }`;
                textArea.className = "form-control m-2";
                textArea.rows = 3;
                textArea.readOnly = true;
                textArea.textContent = sparqlValueBlock;
                resultList.appendChild(textArea)
                setList(msg.properties);
            } else {
                resultList.appendChild(notfoundPropElement)
            }
        }
        
    });

    document.addEventListener("click", function(e) {
        const button = e.target.closest(".btn-clipboard");
        if (!button) return;

        const li = button.closest("li");
        if (li) {
            let match = null;
            if (btnItems.classList.contains("active-tab")) {
                match = li.textContent.match(/\(Q\d+\)/);
            } else if (btnProps.classList.contains("active-tab")) {
                match = li.textContent.match(/\(P\d+\)/);
            }
            if (match) {
                const wiki_id = match[0].replace(/[()]/g, '');
                navigator.clipboard.writeText(wiki_id)
                .then(() => {
                    button.innerHTML = "Copied!";
                    setTimeout(() => {
                        button.innerHTML = copyIconSvg;
                    }, 1000);
                } )
                .catch(err => console.error("Failed to copy:", err));
            }
        }
    });

    // Populate result list
    function setList(entities) {

        entities.forEach(entity => {
            const entityElement = document.createElement("li");
            entityElement.className = "list-group-item mx-2";

            // Riga con link e label
            const row1 = document.createElement("div");
            row1.className = "row";

            const p1 = document.createElement("p");
            const a = document.createElement("a");
            a.href = entity.uri;
            a.target = "_blank";
            a.className = "text-decoration-none";
            a.innerHTML = `<b>${entity.label}</b> (${entity.id})`; // solo markup sicuro
            p1.appendChild(a);
            row1.appendChild(p1);

            // Riga con descrizione
            const row2 = document.createElement("div");
            row2.className = "row ml-2";
            const p2 = document.createElement("p");
            p2.style.fontStyle = "italic";
            p2.textContent = entity.description;
            row2.appendChild(p2);

            // Pulsante copia con icona
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn-clipboard";
            button.title = "";
            button.setAttribute("data-original-title", "Copy to clipboard");
            button.innerHTML = copyIconSvg;

            // Composizione
            entityElement.appendChild(row1);
            entityElement.appendChild(row2);
            entityElement.appendChild(button);
            resultList.appendChild(entityElement);
            
        });
    }

});
