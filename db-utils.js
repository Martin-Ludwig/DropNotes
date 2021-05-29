const PouchDB = require('pouchdb');
const { v4: uuidv4 } = require('uuid');

class DropNotesData {

    static createEmptyNote() {
        return DropNotesData.db.put({
            _id: uuidv4(),
            displayname: "new",
            contents: ""
        }).then(function (doc) {
            return DropNotesData.getNote(doc.id);
        }).catch(function (err) {
            console.log(err);
        });
    }

    static getNote(noteId) {
        return DropNotesData.db.get(noteId).then(function (doc) {
            return doc;
        }).catch(function (err) {
            // Document not found
            return null
        });
    }

    static upsertNote(noteId, content) {
        return DropNotesData.db.get(noteId).then(function (doc) {
            return DropNotesData.db.put({
                _id: noteId,
                _rev: doc._rev,
                contents: content
            });
        }).then(function (response) {
            // handle response
        }).catch(function (err) {
            console.log(err);
        });
    }

    static deleteNote(noteId) {
        DropNotesData.db.get('noteId').then(function (doc) {
            return db.remove(doc);
        }).then(function (result) {
            // handle result
        }).catch(function (err) {
            console.log(err);
        });
    }

    static getAllTabs() {
        return DropNotesData.db.allDocs();
    }

}

DropNotesData.db = new PouchDB('./data/local/db');

module.exports.dropnotesdata = DropNotesData;