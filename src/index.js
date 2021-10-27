require('./css/styles.css');
const download = require('downloadjs');

if (!window.$) {
    // Requiring jquery seems to have some side effect which conflict with semantics ui if this is also used for the app in which MolArt is used
    // That's why the jquery require statement is inside of the if statement
    const jQuery = require('jquery');
    window.$ = jQuery;
    if (!window.jQuery) window.jQuery = window.$;
}

const events = require('events');

const LmController = require('./lm.controller.js');
const PvController = require('./pv.controller.js');

const services = require('./services');

const pdbMapping = require('./pdb.mapping')
const svgSymbols = require('./svg.symbols');

function loadRecord(rec, globals){
    let loadedRecord = globals.lm.loadRecord(rec);
    if (globals.settings.loadAllChains) {
        globals.pdbRecords.forEach(recOther => {
            if (recOther.getPdbId() === rec.getPdbId() && recOther.getId() !== rec.getId()){
                loadedRecord = loadedRecord.then(() => {
                    return globals.lm.loadRecord(recOther, {focus: false, hideOthers: false})
                });
            }
        });
    }
    return loadedRecord;
}

class ActiveStructure {
    constructor(globals){
        this.pdbId = undefined;
        this.chainId = undefined;
        this.record = undefined;
        this.globals = globals;
    }

    set(pdbId, chainId) {
        if (this.pdbId === pdbId && this.chainId === chainId) return;

        const records = this.globals.pdbRecords.filter(rec => rec.idMatch(pdbId, chainId));

        if (records.length === 0) {
            console.warn('Selected PDB ID and chain did not match any record.');
            return Promise.resolve();
        }

        this.record = records[0];
        this.pdbId = this.record.getPdbId();
        this.chainId = this.record.getChainId();

        // if multiple records are present, they all reference the same PDB structure, so it's OK to pick simply
        // the first record
        const self = this;
        return loadRecord(records[0], this.globals).then(() => {
            this.globals.lm.updateHeader();
            this.globals.pv.highlightActiveStructure();
            this.globals.activeFeature.overlay();
            this.globals.lm.hideErrorMessage();
            this.globals.eventEmitter.emit('structureLoaded');
        }, function (error) {
            console.log(error);
            self.globals.lm.showErrorMessage(error);
            throw error;
        });
    }

    /***
     * Get ranges in the sequence which have structure mapped. If there is not structure set, the method
     * throws an error.
     * @returns {*[] Array of arrays of size 2 [begin, end]}
     */
    getSeqStrRange() {
        if (!this.isSet()) {
            throw new Error("No structure loaded.")
        }

        const rec = this.record;
        return this.record.getObservedRanges().map(range => rec.getSeqRangeFromObservedRange(range));
    }

    isSet(){
        return this.pdbId !== undefined;
    }

    exportToPymol(){
        let globals = this.globals;
        let content = "import __main__\n" +
            "__main__.pymol_argv = ['pymol', '-qei']\n" +
            "import pymol\n" +
            "pymol.finish_launching()\n" +
            "from pymol import cmd\n" +
            "cmd.delete('all')\n";

        function replaceNamesWithCustom(name){
            if (globals.opts.pyMolCategoriesLabels && name in globals.opts.pyMolCategoriesLabels) {
                return globals.opts.pyMolCategoriesLabels[name];
            } else {
                return name;
            }
        }

        const sanitizeFeatureName = function(name) {
            return replaceNamesWithCustom(name).replace('&', 'and').replace(/[^a-zA-Z0-9_]/g, "_")
        };

        const sanitizeFeatureType = function(catName, subCatName) {
            let rv = replaceNamesWithCustom(subCatName);
            if (subCatName === 'CHAIN') {
                //CHAIN is a reserved word in pymol
                rv =  'CHAIN_';
            }
            if (rv == catName) {
                rv = rv + '_'; //eg. ANTIGEN has both category and subcategory (feature type) called ANTIGEN
            }
            return sanitizeFeatureName(rv);
        };


        const source = this.record.getSource();
        if (source === 'PDB' || source === 'USER'){
            content += `cmd.load('${this.record.getCoordinatesFile()}')\n`;
        } else if (source === 'SMR') {
            const url = this.record.getCoordinatesFile().replace(this.globals.settings.corsServer, "");
            const name = `${this.globals.uniprotId}.${this.record.getPdbId()}.${this.record.getChainId()}.${this.record.getPdbStart()}-${this.record.getPdbEnd()}`;
            content += `cmd.load('${url}', '${name}', 0, 'pdb')\n`;
        } else if (source === 'AF'){
            const url = services.getAfCifURL(this.globals.uniprotId)
            content += `cmd.load('${url}', '${this.globals.uniprotId}', 0, 'cif')\n`;
        } else {
            throw Error('Unknown structure source');
        }

        content += `cmd.set("orthoscopic", "on")\n`;

        const annotations = this.globals.pv.extractAnnotationData();
        const annotationsSanitized = {};
        for (const cat in annotations) {
            annotationsSanitized[sanitizeFeatureName(cat)] = annotations[cat];
        }

        const fullResiduesSuffix = '_full_residues';
        const cAlphaSuffix = '_c-alpha';

        Object.keys(annotationsSanitized).forEach(cat => {
            // const featureNames = [];
            const catSubcats = {};
            annotationsSanitized[cat].forEach(feature => {

                const featureTypeRoot =  sanitizeFeatureType(cat, feature.type);
                const featureType =  featureTypeRoot + fullResiduesSuffix;
                const featureTypeCA = featureTypeRoot + cAlphaSuffix;

                const featureNameRoot = sanitizeFeatureName(`${feature.type}${feature.begin}-${feature.end}`);
                const featureName = featureNameRoot + fullResiduesSuffix;
                const featureNameCA = featureNameRoot + cAlphaSuffix;

                let fBeginStructure = this.record.mapPosUnpToPdb(feature.begin);
                let fEndStructure = this.record.mapPosUnpToPdb(feature.end);

                let range = this.globals.lm.getAuthSeqNumberRange(this.record, fBeginStructure, fEndStructure);
                // let autSeqNumberBegin = this.globals.lm.getAuthSeqNumber(this.record, fBeginStructure);
                // let autSeqNumberEnd = this.globals.lm.getAuthSeqNumber(this.record, fEndStructure);

                let autSeqNumberBegin = undefined;
                let autSeqNumberEnd = undefined;
                if (range.length === 1) {
                    autSeqNumberBegin = range[0];
                    autSeqNumberEnd = range[0];
                } else if (range.length > 1) {
                    autSeqNumberBegin = range[0];
                    autSeqNumberEnd = range[range.length - 1];
                }

                if (autSeqNumberBegin === undefined || autSeqNumberEnd === undefined) return;

                if (!(featureType in catSubcats)) {
                    catSubcats[featureType] = [];
                    catSubcats[featureTypeCA] = [];
                }
                catSubcats[featureType].push(featureName);
                catSubcats[featureTypeCA].push(featureNameCA);
                //need to use feature.type and not featureType, because featureType is sanitized
                const selection = `chain ${this.chainId} and ` + (require('./settings').boundaryFeatureTypes.indexOf(feature.type) < 0 ? `resi ${autSeqNumberBegin}-${autSeqNumberEnd}` : `(resi ${autSeqNumberBegin}) or (resi ${autSeqNumberEnd})`);
                const selectionCA = `(${selection}) and name CA`;
                content += `cmd.select('${featureName}', '${selection}')\n`;
                content += `cmd.select('${featureNameCA}', '${selectionCA}')\n`;
            });
            Object.keys(catSubcats).forEach(cs => content += `cmd.group('${cs}', '${catSubcats[cs].join(" ")}')\n`);
            content += `cmd.group('${cat}', '${Object.keys(catSubcats).join(" ")}')\n`;
        });

        const customVisuals = this.globals.lm.getVisualsInteractive();
        Object.keys(customVisuals).forEach(visualId => {
            const selectionDef = customVisuals[visualId].selectionDef;
            let structurePoss = selectionDef.structureNumbers;
            if (!structurePoss || structurePoss.length === 0) {
                structurePoss = selectionDef.sequenceNumbers.map(d => this.record.mapPosUnpToPdb(d));
            }
            const authSeqNumbers = structurePoss
                .map(d => this.globals.lm.getAuthSeqNumber(this.record, d))
                .filter((d,i) => {
                    if (d === undefined) {
                        console.warn(`Sequence-structure mapping not found for sequence position ${selectionDef.sequenceNumbers[i]}.`);
                    }
                    return d !== undefined;
                });
            const selection = `chain ${this.chainId} and (resi ${authSeqNumbers.join(' or resi ')})`;
            const selectionCA = `(${selection}) and name CA`;
            content += `cmd.select('${visualId}${fullResiduesSuffix}', '${selection}')\n`;
            content += `cmd.select('${visualId}${cAlphaSuffix}', '${selectionCA}')\n`;
        })

        download(content, `${this.pdbId}_${this.chainId}.py`, "text/plain");
    }
}

class ActiveFeature {
    constructor(globals){
        this.features = undefined;
        this.colors = undefined;
        this.globals = globals;
    }

    set(features, colors) {
        this.features = features;
        this.colors = colors;
        this.overlay();
    }

    unset() {
        this.features = undefined;
        this.colors = undefined;
        this.overlay();
        this.globals.activeHighlight.overlay(); //if the highlight is active, it needs to be also visible in the structure once the other overlays are gone
    }

    overlay(){
        this.features ? this.globals.lm.mapFeatures(this.features, this.colors) : this.globals.lm.unmapFeature();
        this.globals.pv.deselectAllOverlayIcons();
    }
}

class ActiveHighlight {
    constructor(globals){
        this.begin = undefined;
        this.end = undefined;
        this.globals = globals;
    }

    set(begin, end) {
        this.begin = begin;
        this.end = end;
        this.overlay();
    }

    unset() {
        this.begin = undefined;
        this.end = undefined;
        this.overlay();
    }

    isSet() {
        return this.begin !== undefined;
    }

    overlay(){
        if (this.isSet()) {
            this.globals.pv.deselectAllOverlayIcons();
            this.globals.lm.highlightRegion(this.begin, this.end);
        } else {
            if (!this.globals.lm.groupSelected()){
                this.globals.lm.resetVisuals();
            }
        }
    }
}


const showLoadingIcon = function (containerId) {
    $(`#${containerId}`).append(`<div class="pv3d-loader-container"><div class="pv3d-loader"></div></div>`)

};

const hideLoadingIcon = function (containerId) {
    $(`#${containerId} .pv3d-loader-container`).remove();

};

const parseEnabledPdbIds = function(pdbIds) {
    //The list contains records either in the formatd PDB_ID or PDB_ID:CHAIN_ID. For example ['1ryp:b', '4r17']. We want to return
    //for each PDB_ID list of chains or empty list meaning that we want to retrieve all the chains of given PDB_ID
    const pdbIdDict = {};
    pdbIds.forEach(function (pdbId) {
        pdbId = pdbId.toLowerCase().trim();
        let id = pdbId;
        let chain = undefined;

        const ixColon = pdbId.indexOf(':');
        if (ixColon > 0){
            id = pdbId.substring(0, ixColon).trim();
            chain = pdbId.substring(ixColon + 1).trim();
        }
        if (Object.keys(pdbIdDict).indexOf(id) < 0){
            pdbIdDict[id] = [];
        }
        if (chain !== undefined && pdbIdDict[id].indexOf(chain) < 0) {
            pdbIdDict[id].push(chain);
        }
    });
    return pdbIdDict;
};

function sanitizeInputOpts(opts){
    Object.keys(opts).forEach(k => {
        if (typeof opts[k] === "string") {
            opts[k] = opts[k].trim();
        }
    })
}

const MolArt = function(opts) {

    sanitizeInputOpts(opts);

    let pvReady  = false;

    const globals = {
        lmCallbackRegistered: false

        ,pv: PvController()
        ,lm: LmController()

        ,eventEmitter: new events.EventEmitter()

        ,settings: require('./settings')
    };

    globals.activeStructure =  new ActiveStructure(globals);
    globals.activeFeature =  new ActiveFeature(globals);
    globals.activeHighlight =  new ActiveHighlight(globals);

    globals.uniprotId = opts.uniprotId;
    globals.sequence = opts.sequence;

    if (globals.uniprotId !== undefined && globals.sequence !== undefined) {
        throw new Error("UniProt ID and sequence are mutually exclusive!")
    }

    globals.containerId = opts.containerId;
    globals.pvContainerId = globals.containerId + 'ProtVista';
    globals.lmContainerId = globals.containerId + 'LiteMol';

    showLoadingIcon(globals.containerId);

    this.globals = globals;

    createPageStructure();
    initializePlugins(opts).then( () => {updatePageStructure(); hideLoadingIcon(globals.containerId);} );


    function createPageStructure(){
        if ($("#" + globals.containerId).height() === 0)
            $("#" + globals.containerId).css("height", "100vh");



        globals.container = jQuery('<div class="pv-inner-container"></div>').appendTo($("#" + globals.containerId));

        globals.downloadMessage = $(`
            <div class="message-container"> 
                <div class="message">               
                                
                    <div class="content center-items">
                      <button class="ui button pymol">
                           PyMOL
                      </button>
                      <button class="ui button csv">
                           CSV
                      </button>
                    </div>
                </div>
            </div>
        `).appendTo(globals.container);
        // globals.downloadModal.modal({
        //     context: globals.container
        // });
        // For some reason setting the following styles (or class with those items) directly to the div element
        // does not work. Probably they are overrident when modal() is called
        // const modalContent = globals.downloadModal.find(".content");
        // modalContent.css("display", "flex");
        // modalContent.css("align-items", "center");
        // modalContent.css("justify-content", "center");

        globals.downloadMessage.click(() => {
            globals.downloadMessage.css("display", "none");
        })
        globals.downloadMessage.find(".pymol").click(() => {
            globals.activeStructure.exportToPymol();
            globals.downloadMessage.css("display", "none");
        });
        globals.downloadMessage.find(".csv").click(() => {
            globals.pv.exportToCsv();
            globals.downloadMessage.css("display", "none");

        });


        const pvBlock = $('<div class="pv3d-pv"></div>').appendTo(globals.container);
        const lmBlock = $('<div class="pv3d-lm"></div>').appendTo(globals.container);
        globals.splitBar = $('<div class="pv3d-split-bar"></div>');

        globals.errorMessageContainer = $(`
        <div class="message-container">
            <div class="message">.</div>
        </div>`).appendTo(globals.container);

        globals.lmErrorMessageContainer = $(`
        <div class="message-container">
            <a href="#" class="pv3d-error-close-button"></a>
            <div class="message">.</div>            
        </div>`).appendTo(lmBlock);

        globals.container.append(pvBlock);
        globals.container.append(globals.splitBar);
        globals.container.append(lmBlock);

        /**
         *************** HEADER
         */

        globals.container.append(`<span class="logo ui label"><a href="${globals.settings.homepage}" target="_blank">MolArt</a></span>`)

        const pvHeader = $(`        
        <div class="pv3d-header pv3d-header-pv">
                <a class="ui label unp-link pv3d-invisible" href="" target="_blank">
                    UniProt:
                    <div class="detail"></div>
                </a>
        </div>
        `);

        const lmHeader = $(`        
        <div class="pv3d-header pv3d-header-lm">
        
        
            <div class="pv3d-button pv3d-download" title="Export to PyMol">
                ${svgSymbols.download}
            </div>
            
            <a class="ui label pdb-link pv3d-invisible" href="" target="_blank">                    
                <div class="detail"></div>
            </a>
            <div class="lm-list">
                <div class="lm-pdb-id-list ui search selection dropdown">
                    <div class="text"></div>
                    <i class="dropdown icon"></i>
                </div>
                :
                <div class="lm-pdb-chain-list ui search selection dropdown">
                    <div class="text"></div>
                    <i class="dropdown icon"></i>
                </div>
            </div>
            <div class="user-highlights ui selection dropdown">
                    <div class="text"></div>                    
                    <i class="dropdown icon"></i>
                </div>            
                      
        </div>
        `);

        const lmHeaderList = lmHeader.find('.lm-list');

        const iconLeft = svgSymbols.createJQSvgIcon(svgSymbols.controllerPrevious, 0, 0/*, headerHeight*/);
        const iconRight = svgSymbols.createJQSvgIcon(svgSymbols.controllerNext, 0, 0/*, headerHeight*/);

        iconLeft.addClass('shift-left');
        iconRight.addClass('shift-right');

        lmHeaderList.prepend(iconLeft);
        lmHeaderList.append(iconRight);

        pvBlock.append(pvHeader);
        lmBlock.append(lmHeader);

        /**
         *************** BODY
         */

        globals.pvContainer = $(`<div id="${globals.pvContainerId}" class="pv-container pv3d-content"></div>`);

        globals.lmContainer = $(`
        <div class="lm-container pv3d-content">
            <div id="${globals.lmContainerId}" class="lm-component-container">
            </div>
            <div class="pv3d-footer">
                <div style="display: table; width: 100%;">
                    <div style="display: table-row;"></div>                    
                        <!--<div style="display: table-cell; width: 1px; padding-right: 10px">-->
                            <!--<label>Transparency: </label>-->
                        <!--</div>                    -->
                        <div style="display: table-cell;">
                        <div class="ui segment transparency-slider-container">
                                <div class="ui range transparency-slider"></div>
                            </div>
                            <!--<input class="pv3d-lm-transparency-slider" type="range" value="30" min="0" max="100">                            -->
                        </div>                    
                </div>
            </div>
        </div>
        `);
        // globals.lmContainer.css('top', pvHeader.outerHeight());
        // .each(function (ix, e) {
        //
        //     $(e).find('#range-1').range({
        //         min: 0,
        //         max: 10,
        //         start: 5
        //     });
        //
        // });

        // $(document).ready(function(){
        //     globals.lmContainer.find('.transparency-slider').range({
        //         min: 0,
        //         max: 100,
        //         start: 30
        //     });
        // });


        pvBlock.append(globals.pvContainer);
        lmBlock.append(globals.lmContainer);

        globals.container.find('.pv3d-content').css('height', `calc(100% - ${pvHeader.outerHeight(true)}px)`);

        // content.on('scroll', () => {
        //     globals.lmContainer.css('top', content.scrollTop());
        // });

        /**
         *************** FOOTER
         */

        const lmFooter = globals.lmContainer.find('.pv3d-footer');
        globals.lmContainer.find('.lm-component-container').css('height', `calc(100% - ${lmFooter.outerHeight(true)}px)`);

        /**
         *************** IFRAME (to listen to resize events [even for scrollbar appearance])
         */
        const iframe = $('<iframe style="height: 0; background-color: transparent; margin: 0; padding: 0; overflow: hidden; border-width: 0; position: absolute; width: 100%;"></iframe>');
        pvBlock.append(iframe);

        /**
         *************** EVENT HANDLING
         */

        iframe[0].contentWindow.addEventListener('resize', function(e) {
            resize();
        });

        globals.splitBar.mousedown(e => {
            e.preventDefault();
            globals.container.mousemove(function (e) {
                e.preventDefault();
                splitBarPositionChange(e);
            })
        });
        globals.container.mouseup(() => {
            globals.container.unbind('mousemove');
            globals.pv.highlightActiveStructure();
        });

        globals.container.on('scroll', () => {
            positionHeadersAndContainersTop();
        });

        globals.container.find('.pv3d-button.pv3d-download').on('click',function () {
            globals.downloadMessage.css("display", "block");
        });

        $(window).on('resize', () => {
            resize();
        });

      globals.container.find('.pv3d-error-close-button').on('click',function () {
          $(this).parent().css('display', 'none');
      });
    }

    function positionHeadersAndContainersTop(){

        const headerHeight =  globals.container.find('.pv3d-header.pv3d-header-pv').outerHeight();
        globals.pvContainer.css('top', headerHeight + 'px');
        const containerTop = globals.container.offset().top;
        const pvContainerTop = globals.pvContainer.offset().top;
        const newHeaderTop = containerTop - pvContainerTop + headerHeight;

        globals.container.find('.pv3d-header').css('top', newHeaderTop + 'px');
        globals.container.find('.logo').css('top', `${newHeaderTop + 4}px`);
        globals.container.find('.pv3d-lm .message-container').css('top', newHeaderTop + 'px');

        globals.lmContainer.css('top', (newHeaderTop + headerHeight) + 'px');
    }

    function resize(checkPvReady = true){
        if (checkPvReady && !pvReady) return;

        const pvWidth = globals.container.find('.pv3d-pv').width();
        const lmWidth = globals.container.find('.pv3d-lm').width();

        globals.container.find('.pv3d-header.pv3d-header-pv').width(pvWidth);
        globals.container.find('.pv3d-header.pv3d-header-lm').width(lmWidth);
        globals.lmContainer.width(lmWidth);

        positionHeadersAndContainersTop();
        const contentTop = globals.container.find('.pv3d-header').outerHeight();

        const lmFooterHeight = globals.lmContainer.find('.pv3d-footer').height();
        const lmContentHeight = globals.container.height() - contentTop;
        const lmPluginHeight = lmContentHeight - lmFooterHeight;

        globals.lmContainer.find('.lm-component-container').height(lmPluginHeight);
        globals.lmContainer.height(lmContentHeight);

        if (checkPvReady){
            globals.pv.resized();
        }
    }

    /***
     * Size of some components might change after the data are loaded, so some sizes (which can't be set as ratio)
     * need to be updated.
     */
    function updatePageStructure(){
        const header = globals.container.find('.pv3d-header');
        globals.container.find('.pv3d-content').css('height', `calc(100% - ${header.outerHeight(true)}px)`);
    }

    function showErrorMessage(message) {

        hideLoadingIcon(globals.containerId);
        globals.errorMessageContainer.find('.message')[0].innerHTML = message;
        globals.errorMessageContainer.css('display', 'block');
    }

    function hideErrorMessage() {
        globals.errorMessageContainer.css('display', 'none');
    }

    function splitBarPositionChange(event){
        const newPct = ((event.pageX - globals.container.offset().left) / globals.container.width())*100;
        const spBarWidth = globals.splitBar.width();
        $(globals.container.find('.pv3d-pv')).css('width', `calc(${newPct}% - ${spBarWidth/2}px)`);
        $(globals.container.find('.pv3d-lm')).css('width', `calc(${100-newPct}% - ${spBarWidth/2}px)`);

        window.dispatchEvent(new Event('resize')); //this needs to be done, otherwise structure in LM does not resize (does not work in IE)

        resize();
    }

    function loadSmr(uniprotId, opts) {
        let records = [];
        return services.getUnpToSmrMapping(uniprotId).then(function (uniprotIdSmrs) {
            if (uniprotIdSmrs.structures.length !== 0)  records = uniprotIdSmrs.structures.map(rec => pdbMapping.pdbMapping(rec, 'SMR'));

            //if only specific SMR records are required
            if (opts.smrIds && opts.smrIds.length > 0) {
                records = records.filter(rec => rec.isPDB() || opts.smrIds.indexOf(rec.getPdbId()) >= 0);
            }

            //sort records by length and size
            records.sort((a,b) => b.getCoverage() - a.getCoverage());

            return records;
        }, function (error) {
            return [];
        });
    }

    function loadAf(uniprotId, opts){
        let records = [];
        return services.getUnpToAfMapping(uniprotId).then(afRecords => {
            //it seem that when there is no record for given UniProt ID, the API returns "{}", otherwise it returns an array with one object
            /*
            [
              {
                "entryId": "AF-Q5VSL9-F1",
                "gene": "STRIP1",
                "uniprotAccession": "Q5VSL9",
                "uniprotId": "STRP1_HUMAN",
                "uniprotDescription": "Striatin-interacting protein 1",
                "taxId": 9606,
                "organismScientificName": "Homo sapiens",
                "uniprotStart": 1,
                "uniprotEnd": 837,
                "uniprotSequence": "MEPAVGGPGPLIVNNKQPQPPPPPPPAAAQPPPGAPRAAAGLLPGGKAREFNRNQRKDSEGYSESPDLEFEYADTDKWAAELSELYSYTEGPEFLMNRKCFEEDFRIHVTDKKWTELDTNQHRTHAMRLLDGLEVTAREKRLKVARAILYVAQGTFGECSSEAEVQSWMRYNIFLLLEVGTFNALVELLNMEIDNSAACSSAVRKPAISLADSTDLRVLLNIMYLIVETVHQECEGDKAEWRTMRQTFRAELGSPLYNNEPFAIMLFGMVTKFCSGHAPHFPMKKVLLLLWKTVLCTLGGFEELQSMKAEKRSILGLPPLPEDSIKVIRNMRAASPPASASDLIEQQQKRGRREHKALIKQDNLDAFNERDPYKADDSREEEEENDDDNSLEGETFPLERDEVMPPPLQHPQTDRLTCPKGLPWAPKVREKDIEMFLESSRSKFIGYTLGSDTNTVVGLPRPIHESIKTLKQHKYTSIAEVQAQMEEEYLRSPLSGGEEEVEQVPAETLYQGLLPSLPQYMIALLKILLAAAPTSKAKTDSINILADVLPEEMPTTVLQSMKLGVDVNRHKEVIVKAISAVLLLLLKHFKLNHVYQFEYMAQHLVFANCIPLILKFFNQNIMSYITAKNSISVLDYPHCVVHELPELTAESLEAGDSNQFCWRNLFSCINLLRILNKLTKWKHSRTMMLVVFKSAPILKRALKVKQAMMQLYVLKLLKVQTKYLGRQWRKSNMKTMSAIYQKVRHRLNDDWAYGNDLDARPWDFQAEECALRANIERFNARRYDRAHSNPDFLPVDNCLQSVLGQRVDLPEDFQMNYDLWLEREVFSKPISWEELLQ",
                "modelCreatedDate": "2021-07-01",
                "latestVersion": 1,
                "allVersions": [
                  1
                ],
                "cifUrl": "https://alphafold.ebi.ac.uk/files/AF-Q5VSL9-F1-model_v1.cif",
                "bcifUrl": "https://alphafold.ebi.ac.uk/files/AF-Q5VSL9-F1-model_v1.bcif",
                "pdbUrl": "https://alphafold.ebi.ac.uk/files/AF-Q5VSL9-F1-model_v1.pdb",
                "paeImageUrl": "https://alphafold.ebi.ac.uk/files/AF-Q5VSL9-F1-predicted_aligned_error_v1.png",
                "paeDocUrl": "https://alphafold.ebi.ac.uk/files/AF-Q5VSL9-F1-predicted_aligned_error_v1.json"
              }
            ]
             */
            if (afRecords !== {} && afRecords.length > 0) {
                records = afRecords.map(rec => pdbMapping.pdbMapping(rec, 'AF'));
            }

            return records;
        }, function (error) {
            return [];
        })
    }

    function mappingInMappings(m, mps){

        for (let i = 0; i < mps.length; i++) {
            if (m.getId() === mps[i].getId() && m.isPDB() === mps[i].isPDB()) return i;
        }
        return -1;
    }

    function mergeMappings(mps) {

        let res = [];

        mps.forEach(m => {
            let i = mappingInMappings(m, res);
            if (i >= 0) {
                mps[i].setTaxId(mps[i].getTaxId() + ',' + m.getTaxId());
            } else {
                res.push(m);
            }
        });

        return res;
    }

    function sortPdbRecords(records, opts, settings) {
        if (opts.sortStructures) {
            if (opts.sortStructures === settings.sortStructuresOptions.id) {
                return records.sort( (a,b) => {

                    if (a.getId() < b.getId()) return -1;
                    else if (a.getId() == b.getId()) return 0;
                    else return 1;

                } );
            }
        }
        return records;

    }

    function retrieveStructureRecordsOnline(opts) {

        let pdbMappingAvailable = true;

        return services.getUnpToPdbMapping(opts.uniprotId).then(function(uniprotIdPdbs) {
            globals.pdbRecords = mergeMappings(uniprotIdPdbs[opts.uniprotId].map(rec => pdbMapping.pdbMapping(rec, 'PDB')));
            if (opts.pdbIds && opts.pdbIds.length > 0) {
                const pdbIds = parseEnabledPdbIds(opts.pdbIds);
                globals.pdbRecords = globals.pdbRecords.filter(rec => {
                    const pdbId = rec.getPdbId().toLowerCase();
                    const chainId = rec.getChainId().toLowerCase();
                    if (Object.keys(pdbIds).indexOf(pdbId) >= 0) {
                        if (pdbIds[pdbId].length === 0 || pdbIds[pdbId].indexOf(chainId) >= 0) {
                            return true;
                        }
                    }
                    return false;
                });
            }

            const promises = globals.pdbRecords.map(rec => services.getObservedRanges(rec.getPdbId(), rec.getChainId()));
            return Promise.all(promises).then(function (or) {
                for (let i =0; i < or.length; i++){
                    const ranges = or[i][globals.pdbRecords[i].getPdbId()].molecules[0].chains[0].observed;
                    const ors = ranges.map(r => new pdbMapping.ObservedRange(r));
                    globals.pdbRecords[i].setObservedRanges(ors);
                }
            }).then(function () {
                let pdbIds = globals.pdbRecords.map(rec => rec.getPdbId()).filter((v, i, a) => a.indexOf(v) === i);
                const promises = pdbIds.map(pdbId => services.getUniprotSegments(pdbId));
                return Promise.all(promises).then(function (mappings) {
                    globals.pdbRecords.forEach(rec => {
                        let pdbIx = pdbIds.indexOf(rec.getPdbId());
                        rec.parseInsertedRanges(mappings[pdbIx], globals.uniprotId);
                    })
                });
            })
        }, function(error){
            if (!globals.pdbRecords) globals.pdbRecords = [];
            pdbMappingAvailable = false;
            return Promise.all([loadAf(opts.uniprotId, opts), loadSmr(opts.uniprotId, opts)]).then(records => {
                globals.pdbRecords = globals.pdbRecords.concat(records[0]).concat(records[1]);
            });
        }).then(function(){
            if (!globals.pdbRecords) globals.pdbRecords = [];
            if (opts.alwaysLoadPredicted && pdbMappingAvailable) {
                return Promise.all([loadAf(opts.uniprotId, opts), loadSmr(opts.uniprotId, opts)]).then(records => {
                    globals.pdbRecords = globals.pdbRecords.concat(records[0]).concat(records[1]);
                });
            } else {
                return Promise.resolve();
            }
        }).then(function () {
            if (globals.pdbRecords.length === 0) delete globals.pdbRecords;
            else globals.pdbRecords = sortPdbRecords(globals.pdbRecords, opts, globals.settings);
        });
    }

    function convertPassedRec(rec) {
        return {
            pdb_id: rec.id,
            chain_id: rec.chainId,
            start: rec.start,
            end: rec.end,
            unp_start: rec.seqStart,
            unp_end: rec.seqEnd,
            coverage: (parseInt(rec.end) - parseInt(rec.start)) / (parseInt(rec.seqEnd) - parseInt(rec.seqStart)),
            structure: rec.structure
        }

    }
    function retrievePassedStructureRecords(opts) {

        globals.pdbRecords = opts.sequenceStructureMapping.map(rec => {
            // const pdbRec = pdbMapping.pdbMapping(convertPassedRec(rec), 'USER');
            const pdbRec = pdbMapping.pdbMapping(rec, 'USER');
            const ors = rec.coverage.map(rng => new pdbMapping.ObservedRange(rng));
            pdbRec.setObservedRanges(ors);
            return pdbRec;
        });

        return Promise.resolve();
    }

    function retrieveStructureRecords(uniprotId, opts){
        if (opts.sequenceStructureMapping) {
            return retrievePassedStructureRecords(opts);
        } else {
            return retrieveStructureRecordsOnline(opts);
        }
    }

    function initializeActiveStructure(structureId){
        let rec = globals.pdbRecords[0];
        if (structureId) {
            for (const _rec of globals.pdbRecords) {
                if (_rec.getPdbId().toLowerCase() === structureId.toLowerCase()) {
                    rec = _rec;
                    break;
                }
                console.warn(`Default structure required (${structureId}) but not found in`, globals.pdbRecords)
            }
        }

        globals.activeStructure.set(rec.getPdbId(), rec.getChainId())
            .then(() => {globals.eventEmitter.emit('lmReady');})
    }

    // function initializeTestDataSet(sequence, catName, variant=false){
    //
    //     const ix1 = Math.floor(Math.random() * sequence.length);
    //     const ix2 = ix1 + Math.floor(Math.random() * (sequence.length - ix1));
    //     // const ix1 = 1468;
    //     // const ix2 = 1950;
    //
    //     if (variant) {
    //         return {
    //             sequence: sequence,
    //             features: [
    //                 {
    //                     type: "VARIANT",
    //                     category: "VARIATION",
    //                     description: "Random variantion data",
    //                     begin: String(ix1),
    //                     end: String(ix1),
    //                     // wildType: "X",
    //                     alternativeSequence: "E",
    //                     consequence: "User-defined consequence",
    //                     evidences: [
    //                         {
    //                             code: "ECO code 1",
    //                             source: {
    //                                 name: "Source name 1",
    //                                 id: "source id 1",
    //                                 url: "localhost://sourceid1"
    //                             }
    //                         }
    //                     ],
    //                     xrefs: [
    //                         {
    //                             name: "xref name 1",
    //                             id: "xref id 1",
    //                             url: "localhost://xrefid1"
    //                         }
    //                     ]
    //                 }
    //             ]
    //         }
    //     } else {
    //
    //         return {
    //             sequence: sequence,
    //             features: [
    //                 {
    //                     type: "ACT_SITE",
    //                     category: catName,
    //                     begin: String(ix1),
    //                     end: String(ix1),
    //                     color: "#00F5B8"
    //                 },
    //                 {
    //                     type: "MY_REGION",
    //                     category: catName,
    //                     begin: String(ix1),
    //                     end: String(ix2),
    //                     color: "#FF7094"
    //                 }
    //             ]
    //         };
    //     }
    //
    // }

    function initializePlugins(opts) {

        globals.opts = opts;

        let pdbRetrievalError;

        return retrieveStructureRecords(globals.uniprotId, opts).then(() => {
            return getFasta();
        }).then(function(fasta) {

            // simulating user-provided data source
            // let fastaOneLine = fasta.split("\n").slice(1).join('');
            // opts.customDataSources = [
            //
            //     {
            //         source: 'RANDOM',
            //         useExtension: false,
            //         data: initializeTestDataSet(fastaOneLine, 'MY_CATEGORY1')
            //     },
            //     {
            //         source: 'RANDOM',
            //         useExtension: false,
            //         data: initializeTestDataSet(fastaOneLine, 'MY_CATEGORY2 asdfaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
            //     },
            //     {
            //         source: 'RANDOM_VARIATION',
            //         useExtension: false,
            //         data: initializeTestDataSet(fastaOneLine, 'MY_VARIATION_DATA', true)
            //     },
            //     // {
            //     //     source: 'RANDOM',
            //     //     useExtension: true,
            //     //     url: '../test/data/externalFeatures_'
            //     // }
            //
            //     ];

            globals.pv.initialize({
                globals: globals
                ,fasta: fasta
                ,opts
            });

            globals.lm.initialize({
                globals: globals,
            });

            if (!('pdbRecords' in globals)) {
                globals.lm.showErrorMessage('No PDB mapping or Swissprot or AlphaFold model available for UniprotId ' + globals.uniprotId);
                globals.eventEmitter.emit('pvReady');
                pvReady = true;
                // resize();
            }

            if ('pdbRecords' in globals) {
                initializeActiveStructure(opts.defaultStructureId);

                globals.pv.getPlugin().getDispatcher().on('ready', () => onPvReady());
                if (globals.pv.getPlugin().categories.length > 0) {
                    // It might happen that the callback was registered only after a category was created and other
                    // categories won't be created. In such case, the onready event would be never called
                    onPvReady();
                }
            }

            // })


        }, function (error) {
            showErrorMessage('UniProt record ' + globals.uniprotId + ' could not be retrieved.');
            globals.eventEmitter.emit('pvReady');
        });

        function onPvReady() {
            globals.pvContainer.find('.up_pftv_category_PREDICTED_STRUCTURES .up_pftv_track-header,.up_pftv_category_EXPERIMENTAL_STRUCTURES .up_pftv_track-header').css('text-transform', 'uppercase');
            globals.pv.modifyHtmlStructure();
            globals.pv.resized();
            globals.pv.registerCallbacksAndEvents();
            globals.pv.setCategoriesTooltips(opts.enableCategoriesTooltips, opts.categoriesTooltips);
            globals.pv.reorderCategories(opts);

            globals.eventEmitter.emit('pvReady');
            pvReady = true;
            resize();
        }

        function getFasta(opts) {
            if (globals.opts.uniprotId) {
                return services.getFastaByUniprotId(globals.opts.uniprotId);
            } else {
                if (!globals.opts.sequence) throw Error("Either 'uniprotId' or 'sequence' parameter needs to be provided.");
                return Promise.resolve(`\n${globals.opts.sequence}`)

            }

        }
    }
};

MolArt.prototype.destroy = function () {
    this.getLmController().destroy();
    $(`#${this.globals.containerId}`).empty();

};

MolArt.prototype.loaded = function () {
    try {
        return this.getLmController().getPlugin().moleculeLoaded();
    } catch (e) {
        return false;
    }

};

MolArt.prototype.getGlobals = function () {
    return this.globals;
};

MolArt.prototype.getPvController = function () {
    return this.getGlobals().pv;
};


MolArt.prototype.getLmController = function () {
     return this.getGlobals().lm;
 };

MolArt.prototype.on = function (eventType, callback) {
    this.globals.eventEmitter.on(eventType, callback);
};

MolArt.prototype.highlightInSequence = function (seqPos, zoomIn) {
    this.getPvController().getPlugin().highlightRegion(seqPos,seqPos)
    if (zoomIn) {
        this.getPvController().getPlugin().zoomIn();
        this.getPvController().highlightActiveStructure();
    }
    // this.getPvController().highlightActivePosition(seqPos);
};

MolArt.prototype.deHighlightInSequence = function () {
    this.getPvController().resetHighlight();
};

MolArt.prototype.highlightInStructure = function (seqPos) {
    this.getLmController().highlightResidue(seqPos);
};

MolArt.prototype.hideSequenceView = function (seqPos) {
    $(this.globals.pvContainer).css('display', 'none');
    $(this.globals.lmContainer).css('width', '100%');
};
/***
 * Focuses to given residues + neighborhood in Angstroms.
 * @param seqPos
 * @param neighborhoodSize Any residues having atoms within a sphere with given size and centered in seqPos will be displayed.
 */
MolArt.prototype.focusInStructure = function (seqPos, neighborhoodSize = 0) {
    this.getLmController().focusResidue(seqPos, neighborhoodSize);
};

MolArt.prototype.deHighlightInStructure = function () {
    this.getLmController().dehighlightAll();
};

/***
 * Gets information about whether a structure is loaded. Returns true if there is no structure available for the
 * sequence of if the structure has not been loaded yet.
 * @returns {boolean}
 */
MolArt.prototype.structureLoaded = function () {
    return this.globals.activeStructure.isSet();
};

/***
 * Get ranges in the sequence which have structure mapped. If there is not structure set, the method
 * throws an error.
 * @returns {*[] Array of arrays of size 2 [begin, end]}
 */
MolArt.prototype.getSeqStrRanges = function () {
    return this.globals.activeStructure.getSeqStrRange();


};

 module.exports = MolArt;
