const fs = require('fs');

function getTablist() {
    try {
        rawdata = fs.readFileSync('./data/local/tablist.json');
        return tablist = JSON.parse(rawdata);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
    }
}

function updateTablist(json) {
    data = JSON.stringify(json);
    return fs.writeFileSync('./data/local/tablist.json', data);
}

function addTab(name, id) {
    data = getTablist();
    data.push({ "name": name, "id": id });
    fs.writeFileSync('./data/local/tablist.json', JSON.stringify(data));
    return data;
}

module.exports.getTablist = getTablist
module.exports.updateTablist = updateTablist
module.exports.addTab = addTab