'use strict';

class Editor {

    context;
    content;

    constructor(element) {
        this.context = element;
    }

    getContent() {
        return this.context.innerHTML;
    }

    setContent(content) {
        this.context.innerHTML = content;
    }

    /**
     * Returns the DOM node context originally passed to the editor.
     */
    getContext() {
        return this.context;
    }
}

module.exports.Editor = Editor;