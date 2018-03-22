function ajaxQuery(url, type) {
    if (type === undefined) type = "GET";

    return $.ajax({
        type: type,
        url: url
    });
}

function getFastaByUniprotId(uniprotId) {
    return ajaxQuery('https://www.uniprot.org/uniprot/' + uniprotId + '.fasta');
}

function getUnpToPdbMapping(uniprotId) {
    return ajaxQuery('https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/' + uniprotId);
}

function getUnpToSmrMapping(uniprotId) {
    const corsProxy = 'https://crossorigin.me/';
    // const corsProxy = 'http://cors-proxy.htmldriven.com/?url=';
    return ajaxQuery(corsProxy + 'https://swissmodel.expasy.org/repository/uniprot/'+uniprotId+'.json?provider=swissmodel').then(function (result) {
        if (corsProxy.indexOf('crossorigin.me') >= 0) {
            return Promise.resolve(result.result)
        } else {
            return Promise.resolve(JSON.parse(result.body).result);
        }

    })
}

module.exports = {
    getFastaByUniprotId: getFastaByUniprotId
    ,getUnpToPdbMapping: getUnpToPdbMapping
    ,getUnpToSmrMapping: getUnpToSmrMapping
};
