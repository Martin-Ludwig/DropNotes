const fs = require('fs');

/**
 * 
 * 
 * @returns array
 */
function getTablist() {
    try {
        rawdata = fs.readFileSync('./data/local/tablist.json');
        return JSON.parse(rawdata);
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
    data.push({ "name": name, "id": id, "active": false });
    fs.writeFileSync('./data/local/tablist.json', JSON.stringify(data));
    return data;
}

/**
 * Removes a tab
 * @param {*} id 
 */
async function removeTab(id) {
    data_update = [];
    data = getTablist();
    data.forEach(tab => {
        if (tab["id"] != id) {
            data_update.push(tab);
        }
    });

    updateTablist(data_update);
    return data_update;
}

function setActiveTab(id) {
    data_update = [];
    data = getTablist();
    data.forEach(tab => {
        if (tab["id"] == id) {
            tab["active"] = true;
        } else {
            tab["active"] = false;
        }
        data_update.push(tab);
    });

    updateTablist(data_update);
}

function renameTab(id, newName) {
    data_update = [];
    data = getTablist();
    data.forEach(tab => {
        if (tab["id"] == id) {
            tab["name"] = newName;
        }
        data_update.push(tab);
    });

    updateTablist(data_update);
}

module.exports.getTablist = getTablist
module.exports.updateTablist = updateTablist
module.exports.addTab = addTab
module.exports.removeTab = removeTab
module.exports.setActiveTab = setActiveTab
module.exports.renameTab = renameTab