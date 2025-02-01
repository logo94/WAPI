// HTML Elements
const inputURI = document.getElementById('uri_input');
const btnSearch = document.getElementById('btn_search_entities');
const resultList = document.getElementById('uri_list');
const breakLine = document.getElementById('break_line');
const modalElement = document.getElementById('statusModal');
const modal = new bootstrap.Modal(modalElement, {})

// Message between extension and service-worker
let msg

// No results row
const notfoundElement = document.createElement("li")
notfoundElement.className = "list-group-item mx-2"
notfoundElement.innerHTML = `
    <div class="row text-center">
        <p class="my-2">No items</p>
    </div>
`

// Link to Wikidata results page
const searchElement = document.createElement("li")
searchElement.className = "list-group-item mx-2"

// Link to Wikidata entity creation page
const addElement = document.createElement("li")
addElement.className = "list-group-item mx-2"
addElement.innerHTML = `
    <div class="row text-center">
        <p class="my-2"><a href="https://www.wikidata.org/wiki/Special:NewItem" class="text-decoration-none" target="_blank">+ New item</a></p>
    </div>

`
// Press enter button on input to get results
inputURI.addEventListener("keypress", function (event) {
    if (event.key === 'Enter') {
        btnSearch.click()
    }
})

// Send request to service-worker and populate HTML after response
btnSearch.addEventListener('click', function() {
    resultList.innerHTML = ""
    var port = chrome.runtime.connect({name: "waping"});
    port.postMessage({event: "wapi_request", text: inputURI.value });
    port.onMessage.addListener(function(msg) {
        if (msg.event === "wapi_response") {
            breakLine.style.display = "block"
            if (msg.entities.length > 0) {
                setList(msg.entities);
            } else {
                resultList.appendChild(notfoundElement)
                resultList.appendChild(addElement)
            }
            
        }
        
    });
    
});

// Copy wikidata ID from entity row
document.addEventListener("click", function(e){
    const target = e.target.closest("li");
    if(target){
        let current_item = target.textContent
        let wiki_id = current_item.match(/\(\Q\d+\)/)[0].replace('(', '').replace(')', '')
        console.log(wiki_id)
        copyTextToClipboard(wiki_id)
        let modal = new bootstrap.Modal(modalElement, {})
        modal.show()
        setTimeout(() => modal.hide(), 1000)
    }
});

// Populate entities list
function setList(entities, input) {

    entities.forEach(entity => {
        
        let entityElement = document.createElement("li")
        entityElement.className = "list-group-item mx-2"
        entityElement.innerHTML = `
            <div class="row">
                <p><a href="${entity.uri}" class="text-decoration-none" target="_blank"><b>${entity.label}</b> (${entity.id})</a></p>
            </div>
            <div class="row ml-2">
                <p><em>${entity.description}</em></p>
            </div>
            <div class="row ml-2">
                <p><small>${entity.info}</small></p>
            </div>
            <button type="button" class="btn-clipboard" title="" data-original-title="Copy to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                </svg>
            </button>
        
        `
        resultList.appendChild(entityElement)
        
    });

    // Wikidata result page link
    searchElement.innerHTML = `
    <div class="row text-center">
        <p class="my-2"><a href="https://www.wikidata.org/w/index.php?go=Go&search=${input}&title=Special%3ASearch&ns0=1&ns120=1" class="text-decoration-none" target="_blank">All results</a></p>
    </div>
    `
    resultList.appendChild(searchElement)

    // Wikidata create new item page link
    resultList.appendChild(addElement)

}

// Copy text from extension to clipboard
// Idea by joelpt
function copyTextToClipboard(text) {
    
    let copyFrom = document.createElement("textarea");
    copyFrom.textContent = text;
    document.body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy'); // Deprecated but working, no alternatives
    copyFrom.blur();
    document.body.removeChild(copyFrom);
}


