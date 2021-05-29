'use strict';

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

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
    const { dropnotesdata } = require('./db-utils');
    newtab = await dropnotesdata.createEmptyNote();

    const { addTab } = require('./tablist.js')
    return addTab(newtab["displayname"], newtab["_id"]);
}