const useCorsForSmr = require('./settings').useCorsForSmr;
const corsServer = require('./settings').corsServer;

class ObservedRangePoint {
    constructor(data){
        this.posStructure = data.author_residue_number;
        this.insertionCode = data.author_insertion_code;
        this.posSequence = data.residue_number;
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

    let observedRanges = [new ObservedRange({
        start: {
            author_residue_number: uniprotStart,
            author_insertion_code: undefined,
            residue_number: pdbStart
        },
        end: {
            author_residue_number: uniprotEnd,
            author_insertion_code: undefined,
            residue_number: pdbEnd
        }
    })];
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

    const setUnobservedRanges = function(){
        const ors = getObservedRanges().sort( (a,b) => a.start.posSequence - b.start.posSequence);
        unobservedRanges = [];

        if (1 < ors[0].start.posSequence){
            unobservedRanges.push(new UnobservedRange(1, ors[0].start.posSequence-1));
        }

        for (let i = 1; i < ors.length; i++) {
            unobservedRanges.push(new UnobservedRange(ors[i-1].end.posSequence+1, ors[i].start.posSequence-1))
        }

        if (getLength() > ors[ors.length - 1].end.posSequence){
            unobservedRanges.push(new UnobservedRange(ors[ors.length - 1].end.posSequence+1, getLength()));
        }
    };

    const setTaxId = function (tId) {taxId = tId};

    const setObservedResidues = function(or){observedResidues = or};
    const setObservedRanges = function(or){
        observedRanges = or;
        setUnobservedRanges();
    };

    const mapPosUnpToPdb = function(pos) {
        return getPdbStart() + parseInt(pos) - getUnpStart();
    };
    const mapPosPdbToUnp = function(pos) {
        return getUnpStart() + parseInt(pos) - getPdbStart();
    };

    const isValidPdbPos = function(pos) {
        return getPdbStart() <= pos && pos <= getPdbEnd();
    };

    const mapPosSeqToUnp = function (pos) {
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
                TaxId : ${getTaxId()},
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

    const isPDB = function () {
        return getSource() === 'PDB';
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
        ,mapPosSeqToUnp: mapPosSeqToUnp
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
