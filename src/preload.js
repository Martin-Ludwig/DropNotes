'use strict';

const { ipcRenderer } = require("electron");
const { Editor } = require("./editor");
const { Note } = require("./note");

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

        status = document.querySelector("#input-status");
    })

    // Click event: create new note
    document.getElementById('add-new-note').addEventListener("click", () => {
        createNewNote();
    });

    // Click event: switch notes
    document.getElementById('tab-bar').addEventListener("click", (element) => {
        if (element.target.id == "tab-bar") {
            return;
        }

        var nextTab = element.target

        console.log("getElementById('tab-bar'):element.target= ", element.target);

        if (nextTab.id !== undefined &&
            nextTab.id !== currentNote.id) {

            // save current tab
            // Todo: only save on content change
            saveNote(currentNote);

            // switch note
            switchToNote(nextTab.id);
        } else if (element.target.id !== document.activeElement.id) {
            // todo: refactor
            // todo: disable newline, maxlength
            // rename note
            element.target.setAttribute("contenteditable", true);

            var range = document.createRange();
            range.selectNodeContents(element.target);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    // Click event: delete notes
    document.getElementById('delete-note').addEventListener("click", async (element) => {
        // deletes current and returns the next tab
        var nextNoteId = await ipcRenderer.invoke("note-delete", currentNote.id);

        if (nextNoteId != null) {
            cache.delete(currentNote.id);
            document.getElementById(currentNote.id).remove();
            switchToNote(nextNoteId);
        } else {
            clearNoteContent();
        }

    });

    document.getElementById('tab-bar').addEventListener("focusout", (element) => {
        element.target.setAttribute("contenteditable", false);
        ipcRenderer.send('note-rename', element.target.id, element.target.innerHTML);
    });

    document.getElementById('tab-bar').addEventListener("wheel", (element) => {
        const tabbar = document.getElementById('tab-bar');
        if (tabbar.scrollWidth > tabbar.offsetWidth) {
            element.preventDefault();
            tabbar.scrollLeft += element.deltaY * 0.3;
        }
    });

    // tab pressed: insert \t 
    document.getElementById('editor').addEventListener('keydown', function (e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            editor.inserHtml("\t");
        }
    });

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
    try {
        if (noteId == null) {
            throw "Cannot switch to DropNote. DropNote does not exist.";
        }

        removeActiveClass(currentNote.id);

        if (currentNote !== undefined && currentNote.id !== undefined) {
            // cache note
            cache.set(currentNote.id, currentNote);
        }

        currentNote = await getNote(noteId);
        ipcRenderer.send('note-switch', currentNote.id);

        editor.setContent(currentNote.content);

        // set text cursor
        focusEditor(editor.getContext());

        setActiveClass(currentNote.id);


    } catch (error) {
        console.log(error);
    }


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

function removeActiveClass(tabId) {
    var e = document.getElementById(tabId);
    if (e != null) {
        e.classList.remove("active");
    }
}

function setActiveClass(tabId) {
    var e = document.getElementById(tabId);
    if (e != null) {
        e.classList.add("active");
    }
}

function clearNoteContent() {
    editor.setContent("");
    OnContentChange();
    focusEditor(editor.getContext());
}