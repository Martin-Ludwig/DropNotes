'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const { dropnotesdata } = require('./db-utils');
const { getTablist, addTab, removeTab, setActiveTab, renameTab } = require('./tablist.js');

let tablist = loadTablist();

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false
        }
    });

    win.loadFile('./src/index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    });

    ipcMain.handleOnce("get-tablist", () => {
        return tablist;
    });

    ipcMain.handle('note-create', async (event) => {
        var note = await dropnotesdata.createEmptyNote();
        addTab(note.name, note.id);
        return note;
    });

    ipcMain.handle('note-get', async (event, noteId) => {
        if (noteId !== null) {
            var note = await dropnotesdata.getNote(noteId);
            return note;
        }
    });

    ipcMain.on('note-update', (event, note) => {
        if (note !== null) {
            dropnotesdata.upsertNote(note.id, note.content);
        }
    });

    ipcMain.handle('note-delete', async (event, noteId) => {
        if (noteId !== null) {
            tablist = await getTablist();

            if (tablist.length > 1) {
                dropnotesdata.deleteNote(noteId);
                tablist = await removeTab(noteId);

                // todo tab switch history
                return tablist[0]["id"];
            } else {
                return null;
            }
        }
    });

    ipcMain.on('note-switch', (event, noteId) => {
        if (noteId !== null) {
            setActiveTab(noteId);
        }
    });

    ipcMain.on('note-rename', (event, noteId, newName) => {
        if (noteId !== null && newName !== null) {
            renameTab(noteId, newName);
        }
    });

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

async function loadTablist() {
    tablist = await getTablist();
    if (tablist.length == 0) {
        // initialize first tab
        tablist = await initTablist();
    }

    return tablist;
}

async function initTablist() {
    var newtab = await dropnotesdata.createEmptyNote();

    return addTab(newtab.name, newtab.id);
}