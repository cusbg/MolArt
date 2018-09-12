// var $ = require('jquery');

const svgSymbols = require('./svg.symbols');
const ProtVista = require('ProtVista');


const PvController = function () {

    // const ProtVista = use('ProtVista');
    let plugin;
    let globals;

    const settings = {
        highlightByHovering: false
    };

    function initialize(params) {

        globals = params.globals;
        if (params.opts.highlightByHovering !== undefined) settings.highlightByHovering = params.opts.highlightByHovering;

        const sequence = params.fasta.split("\n").slice(1).join("");

        if ('pdbRecords' in globals) {

            const pvDataSource = {
                sequence: sequence,
                features: []
            };

            globals.pdbRecords.forEach(function (rec, ix) {
                pvDataSource.features.push({
                    category: rec.getSource() === 'PDB' ? globals.settings.pvMappedStructuresCat.id: globals.settings.pvMappedStructuresCat.idPredicted,
                    type: rec.getPdbId().toUpperCase() + "_" + rec.getChainId().toUpperCase(),
                    description: rec.getDescription(),
                    ftId: ix,
                    begin: rec.getUnpStart(),
                    end: rec.getUnpEnd()
                })
            });

            const ds = {
                source: 'SIFTS API',
                useExtension: false,
                url: 'data:text/plain,' + encodeURI(JSON.stringify(pvDataSource))
            };

                let customDataSources = [ds];

            if (params.opts.customDataSources){
                params.opts.customDataSources.forEach(ds => {
                    if (ds.url === undefined) {
                        ds.url = 'data:text/plain,' + encodeURI(JSON.stringify(ds.data));
                    }
                });

                customDataSources = customDataSources.concat(params.opts.customDataSources);
            }


            plugin = new ProtVista( Object.assign({}, params.opts,
                {
                    el: document.getElementById(globals.pvContainerId),
                    uniprotacc: globals.uniprotId,
                    defaultSources: true,
                    // customDataSource: ds,
                    customDataSources: customDataSources
                }))

        } else {
            plugin = new ProtVista({
                el: document.getElementById(globals.pvContainerId),
                uniprotacc: globals.uniprotId,
                defaultSources: true
            });
        }



        initializeHeader();
    }

    function setCategoriesTooltips(enable, toolTips) {
        if (enable !== undefined && !enable) {
          globals.pvContainer.find('a.up_pftv_category-name').removeAttr('title');
        } else {
            if (toolTips !== undefined) {
                toolTips.forEach(keyVal => {
                    globals.pvContainer.find(`div.up_pftv_category_${keyVal[0]} a.up_pftv_category-name`).attr('title', keyVal[1])
                })
            }
        }

    }

    function getUniprotLink(uniprotId) {
        return 'http://www.uniprot.org/uniprot/' + uniprotId;
    }

    function getHeaderLinkContainer(){
        return globals.container.find('.pv3d-header-pv .unp-link');
    }

    function initializeHeader() {
        const linkContainer = getHeaderLinkContainer();
        linkContainer.removeClass('pv3d-invisible');
        linkContainer.attr('href', getUniprotLink(globals.uniprotId));
        linkContainer.find('.detail').text(globals.uniprotId);
    }

    function registerCallback(event, f) {
        plugin.getDispatcher().on(event, function(param){
            f(param);
        });
    }

    function modifyHtmlStructure(){
        createBars();
        createOverlaySymbolsAndLinks();
    }

    function createBars(){
        if (globals.pvContainer.find('.pv3d-pv-bars').length === 0) {

            const container = $('<div class="pv3d-pv-bars"></div>').appendTo(globals.pvContainer.find('.up_pftv_category-container'));
            createHighlightBar(container);
            createActiveStructureBar(container);
        }
    }

    function createHighlightBar(container){
        container.append('<div class="pv3d-pv-highlight-bar"></div>');
    }

    function createActiveStructureBar(container){
        container.append('<div class="pv3d-pv-structure-bar"></div>');
    }

    function createOverlaySymbols(){
        globals.pvContainer.find('.up_pftv_category-name, .up_pftv_track-header').each((ix, val) => {

            const el = $(val);
            if (
                (el.parents(`div[class="up_pftv_category_${globals.settings.pvMappedStructuresCat.id}"]`).length > 0)
                || (el.parents(`div[class="up_pftv_category_${globals.settings.pvMappedStructuresCat.idPredicted}"]`).length > 0)
                || (el.hasClass('up_pftv_track-header') && el.parents(`div[class="${globals.settings.pvVariationCat.clazz}"]`).length > 0)
            ) return;

            const category = el.closest('.up_pftv_category');
            if (el.parent().find(svgSymbols.svgIconSelector).length > 0) return;

            if (el.attr("class").split(' ').indexOf('up_pftv_track-header') >=0 ){
                el.parent().parent().css('position', 'relative');
            }else{
                category.css('position', 'relative');
            }

            const categoryLink = category.find('a');

            const width = categoryLink.outerHeight()*0.5;
            const left = categoryLink.width() - width;
            const top = categoryLink.outerHeight() / 2 - width / 2;

            const icon = svgSymbols.createJQSvgIcon(svgSymbols.arrowCircleRight, top, left, width);
            icon.prependTo(el.parent());
        });
    }

    function createOverlayLinks() {
        globals.pvContainer.find(getVariantsLinksSelectors()).css('cursor', 'pointer');
    }

    function createOverlaySymbolsAndLinks(){
        createOverlaySymbols();
        createOverlayLinks();
    }

    function getTrackData(trackContainer) {
        const categories = getCategories();
        for (let ixCat = 0; ixCat < categories.length; ixCat++){
            const cat = categories[ixCat];
            for (let ixTrack = 0; ixTrack < cat.tracks.length; ixTrack++) {
                const track = cat.tracks[ixTrack];
                if (globals.pvContainer.find(track.trackContainer[0]).is(trackContainer)) {
                    return track.data;
                }
            }
        }
    }

    function getVariationCategory(catContainer){

        const minColor = globals.settings.variationColors.min;
        const maxColor = globals.settings.variationColors.max;
        const diffColor = [maxColor[0] - minColor[0], maxColor[1] - minColor[1], maxColor[2] - minColor[2]];
        function getColor(intensity){
            const color = [0,0,0];
            for (let ix = 0; ix < 3; ix++)  color[ix] = minColor[ix] + diffColor[ix] * intensity;
            return `(${color[0]},${color[1]},${color[2]})`;
        }

        let relativeHist;
        const categories = getCategories();
        for (let ixCat = 0; ixCat < categories.length; ixCat++){
            const cat = categories[ixCat];
            if (globals.pvContainer.find(cat.categoryContainer[0]).parent().is(catContainer)) {
                const histogram = cat.categoryViewer.variationCountArray;
                const max = Math.max(...histogram);
                relativeHist = histogram.map( x => x / max );
            }
        }

        const data = relativeHist.map( (x, i) => {return {begin: i, end: i, type: 'VARIANT'}} );
        const colors = relativeHist.map( (x) => getColor(x));

        return {
            catData: data,
            catColors: colors
        }
    }

    function resized(){
        const container = globals.container.find('.pv3d-pv-bars');
        const cat = globals.pvContainer.find('.up_pftv_category-viewer');
        if (cat.length > 0){
            container.css('left', cat.position().left + 'px');
            container.css('width', cat.width());
        }

        highlightActiveStructure();
    }

    let lastLetterWidth = 0, lastLeft = 0, lastWidth = 0;
    function highlightActiveStructure(){

        if (!globals.activeStructure.isSet()) return;

        const unpStart = globals.activeStructure.record.getUnpStart();
        const unpEnd = globals.activeStructure.record.getUnpEnd();

        const xScale = getPlugin().xScale;
        const letterWidth = xScale(2) - xScale(1);
        const left = xScale(unpStart) - letterWidth/2;
        const width = xScale(unpEnd) - left + letterWidth/2;

        // if (lastLetterWidth === letterWidth && left === lastLeft && width === lastWidth) return;
        lastLetterWidth = letterWidth;
        lastLeft = left;
        lastWidth = width;

        const div = globals.container.find('.pv3d-pv-structure-bar');
        div.css('display', 'block');
        div.css('left', (/*offset + */left) + 'px');
        div.css('width', width + 'px');
    }

    function getHighlightBar() {
        return globals.container.find('.pv3d-pv-highlight-bar');
    }

    function highlightActivePosition(resNum){

        const xScale = getPlugin().xScale;
        const unpNum = globals.activeStructure.record.mapPosPdbToUnp(resNum);
        const posStart = xScale(unpNum);
        const width = xScale(unpNum+1) - posStart;

        const div = getHighlightBar();
        div.css('display', 'block');
        div.css('left', (/*offset + */posStart - width / 2) + 'px');
        div.css('width', width + 'px');
    }

    function dehighlightActivePosition(){
        getHighlightBar().css('display', 'none');
    }

    function getVariantsLinksSelectors(){
        return '.variation-y.axis.left text, .variation-y.axis.right text';
    }

    function featureSelectedCallback(){
        globals.pv.registerCallback("featureSelected", function(f) {

            if (f.feature.category === globals.settings.pvMappedStructuresCat.id || f.feature.category === globals.settings.pvMappedStructuresCat.idPredicted){
                const rec = globals.pdbRecords[f.feature.ftId];
                // loadRecord(rec);
                globals.activeStructure.set(rec.getPdbId(), rec.getChainId());
                globals.activeFeature.overlay();
                getPlugin().deselectFeature();
            }
            else {
                let color = f.color;
                //for IE, the color comes from PV as hex, but for Chrome and Mozilla as rbg(a,b,c)
                if (color.indexOf("#") === 0) {
                    color= 'rgb(' + hex2rgb(f.color).join() + ')';
                }
                globals.activeFeature.set([f.feature], [color]);
            }
        });
    }

    function featureDeselectedCallback() {
        globals.pv.registerCallback("featureDeselected", function(f) {
            globals.activeFeature.unset();
        });
    }

    function removeClass(elements, className) {
        elements.attr('class', elements.attr('class').replace(' ' + className, ''));
    }

    function deselectAllOverlayIcons(){
        removeClass(globals.pvContainer.find(svgSymbols.svgIconSelector), 'selected')
    }

    function hex2rgb(hex) {
        // while (hex.length < 7) hex += '0';
        //
        // return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            [parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)]
         : null;
    }

    function extractAnnotationData(){
        const data = {};
        const categories = getCategories();
        categories.forEach(cat => {
            if ('features' in cat.categoryViewer ||
                cat.name === globals.settings.pvMappedStructuresCat.id ||
                cat.name === globals.settings.pvMappedStructuresCat.idPredicted) return;
            data[cat.name] = [];

            cat.data.forEach(feature => {
                data[cat.name].push({
                    type: feature.type,
                    begin: feature.begin,
                    end: feature.end
                })
            })
        });

        return data;
    }

    function overlayCallbacks() {
        /**
         * /For each added SVG icon with arrow add overlay functionality
         */
        globals.pvContainer.find(svgSymbols.svgIconSelector).each((ix, val) => {

            /**
             * For a track defined by its SVG container, retrieve its data and and color
             * @param svg SVG container keeping the track data.
             * @returns {{trackData: *, trackColors}}
             */
            function getTrack(svg){
                const trackContainer = svg.closest('div').find('.up_pftv_track');
                const trackData = globals.pv.getTrackData(trackContainer);
                const color = trackContainer.find(".up_pftv_feature").css('stroke');
                const trackColors = trackData.map(() =>  {return color;});
                return {
                    trackData: trackData,
                    trackColors: trackColors
                }
            }

            /**
             * /For each added SVG icon with arrow add overlay functionality
             */
            const el = $(val); //arrow icon corresponding to either category or track
            el.off().on('click', (e) => {
                if (!globals.lm.moleculeLoaded()) return;

                let target = $(e.target); //clicked element
                if (!target.is('svg')) target = target.closest('svg');
                if (target.attr('class').indexOf('selected') === -1){
                    const tracks = {trackData: [], trackColors: []};
                    if (target.closest('.up_pftv_category-tracks').length > 0) { //track icon was clicked
                        const track = getTrack(target);
                        tracks.trackData = tracks.trackData.concat(track.trackData);
                        tracks.trackColors = tracks.trackColors.concat(track.trackColors)
                    } else { //category icon was clicked
                        const closestCat = target.closest('.up_pftv_category');
                        if (closestCat.parent().hasClass(globals.settings.pvVariationCat.clazz)) {
                            //if variation category was clicked we need to retrieve the histogram and overlay it
                            //each residue will be converted to a feature with a color based on the histogram value
                            const category = getVariationCategory(closestCat.parent());
                            tracks.trackData = category.catData;
                            tracks.trackColors = category.catColors;
                        } else {
                            //if non-variation category was clicked thus we need to retrieve data from all tracks in that category
                            closestCat.find('.up_pftv_category-tracks ' + svgSymbols.svgIconSelector).each((ix, svg) => {
                                const track = getTrack($(svg));
                                tracks.trackData = tracks.trackData.concat(track.trackData);
                                tracks.trackColors = tracks.trackColors.concat(track.trackColors);
                            });
                        }
                    }

                    globals.activeFeature.unset();
                    globals.activeFeature.set(tracks.trackData, tracks.trackColors);
                    target.attr('class', target.attr('class') + ' selected');
                } else {
                    globals.activeFeature.unset();
                    // p3.lm.unmapFeature();
                    removeClass(target, 'selected');
                }
            })
        });


        globals.pvContainer.find(getVariantsLinksSelectors()).each((ix, val) => {

            const el = $(val); //clicked AA letter
            el.off().on('click', (e) => {

                // get the variant category
                const categories = getCategories();
                const variantFeatures = categories.filter(cat => "features" in cat.categoryViewer)[0].categoryViewer.features;

                let variant = $(e.target).parent().attr('class').match(/up_pftv_aa_([^ ]*)/)[1];
                if (variant === 'd') variant = 'del';
                if (variant === 'loss') variant = '*';
                const trackData = [];
                const trackColors = [];
                // go over all positions and check at which position this variant is present
                // and find color for that variant in the variant chart
                variantFeatures.forEach(f => {
                    f.variants.forEach(v => {
                        if (v.alternativeSequence === variant) {
                            const color = globals.container.find('.up_pftv_variant[name="' + v.internalId + '"]').attr('fill');
                            trackData.push(v);
                            trackColors.push('(' + hex2rgb(color).join(',') + ')');
                        }
                    })
                });
                trackColors.length > 0 ? globals.activeFeature.set(trackData, trackColors) : globals.activeFeature.unset();
            })
        });
    }

    function getCategories() {
        return plugin.categories;
    }

    function handleMouseMoveEvents() {
        globals.container.find('.up_pftv_category-viewer svg, .up_pftv_track svg, .up_pftv_aaviewer svg')
            .off()
            .on('mousemove', (e) =>{
                const resNum = Math.round(globals.pv.getPlugin().xScale.invert(e.offsetX));
                globals.lm.highlightResidue(resNum);
            })
            .on('mouseout', (e) =>{
                globals.lm.dehighlightAll();
            });
        globals.container.find('.up_pftv_category-container')
            .off()
            .on('wheel mousemove', e => {
                if (e.type === 'wheel' || (e.type === 'mousemove' && e.which === 1)) globals.pv.highlightActiveStructure();
            });

        if (settings.highlightByHovering) {

            globals.container.find('path.up_pftv_feature').off().hover(
                function (e) {
                    const featureEl = e.target;
                    const featureId = featureEl.getAttribute('name');

                    if (featureId.indexOf(globals.settings.pvMappedStructuresCat.id) == 0 || featureId.indexOf(globals.settings.pvMappedStructuresCat.idPredicted) == 0)
                        return;

                    const featureCategoryEl = featureEl.closest('div.up_pftv_category');
                    const featureCategoryName = $(featureCategoryEl).parent().attr('class').replace('up_pftv_category_', '');
                    const featureCategory = getCategories().filter(c => c.name === featureCategoryName)[0];

                    const featureData = featureCategory.data.filter(d=>d.internalId === featureId)[0];
                    const featureColor = $(featureEl).css('stroke');

                    let activeFeatures = globals.activeFeature.features;
                    if (activeFeatures === undefined) activeFeatures = []
                    let activeColors = globals.activeFeature.colors;
                    if (activeColors === undefined) activeColors = []


                    globals.lm.mapFeatures(activeFeatures.concat([featureData]), activeColors.concat([featureColor]));


                    console.log('in', featureId, featureData)

                },
                function(e) {
                    globals.activeFeature.overlay();
                    console.log('out', e.target.getAttribute('name'))
                });
        }
    }

    let callBacksRegistered = false;
    function registerCallbacksAndEvents(){

        featureSelectedCallback();
        featureDeselectedCallback();
        overlayCallbacks();
        handleMouseMoveEvents();
    }

    function getPlugin() {
        return plugin;
    }

    return  {
        initialize: initialize
        ,registerCallback: registerCallback
        ,getPlugin: getPlugin
        ,getTrackData: getTrackData
        ,modifyHtmlStructure: modifyHtmlStructure
        ,createOverlaySymbolsAndLinks: createOverlaySymbolsAndLinks
        // ,getVariantsLinksSelectors: getVariantsLinksSelectors
        ,highlightActiveStructure: highlightActiveStructure
        ,highlightActivePosition: highlightActivePosition
        ,dehighlightActivePosition: dehighlightActivePosition
        ,registerCallbacksAndEvents: registerCallbacksAndEvents
        ,deselectAllOverlayIcons: deselectAllOverlayIcons
        ,resized: resized
        ,extractAnnotationData: extractAnnotationData
        ,setCategoriesTooltips: setCategoriesTooltips

        //Exposed for testing purposes
        ,getHeaderLinkContainer: getHeaderLinkContainer
    }

};

module.exports = PvController;
