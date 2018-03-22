function ajaxQuery(url, type) {
    if (type === undefined) type = "GET";

    return $.ajax({
        type: type,
        url: url
    });
}

function queryUniprot(query) {
    return ajaxQuery('https://www.uniprot.org/uniprot/?query=' + query + '&sort=score&columns=id,entry%20name,reviewed,protein%20names,3d,genes,organism,length&format=tab&limit=10');
}

function querySwissprot(uniprotId) {
    return ajaxQuery('http://cors-proxy.htmldriven.com/?url=http://swissmodel.expasy.org/repository/uniprot/'+uniprotId+'.json?provider=swissmodel')
}

function searchUniprot() {

    const query  = $('#uniprotQueryInput').val();

    $('#progressDiv').css('display', 'block');
    $('#progressDiv.text').text('Searching Uniprot for ' + query);
    queryUniprot(query).then(function (result) {

        $('#progressDiv').css('display', 'none');

        const lines = result.split(/\r?\n/);
        // console.log(lines);
        let table = $('table');
        if (table.length === 0) {
            table = $('<table class="ui sortable celled table"></table>');
        }
        else {
            table.empty();
        }
        const head = $('<thead><tr></tr></thead>');
        let ix3D;
        lines[0].split('\t').forEach(function (val, ix) {
            if (val === '3D') ix3D = ix;
            $(`<th class="">${val}</th>`).appendTo(head);
        });
        table.append(head);
        lines.splice(1).forEach(function (row) {
            const tableRow = $('<tr></tr>');
            let uniprotId;
            row.split('\t').forEach(function (cell, ix) {
                let cellContent;
                if (ix >= 1) cellContent = cell;
                else {
                    uniprotId = cell;
                    cellContent = `<a href="#" onclick="addTab('${cell}'); return false;">${cell}</a>`;
                }

                const td = $(`<td class="">${cellContent}</td>`).appendTo(tableRow);
                if (ix === ix3D && !cell) {
                    querySwissprot(uniprotId).then(function(uniprotIdSmrs){
                        if (JSON.parse(uniprotIdSmrs.body).result.structures.length > 0) td.text('Predicted');
                    });
                }
            });
            table.append(tableRow);
        });

        $('div[data-tab="search-tab"]').append(table);
    })
}

function adjustContainerDimensions(pluginContainer) {
    const activeTab = $('.tab.active');
    const heightComplement = activeTab.offset().top
        + parseInt(activeTab.css('padding-top'))
        + parseInt(activeTab.css('padding-bottom'))
        + parseInt(activeTab.css('margin-top'))
        + parseInt(activeTab.css('margin-bottom'))
        + parseInt(activeTab.css('border-top-width'))
        + parseInt(activeTab.css('border-bottom-width'));
    const widthComplement = parseInt(activeTab.css('padding-left'))
        + parseInt(activeTab.css('padding-right'))
        + parseInt(activeTab.css('margin-left'))
        + parseInt(activeTab.css('margin-right'))
        + parseInt(activeTab.css('border-left-width'))
        + parseInt(activeTab.css('border-right-width'));
    pluginContainer.css('height', `calc(100vh - ${heightComplement}px)`);
    pluginContainer.css('width', `calc(100% - ${widthComplement}px)`);
}

function activateTab(uniprotId){
    $('.tab.active').removeClass('active');
    $('.active').removeClass('active');

    $(`*[data-tab="${uniprotId}"]`).addClass('active');

}

function addTab(uniprotId) {
    if ($(`a[data-tab="${uniprotId}"]`).length > 0) {
        activateTab(uniprotId);
        return;
    }
    const menuItem = $(`<a class="item" data-tab="${uniprotId}">${uniprotId}</a>`);
    $('#mainTabMenu').append(menuItem);

    const tabContainer = $(`<div id="tabContainer${uniprotId}" class="ui bottom attached tab segment" data-tab="${uniprotId}"></div>`);
    const pluginContainer = $(`<div id="pluginContainer${uniprotId}"></div>`);

    tabContainer.append(pluginContainer);
    $('#mainTabs').append(tabContainer);

    //$.tab('change tab', uniprotId); //does not work well, therefore the manual activation below

    activateTab(uniprotId);
    adjustContainerDimensions(pluginContainer);

    menuItem.tab({
        'onVisible': function () {
            /*
             * Needed to fix possible errors caused by having multiple plugins.
             * Each of the is listening to window resize events and when redrawing
             * while not being active, it has zero width and height and thus dynamic
             * dimensions become incorrect.
             */
            adjustContainerDimensions(pluginContainer);
            window.dispatchEvent(new Event('resize'));
        }
    });

    const molstar = new MolStar({
        uniprotId: uniprotId,
        containerId: 'pluginContainer' + uniprotId
    });

    setTimeout(function() {
        const container = $('.transparency-slider-container');
        container.css('border', 'none');
        container.css('margin', '0');
        container.css('padding', '0');
        container.css('box-shadow', 'none');
        container.css('-webkit-box-shadow', 'none');

    }, 500);
}

$(document).ready(function(){
    $('.menu .item')
        .tab()
    ;
});
