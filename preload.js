const { dropnotesdata } = require('./db-utils')

let showTab = 'tab1';
const htmlContentDiv = 'content';

let contentDiv;
let activeTab;
let tablist;

let keyupTimeout;
let saveContentDelay = 700;

let status;

const { getTablist, addTab } = require('./tablist.js')



window.addEventListener('DOMContentLoaded', () => {
    buildTabs();

    new Promise((resolve, reject) => {
        initEditor();
        resolve();
    }).then(() => {
        SetContent(showTab);
        contentDiv = document.getElementById('editor').getElementsByClassName(htmlContentDiv)[0]

        status = document.querySelector("#status");
    }).catch((err) => {
    })

    document.getElementById('add-new-tab').addEventListener("click", () => {
        createNewTab();
    });

})

async function loadTablist() {
    tablist = getTablist();
    if (tablist.length == 0) {
        // initialize first tab
        newtab = await dropnotesdata.createEmptyTab();
        tablist = addTab(newtab["displayname"], newtab["_id"]);
    }

    showTab = tablist[0]["id"];
}

async function buildTabs() {
    await loadTablist();

    const tabbar = document.getElementById('tab-bar');

    tablist.forEach(element => {
        tab = document.createElement('div');
        tab.className = 'tab';
        tab.innerHTML = element['name'];
        tab.setAttribute("data-id", element['id'])
        tab.addEventListener("click", (element) => {
            console.log("Clicked element= ", element.target)
            id = element.target.getAttribute("data-id");
            if (id != "undefined") {
                // save current tab
                // Todo: only save on content change
                SaveContent(showTab, contentDiv.innerHTML);

                // switch tab
                // todo: don't switch to same tab
                showTab = id;
                SetContent(id);
            }
        });

        tabbar.appendChild(tab);
    });
}


// todo: refactor
// Get content and put contents in editor
async function SetContent(tabId) {
    activeTab = await dropnotesdata.getTab(tabId);

    if (activeTab) {
        if (activeTab["contents"]) {
            content = activeTab["contents"];
        } else {
            content = ''
        }
    } else {
        content = ''
    }

    // Set content
    contentDiv.innerHTML = content

    // set text cursor
    FocusEditor(contentDiv);
}

function OnContentChange() {
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(function () {
        id = showTab;
        content = contentDiv.innerHTML;
        SaveContent(id, content);
    }, saveContentDelay);
    status.innerHTML = "typing"
}

function SaveContent(id, content) {
    dropnotesdata.upsertTab(id, content)
    status.innerHTML = "saved"
}

// Sets the caret (text cursor) behind the last character
function FocusEditor(contentEditableElement) {
    range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    range.collapse(false);
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function initEditor() {

    const { init } = require('pell')

    // Initialize pell on an HTMLElement
    init({
        // <HTMLElement>, required
        element: document.getElementById('editor'),

        onChange: () => { OnContentChange() },

        actions: [
            'bold',
            {
                name: 'custom',
                icon: 'C',
                title: 'Custom Action',
                result: () => console.log('Do something!')
            },
            'underline'
        ],

        classes: {
            actionbar: 'editor-actionbar',
            button: 'editor-button',
            content: htmlContentDiv,
            selected: 'editor-button-selected'
        }
    })

}

async function createNewTab() {
    newtab = await dropnotesdata.createEmptyTab();
    addTab(newtab["displayname"], newtab["_id"]);

    tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerHTML = newtab["displayname"];

    //div.setAttrivute('id', )
    document.getElementById('tab-bar').appendChild(tab);

    SetContent(newtab["_id"]);
}