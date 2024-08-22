const { method } = require('lodash');

const useCorsForSmr = require('./settings').useCorsForSmr;
const corsServer = require('./settings').corsServer;
const urlPredictProtein = require('./settings').urlPredictProtein;

function ajaxQuery(url, type) {
    if (type === undefined) type = "GET";

    //return fetch(url, {method: type}).then(res => res.json());

    return $.ajax({
        type: type,
        url: url
    });//.then(data => Promise.resolve(data), () => Promise.resolve(undefined));
}

function getFastaByUniprotId(uniprotId) {
    return ajaxQuery('https://rest.uniprot.org/uniprotkb/' + uniprotId + '.fasta');
}

function getUnpToPdbMapping(uniprotId) {
        return ajaxQuery('https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/' + uniprotId);
}

function getObservedRangesAPI(pdbId, chainId) {
    return `https://www.ebi.ac.uk/pdbe/api/pdb/entry/polymer_coverage/${pdbId}/chain/${chainId}`;
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

function getAfURL(uniprotId) {
    return `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
}

function getAfCifURL(uniprotId) {
    return `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v1.cif`;
}


function getUnpToAfMapping(uniprotId) {

    return ajaxQuery(getAfURL(uniprotId));
}

function getPredictProtein(uniprotId) {
    return ajaxQuery(`${urlPredictProtein}${uniprotId}?format=molart`);

}

/*
In chrome, there is a limit on resources and when the promise pool is too large, it runs out of resources. 
An example is retriving polymer_coverage for P01308, which has about 1600 chains, i.e. the pool has 
more than 1600 requests.
*/
function promiseAll(promises){
    const cntMaxConcurent = 10;
    let cntProcessed = 0;

    
    let promise = Promise.resolve([]);
    let res = [];
    do {
        (() => {
            let auxcntProcessed = cntProcessed;
            promise = promise.then((resPromise) => {
                res = res.concat(resPromise);

                console.log("running 100 promisses");
                return Promise.all(promises.slice(auxcntProcessed, Math.min(promises.length, auxcntProcessed + cntMaxConcurent)));
            });
        })();
        cntProcessed += cntMaxConcurent;

    } while (cntProcessed < promises.length);

    return promise.then(resPromise => res.concat(resPromise));

}

function fetchAllJson(APIs){
    const cntMaxConcurent = 500;
    let cntProcessed = 0;

    
    let promise = Promise.resolve([]);
    let res = [];
    do {
        (() => {
            let auxcntProcessed = cntProcessed;
            promise = promise.then((resPromise) => {
                res = res.concat(resPromise);

                console.log(`running ${cntMaxConcurent} promisses`);
                const promises = APIs.slice(auxcntProcessed, Math.min(APIs.length, auxcntProcessed + cntMaxConcurent)).map(api => fetch(api).then(res => res.json()))
                return Promise.all(promises);
            });
        })();
        cntProcessed += cntMaxConcurent;

    } while (cntProcessed < APIs.length);

    return promise.then(resPromise => res.concat(resPromise));

}

module.exports = {
    getFastaByUniprotId: getFastaByUniprotId
    , getUnpToPdbMapping: getUnpToPdbMapping
    , getUnpToSmrMapping: getUnpToSmrMapping
    , getUnpToAfMapping: getUnpToAfMapping
    , getPredictProtein: getPredictProtein
    , getObservedRanges: getObservedRanges
    , getObservedRangesAPI: getObservedRangesAPI
    , getUniprotSegments: getUniprotSegments
    , getAfURL: getAfURL
    , getAfCifURL: getAfCifURL
    //, promiseAll: promiseAll  
    , fetchAllJson: fetchAllJson
};
