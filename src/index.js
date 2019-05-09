require('./css/styles.css');
const download = require('downloadjs');

if (!window.$) window.$ = require('jquery');
if (!window.jQuery) window.jQuery = window.$;

const events = require('events');

const LmController = require('./lm.controller.js');
const PvController = require('./pv.controller.js');

const services = require('./services');

const pdbMapping = require('./pdb.mapping');
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
        }, function (error) {
            console.log(error);
            self.globals.lm.showErrorMessage(error);
            throw error;
        });
    }

    isSet(){
        return (this.pdbId === undefined ? false : true);
    }

    exportToPymol(){
        let content = "import __main__\n" +
            "__main__.pymol_argv = ['pymol', '-qei']\n" +
            "import pymol\n" +
            "pymol.finish_launching()\n" +
            "from pymol import cmd\n" +
            "cmd.delete('all')\n";

        const sanitizeFeatureName = function(name) {
            return name.replace('&', 'and').replace(/[^a-zA-Z0-9_]/g, "_")
        };

        const sanitizeFeatureType = function(catName, subCatName) {
            let rv = subCatName
            if (subCatName == 'CHAIN') {
                //CHAIN is a reserved word in pymol
                rv =  'CHAIN_';
            }
            if (rv == catName) {
                rv = rv + '_'; //eg. ANTIGEN has both category and subcategory (feature type) called ANTIGEN
            }
            return rv;
        };


        const source = this.record.getSource();
        if (source === 'PDB'){
            content += `cmd.load('${this.record.getCoordinatesFile()}')\n`;
        } else if (source === 'SMR') {
            const url = this.record.getCoordinatesFile().replace(this.globals.settings.corsServer, "");
            const name = `${this.globals.uniprotId}.${this.record.getPdbId()}.${this.record.getChainId()}.${this.record.getPdbStart()}-${this.record.getPdbEnd()}`;
            content += `cmd.load('${url}', '${name}', 0, 'pdb')\n`;
        } else {
            throw Error('Unknown structure source');
        }

        const annotations = this.globals.pv.extractAnnotationData();

        Object.keys(annotations).forEach(cat => {
            // const featureNames = [];
            const catSubcats = {};
            annotations[cat].forEach(feature => {

                const featureType = sanitizeFeatureType(cat, feature.type);
                const featureTypeCA = featureType + '-CA';

                const featureName = sanitizeFeatureName(`${feature.type}${feature.begin}-${feature.end}`);
                const featureNameCA = featureName + '-CA';

                let fBeginStructure = this.record.mapPosUnpToPdb(feature.begin);
                let fEndStructure = this.record.mapPosUnpToPdb(feature.end);

                let autSeqNumberBegin = this.globals.lm.getAuthSeqNumber(this.record, fBeginStructure);
                let autSeqNumberEnd = this.globals.lm.getAuthSeqNumber(this.record, fEndStructure);

                if (autSeqNumberBegin === undefined || autSeqNumberEnd === undefined) return;

                if (!(feature.type in catSubcats)) {
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
            Object.keys(catSubcats).forEach(cs => content += `cmd.group('${cs}', '${catSubcats[cs].join(" ")}')\n`)
            content += `cmd.group('${cat}', '${Object.keys(catSubcats).join(" ")}')\n`;
        });

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
    }

    overlay(){
        this.features ? this.globals.lm.mapFeatures(this.features, this.colors) : this.globals.lm.unmapFeature();
        this.globals.pv.deselectAllOverlayIcons();
    }
}



const MolArt = function(opts) {

    let pvReady  = false;

    this.eventEmitter = new events.EventEmitter();
    const eventEmitter = this.eventEmitter;

    const globals = {
        lmCallbackRegistered: false

        ,lm: LmController()
        ,pv: PvController()

        ,settings: require('./settings')
    };

    globals.activeStructure =  new ActiveStructure(globals);
    globals.activeFeature =  new ActiveFeature(globals);

    globals.uniprotId = opts.uniprotId;
    globals.containerId = opts.containerId;
    globals.pvContainerId = globals.containerId + 'ProtVista';
    globals.lmContainerId = globals.containerId + 'LiteMol';

    this.globals = globals;

    createPageStructure();
    initializePlugins(opts).then( () => updatePageStructure() );

    function createPageStructure(){
        if ($("#" + globals.containerId).height() == 0)
            $("#" + globals.containerId).css("height", "100vh");

        globals.container = $('<div class="pv-inner-container"></div>').appendTo($("#" + globals.containerId));

        const pvBlock = $('<div class="pv3d-pv"></div>').appendTo(globals.container);
        const lmBlock = $('<div class="pv3d-lm"></div>').appendTo(globals.container);
        globals.splitBar = $('<div class="pv3d-split-bar"></div>');

        globals.errorMessageContainer = $(`
        <div class="error-message-container">
            <div class="error-message">.</div>
        </div>`).appendTo(globals.container);

        globals.lmErrorMessageContainer = $(`
        <div class="error-message-container">
            <a href="#" class="pv3d-error-close-button"></a>
            <div class="error-message">.</div>            
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
            globals.activeStructure.exportToPymol();
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
        globals.container.find('.pv3d-lm .error-message-container').css('top', newHeaderTop + 'px');

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

        globals.errorMessageContainer.find('.error-message')[0].innerHTML = message;
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
        return services.getUnpToSmrMapping(uniprotId).then(function (uniprotIdSmrs) {
            if (!globals.pdbRecords) globals.pdbRecords = [];
            if (uniprotIdSmrs.structures.length !== 0)  globals.pdbRecords = globals.pdbRecords.concat(uniprotIdSmrs.structures.map(rec => pdbMapping(rec, 'SMR')));

            if (opts.smrIds && opts.smrIds.length > 0) {
                globals.pdbRecords = globals.pdbRecords.filter(rec => rec.isPDB() || opts.smrIds.indexOf(rec.getPdbId()) >= 0);
            }

            return Promise.resolve();
        });
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

    function retrieveStructureRecords(uniprotId, opts){

        return services.getUnpToPdbMapping(uniprotId).then(function(uniprotIdPdbs) {
            // console.log('uniprotIdPdbs', uniprotIdPdbs);
            globals.pdbRecords = mergeMappings(uniprotIdPdbs[uniprotId].map(rec => pdbMapping(rec, 'PDB')));
            if (opts.pdbIds && opts.pdbIds.length > 0) {
                globals.pdbRecords = globals.pdbRecords.filter(rec => opts.pdbIds.indexOf(rec.getPdbId()) >= 0);
            }
            return Promise.resolve();
        }, function(error){
            return loadSmr(uniprotId, opts);
        }).then(function(){
            return opts.alwaysLoadPredicted ? loadSmr(uniprotId, opts) : Promise.resolve();
        }).then(function () {
            if (globals.pdbRecords.length === 0) delete globals.pdbRecords;
            else globals.pdbRecords = sortPdbRecords(globals.pdbRecords, opts, globals.settings);
        })
    }

    function initializeActiveStructure(){
        const rec = globals.pdbRecords[0];
        globals.activeStructure.set(rec.getPdbId(), rec.getChainId());
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
            return services.getFastaByUniprotId(globals.uniprotId);
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

            resize(false);

            globals.pv.getPlugin().getDispatcher().on('ready', () => {
                globals.pv.modifyHtmlStructure();
                globals.pv.resized();
                globals.pv.registerCallbacksAndEvents();
                globals.pv.setCategoriesTooltips(opts.enableCategoriesTooltips, opts.categoriesTooltips);

                eventEmitter.emit('pvReady');
                pvReady = true;
                // resize();
            });

            globals.lm.initialize({
                globals: globals,
            });

            if (!('pdbRecords' in globals)) {
                globals.lm.showErrorMessage('No PDB mapping or Swissprot model available for UniprotId ' + globals.uniprotId);
                eventEmitter.emit('pvReady');
                pvReady = true;
                // resize();
            }

            if ('pdbRecords' in globals) {
                initializeActiveStructure();

            }
        }, function (error) {
            showErrorMessage('UniProt record ' + globals.uniprotId + ' could not be retrieved.');
            eventEmitter.emit('pvReady');
        });
    }
};

MolArt.prototype.destroy = function () {
    return this.getLmController().destroy();
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
    this.eventEmitter.on(eventType, callback);
};

 module.exports = MolArt;
