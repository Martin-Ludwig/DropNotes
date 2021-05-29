'use strict';

const { ipcRenderer } = require("electron");
const { dropnotesdata } = require('./db-utils');

let showTab = 'tab1';
const htmlContentDiv = 'content';

let contentDiv;
let activeTab;
let tablist;

let keyupTimeout;
let saveContentDelay = 700;

let status;

const { addTab } = require('./tablist.js')

window.addEventListener('DOMContentLoaded', () => {

    var promiseEditor = new Promise((resolve => resolve(initEditor())));
    var promiseTabs = new Promise((resolve => resolve(buildTabs())));

    Promise.all([promiseEditor, promiseTabs]).then(() => {
        SetContent(showTab);
        contentDiv = document.getElementById('editor').getElementsByClassName(htmlContentDiv)[0]

        status = document.querySelector("#status");
    })

    // Event: create new note
    document.getElementById('add-new-note').addEventListener("click", () => {
        createNewNote();
    });

    // Event: switch notes
    document.getElementById('tab-bar').addEventListener("click", (element) => {
        var e = element.target

        if (e.id != "undefined") {
            // save current tab
            // Todo: only save on content change
            SaveContent(showTab, contentDiv.innerHTML);

            // switch tab
            // todo: don't switch to same tab
            showTab = e.id;
            SetContent(e.id);
        }
    });

    // Todo Event: delete note

})

/**
 * Fills #tab-bar
 */
async function buildTabs() {
    tablist = await ipcRenderer.invoke('get-tablist');
    showTab = tablist[0]["id"];

    const tabbar = document.getElementById('tab-bar');

    tablist.forEach(element => {
        var tab = document.createElement('div');
        tab.id = element["id"];
        tab.className = 'tab';
        tab.innerHTML = element['name'];

        tabbar.appendChild(tab);
    });
}


// todo: refactor
// Get content and put contents in editor
async function SetContent(tabId) {
    var activeTab = await dropnotesdata.getNote(tabId);

    var content = '';
    if (activeTab && activeTab["contents"]) {
        content = activeTab["contents"];
    }

    // Set content
    contentDiv.innerHTML = content;

    // set text cursor
    FocusEditor(contentDiv);
}

/**
 * Tracks user input and saves note when done typing.
 */
function OnContentChange() {
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(function () {
        var id = showTab;
        var content = contentDiv.innerHTML;
        SaveContent(id, content);
    }, saveContentDelay);
    status.innerHTML = "typing"
}

function SaveContent(id, content) {
    dropnotesdata.upsertNote(id, content)
    status.innerHTML = "saved"
}

/**
 * Sets the caret (text cursor) behind the last character.
 * 
 * @param Node contentEditableElement 
 */
function FocusEditor(contentEditableElement) {
    var range, selection;
    range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    range.collapse(false);
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Creates rich text editor inside #editor.
 */
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


async function createNewNote() {
    var newtab = await dropnotesdata.createEmptyNote();
    addTab(newtab["displayname"], newtab["_id"]);

    var tab = document.createElement('div');
    tab.id = newtab["_id"];
    tab.className = 'tab';
    tab.innerHTML = newtab["displayname"];

    document.getElementById('tab-bar').appendChild(tab);

    SetContent(newtab["_id"]);
}