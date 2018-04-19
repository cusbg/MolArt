const corsServer = require('./settings').corsServer;

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
        coordinatesFile = corsServer + record.coordinates;
    } else {
        throw Error('Unknown source of PDB mapping data');
    }

    let observedResidues = [];

    const getId = function(){return getPdbId() + getChainId();};
    const getPdbId = function(){return pdbId;};
    const getChainId = function(){return chain;};
    const getExperimentalMethod = function(){return experimentalMethod;};
    const getCoverage = function(){return coverage;};
    const getPdbStart = function(){return pdbStart;};
    const getPdbEnd = function(){return pdbEnd;};
    const getUnpStart = function(){return uniprotStart;};
    const getUnpEnd = function(){return uniprotEnd;};
    const getTaxId = function(){return taxId;};
    const getObservedResidues = function(){return observedResidues;};
    const getSource = function(){return source};
    const getCoordinatesFile = function () {return coordinatesFile; }

    const setObservedResidues = function(or){observedResidues = or};

    const mapPosUnpToPdb = function(pos) {
        return getPdbStart() + parseInt(pos) - getUnpStart();
    };
    const mapPosPdbToUnp = function(pos) {
        return getUnpStart() + parseInt(pos) - getPdbStart();
    };

    const isValidPdbPos = function(pos) {
        return getPdbStart() <= pos && pos <= getPdbEnd();
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

    return  {
        getId: getId
        ,getPdbId: getPdbId
        ,getChainId: getChainId
        ,getExperimentalMethod: getExperimentalMethod
        ,getCoverage: getCoverage
        ,getPdbStart: getPdbStart
        ,getPdbEnd: getPdbEnd
        ,getUnpStart: getUnpStart
        ,getUnpEnd: getUnpEnd
        ,mapPosUnpToPdb: mapPosUnpToPdb
        ,mapPosPdbToUnp: mapPosPdbToUnp
        ,getTaxId: getTaxId
        ,getSource: getSource
        ,getCoordinatesFile: getCoordinatesFile
        ,getDescription: getDescription
        ,getObservedResidues: getObservedResidues
        ,setObservedResidues: setObservedResidues
        ,isValidPdbPos: isValidPdbPos
        ,isValidPdbRegion: isValidPdbRegion
        ,idMatch: idMatch
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
            observedResidues: getObservedResidues()
        }
    }
};

module.exports = pdbMapping;
