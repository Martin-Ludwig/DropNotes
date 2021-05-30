'use strict';

class Note {

    id;
    name;
    content;

    constructor(id, name = 'new', content = '') {
        this.id = id;
        this.name = name;
        this.content = content;
    }

}

module.exports.Note = Note;