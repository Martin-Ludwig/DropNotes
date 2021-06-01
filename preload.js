'use strict';

const { ipcRenderer } = require("electron");
const { Editor } = require("./editor");
const { Note } = require("./note");
const { addTab } = require('./tablist.js')

const editorContentClass = 'content';
const saveContentDelay = 700;

let cache = new Map();
let currentNote = new Note();

let editor;
let keyupTimeout;
let status;

window.addEventListener('DOMContentLoaded', () => {

    var promiseEditor = new Promise((resolve => resolve(initEditor())));
    var promiseTabs = new Promise((resolve => resolve(buildTabs())));

    Promise.all([promiseEditor, promiseTabs]).then((result) => {

        switchToNote(result[1]);

        var e = document.getElementById('editor').getElementsByClassName(editorContentClass)[0];
        editor = new Editor(e);

        status = document.querySelector("#status");
    })

    // Click event: create new note
    document.getElementById('add-new-note').addEventListener("click", () => {
        createNewNote();
    });

    // Click event: switch notes
    document.getElementById('tab-bar').addEventListener("click", (element) => {
        var nextTab = element.target

        if (nextTab.id !== undefined &&
            nextTab.id !== currentNote.id) {

            // save current tab
            // Todo: only save on content change
            saveNote(currentNote);

            // switch note
            switchToNote(nextTab.id);
        }
    });

    // Todo Event: delete note

})

/**
 * Fills #tab-bar
 * @returns {uuid} Id of last active tab
 */
async function buildTabs() {
    const tabbar = document.getElementById('tab-bar');
    var tablist = await ipcRenderer.invoke('get-tablist');
    tablist.forEach(element => {
        var tab = document.createElement('div');
        tab.id = element["id"];
        tab.className = 'tab';
        tab.innerHTML = element['name'];

        tabbar.appendChild(tab);
    });

    // Todo: get last active tab
    return tablist[0]["id"];
}

/**
 * Changes note
 * @param {uuid} noteId 
 */
async function switchToNote(noteId) {
    if (currentNote !== undefined && currentNote.id !== undefined) {
        // cache note
        cache.set(currentNote.id, currentNote);
    }

    currentNote = await getNote(noteId);
    editor.setContent(currentNote.content);

    // set text cursor
    focusEditor(editor.getContext());
}


/**
 * Tracks user input and saves note when done typing.
 */
function OnContentChange() {
    clearTimeout(keyupTimeout);
    currentNote.content = editor.getContent();
    keyupTimeout = setTimeout(function () {
        var n = new Note(currentNote.id, currentNote.name, currentNote.content)
        saveNote(n);
    }, saveContentDelay);
    status.innerHTML = "typing"
}

/**
 * Saves note in database
 * @param {Note} note 
 */
function saveNote(note) {
    ipcRenderer.send('note-update', currentNote)
    status.innerHTML = "saved"
}

/**
 * Sets the caret (text cursor) behind the last character.
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
            content: editorContentClass,
            selected: 'editor-button-selected'
        }
    })
}

// todo refactor
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

/**
 * @param {uuid} noteId 
 * @returns Note
 */
async function getNote(noteId) {
    // check cached note
    var note = cache.get(noteId);
    if (note !== undefined) {
        // return cached note
        return note;
    } else {
        // return note from database
        return ipcRenderer.invoke('note-get', noteId).then((result) => {
            return result;
        });
    }
}