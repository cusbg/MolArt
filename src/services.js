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

function getObservedRanges(pdbId, chainId) {
    return ajaxQuery(`https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`);

    // {
    //   "5wf5": {
    //     "molecules": [
    //       {
    //         "entity_id": 1,
    //         "chains": [
    //           {
    //             "observed": [
    //               {
    //                 "start": {
    //                   "author_residue_number": 3,     --- number of residue in the PDB structure
    //                   "author_insertion_code": null,
    //                   "struct_asym_id": "A",
    //                   "residue_number": 34            --- number of residue in the PDB sequence (the structure does not need to cover the full sequence [even when considering unobserved resiues])
    //                 },
    //                 "end": {
    //                   "author_residue_number": 148,
    //                   "author_insertion_code": null,
    //                   "struct_asym_id": "A",
    //                   "residue_number": 179
    //                 }
    //               },
    //               {
    //                 "start": {
    //                   "author_residue_number": 157,
    //                   "author_insertion_code": null,
    //                   "struct_asym_id": "A",
    //                   "residue_number": 188
    //                 },
    //                 "end": {
    //                   "author_residue_number": 307,
    //                   "author_insertion_code": null,
    //                   "struct_asym_id": "A",
    //                   "residue_number": 485
    //                 }
    //               }
    //             ],
    //             "chain_id": "A",
    //             "struct_asym_id": "A"
    //           }
    //         ]
    //       }
    //     ]
    //   }
    // }
    //

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
    , getObservedRanges: getObservedRanges
};
