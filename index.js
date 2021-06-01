'use strict';

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

const { dropnotesdata } = require('./db-utils');


let tablist = loadTablist();

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    ipcMain.handleOnce("get-tablist", () => {
        return tablist;
    })

    ipcMain.handle('note-create', async (event) => {
        var note = await dropnotesdata.createEmptyNote();
        return note;
    })

    ipcMain.handle('note-get', async (event, noteId) => {
        var note = await dropnotesdata.getNote(noteId);
        return note;
    })

    ipcMain.on('note-update', (event, note) => {
        dropnotesdata.upsertNote(note.id, note.content)
    })

    ipcMain.on('note-delete', (event, noteId) => {
        dropnotesdata.deleteNote(noteId)
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

async function loadTablist() {
    const { getTablist } = require('./tablist.js');

    tablist = await getTablist();
    if (tablist.length == 0) {
        // initialize first tab
        tablist = await initTablist();
    }

    return tablist;
}

async function initTablist() {
    var newtab = await dropnotesdata.createEmptyNote();

    const { addTab } = require('./tablist.js')
    return addTab(newtab.name, newtab.id);
}