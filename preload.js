'use strict';

const { ipcRenderer } = require("electron");
const { Note } = require("./note");

let showTab = 'tab1';
const htmlContentDiv = 'content';

let contentDiv;
let tablist;

let keyupTimeout;
let saveContentDelay = 700;

let status;

const { addTab } = require('./tablist.js')

window.addEventListener('DOMContentLoaded', () => {

    var promiseEditor = new Promise((resolve => resolve(initEditor())));
    var promiseTabs = new Promise((resolve => resolve(buildTabs())));

    Promise.all([promiseEditor, promiseTabs]).then(() => {
        switchToNote(showTab);
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
            switchToNote(e.id);
        }
    });

    // Todo Event: delete note

    /** New note
    ipcRenderer.on('note-add', (event, note) => {
    });
    */
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

function switchToNote(noteId) {
    ipcRenderer.invoke('note-get', noteId).then((result) => {
        var note = result;
        setContent(note.content)

        // set text cursor
        focusEditor(contentDiv);
    });
}


function setContent(content) {
    // Set content
    contentDiv.innerHTML = content;
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
    var note = new Note(id, 'new', content);
    ipcRenderer.send('note-update', note)
    status.innerHTML = "saved"
}

/**
 * Sets the caret (text cursor) behind the last character.
 * 
 * @param Node contentEditableElement 
 */
function focusEditor(contentEditableElement) {
    var range = document.createRange();
    range.selectNodeContents(contentEditableElement);
    range.collapse(false);
    var selection = window.getSelection();
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
    ipcRenderer.invoke("note-create").then((result) => {
        var newNote = result;

        addTab(newNote.name, newNote.id);

        var tab = document.createElement('div');
        tab.id = newNote.id;
        tab.className = 'tab';
        tab.innerHTML = newNote.name;

        document.getElementById('tab-bar').appendChild(tab);

        switchToNote(newNote.id)
    });
}