window.addEventListener('DOMContentLoaded', () => {

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
})
