/* eslint-disable indent,max-len */
const createPlugin = require('./lm.plugin.js');
const settings = require('./settings');


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
            this.selectionGroupId = undefined;
            this.interactiveHighlightsGroupId = undefined;
            this.observedResidues = [];
            this.userHighlightVisualIds = [];
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

        setInteractiveHighlightsGroupId(id) {
            this.interactiveHighlightsGroupId = id;
        }

        getInteractiveHighlightsGroupId() {
            return this.interactiveHighlightsGroupId;
        }

        setSelectionGroupId(selectionId) {
            this.selectionGroupId = selectionId;
        }

        getSelectionGroupId() {
            return this.selectionGroupId;
        }

        setObservedResidues(observedResidues) {
            this.observedResidues= observedResidues;
        }

        getObservedResidues() {
            return this.observedResidues;
        }

        setUserHighlightVisualIds(userHighlightVisualIds) {
            this.userHighlightVisualIds= userHighlightVisualIds;
        }

        getUserHighlightVisualIds() {
            return this.userHighlightVisualIds;
        }
        
        setUserHighlightSelectionIds(userHighlightSelectionIds) {
            this.userHighlightSelectionIds= userHighlightSelectionIds;
        }

        getUserHighlightSelectionIds() {
            return this.userHighlightSelectionIds;
        }
    }
    class InteractiveVisual {
        /*
        selectionDef: {
            sequenceNumbers: [63],
            structureNumbers: [72] //used only if sequenceNumbers is not defined
            atomNames: ['CA', 'CE'] //can be empty
        }
        visualDef: {
                    type: 'BallsAndSticks',
                    //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.ballsandsticksparams.html
                    params: { useVDW: true, vdwScaling: 1, bondRadius: 0.13, detail: 'Automatic' },
                    color: {r:1, g: 0, b: 0},
                    alpha: 1
                }
     */
        constructor(selectionDef, visualDef) {
            this.selectionDef = selectionDef;
            this.visualDef = visualDef;
        }

        exportToPyMol() {

        }
    }

    let globals;
    const mapping = {};
    let activeRecId = undefined;
    const interactiveVisuals = {};

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

    function getHeaderUserHighlightsList() {
        return globals.container.find('.user-highlights');
    }

    function userHighlightSelected(i) {
        return $(getHeaderUserHighlightsList().find('div.item')[i]).hasClass('selected');
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

        // getHeaderUserHighlightsList().dropdown('setting', 'onChange', function (val, text, selected) {
        //     console.log(val, text, selected);
        //     updateUserSelection(val, text, selected);
        // });
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
        } else if (source === 'AF') {
            linkContainer[0].childNodes[0].nodeValue = 'AF: ';
            linkContainer.attr('href', getAfLink(globals.uniprotId));
            linkContainer.find('.detail').text(`${globals.uniprotId} (${globals.activeStructure.pdbId})`);
        }
        else {
            linkContainer.css('display', 'none');
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

    function updateSurfaceTransparencyTitle(val){
        globals.container.find('.transparency-slider').attr('title', `Surface transparency:  ${val}%`)
    }

    function handleEvents() {

        const initialTransparency = settings.lmInitSurfaceTransparency;
        globals.container.find('.transparency-slider').range({
            min: 0,
            max: 100,
            start: initialTransparency * 2, //for some reason the initial transparency got set to half of the required value
            onChange: function(val) {
                setSurfaceTransparency(parseFloat(val) / 100);
                updateSurfaceTransparencyTitle(val);
            }
        });
        setSurfaceTransparency(initialTransparency / 100);
        updateSurfaceTransparencyTitle(initialTransparency);

        activateDropdownsEvents();
        // pdbChainListOnChange(true);

        globals.container.find('.pv3d-header .shift-left').on('click', () => shiftActiveStructure(-1));
        globals.container.find('.pv3d-header .shift-right').on('click', () => shiftActiveStructure(1));
    }

    function highlightCallBack(e) {
        if (e.data && e.data.residues.length > 0) {
            globals.pv.highlightActivePosition(e.data.residues[0].seqNumber);
            const resInfo = e.data.residues[0];
            resInfo.unpSeqNumber = globals.activeStructure.record.mapPosPdbToUnp(resInfo.seqNumber);
            globals.eventEmitter.emit("structureMouseOn", resInfo);
        } else {
            globals.pv.dehighlightActivePosition();
            globals.eventEmitter.emit("structureMouseOff");
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

    function getAfLink(uniprotId, pdbId) {
        return 'https://alphafold.ebi.ac.uk/entry/' + uniprotId;
    }

    function rgbFromString(color) {
        const arr = color.split(/[(,)]/);
        return { r: arr[1], g: arr[2], b: arr[3] };
    }

    function loadMolecule(rec, hideOthers) {

        return plugin.loadMolecule(rec.getPdbId(), rec.getSource(), rec.getFormat(), rec.getCoordinatesFile(), globals.opts.alphaFoldConfidence ? globals.opts.alphaFoldConfidence.threshold : undefined)
        .then(function (modelId) {
            mapping[rec.getId()].setPdbRecord(rec);
            mapping[rec.getId()].setModelId(modelId);
            // load molecule into the LM plugin, retrieve ID of the respective model and hide all other models
            return hideOthers ? plugin.hideModelsExcept([modelId]) : Promise.resolve();
        });
    }

    const handleAfConfidence = () => {
        const source = mapping[activeRecId].getPdbRecord().getSource();
        return globals.opts.alphaFoldConfidence && (source === 'AF' || (source == 'USER' && globals.opts.alphaFoldConfidence.applyToUserStructures));

    }

    const setAFConfidenceVisibility = () => {
        
        if (handleAfConfidence){            
            plugin.setAFConfidenceVisibility(mapping[activeRecId].getModelId(), globals.afConfident);
            setUserSelectionsVisibiliy(mapping[activeRecId].getPdbRecord().getPdbId());
        }
    }

    function createUniprotMappingGroup(rec) {
        return plugin.createGroup(globals.settings.pvMappedStructuresCat.name, 'Uniprot mapping', mapping[rec.getId()].getModelId());
    }

    function createPdbSelections(rec, groupId) {
        // create selection corresponding to the PDB record and create visual for it
        const selectionName = rec.getPdbId().toUpperCase() + ':' + rec.getChainId() + ' (' + rec.getPdbStart() + '-' + rec.getPdbEnd() + ')';

        return plugin.createSelectionFromRange({
            rootId: groupId,
            name: selectionName,
            chainId: rec.getChainId(),
            beginIx: rec.getPdbStart(),
            endIx: rec.getPdbEnd(),
            selectionId: `${groupId}_${selectionName}` });
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
        activeRecId = recId;

        if (recId in mapping) {
            if (params.focus) plugin.focusSelection(mapping[recId].getSelectionId());
            if (params.hideOthers) plugin.hideModelsExcept([mapping[recId].getModelId()]).then(()=>setUserSelectionsVisibiliy(mapping[recId].getPdbRecord().getPdbId()));
            const observedResidues = rec.getObservedResidues();
            if (!observedResidues || observedResidues.length === 0) extractObservedResidues(rec);
            updateHeaderPdbLink();
            
            setAFConfidenceVisibility();

            return Promise.resolve();
        }

        mapping[recId] = new PdbRecordMapping();
        // mapping[recId] = {
        //     featureIdToSelId: {}
        // };

        let groupId, selectionId;
        let extraHighlightsContent = globals.opts.extraHighlights ? globals.opts.extraHighlights.content : [];

        let extraSelectionIds = [];

        return loadMolecule(rec, params.hideOthers)
            .then(() => {updateHeaderPdbLink(); return Promise.resolve();})
            .then(()=> {extractObservedResidues(rec); return Promise.resolve();})
            .then(() => createUniprotMappingGroup(rec))
            .then(_groupId => {
                groupId = _groupId;
                return createPdbSelections(rec, groupId)
            })
            .then(_selectionId => {

                selectionId = _selectionId;
                if (plugin.getEntity(selectionId).length === 0){
                  throw Error('Invalid mapping (the structure file does not contain the selection)');
                }

                mapping[recId].setSelectionId(selectionId);
                if (params.focus) plugin.focusSelection(selectionId);
                return plugin.createVisual(selectionId);
                // return createVisualForSelection(rec, selectionId);
                // focusAndColorPdb(rec, selectionId, color)
            }).then((surfaceVisualId) => {
                if (handleAfConfidence()) {
                    const modelId = mapping[rec.getId()].getModelId();
                    return plugin.createVisualsForAFConfidence(modelId, surfaceVisualId, globals.opts.alphaFoldConfidence.threshold)
                        .then(setAFConfidenceVisibility);
                } else return Promise.resolve();
            })
            .then(() => {

                // Create group covering all selections possibly specified by the user

                return plugin.createGroup("Selections", 'Selections', selectionId)

            }).then((selectionsGroupId => {

                mapping[recId].setSelectionGroupId(selectionsGroupId);

                // Create selection for each of the selections
                const promises = extraHighlightsContent
                    .map((h, i) => {
                    const selName = h.sequenceNumbers.join();
                    return plugin.createSelectionFromList({
                        rootId: selectionsGroupId,
                        name: selName,
                        chainId: rec.getChainId(),
                        sequenceNumbers: h.sequenceNumbers.map(n=> rec.mapPosUnpToPdb(n)),
                        atomNames: h.atomNames,
                        selectionId: `${settings.userSelectionPrefix}${selectionsGroupId}_sel${i}`
                    });
                });

                return Promise.all(promises);
            }))
            .then(selectionsIds => {
                
                mapping[recId].setUserHighlightSelectionIds(selectionsIds.filter(id => id !== undefined));
                extraSelectionIds = selectionsIds;
                
                if (handleAfConfidence()) {
                    return Promise.all(
                        selectionsIds
                            .filter(selectionId => selectionId !== undefined)
                            .map(selectionId => plugin.createSubSelectionForAFCofidence(selectionId, globals.opts.alphaFoldConfidence.threshold))
                        )
                        .then(() => selectionsIds)
                } else {
                    return Promise.resolve(selectionsIds);
                }
            }).then(selectionsIds => {

                const promises = selectionsIds.map( (id, i) => {
                    if (id !== undefined) {
                        return plugin.createVisual(id,
                            params = {
                                style: plugin.getStyleDefinition(
                                    extraHighlightsContent[i].visual.type,
                                    extraHighlightsContent[i].visual.params,
                                    extraHighlightsContent[i].visual.color,
                                    extraHighlightsContent[i].visual.alpha

                                )},
                            handleAfConfidence()
                        )
                    } else {
                        return Promise.resolve(undefined);
                    }

                    });

                return Promise.all(promises);
            }).then(visualIds => {
                //console.log('visualIds',visualIds);
                const visualIdsDef = visualIds.filter(id => id !== undefined);
                mapping[recId].setUserHighlightVisualIds(visualIdsDef);

                visualIds.forEach((id, i) => {
                    if (id === undefined) return;
                    const selectionId = extraSelectionIds[i];
                    extraHighlightsContent[i].selectionId = selectionId;
                    userHighlightSelected(i) || !globals.opts.extraHighlights.controlVisibility ? plugin.showEntity(selectionId, globals.afConfident): plugin.hideEntity(selectionId);
                    if (extraHighlightsContent[i].visualIds === undefined) extraHighlightsContent[i].visualIds = [];
                    extraHighlightsContent[i].visualIds.push(id)
                    
                });
            }).then(() => {
                Object.keys(interactiveVisuals).forEach(visualId => {
                    const vis = interactiveVisuals[visualId];
                    return setVisualInteractive(visualId, vis.selectionDef, vis.visualDef, recId);
                })
            })
    }

    /*
        selectionDef: {
            sequenceNumbers: [63],
            structureNumbers: [72] //used only if sequenceNumbers is not defined
            atomNames: ['CA', 'CE'] //can be empty
        }
        visualDef: {
                    type: 'BallsAndSticks',
                    //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.ballsandsticksparams.html
                    params: { useVDW: true, vdwScaling: 1, bondRadius: 0.13, detail: 'Automatic' },
                    color: {r:1, g: 0, b: 0},
                    alpha: 1
                }
     */
    const getInteractiveSelectionId = (recId, visualId) => `${settings.interactiveSelectionPrefix}${recId}-${visualId}`;
    function setVisualInteractive(visualId, selectionDef, visualDef, recId = undefined){

        if (selectionDef.sequenceNumbers.length === 0) {
            console.warn('Setting interative visual with empty selection.')
            return ;
        }

        const promises = [];
        const recIds = recId ? [recId] : Object.keys(mapping);
        recIds.forEach(recId => {
            const promise = plugin.createGroup('interactive_highlights', 'Interactive highlights', mapping[recId].getSelectionId()).then(groupId => {
                const selId = getInteractiveSelectionId(recId, visualId);
                const rec = mapping[recId];
                return plugin.createSelectionFromList({
                    rootId: groupId,
                    name: selId,
                    chainId: rec.getPdbRecord().getChainId(),
                    sequenceNumbers: selectionDef.sequenceNumbers.map(n=> rec.getPdbRecord().mapPosUnpToPdb(n)),
                    atomNames: selectionDef.atomNames,
                    selectionId: selId
                });
            }).then(selectionId => {
                return plugin.createVisual(selectionId,
                    {style: plugin.getStyleDefinition(visualDef.type, visualDef.params, visualDef.color, visualDef.alpha)},
                    true).then(() => {
                        //the resulting selection and visual should be visible only if the parent model is visible (by default the visual selection and visual is visible)
                        return plugin.hideEntityIfInHiddenModel(selectionId)                        
                    })
            });
            promises.push(promise);
        });

        return Promise.all(promises).then(() => {
            interactiveVisuals[visualId] = new InteractiveVisual(selectionDef, visualDef);

        })
    }

    function clearVisualInteractiveAll() {
        Object.keys(interactiveVisuals).forEach( id => clearVisualInteractive(id));
    }

    function clearVisualInteractive(visualId) {
        if (Object.keys(interactiveVisuals).indexOf(visualId) < 0) return;
        for (const recId in  mapping) {
            plugin.removeEntity(getInteractiveSelectionId(recId, visualId));
        }
        delete interactiveVisuals[visualId];
    }

    function getVisualsInteractive(){
        return interactiveVisuals;
    }

    function mapFeatures(features, colors) {
        colorRegions(features.map((f, i) => {
            return {
                seqBegin: f.begin,
                seqEnd: f.end,
                color: rgbFromString(colors[i]),
                boundary: globals.settings.boundaryFeatureTypes.indexOf(f.type) >= 0
            }
        }))
    }

    function colorRegions(regions) {

        const modelIdSelections = {}; // mapping of features over all loaded chains

        for (const id in mapping) {
            const modelId = mapping[id].getModelId();

            if (!(modelId in modelIdSelections)) modelIdSelections[modelId] = [];

            if (!mapping[id].getPdbRecord()) continue; //can happen when there are problems when retrieving PDB records

            const rec = mapping[id].getPdbRecord();
            const chainId = rec.getChainId();
            const chainSelections = [];

            regions.forEach(r => {
                let  begin = rec.mapPosUnpToPdb(r.seqBegin);
                let end = rec.mapPosUnpToPdb(r.seqEnd);
                const boundaryOnly = r.boundary; // whether only begin and end residues should be selected

                if ((boundaryOnly && (rec.isValidPdbPos(begin) || rec.isValidPdbPos(end))) ||
                    //(!boundaryOnly && rec.isValidPdbRegion(begin, end))
                    !boundaryOnly
                ) {
                    //Trim the selction to valid PDB region otherwise Litemol sometimes fail to color it
                    if (!boundaryOnly) {
                        // const observedResidues = rec.getObservedResidues();
                        // begin = Math.max(begin, rec.getPdbStart(), observedResidues.length > 0 ? Math.min(...observedResidues) : 0);
                        // end = Math.min(end, rec.getPdbEnd(), observedResidues.length > 0 ? Math.max(...observedResidues) : 0);
                        rec.getObservedRanges().forEach(or => {
                            const seqStart = rec.mapPosStructToUnp(or.start.posPDBSequence);
                            const seqEnd = rec.mapPosStructToUnp(or.end.posPDBSequence);
                            if (r.seqEnd < seqStart || r.seqBegin > seqEnd) {
                                return;
                            }
                            begin = Math.max(rec.mapPosUnpToPdb(Math.max(r.seqBegin, seqStart)), 0);
                            end = Math.min(rec.mapPosUnpToPdb(Math.min(r.seqEnd, seqEnd)), rec.getPdbEnd());
                            modelIdSelections[modelId].push({ chainId: chainId, begin: begin, end: end, color: r.color, boundaryOnly: boundaryOnly});
                        })
                    } else {
                        modelIdSelections[modelId].push({ chainId: chainId, begin: begin, end: end, color:  r.color, boundaryOnly: boundaryOnly});
                    }
                }
            });
            modelIdSelections[modelId] = modelIdSelections[modelId].concat(chainSelections);
        }

        Object.keys(modelIdSelections).forEach(modelId => plugin.colorSelections(modelId, modelIdSelections[modelId], [settings.userSelectionPrefix, settings.interactiveSelectionPrefix]));
    }

    function resetVisuals(){
        plugin.resetVisuals(settings.userSelectionPrefix);
    }

    function unmapFeature(feature) {
        resetVisuals();

    }


    function setUserSelectionsVisibiliy(pdbId){
        
        let recordVisuals = [];
        for (const id in mapping) {
            if (mapping[id].getPdbRecord().getPdbId() === pdbId) {
                recordVisuals = recordVisuals.concat(mapping[id].getUserHighlightVisualIds());
            }
        }

        const afConfident = globals.afConfident;

        getHeaderUserHighlightsList().find('div.item').each(i => {
            if (!globals.opts.extraHighlights.content[i].visualIds) return;
            globals.opts.extraHighlights.content[i].visualIds.forEach((visualId) => {
                if (recordVisuals === undefined || recordVisuals.indexOf(visualId) >= 0) {
                    if (userHighlightSelected(i)) {
                        //plugin.showEntity(visualId)
                        plugin.showSelectionVisual(visualId, afConfident)
                    } else {
                        //plugin.hideEntity(visualId);
                        plugin.hideSelectionVisual(visualId, afConfident);
                    } 
                }
            })
        })
    }

    function highlightUserSelection(i, on, pdbId) {
        //i is the index of user selection in globals.opts.extraHighlights.content

        if (!globals.opts.extraHighlights.content[i].visualIds) return;

        const afConfident = globals.afConfident;

        let recordVisuals = [];
        for (const id in mapping) {
            if (mapping[id].getPdbRecord().getPdbId() == pdbId) {
                recordVisuals = recordVisuals.concat(mapping[id].getUserHighlightVisualIds());
            }
        }

        globals.opts.extraHighlights.content[i].visualIds.forEach(visualId => {
            if (recordVisuals.indexOf(visualId) >= 0) {
                if (on) {
                    //plugin.showEntity(visualId)
                    plugin.showSelectionVisual(visualId, afConfident)
                } else {
                    //plugin.hideEntity(visualId);
                    plugin.hideSelectionVisual(visualId, afConfident)
                }
            }
        });

    }

    let lastHighlighted = -1;
    function highlightResidue(resNum) {

        // The following test had to be commented out since when moving across categories the dehighlightAll is called and
        // then when entering another category at the same position, the active residue would remain dehighlighted

        // if (lastHighlighted === resNum) return;
        // lastHighlighted = resNum;

        dehighlightAll();
        for (const id in mapping) {
            if (mapping[id].getPdbRecord()) { // the structure might still be loading and pdbRecord might not have been added yet
                const pdbRec = mapping[id].getPdbRecord();

                if (pdbRec.isInObservedRanges(resNum)) {
                    plugin.highlightResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbRec.mapPosUnpToPdb(resNum));
                }

                // const pdbPos = pdbRec.mapPosUnpToPdb(resNum);
                //
                // if (pdbRec.isValidPdbPos(pdbPos)) {
                //     plugin.highlightResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbPos);
                // }
            }
        }
    }

    function highlightRegion(seqBegin, seqEnd){
        colorRegions([{
            seqBegin: seqBegin,
            seqEnd: seqEnd,
            color: settings.colors.lmHighlight
        }])

    }

    function focusResidue(resNum, neighborhoodSize) {
        for (const id in mapping) {
            if (mapping[id].getPdbRecord()) { // the structure might still be loading and pdbRecord might not have been added yet
                const pdbRec = mapping[id].getPdbRecord();

                if (pdbRec.isInObservedRanges(resNum)) {
                    plugin.focusResidue(mapping[id].getModelId(), pdbRec.getChainId(), pdbRec.mapPosUnpToPdb(resNum), neighborhoodSize);
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
        return plugin.setSurfaceTransparency(val, settings.userSelectionPrefix);
    }

    function showErrorMessage(message) {

        globals.lmErrorMessageContainer.find('.message')[0].innerHTML = message;
        globals.lmErrorMessageContainer.css('display', 'block');
    }

    function hideErrorMessage() {
        globals.lmErrorMessageContainer.css('display', 'none');
    }

    function initalizeUserHighlights() {
        let $userHighlihts = getHeaderUserHighlightsList();
        if (globals.opts.extraHighlights && globals.opts.extraHighlights.content.length > 0 && globals.opts.extraHighlights.controlVisibility) {

            const ddContent = [];
            globals.opts.extraHighlights.content.forEach((eh, i) => {
                ddContent.push({name: eh.label, value: i});
            });

            $userHighlihts.dropdown({
                placeholder: globals.opts.extraHighlights.label,
                values: ddContent,
                action: 'hide',
                onChange: (val, text, $selected) => {

                    if ($selected == undefined) return;

                    $selected.toggleClass('selected');
                    highlightUserSelection(val, $selected.hasClass('selected'), globals.activeStructure.pdbId);
                }
            });
            $userHighlihts.find('div.item').each((i, el) => {
                if (globals.opts.extraHighlights.content[i].showOnStart) {
                    $(el).addClass('selected');
                }
            })
            $userHighlihts.find('div.text').removeClass('default');
        } else {
            $userHighlihts.css('display', 'none');
        }
    }


    function getAuthSeqNumber(rec, resNum) {
        // returns https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.core.structure.residue.html
        let modelId = mapping[rec.getId()].getModelId();
        return plugin.getAuthSeqNumber(modelId, rec.getChainId(), resNum);
    }

    function getAuthSeqNumberRange(rec, resNumBegin, resNumEnd) {
        let modelId = mapping[rec.getId()].getModelId();
        return plugin.getAuthSeqNumberRange(modelId, rec.getChainId(), resNumBegin, resNumEnd);

    }

    function processPassedOptions(opts) {
        if (opts.lmInitSurfaceTransparency) {
            settings.lmInitSurfaceTransparency = opts.lmInitSurfaceTransparency;
        }
    }

    function groupSelected(){
        return globals.pvContainer.find(".pv3d-svg-icon.selected").length >= 1;
    }

    function initialize(params) {
        globals = params.globals;

        processPassedOptions(globals.opts);

        plugin.initializePlugin(globals);

        initalizeUserHighlights();

        if ('pdbRecords' in globals) populateHeaderPdbIds();
        registerCallbacksAndEvents();
    }

    function destroy(){
        plugin.destroyPlugin();
    }

    return {
        initialize: initialize,
        destroy: destroy,
        loadRecord: loadRecord,
        mapFeatures: mapFeatures,
        unmapFeature: unmapFeature,
        getPlugin: getPlugin,
        highlightResidue: highlightResidue,
        focusResidue: focusResidue,
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

        getAuthSeqNumber: getAuthSeqNumber,
        getAuthSeqNumberRange: getAuthSeqNumberRange,

        highlightRegion: highlightRegion,
        highlightCallback: highlightCallBack,
        resetVisuals: resetVisuals,
        groupSelected: groupSelected,

        setVisualInteractive: setVisualInteractive,
        clearVisualInteractive: clearVisualInteractive,
        clearVisualInteractiveAll: clearVisualInteractiveAll,
        getVisualsInteractive: getVisualsInteractive,

        // Exposed for testing purposes
        getHeaderPdbId: getHeaderPdbId,
        getHeaderChainId: getHeaderChainId,
        getHeaderPdbIdList: getHeaderPdbIdList,
        getHeaderPdbChainList: getHeaderPdbChainList,
        getHeaderLinkContainer: getHeaderLinkContainer,

        setAFConfidenceVisibility: setAFConfidenceVisibility,
    };
};

module.exports = LmController;
