const PouchDB = require('pouchdb');

// Todo: delete tab

class DropNotesData {

    static createEmptyTab(tabId) {
        return DropNotesData.db.put({
            _id: tabId,
            contents: ''
        }).then(function (response) {
            // handle response
        }).catch(function (err) {
            console.log(err);
        });
    }

    static getTab(tabId) {
        return DropNotesData.db.get(tabId).then(function (doc) {
            return doc;
        }).catch(function (err) {
            // Document not found
            return null
        });
    }

    static upsertTab(tabId, content) {
        return DropNotesData.db.get(tabId).then(function (doc) {
            return DropNotesData.db.put({
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

}

DropNotesData.db = new PouchDB('./data/local');

module.exports.dropnotesdata = DropNotesData;