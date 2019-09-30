const _ = require('lodash');

const useCorsForSmr = require('./settings').useCorsForSmr;
const corsServer = require('./settings').corsServer;

class ObservedRangePoint {
    constructor(data){
        this.posStructurePdb = data.author_residue_number; //PDB residue number
        this.insertionCode = data.author_insertion_code;
        this.posStructure = data.residue_number; // CIF residue number
    }
}
class ObservedRange {
    constructor(data){
        this.start = new ObservedRangePoint(data.start);
        this.end = new ObservedRangePoint(data.end);
    }
}

class UnobservedRange {
    constructor(start, end){
        this.start = start;
        this.end = end;
    }
}

const pdbMapping = function (record, _source = 'PDB') {

    let pdbId = undefined,
        chain = undefined,
        experimentalMethod = undefined,
        coverage = undefined,
        pdbStart = undefined,
        pdbEnd = undefined,
        uniprotStart = undefined,
        uniprotEnd = undefined,
        taxId = undefined,
        source = _source,
        coordinatesFile = undefined;
    if (source === 'PDB') {
        pdbId = record.pdb_id;
        chain = record.chain_id;
        experimentalMethod = record.experimental_method;
        coverage = record.coverage;
        pdbStart = parseInt(record.start);
        pdbEnd = parseInt(record.end);
        uniprotStart = parseInt(record.unp_start);
        uniprotEnd = parseInt(record.unp_end);
        coordinatesFile = 'https://www.ebi.ac.uk/pdbe/static/entry/' + pdbId + '_updated.cif';
        taxId = record.tax_id;
    } else if (source === 'SMR') {//swissprot model repository
        const sTemplate = record.template.match(/(.+)\.(.+)+\.(.+)/);
        pdbId = sTemplate[1] + '.' + sTemplate[2];
        chain = sTemplate[3];
        experimentalMethod = `${record.provider} (${record.method})`;
        coverage = record.coverage;
        pdbStart = parseInt(record.from);
        pdbEnd = parseInt(record.to);
        uniprotStart = parseInt(record.from);
        uniprotEnd = parseInt(record.to);
        coordinatesFile = record.coordinates;
        if (useCorsForSmr) coordinatesFile = corsServer + coordinatesFile
    } else {
        throw Error('Unknown source of PDB mapping data');
    }

    let observedResidues = [];

    let observedRanges = [shiftObservedRangeToFitMapping(new ObservedRange({
        start: {
            author_residue_number: pdbStart,
            author_insertion_code: undefined,
            residue_number: 1
        },
        end: {
            author_residue_number: pdbEnd,
            author_insertion_code: undefined,
            residue_number: uniprotEnd-uniprotStart
        }
    }))];
    let unobservedRanges = [];

    const getId = function(){return getPdbId() + getChainId();};
    const getPdbId = function(){return pdbId;};
    const getChainId = function(){return chain;};
    const getExperimentalMethod = function(){return experimentalMethod;};
    const getCoverage = function(){return coverage;};
    const getLength = function () {return getUnpEnd() - getUnpStart();};
    const getPdbStart = function(){return pdbStart;};
    const getPdbEnd = function(){return pdbEnd;};
    const getUnpStart = function(){return uniprotStart;};
    const getUnpEnd = function(){return uniprotEnd;};
    const getTaxId = function(){return taxId;};
    const getObservedResidues = function(){return observedResidues;};
    const getObservedRanges = function(){return observedRanges;};
    const getUnobservedRanges = function(){return unobservedRanges;};
    const getSource = function(){return source};
    const getCoordinatesFile = function () {return coordinatesFile; };

    const isPDB = function () {
        return getSource() === 'PDB';
    };

    const setUnobservedRanges = function(){
        const ors = getObservedRanges().sort( (a,b) => a.start.posStructure - b.start.posStructure);
        if (ors.length === 0) {
            console.warn(`Structure ${pdbId}:${chain} has no observed range in the mapped region.`);
            return;
        }
        unobservedRanges = [];

        if (1 < ors[0].start.posStructure){
            unobservedRanges.push(new UnobservedRange(1, ors[0].start.posStructure-1));
        }

        for (let i = 1; i < ors.length; i++) {
            unobservedRanges.push(new UnobservedRange(ors[i-1].end.posStructure+1, ors[i].start.posStructure-1))
        }

        if (getLength()  >= ors[ors.length - 1].end.posStructure){ //+1 because length
            unobservedRanges.push(new UnobservedRange(ors[ors.length - 1].end.posStructure+1, getLength()+1));
        }
    };

    const setTaxId = function (tId) {taxId = tId};

    const setObservedResidues = function(or){observedResidues = or};

    function shiftObservedRangeToFitMapping(or) {
        /*
        The observed ranges API endpoint does not need to match the best_structures API and thus range which starts
        at position 1 can actually start before the beginning of the mapped region. This is, e.g. the case of 2dnc,
        where observed range is
        "observed": [
              {
                "start": {
                  "author_residue_number": 1,
                  "author_insertion_code": null,
                  "struct_asym_id": "A",
                  "residue_number": 1
                },
                "end": {
                  "author_residue_number": 98,
                  "author_insertion_code": null,
                  "struct_asym_id": "A",
                  "residue_number": 98
                }
              }
            ],
           and best mapping is
           {
              "end": 92,
              "chain_id": "A",
              "pdb_id": "2dnc",
              "start": 8,
              "unp_end": 141,
              "coverage": 0.17,
              "unp_start": 57,
              "resolution": null,
              "experimental_method": "Solution NMR",
              "tax_id": 9606
            }
           Thus the mapping actually does not cover the full available structure.
         */

        const orc = _.cloneDeep(or);
        if (source === 'SMR'){
            orc.end.posStructure +=1;
        } else {
            orc.start.posStructure -= pdbStart;
            orc.end.posStructure -= pdbStart - 1;
        }

        return orc;

    }

    const setObservedRanges = function(ors){
        observedRanges = ors.filter(or => {
            // return true;
            return or.start.posStructure <= pdbEnd && or.end.posStructure >= pdbStart;
        }).map(or => shiftObservedRangeToFitMapping(or));
        setUnobservedRanges();
    };

    const mapPosUnpToPdb = function(pos) {
        return getPdbStart() + parseInt(pos) - getUnpStart();
    };
    const mapPosPdbToUnp = function(pos) {
        return getUnpStart() + parseInt(pos) - getPdbStart();
    };

    const isInObservedRanges = function (pos) {
        let ors = getObservedRanges();
        for (let i = 0; i< ors.length; ++i){
            let or = ors[i];
            if (pos >= mapPosStructToUnp(or.start.posStructure) && pos <= mapPosStructToUnp(or.end.posStructure)) {
                return true;
            }
        }
        return false;
    };

    const isValidPdbPos = function(pos) {
        return getPdbStart() <= pos && pos <= getPdbEnd();
    };

    const mapPosStructToUnp = function (pos) {
        return getUnpStart() + pos-1;
    };

    const isValidPdbRegion = function(begin, end) {

        return ( getPdbStart() <= begin  && begin <= getPdbEnd() )
            || ( getPdbStart() <= end && end <= getPdbEnd()
            || ( begin <= getPdbStart() && getPdbEnd()  <= end )
                );
    };

    const idMatch = function(pdbId, chainId){
        return getPdbId().toLowerCase() === pdbId.toLowerCase() && getChainId().toLowerCase() === chainId.toLowerCase();
    };

    const getDescription = function(){
        const source = getSource();
        if (source === 'PDB') {
            return `Experimental method: ${getExperimentalMethod()},
                Coverage : ${getCoverage()},                
                PDB begin: ${getPdbStart()},
                PDB end: ${getPdbEnd()}`;

        } else if (source === 'SMR') {
            return `Experimental method: ${getExperimentalMethod()},
                Coverage : ${getCoverage()},                
                PDB begin: ${getPdbStart()},
                PDB end: ${getPdbEnd()}`;
        } else {
            throw Error('Unknown source of PDB mapping data');
        }
    };



    return  {
        getId: getId
        ,getPdbId: getPdbId
        ,getChainId: getChainId
        ,getExperimentalMethod: getExperimentalMethod
        ,getCoverage: getCoverage
        ,getLength: getLength
        ,getPdbStart: getPdbStart
        ,getPdbEnd: getPdbEnd
        ,getUnpStart: getUnpStart
        ,getUnpEnd: getUnpEnd
        ,mapPosUnpToPdb: mapPosUnpToPdb
        ,mapPosPdbToUnp: mapPosPdbToUnp
        ,mapPosStructToUnp: mapPosStructToUnp
        ,getTaxId: getTaxId
        ,getSource: getSource
        ,getCoordinatesFile: getCoordinatesFile
        ,getDescription: getDescription
        ,getObservedResidues: getObservedResidues
        ,setObservedResidues: setObservedResidues
        ,getObservedRanges: getObservedRanges
        ,setObservedRanges: setObservedRanges
        ,getUnobservedRanges: getUnobservedRanges
        ,setTaxId: setTaxId
        ,isValidPdbPos: isValidPdbPos
        ,isValidPdbRegion: isValidPdbRegion
        ,isInObservedRanges: isInObservedRanges
        ,idMatch: idMatch
        ,isPDB: isPDB
        ,content: {
            id: getId(),
            pdbId: getPdbId(),
            chainId: getChainId(),
            experimentalMethod: getExperimentalMethod(),
            coverage: getCoverage(),
            pdbStart: getPdbStart(),
            podbEnd: getPdbEnd(),
            unpStart: getUnpStart(),
            unpEnd: getUnpEnd(),
            taxId: getTaxId(),
            source: getSource(),
            observedResidues: getObservedResidues(),
            observedRanges: getObservedRanges(),
            unobservedRanges: getUnobservedRanges()
        }
    }
};

module.exports = {
    pdbMapping: pdbMapping,
    ObservedRange: ObservedRange
};
