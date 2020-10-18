const _ = require('lodash');

const useCorsForSmr = require('./settings').useCorsForSmr;
const corsServer = require('./settings').corsServer;

const STRUCTURE_FORMAT = {
    PDB: 0,
    mmCIF: 1
};

class ObservedRangePoint {
    constructor(data){
        this.posPDBStructure = data.author_residue_number; //number of the residue in the PDB structure
        this.insertionCode = data.author_insertion_code;
        this.posPDBSequence = data.residue_number; // number of the residue in the PDB sequence
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
        format = undefined,
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
        format = STRUCTURE_FORMAT.mmCIF;
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
        format = STRUCTURE_FORMAT.PDB;
        experimentalMethod = `${record.provider} (${record.method})`;
        coverage = record.coverage;
        pdbStart = parseInt(record.from);
        pdbEnd = parseInt(record.to);
        uniprotStart = parseInt(record.from);
        uniprotEnd = parseInt(record.to);
        coordinatesFile = record.coordinates;
        if (useCorsForSmr) coordinatesFile = corsServer + coordinatesFile
    } else if (source === 'USER'){
        pdbId = record.id;
        chain = record.chainId;
        format = record.structure.format.toUpperCase() === 'PDB' ? STRUCTURE_FORMAT.PDB : STRUCTURE_FORMAT.mmCIF;
        experimentalMethod = 'unknown';
        coverage = (parseInt(record.end) - parseInt(record.start)) / (parseInt(record.seqEnd) - parseInt(record.seqStart));
        pdbStart = parseInt(record.start);
        pdbEnd = parseInt(record.end);
        uniprotStart = parseInt(record.seqStart);
        uniprotEnd = parseInt(record.seqEnd);
        if (record.structure.uri !== undefined){
            coordinatesFile = record.structure.uri;
        } else if (record.structure.data !== undefined){
            coordinatesFile = 'data:text/plain;base64,' + btoa(record.structure.data)
        } else {
            throw Error('Structure information parameter requires information about uri or data.')
        }
    }
    else {
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
    const getFormat = function () {return format;};
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
    const getCoordinatesFile = function () {return coordinatesFile; }
    const isPDB = function () {
        return getSource() === 'PDB';
    };

    const getSeqRangeFromObservedRange = function (range) {
        return [
            Math.max(this.getUnpStart(), this.mapPosStructToUnp(range.start.posPDBSequence)),
            Math.min(this.mapPosStructToUnp(range.end.posPDBSequence), this.getUnpEnd())
            ];
    }

    const setUnobservedRanges = function(){
        const ors = getObservedRanges().sort( (a,b) => a.start.posPDBSequence - b.start.posPDBSequence);
        if (ors.length === 0) {
            console.warn(`Structure ${pdbId}:${chain} has no observed range in the mapped region.`);
            return;
        }
        unobservedRanges = [];

        if (1 < ors[0].start.posPDBSequence){
            unobservedRanges.push(new UnobservedRange(1, ors[0].start.posPDBSequence-1));
        }

        for (let i = 1; i < ors.length; i++) {
            unobservedRanges.push(new UnobservedRange(ors[i-1].end.posPDBSequence+1, ors[i].start.posPDBSequence-1))
        }

        if (getLength()  >= ors[ors.length - 1].end.posPDBSequence){ //+1 because length
            unobservedRanges.push(new UnobservedRange(ors[ors.length - 1].end.posPDBSequence+1, getLength()+1));
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
            orc.end.posPDBSequence +=1;
        } else {
            orc.start.posPDBSequence -= pdbStart - 1;
            orc.end.posPDBSequence -= pdbStart - 1;
        }

        return orc;

    }

    const setObservedRanges = function(ors){
        observedRanges = ors.filter(or => {
            // return true;
            return or.start.posPDBSequence <= pdbEnd && or.end.posPDBSequence >= pdbStart;
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
            if (pos >= mapPosStructToUnp(or.start.posPDBSequence) && pos <= mapPosStructToUnp(or.end.posPDBSequence)) {
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
        return `Experimental method: ${getExperimentalMethod()}`;
    };



    return  {
        getId: getId
        ,getPdbId: getPdbId
        ,getChainId: getChainId
        ,getFormat: getFormat
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
        ,getSeqRangeFromObservedRange: getSeqRangeFromObservedRange
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
            format: getFormat(),
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
    ObservedRange: ObservedRange,
    STRUCTURE_FORMAT: STRUCTURE_FORMAT
};
