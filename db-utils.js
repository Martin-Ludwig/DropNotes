'use strict';

const PouchDB = require('pouchdb');
const { v4: uuidv4 } = require('uuid');
const { Note } = require('./note');

// todo: insert and update function

class DropNotesData {

    /**
     * 
     * @returns Note
     */
    static createEmptyNote() {
        var note = DropNotesData.db.put({
            _id: uuidv4(),
            displayname: "new",
            content: ""
        }).then(function (doc) {
            return DropNotesData.getNote(doc.id);
        }).catch(function (err) {
            console.log(err);
        });

        return note;
    }

    /**
     * 
     * @param {uuidv4} noteId 
     * @returns Note
     */
    static async getNote(noteId) {
        var doc = await DropNotesData.db.get(noteId).then(function (doc) {
            return doc;
        }).catch(function (err) {
            // Document not found
            return null
        });

        return new Note(doc["_id"], doc["displayname"], doc["content"])
    }

    static upsertNote(noteId, content) {
        return DropNotesData.db.get(noteId).then(function (doc) {
            return DropNotesData.db.put({
                _id: noteId,
                _rev: doc._rev,
                content: content
            });
        }).then(function (response) {
            // handle response
        }).catch(function (err) {
            console.log(err);
        });
    }

    static deleteNote(noteId) {
        DropNotesData.db.get(noteId).then(function (doc) {
            return db.remove(doc);
        }).then(function (result) {
            // handle result
        }).catch(function (err) {
            console.log(err);
        });
    }

    static getAllNotes() {
        return DropNotesData.db.allDocs();
    }

}

DropNotesData.db = new PouchDB('./data/local/db');

module.exports.dropnotesdata = DropNotesData;