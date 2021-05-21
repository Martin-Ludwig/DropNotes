const PouchDB = require('pouchdb');
const db = new PouchDB('./data/local');

const htmlContentDiv = '.ql-editor'

let currentTab;
let content;

let keyupTimeout;
let saveContentDelay = 700;

// Get Content and put contents in editor
async function SetContent(tabId, element) {
    // Todo refactor GetTab and better error handling
    currentTab = await GetTab(tabId);
    console.log("init currentTab", currentTab)
    console.log("init content", content)
    if (currentTab && currentTab["contents"]) {
        content = currentTab["contents"];
    } else {
        content = ''
    }
    document.querySelector(element).innerHTML = content;
}


window.addEventListener('DOMContentLoaded', () => {
    SetContent('tab1', htmlContentDiv);

    console.log("init currentTab", currentTab)
    console.log("init content", content)

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

    // auto save
    document.addEventListener('keyup', function (event) {
        clearTimeout(keyupTimeout);
        keyupTimeout = setTimeout(SaveContent, saveContentDelay);
    })
})

function SaveContent() {
    content = document.querySelector(htmlContentDiv).innerHTML;
    console.log("SAVING NEW CONTENT= ", content)

    UpsertTab('tab1', content)
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