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
    const spUrl = 'https://swissmodel.expasy.org/repository/uniprot/'+uniprotId+'.json?provider=swissmodel';
    return ajaxQuery('http://cors-proxy.htmldriven.com/?url=' + spUrl).then(function (result) {
        return Promise.resolve(JSON.parse(result.body).result);
    }, function(){
        return ajaxQuery('https://crossorigin.me/' + spUrl).then(function (result) {
            return Promise.resolve(result.result)
        });
    })
}

module.exports = {
    getFastaByUniprotId: getFastaByUniprotId
    ,getUnpToPdbMapping: getUnpToPdbMapping
    ,getUnpToSmrMapping: getUnpToSmrMapping
};
