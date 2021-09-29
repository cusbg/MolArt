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

//sometimes, the structure has insertions with respect to UniProt record, meaning that the UniProt does not
//need to fully cover the structure, the mappings API has information about segments which correspond to the
//regions in the structure covered by the uniprot record (e.g. 6i53 where the resiudes 28-35 [including] are not observed
// in the uniprot record
// {
//     "6i53": {
//     "UniProt": {
//         "P14867": {
//             "identifier": "GBRA1_HUMAN",
//                 "name": "GBRA1_HUMAN",
//                 "mappings": [
//                 {
//                     "entity_id": 2,
//                     "chain_id": "A",
//                     "start": {
//                         "author_residue_number": null,
//                         "author_insertion_code": "",
//                         "residue_number": 1
//                     },
//                     "unp_end": 27,
//                     "unp_start": 1,
//                     "end": {
//                         "author_residue_number": null,
//                         "author_insertion_code": "",
//                         "residue_number": 27
//                     },
//                     "struct_asym_id": "B"
//                 },
//                 {
//                     "entity_id": 2,
//                     "chain_id": "A",
//                     "start": {
//                         "author_residue_number": null,
//                         "author_insertion_code": "",
//                         "residue_number": 36
//                     },
//                     "unp_end": 456,
//                     "unp_start": 28,
//                     "end": {
//                         "author_residue_number": null,
//                         "author_insertion_code": "",
//                         "residue_number": 464
//                     },
//                     "struct_asym_id": "B"
//                 },
//                 ...

function getUniprotSegments(pdbId){

    return ajaxQuery(`https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${pdbId}`);

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

function getAfURI(uniprotId) {
    return `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
}

function getUnpToAfMapping(uniprotId) {

    return ajaxQuery(getAfURI(uniprotId));
}

function getPredictProtein(uniprotId) {
    return ajaxQuery(`${urlPredictProtein}${uniprotId}?format=molart`);

}

module.exports = {
    getFastaByUniprotId: getFastaByUniprotId
    , getUnpToPdbMapping: getUnpToPdbMapping
    , getUnpToSmrMapping: getUnpToSmrMapping
    , getUnpToAfMapping: getUnpToAfMapping
    , getPredictProtein: getPredictProtein
    , getObservedRanges: getObservedRanges
    , getUniprotSegments: getUniprotSegments
    , getAfURI: getAfURI
};
