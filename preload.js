const PouchDB = require('pouchdb');
const db = new PouchDB('./data/local');

const htmlContentDiv = '.ql-editor'
var contentDiv;

let currentTab;
let content;

let keyupTimeout;
let saveContentDelay = 700;

let status;

// Get content and put contents in editor
async function SetContent(tabId, element) {
    // Todo refactor GetTab and better error handling
    currentTab = await GetTab(tabId);
    if (currentTab && currentTab["contents"]) {
        content = currentTab["contents"];
    } else {
        content = ''
    }
    document.querySelector(element).innerHTML = content;
    FocusEditor(document.querySelector(htmlContentDiv));
}


window.addEventListener('DOMContentLoaded', () => {
    SetContent('tab1', htmlContentDiv);

    var toolbarOptions = [
        ['bold', 'italic', 'underline'],
        ['link']
    ];
    var options = {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'bubble'
    };

    var Quill = require('quill')

    var editor = new Quill('#content', options);
    contentDiv = document.querySelector(htmlContentDiv);

    // auto save
    // Todo: save after using toolbar option
    contentDiv.addEventListener("input", OnContentChange);
    contentDiv.addEventListener("paste", OnContentChange);
    contentDiv.addEventListener("keyup", (event) => {
        if (event.keyCode == "8" || event.keyCode == "46") {
            OnContentChange();
        }
    });

    status = document.querySelector("#status")
})

function OnContentChange() {
    console.log("OnContentChange")
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(SaveContent, saveContentDelay);
    status.innerHTML = "typing"
}

function SaveContent() {
    content = document.querySelector(htmlContentDiv).innerHTML;
    UpsertTab('tab1', content)
    status.innerHTML = "saved"
}

function UpsertTab(tabId, content) {
    return db.get(tabId).then(function (doc) {
        return db.put({
            _id: tabId,
            _rev: doc._rev,
            contents: content
        });
    }).then(function (response) {
        // handle response
    }).catch(function (err) {
        console.log(err);
    });
}

// TODO:
// Put Initialize document in seperate function
function GetTab(tabId) {
    return db.get(tabId).then(function (doc) {
        return doc;
    }).catch(function (err) {
        // Initialize document
        return db.put({
            _id: tabId,
            contents: ""
        }).then(function (response) {
            // handle response
        }).catch(function (err) {
            console.log(err);
        });
    });
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