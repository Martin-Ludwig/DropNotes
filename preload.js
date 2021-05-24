const { dropnotesdata } = require('./db-utils')

const showTab = 'tab1';
const htmlContentDiv = 'content';

let contentDiv;
let currentTab;

let keyupTimeout;
let saveContentDelay = 700;

let status;

window.addEventListener('DOMContentLoaded', () => {

    new Promise((resolve, reject) => {
        initEditor();
        resolve();
    }).then(() => {
        SetContent(showTab, htmlContentDiv);
        contentDiv = document.getElementById('editor').getElementsByClassName(htmlContentDiv)[0]

        status = document.querySelector("#status");
    }).catch((err) => {
    })

})

// todo: refactor
// Get content and put contents in editor
async function SetContent(tabId, element) {
    currentTab = await dropnotesdata.getTab(tabId);

    if (currentTab) {
        if (currentTab["contents"]) {
            content = currentTab["contents"];
        } else {
            content = ''
        }
    } else {
        dropnotesdata.createEmptyTab(tabId)
        content = ''
    }

    // Set content
    contentDiv.innerHTML = content

    // set text cursor
    FocusEditor(contentDiv);
}

function OnContentChange() {
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(SaveContent, saveContentDelay);
    status.innerHTML = "typing"
}

function SaveContent() {
    content = contentDiv.innerHTML;
    dropnotesdata.upsertTab(currentTab["_id"], content)
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