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

    /**
     * Inserts text at the caret (text cursor) position.
     * 
     * @param {string} $html 
     * @param {int} $pos 
     */
    inserHtml($html, $pos = 0) {
        var ctx = this.getContext();
        var doc = ctx.ownerDocument.defaultView;
        var sel = doc.getSelection();
        var range = sel.getRangeAt($pos);

        var textNode = document.createTextNode($html);
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

module.exports.Editor = Editor;