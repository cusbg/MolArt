const useCorsForSmr = require('./settings').useCorsForSmr;
const corsServer = require('./settings').corsServer;
const urlPredictProtein = require('./settings').urlPredictProtein;

function ajaxQuery(url, type) {
    if (type === undefined) type = "GET";

    return $.ajax({
        type: type,
        url: url
    });//.then(data => Promise.resolve(data), () => Promise.resolve(undefined));
}

function getFastaByUniprotId(uniprotId) {
    return ajaxQuery('https://www.uniprot.org/uniprot/' + uniprotId + '.fasta');
}

function getUnpToPdbMapping(uniprotId) {
    return ajaxQuery('https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/' + uniprotId);
}

function getUnpToSmrMapping(uniprotId) {
  let spUrl = 'https://swissmodel.expasy.org/repository/uniprot/'+uniprotId+'.json?provider=swissmodel'
  if (useCorsForSmr) {
      spUrl = corsServer + 'https://swissmodel.expasy.org/repository/uniprot/'+uniprotId+'.json?provider=swissmodel';
  }

  return ajaxQuery(spUrl).then(function (result) {

    return result.result;
  })
}

function getPredictProtein(uniprotId) {
    return ajaxQuery(`${urlPredictProtein}${uniprotId}?format=molart`);

}

module.exports = {
    getFastaByUniprotId: getFastaByUniprotId
    , getUnpToPdbMapping: getUnpToPdbMapping
    , getUnpToSmrMapping: getUnpToSmrMapping
    , getPredictProtein: getPredictProtein
};
