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


        const source = this.record.getSource();
        if (source === 'PDB'){
            content += `cmd.load('${this.record.getCoordinatesFile()}')\n`;
        } else if (source === 'SMR') {
            const url = this.record.getCoordinatesFile().replace(globals.settings.corsServer, "");
            const name = `${this.globals.uniprotId}.${this.record.getPdbId()}.${this.record.getChainId()}.${this.record.getPdbStart()}-${this.record.getPdbEnd()}`;
            content += `cmd.load('${url}', '${name}', 0, 'pdb')\n`;
        } else {
            throw Error('Unknown structure source');
        }

        const annotations = this.globals.pv.extractAnnotationData();

        Object.keys(annotations).forEach(cat => {
            const featureNames = [];
            annotations[cat].forEach(feature => {
                const featureName = `${feature.type}${feature.begin}-${feature.end}`;
                featureNames.push(featureName);
                const selection = require('./settings').boundaryFeatureTypes.indexOf(feature.type) < 0 ? `resi ${feature.begin}-${feature.end}` : `(resi ${feature.begin}) or (resi ${feature.end})`;
                content += `cmd.select('${featureName}', '${selection}')\n`;
            });
            content += `cmd.group('${cat}', '${featureNames.join(" ")}')\n`;
        });

        download(content, this.pdbId + '.py', "text/plain");
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



const MolStar = function(opts) {

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
        globals.container.find('.pv3d-lm .error-message-container').css('top', newHeaderTop + 'px');

        globals.lmContainer.css('top', (newHeaderTop + headerHeight) + 'px');
    }

    function resize(){
        if (!pvReady) return;

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

        globals.pv.resized();
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

    function retrieveStructureRecords(uniprotId){

        return services.getUnpToPdbMapping(uniprotId).then(function(uniprotIdPdbs) {
            globals.pdbRecords = uniprotIdPdbs[uniprotId].map(rec => pdbMapping(rec, 'PDB'));
        }, function(error){
            return services.getUnpToSmrMapping(uniprotId).then(function (uniprotIdSmrs) {
                if (uniprotIdSmrs.structures.length !== 0)  globals.pdbRecords = uniprotIdSmrs.structures.map(rec => pdbMapping(rec, 'SMR'));
            });
        });
    }

    function initializeActiveStructure(){
        const rec = globals.pdbRecords[0];
        globals.activeStructure.set(rec.getPdbId(), rec.getChainId());
    }

    function initializeTestDataSet(sequence, catName){

        const ix1 = Math.floor(Math.random() * sequence.length);
        const ix2 = ix1 + Math.floor(Math.random() * (sequence.length - ix1));

        return {
            sequence: sequence,
            features: [
                {
                    type: "ACT_SITE",
                    category: catName,
                    begin: String(ix1),
                    end: String(ix1),
                    color: "#00F5B8"
                },
                {
                    type: "MY_REGIOM",
                    category: catName,
                    begin: String(ix1),
                    end: String(ix2),
                    color: "#FF7094"
                }
            ]
        };
    }

    function initializePlugins(opts) {

        let pdbRetrievalError;

        return retrieveStructureRecords(globals.uniprotId).then(() => {
            return services.getFastaByUniprotId(globals.uniprotId);
        }).then(function(fasta) {

            //simulating user-provided data source
            // opts.customDataSources = [
            //
            //     {
            //         source: 'RANDOM',
            //         useExtension: false,
            //         data: initializeTestDataSet(fasta.split("\n").slice(1).join(''), 'MY_CATEGORY1')
            //     },
            //     {
            //         source: 'RANDOM',
            //         useExtension: false,
            //         data: initializeTestDataSet(fasta.split("\n").slice(1).join(''), 'MY_CATEGORY2')
            //     },
            //     {
            //         source: 'RANDOM',
            //         useExtension: true,
            //         url: './test/data/externalFeatures_'
            //     }
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
                globals.lm.showErrorMessage('No PDB mapping or Swissprot model available for UniprotId ' + globals.uniprotId);
                eventEmitter.emit('pvReady');
                pvReady = true;
                resize();
            }

            if ('pdbRecords' in globals) {
                initializeActiveStructure();
                globals.pv.getPlugin().getDispatcher().on('ready', () => {
                    globals.pv.modifyHtmlStructure();
                    globals.pv.resized();
                    globals.pv.registerCallbacksAndEvents();

                    eventEmitter.emit('pvReady');
                    pvReady = true;
                    resize();
                });
            }
        }, function (error) {
            console.log('z');
            showErrorMessage('UniProt record ' + globals.uniprotId + ' could not be retrieved.');
            eventEmitter.emit('pvReady');
        });
    }
};

MolStar.prototype.destroy = function () {
    return this.getLmController().destroy();
};

MolStar.prototype.getGlobals = function () {
    return this.globals;
};

MolStar.prototype.getPvController = function () {
    return this.getGlobals().pv;
};


MolStar.prototype.getLmController = function () {
     return this.getGlobals().lm;
 };

MolStar.prototype.on = function (eventType, callback) {
    this.eventEmitter.on(eventType, callback);
};

 module.exports = MolStar;
