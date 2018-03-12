/* eslint-disable indent,max-len */
const createPlugin = require('./lm.plugin.js');

require('../node_modules/semantic-ui-transition/transition.min');
require('../node_modules/semantic-ui-dropdown/dropdown.min');

require('./lib/semantic-ui-range/range');

function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function beautifyGroupName(name) {
    return capitalize(name).replace('_', ' ');
}

const LmController = function () {

    const plugin = createPlugin();

    class PdbRecordMapping {
        constructor(){
            this.pdbRecord = undefined;
            this.modelId = undefined;
            this.selectionId = undefined;
            this.observedResidues = [];
        }

        setPdbRecord(pdbRecord) {
            this.pdbRecord = pdbRecord;
        }

        getPdbRecord() {
            return this.pdbRecord;
        }

        setModelId(modelId) {
            this.modelId = modelId;
        }

        getModelId() {
            return this.modelId;
        }

        setSelectionId(selectionId) {
            this.selectionId = selectionId;
        }

        getSelectionId() {
            return this.selectionId;
        }

        setObservedResidues(observedResidues) {
            this.observedResidues= observedResidues;
        }

        getObservedResidues() {
            return this.observedResidues;
        }
    }

    let globals;
    const mapping = {};

    function setToArray(set) {
        const array = [];

        set.forEach(v => array.push(v));
        return array;
    }

    function uniquifyArray(arr) {
        const newArr = [];

        arr.forEach(v => {
            if (newArr.indexOf(v) === -1) newArr.push(v);
        });

        return newArr;
    }

    function getPdbIds() {
        // return [...new Set(globals.pdbRecords.map(rec=>rec.getPdbId()))];
        // return Array.from(new Set(globals.pdbRecords.map(rec=>rec.getPdbId())));
        // return setToArray(new Set(globals.pdbRecords.map(rec=>rec.getPdbId())));
        return uniquifyArray(globals.pdbRecords.map(rec=>rec.getPdbId()));
    }

    function getPdbChains(pdbId) {
        // return [... new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId()))];
        // return Array.from(new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId())));
        // return setToArray(new Set(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId())));
        return uniquifyArray(globals.pdbRecords.filter(rec => rec.getPdbId() === pdbId).map(rec => rec.getChainId()));
    }

    /**
     * Fills dropdown with pdb chains to chains of currently selected pdb record and selects
     * the chain, which should be active or the first chain in the list.
     *
     * @param selectedFromActive If true, the selected item will be chosen based on active structure,
     * if not, it will be the first item in the list of chains. That is used in situations when the
     * user selects PDB ID from the dropdown and not from ProtVista.
     */
    function updateHeaderChainIds(val, text, selected) {

        const pdbId = (val === undefined ? getHeaderPdbId() : val);
        const pdbChainList = getHeaderPdbChainList();
        const ddContent = getPdbChains(pdbId).map(val => { return {name: val, value: val};});

        if (ddContent.length === 0) return;// TODO: this should not happen
        /*if (!selectedFromActive)*/ ddContent[0].selected = true;

        pdbChainList.dropdown('change values', ddContent);

        /*if (selectedFromActive)*/ updateHeaderPdbChainToActive();

        // if (triggerChainListChange) pdbChainList.trigger('change');
    }

    function populateHeaderPdbIds() {

        const pdbIdsList = getHeaderPdbIdList();
        // pdbIdsList.empty();
        // pdbIds.forEach(val => { pdbIdsList.append(`<option value="${val}">${val}</option>`); })
        const ddContent = getPdbIds().map(val => { return {name: val, value: val};});

        ddContent[0].selected = true;
        pdbIdsList.dropdown({
            values: ddContent,
            action: 'activate',
            // onChange: (val, text, selected) => { updateHeaderChainIds(val, text, selected); }
        });

        updateHeaderChainIds();
    }

    function getHeaderPdbIdList() {
        return globals.container.find('.lm-pdb-id-list');
    }

    function getHeaderPdbChainList() {
        return globals.container.find('.lm-pdb-chain-list');
    }

    function getHeaderPdbId() {
        //For some reason, using get value closes the combo
        return getHeaderPdbIdList().find('.text').text();
    }

    function getHeaderChainId() {
        // return getHeaderPdbChainList().val();
        return getHeaderPdbChainList().dropdown('get value');
    }

    function getHeaderLinkContainer() {
        return globals.container.find('.pv3d-header-lm .pdb-link');
    }


    function deactivateDropdownsEvents() {
        getHeaderPdbIdList().dropdown('setting', 'onChange', function (value) {});
        getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {});
    }

    function activateDropdownsEvents() {

        getHeaderPdbIdList().dropdown('setting', 'onChange', function (val, text, selected) {
            updateHeaderChainIds(val, text, selected);
        });

        getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {
            if (value) {
                updateActiveStructureFromHeader();
            }
        });
    }

    function updateHeader() {
        if (globals.activeStructure.pdbId === getHeaderPdbId() && globals.activeStructure.chainId === getHeaderChainId()) return;

        deactivateDropdownsEvents();
        if (getHeaderPdbId() !== globals.activeStructure.pdbId) {

            // pdbChainListOnChange(false);
            updateHeaderPdbIdToActive();
            updateHeaderChainIds();
            // pdbChainListOnChange(true);
        } else {

            updateHeaderChainIds();
        }
        activateDropdownsEvents();

        // updateHeaderPdbChainToActive();
    }

    function updateHeaderPdbIdToActive() {
        // const list = getHeaderPdbIdList();
        // const opts = list.find('option').toArray().map(o => o.value);
        // list[0].selectedIndex = opts.indexOf(globals.activeStructure.pdbId);
        getHeaderPdbIdList().dropdown('set selected', globals.activeStructure.pdbId);
    }

    function updateHeaderPdbChainToActive() {
        // const list = globals.container.find('.pv3d-header select.lm-pdb-chain-list');
        // const opts = list.find('option').toArray().map(o => o.value);
        getHeaderPdbChainList().dropdown('set selected', globals.activeStructure.chainId);

    }

    function updateHeaderPdbLink() {
        const linkContainer = getHeaderLinkContainer();

        linkContainer.removeClass('pv3d-invisible');
        const source = globals.activeStructure.record.getSource();
        if (source === 'PDB'){
            linkContainer[0].childNodes[0].nodeValue = 'PDB: ';
            linkContainer.attr('href', getPdbLink(globals.activeStructure.pdbId));
            linkContainer.find('.detail').text(globals.activeStructure.pdbId);
        } else if (source === 'SMR') {
            linkContainer[0].childNodes[0].nodeValue = 'SMR: ';
            linkContainer.attr('href', getSmrLink(globals.uniprotId));
            linkContainer.find('.detail').text(`${globals.uniprotId} (${globals.activeStructure.pdbId})`);
        } else {
            throw Error('Unknown structure source');
        }
    }

    function shiftActiveStructure(shift) {
        const pdbId = getHeaderPdbId();

        const pdbIdItems = getHeaderPdbIdList().find('.item');
        let currentIx;

        for (let ix = 0; ix < pdbIdItems.length; ix++) {
            if (globals.container.find(pdbIdItems[ix]).attr('data-value') === pdbId) {
                currentIx = ix;
                break;
            }
        }
        const newIx = currentIx + shift;

        if (newIx >= 0 && newIx < pdbIdItems.length) {
            const newPdbId = globals.container.find(pdbIdItems[newIx]).attr('data-value');

            globals.activeStructure.set(newPdbId, getPdbChains(newPdbId)[0]);
        }
    }

    function pdbChainListOnChange(activate) {
        if (activate) {
            getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {
                if (value) {
                    updateActiveStructureFromHeader();
                }
            });
        } else {
            getHeaderPdbChainList().dropdown('setting', 'onChange', function (value) {});
        }
    }

    function handleEvents() {

        globals.container.find('.transparency-slider').range({
            min: 0,
            max: 100,
            start: 30,
            onChange: function(val) {
                globals.lm.setSurfaceTransparency(parseFloat(val) / 100);
            }
        });

        activateDropdownsEvents();
        // pdbChainListOnChange(true);

        globals.container.find('.pv3d-header .shift-left').on('click', () => shiftActiveStructure(-1));
        globals.container.find('.pv3d-header .shift-right').on('click', () => shiftActiveStructure(1));
    }


    function highlightCallBack(e) {
        if (e.data && e.data.residues.length > 0) {
            globals.pv.highlightActivePosition(e.data.residues[0].seqNumber);
        } else {
            globals.pv.dehighlightActivePosition();
        }
    }

    function registerCallbacksAndEvents() {
        handleEvents();
        getPlugin().registerHighlightCallback(highlightCallBack);
    }

    function updateActiveStructureFromHeader() {
        //TODO when loading the plugin, this is called multiple times which can cause the problems in getHeaderPdbId
        globals.activeStructure.set(getHeaderPdbId(), getHeaderChainId());
    }

    function getPdbLink(pdbId) {
        return 'https://www.ebi.ac.uk/pdbe/entry/pdb/' + pdbId;
    }

    function getSmrLink(uniprotId, pdbId) {
        return 'https://swissmodel.expasy.org/repository/uniprot/' + uniprotId;
    }

    function rgbFromString(color) {
        const arr = color.split(/[(,)]/);
        return { r: arr[1], g: arr[2], b: arr[3] };
    }

    function loadMolecule(rec, hideOthers) {

        return plugin.loadMolecule(rec.getPdbId(), rec.getSource(), rec.getCoordinatesFile()).then(function (modelId) {
            mapping[rec.getId()].setPdbRecord(rec);
            mapping[rec.getId()].setModelId(modelId);
            // load molecule into the LM plugin, retrieve ID of the respective model and hide all other models
            return hideOthers ? plugin.hideModelsExcept([modelId]) : Promise.resolve();
        });
    }

    function createUniprotMappingGroup(rec) {
        return plugin.createGroup(globals.settings.pvMappedStructuresCat.name, 'Uniprot mapping', mapping[rec.getId()].getModelId());
    }

    function createPdbSelections(rec, groupId) {
        // create selection corresponding to the PDB record and create visual for it
        const selectionName = rec.getPdbId().toUpperCase() + ':' + rec.getChainId() + ' (' + rec.getPdbStart() + '-' + rec.getPdbEnd() + ')';

        return plugin.createSelection(groupId, selectionName, rec.getChainId(), rec.getPdbStart(), rec.getPdbEnd() + 1);
    }

    function  extractObservedResidues(rec){
        const modelId = mapping[rec.getId()].getModelId();
        const chainId = rec.getChainId();

        const isHets = plugin.getController().context.select(modelId)[0].props.model.data.residues.isHet;
        const seqNumbers  = plugin.getController().context.select(modelId)[0].props.model.data.residues.seqNumber;
        const asymIds  = plugin.getController().context.select(modelId)[0].props.model.data.residues.authAsymId;

        rec.setObservedResidues(seqNumbers.filter((seqNumber, ix) => asymIds[ix] === chainId && !isHets[ix]));
    }

    function loadRecord(rec, params = {focus: true, hideOthers: true}) {

        const recId = rec.getId();

        if (recId in mapping) {
            if (params.focus) plugin.focusSelection(mapping[recId].getSelectionId());
            if (params.hideOthers) plugin.hideModelsExcept([mapping[recId].getModelId()]);
            const observedResidues = rec.getObservedResidues();
            if (!observedResidues || observedResidues.length === 0) extractObservedResidues(rec);
            updateHeaderPdbLink();

            return Promise.resolve();
        }

        mapping[recId] = new PdbRecordMapping();
        // mapping[recId] = {
        //     featureIdToSelId: {}
        // };

        return loadMolecule(rec, params.hideOthers)
            .then(() => {updateHeaderPdbLink(); return Promise.resolve();})
            .then(()=> {extractObservedResidues(rec); return Promise.resolve();})
            .then(() => createUniprotMappingGroup(rec))
            .then(groupId => createPdbSelections(rec, groupId))
            .then(selectionId => {
                mapping[recId].setSelectionId(selectionId);
                if (params.focus) plugin.focusSelection(selectionId);
                return plugin.createVisual(selectionId);
                // return createVisualForSelection(rec, selectionId);
                // focusAndColorPdb(rec, selectionId, color)
            });
            // .then(() => createCategories(rec, pvCategories));


    }

    function mapFeatures(features, colors) {

        const modelIdSelections = {}; // mapping of features over all loaded chains

        for (const id in mapping) {
            const modelId = mapping[id].getModelId();

            if (!(modelId in modelIdSelections)) modelIdSelections[modelId] = [];

            if (!mapping[id].getPdbRecord()) continue; //can happen when there are problems when retrieving PDB records

            const rec = mapping[id].getPdbRecord();
            const chainId = rec.getChainId();
            const chainSelections = [];

            features.forEach((f, i) => {
                let  begin = rec.mapPosUnpToPdb(f.begin);
                let end = rec.mapPosUnpToPdb(f.end);
                const boundaryOnly = globals.settings.boundaryFeatureTypes.indexOf(f.type) >= 0; // whether only begin and end residues should be selected

                if ((boundaryOnly && (rec.isValidPdbPos(begin) || rec.isValidPdbPos(end))) ||
                    (!boundaryOnly && rec.isValidPdbRegion(begin, end))
                ) {
                    //Trim the selction to valid PDB region otherwise Litemol sometimes fail to color it
                    if (!boundaryOnly) {
                        const observedResidues = rec.getObservedResidues();

                        begin = Math.max(begin, rec.getPdbStart(), observedResidues.length > 0 ? Math.min(...observedResidues) : 0);
                        end = Math.min(end, rec.getPdbEnd(), observedResidues.length > 0 ? Math.max(...observedResidues) : 0);
                    }

                    modelIdSelections[modelId].push({ chainId: chainId, begin: begin, end: end, color: rgbFromString(colors[i]), boundaryOnly: boundaryOnly});
                }
            });
            modelIdSelections[modelId] = modelIdSelections[modelId].concat(chainSelections);
        }

        Object.keys(modelIdSelections).forEach(modelId => plugin.colorSelections(modelId, modelIdSelections[modelId]));
    }

    function unmapFeature(feature) {
        plugin.resetVisuals();
    }

    let lastHighlighted = -1;

    function highlightResidue(resNum) {

        if (lastHighlighted === resNum) return;
        lastHighlighted = resNum;

        dehighlightAll();
        for (const id in mapping) {
            if (mapping[id].getPdbRecord()) { // the structure might still be loading and pdbRecord might not have been added yet
                const pdbRec = mapping[id].getPdbRecord();
                const pdbPos = pdbRec.mapPosUnpToPdb(resNum);

                if (pdbRec.isValidPdbPos(pdbPos)) {
                    plugin.highlightResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbPos);
                }
            }
        }
    }

    function dehighlightAll() {
        plugin.dehighlightAll();
    }

    function getPlugin() {
        return plugin;
    }

    function moleculeLoaded() {
        return plugin.moleculeLoaded();
    }

    function setSurfaceTransparency(val) {
        return plugin.setSurfaceTransparency(val);
    }

    function showErrorMessage(message) {

        globals.lmErrorMessageContainer.find('.error-message')[0].innerHTML = message;
        globals.lmErrorMessageContainer.css('display', 'block');
    }

    function hideErrorMessage() {
        globals.lmErrorMessageContainer.css('display', 'none');
    }

    function initialize(params) {
        globals = params.globals;
        plugin.initializePlugin(globals.lmContainerId);

        if ('pdbRecords' in globals) populateHeaderPdbIds();
        registerCallbacksAndEvents();
    }

    function destroy(){
        plugin.destroyPlugin();
    }

    // function formatSelectionForColoring(selections, colors) {
    //    const formated = []
    //    for (let ix = 0; ix < selections.length; ++ix) {
    //        formated.push({selectionId: selections[ix], color: rgbFromString(colors[ix])});
    //    }
    //    return formated;
    // }

    // function focusSelection(rec, selectionId) {
    //     mapping[rec.getId()].mainStructSelId = selectionId;
    //     lmPlugin.focusSelection(selectionId);
    // }

    // function createVisualForSelection(rec, selectionId) {
    //     mapping[rec.getId()].mainStructSelId = selectionId;
    //     return lmPlugin.createVisual(selectionId);
    // }

    // function focusAndColorPdb(rec, selectionId, color){
    //     //retrieve IDs of the created selection and visual and focus view on the selection
    //     mapping[rec.getId()].mainStructSelId = selectionId;
    //     lmPlugin.focusSelection(selectionId);
    //     lmPlugin.createVisual(selectionId);
    //     // lmPlugin.colorSelections(mapping[rec.getId()].modelId, [{selectionId: selectionId, color: rgbFromString(color)}]);
    //     return Promise.resolve();
    // }

    // function createCategoryGroup(rec, cat) {
    //     return lmPlugin.createGroup(cat.header.text(), '', mapping[rec.getId()].mainStructSelId)
    //         .then( catId => {
    //         // toggle off the category, so that the tree is not too deep
    //         lmPlugin.toggleEntity(catId, false);
    //         return Promise.resolve(catId);
    //     });
    // }
    //
    // function intersectSeqStruct(begin, end, rec) {
    //     return (rec.getUnpStart() <= begin && begin <= rec.getUnpEnd()) || (rec.getUnpStart() <= end && end <= rec.getUnpEnd());
    // }

    // function createTrackData(rec, track, trackId) {
    //     //for each track create selections which intersect the respective part of the structure
    //
    //     const promisesTrackData = [];
    //     track.data.forEach(function (data, ix) {
    //         if (data.type == 'VARIANT') {
    //             if (intersectSeqStruct(data.pos, data.pos, rec)) {
    //                 data.variants.forEach(variant => {
    //                     const promise = lmPlugin.createSelection(trackId,
    //                         data.pos + ' (' + variant.wildType + '->' + variant.alternativeSequence + ')',
    //                         rec.getChainId(),
    //                         rec.mapPosUnpToPdb(variant.begin), rec.mapPosUnpToPdb(variant.end) + 1
    //                     ).then(selectionId => mapping[rec.getId()].featureIdToSelId[variant.internalId] = selectionId);
    //                     promisesTrackData.push(promise);
    //                 })
    //             }
    //         }
    //         else {
    //             if (intersectSeqStruct(data.begin, data.end, rec)) {
    //                 const promise = lmPlugin.createSelection(trackId,
    //                     data.begin + '-' + data.end,
    //                     rec.getChainId(),
    //                     rec.mapPosUnpToPdb(data.begin), rec.mapPosUnpToPdb(data.end) + 1
    //                 ).then(
    //                     selectionId => {
    //                         mapping[rec.getId()].featureIdToSelId[data.internalId] = selectionId;
    //                         // lmPlugin.createVisual(selectionId)
    //                     });
    //                 promisesTrackData.push(promise);
    //             }
    //         }
    //     });
    //
    //     return Promise.all(promisesTrackData);
    // }

    // function createGroupAndDataForTrack(rec, track, catId){
    //     return lmPlugin.createGroup(track.label, '', catId).then(trackId => {
    //         lmPlugin.toggleEntity(trackId, false);
    //         return Promise.resolve(trackId);
    //     }).then(trackId => createTrackData(rec, track, trackId));
    //
    // }

    // function createTracksFroCategory(rec, cat, catId){
    //     //for each category create all the tracks inside
    //
    //     const promisesTracks = cat.tracks.map(track => createGroupAndDataForTrack(rec, track, catId));
    //     return Promise.all(promisesTracks).then(function (){
    //         //if (cntNonEmptyTracks == 0) lmPlugin.removeEntity(catId); //TODO
    //     })
    // }

    // function createCategories(rec, pvCategories) {
    //     //create groups and selections for all the categories and features
    //     const promisesCats = [];
    //     pvCategories.forEach( cat => {
    //         if (cat.name != mappedStructsCat.id) { //if this is not the sequence-structure mapping category
    //             promisesCats.push(createCategoryGroup(rec, cat).then(catId => createTracksFroCategory(rec, cat, catId)));
    //         }
    //     });
    //     return Promise.all(promisesCats);
    // }

    // function showModel(modelId) {
    //     return lmPlugin.hideModels([modelId]);
    // }
    //
    // function showRecord(rec) {
    //     return lmPlugin.hideMolecules([rec.pdb_id]);
    // }

    // function createSelectionWithVisual(rec) {
    //    return lmPlugin.createSelection(rec.chain_id + "( " + rec.start + "-" + rec.end + ") - " + rec.experimental_method,
    //        rec.pdb_id, rec.chain_id, rec.start, rec.end + 1, true);
    // }

    // function focusRecord(rec){
    //     return lmPlugin.focusSelection(rec.pdb_id, rec.chain_id, rec.start, rec.end + 1, true);
    // }

    return {
        initialize: initialize,
        destroy: destroy,
        loadRecord: loadRecord,
        mapFeatures: mapFeatures,
        unmapFeature: unmapFeature,
        getPlugin: getPlugin,
        highlightResidue: highlightResidue,
        dehighlightAll: dehighlightAll,
        // ,registerHighlightCallback: registerHighlightCallback
        moleculeLoaded: moleculeLoaded,
        setSurfaceTransparency: setSurfaceTransparency,
        populateHeaderPdbIds: populateHeaderPdbIds,
        updateHeader: updateHeader,
        // ,handleHeaderEvents: handleHeaderEvents
        registerCallbacksAndEvents: registerCallbacksAndEvents,
        // ,setActiveStructureFromHeader: setActiveStructureFromHeader
        // showRecord: showRecord,
        // createSelectionWithVisual: createSelectionWithVisual,
        // focusRecord: focusRecord
        showErrorMessage: showErrorMessage,
        hideErrorMessage: hideErrorMessage,

        // Exposed for testing purposes
        getHeaderPdbId: getHeaderPdbId,
        getHeaderChainId: getHeaderChainId,
        getHeaderPdbIdList: getHeaderPdbIdList,
        getHeaderPdbChainList: getHeaderPdbChainList,
        getHeaderLinkContainer: getHeaderLinkContainer,
        highlightCallback: highlightCallBack
    };
};

module.exports = LmController;
