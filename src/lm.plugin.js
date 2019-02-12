const blender = require('color-blend');
let LiteMol = require('litemol').default;

const getUniqueId = (function() {
    let uniqueId = 0;

    return function () {
        uniqueId++;
        return uniqueId;
    }
})();

const CustomTheme = (function(){
    const Core = LiteMol.Core;
    const Visualization = LiteMol.Visualization;
    const Bootstrap = LiteMol.Bootstrap;
    const Q = Core.Structure.Query;
    const ColorMapper = (function () {
        function ColorMapper() {
            this.uniqueColors = [];
            this.map = Core.Utils.FastMap.create();
        }
        Object.defineProperty(ColorMapper.prototype, "colorMap", {
            get: function () {
                const map = Core.Utils.FastMap.create();
                this.uniqueColors.forEach(function (c, i) { return map.set(i, c); });
                return map;
            },
            enumerable: true,
            configurable: true
        });
        ColorMapper.prototype.addColor = function (color) {
            const id = color.r + "-" + color.g + "-" + color.b;
            if (this.map.has(id))
                return this.map.get(id);
            const index = this.uniqueColors.length;
            this.uniqueColors.push(Visualization.Color.fromRgb(color.r, color.g, color.b));
            this.map.set(id, index);
            return index;
        };
        return ColorMapper;
    }());

    const mergeRgb = function(c1, c2, p) {
        if (p === undefined) p = 0.2;

        c1.a = 1;
        c2.a = 1;

        return blender.darken(c1, c2);
    };

    const createTheme = function(model, colorDef) {
        const mapper = new ColorMapper();
        mapper.addColor(colorDef.base);
        const map = new Uint8Array(model.data.atoms.count);
        for (let _i = 0, _a = colorDef.entries; _i < _a.length; _i++) {
            const e = _a[_i];
            let query;
            if ('query' in e ){
                query = e.query.compile();
            } else if (e.boundaryOnly) {
                query = Q.or(
                    modSequence(e.entity_id.toString(), { authAsymId: e.struct_asym_id }, { seqNumber: e.start_residue_number }, { seqNumber: e.start_residue_number}),
                    modSequence(e.entity_id.toString(), { authAsymId: e.struct_asym_id }, { seqNumber: e.end_residue_number }, { seqNumber: e.end_residue_number})
                ).compile()
            } else {
                query = modSequence(e.entity_id.toString(), { authAsymId: e.struct_asym_id }, { seqNumber: e.start_residue_number }, { seqNumber: e.end_residue_number }).compile();
                // Q.sequence(e.entity_id.toString(), e.struct_asym_id, { seqNumber: e.start_residue_number }, { seqNumber: e.end_residue_number }).compile();
            }

            const defaultColorIndex = mapper.addColor(e.color);
            for (let _b = 0, _c = query(model.queryContext).fragments; _b < _c.length; _b++) {
                const f = _c[_b];
                for (let _d = 0, _e = f.atomIndices; _d < _e.length; _d++) {
                    const a = _e[_d];
                    let colorIndex = defaultColorIndex;
                    if (map[a] != 0) {
                        const existingColor = mapper.uniqueColors[map[a]];
                        const existingColor255 = {
                            r: 255 * existingColor.r,
                            g: 255 * existingColor.g,
                            b: 255 * existingColor.b
                        };
                        colorIndex = mapper.addColor(mergeRgb(existingColor255, e.color));
                    }
                    map[a] = colorIndex;
                }
            }
        }
        const fallbackColor = { r: 0.6, g: 0.6, b: 0.6 };
        const selectionColor = { r: 0, g: 0, b: 1 };
        const highlightColor = { r: 1, g: 1, b: 0 };
        const colors = Core.Utils.FastMap.create();
        colors.set('Uniform', fallbackColor);
        colors.set('Selection', selectionColor);
        colors.set('Highlight', highlightColor);
        const mapping = Visualization.Theme.createColorMapMapping(function (i) { return map[i]; }, mapper.colorMap, fallbackColor);
        // make the theme "sticky" so that it persist "ResetScene" command.
        return Visualization.Theme.createMapping(mapping, { colors: colors, isSticky: true});
    };

    const applyTheme = function(plugin, modelRef, theme) {
        const visuals = plugin.selectEntities(Bootstrap.Tree.Selection.byRef(modelRef).subtree().ofType(Bootstrap.Entity.Molecule.Visual));
        for (let _i = 0, visuals_2 = visuals; _i < visuals_2.length; _i++) {
            const v = visuals_2[_i];
            plugin.command(Bootstrap.Command.Visual.UpdateBasicTheme, { visual: v, theme: theme });
        }
    };

    return {
        createTheme: createTheme,
        applyTheme: applyTheme
    }
})();

function createPlugin() {
    return (function (LiteMol) {

        const settings = {
            surfaceTransparencyAlpha: 0.3
            ,modelPrefix: 'mod'
            ,selectionPrefix: 'sel'
            ,visualPrefix: 'vis'
            ,groupPrefix: 'gr'
        };

        let controller;

        const defaultlVisuals = {};

        var Plugin = LiteMol.Plugin;
        var Views = Plugin.Views;
        var Bootstrap = LiteMol.Bootstrap;
        // everything same as before, only the namespace changed.
        var Query = LiteMol.Core.Structure.Query;
        var AQ = Query.Algebraic;
        // You can look at what transforms are available in Bootstrap/Entity/Transformer
        // They are well described there and params are given as interfaces.
        var Transformer = Bootstrap.Entity.Transformer;
        var Tree = Bootstrap.Tree;
        var Transform = Tree.Transform;
        var LayoutRegion = Bootstrap.Components.LayoutRegion;
        var CoreVis = LiteMol.Visualization;
        var Visualization = Bootstrap.Visualization;
        // all commands and events can be found in Bootstrap/Event folder.
        // easy to follow the types and parameters in VSCode.
        // you can subsribe to any command or event using <Event/Command>.getStream(plugin.context).subscribe(e => ....)
        var Command = Bootstrap.Command;
        var Event = Bootstrap.Event;
        var highlightCallbacks = [];

        function controllerAvailability(){
            if (!controller.instance) throw new ReferenceError("LiteMol plugin controller not available.");
        }

        function selectNodes(what) {
            controllerAvailability();
            return controller.context.select(what);
        }

        const loadMolecule = function (pdbId, source, url) {
            controllerAvailability();

            const modelId = getModelId(pdbId);
            const visualId = getVisualId(modelId);
            if (selectNodes(modelId).length > 0) return Promise.resolve(modelId);

            let format;
            if (source === 'PDB') {
                format = LiteMol.Core.Formats.Molecule.SupportedFormats.mmCIF;
            } else if (source === 'SMR') {
                format = LiteMol.Core.Formats.Molecule.SupportedFormats.PDB;
            } else {
                throw Error('Unsuported format of the structure file');
            }

            const action = Transform.build()
                .add(controller.context.tree.root, Transformer.Data.Download, { url: url, type: 'String', id: pdbId})
                .then(Transformer.Molecule.CreateFromData, { format: format, customId: pdbId }, { isBinding: true})
                .then(Transformer.Molecule.CreateModel, { modelIndex: 0 }, { isBinding: false, ref: modelId })
                .then(Transformer.Molecule.CreateMacromoleculeVisual, {
                    polymer: true,
                    polymerRef: visualId,
                    het: true,
                    water: true
                });

            return controller.applyTransform(action).then(function () {

                const visual = selectNodes(visualId);
                if (visual.length === 0) throw Error('Accessing PDB failed <br/> (' + url + ')');

                defaultlVisuals[visualId] = Object.assign({}, visual[0].props.model.theme, {isSticky: true});
                // let visual = selectNodes(visualId)[0];
                return Promise.resolve(modelId);
                // Command.Visual.UpdateBasicTheme.dispatch(controller.context, {visual: visual, theme: visual.props.style.theme});
                // Command.Visual.UpdateBasicTheme.dispatch(controller.context, {visual: visual, theme: createMainTheme()});
            })
        };

        const resetVisuals = function (idRestriction="") {
            controllerAvailability();

            for (const visualId in defaultlVisuals) {
                const visual = selectNodes(visualId)[0];
                if (visual.ref.search(idRestriction) >= 0) continue;
                const theme = defaultlVisuals[visualId];
                if (visual.props.style.type == 'Surface') theme.transparency.alpha = settings.surfaceTransparencyAlpha;
                controller.command(Bootstrap.Command.Visual.UpdateBasicTheme, {visual: visual, theme: theme});
            }
        };

        const hideModelsExcept = function (modelIdsToShow) {
            controllerAvailability();

            let promises = [];
            controller.selectEntities(Bootstrap.Tree.Selection.subtree().ofType(Bootstrap.Entity.Molecule.Model)).forEach(
                function (model) {
                    promises.push(Bootstrap.Command.Entity.SetVisibility.dispatch(controller.context, {
                        entity: model,
                        visible: modelIdsToShow.indexOf(model.ref) >= 0
                    }));
                }
            );
            return Promise.all(promises);
        };

        const focusSelection = function (selectionId) {
            controllerAvailability();

            Command.Entity.Focus.dispatch(controller.context, selectNodes(selectionId));
        };

        const getDefaultSurfaceVis = function () {
            controllerAvailability();

            const surfaceVis = Visualization.Molecule.Default.ForType.get('Surface');
            surfaceVis.theme.transparency.alpha = settings.surfaceTransparencyAlpha;
            surfaceVis.theme.colors = surfaceVis.theme.colors.set('Uniform', {r: 0.75, g: 0.75, b: 0.75});

            return surfaceVis;
        };

        const getStyleDefinition = function(type, params, color, alpha){
            return {
                type: type,
                params: params,
                theme: { template: Visualization.Molecule.Default.UniformThemeTemplate,
                    colors: Visualization.Molecule.Default.UniformThemeTemplate.colors.set('Uniform', color ),
                    transparency: { alpha: alpha }
                }
            };
        };

        const createVisual = function (entityId, params) {
            controllerAvailability();

            //check whether the entity over which the visual is to be applied exists
            if (selectNodes(entityId).length == 0) {
                console.warn(`Trying to create visual for non-existing entity ${entityId}`);
                return Promise.resolve(undefined);
            }

            const surfaceVis = getDefaultSurfaceVis();

            if (params === undefined) params = {style: surfaceVis};

            // params = {style: {
            //     type: 'Cartoons',
            //     params: LiteMol.Bootstrap.Visualization.Molecule.Default.ForType.get('Cartoons').params,
            //     theme: { template: Visualization.Molecule.Default.UniformThemeTemplate, colors: Visualization.Molecule.Default.UniformThemeTemplate.colors.set('Uniform', { r: 0, g: 0, b: 0 }), transparency: { alpha: 1 } }
            // }}

            // params = {style: LiteMol.Bootstrap.Visualization.Molecule.Default.ForType.get('Cartoons')};
            // console.log(params);
            // var colors = LiteMol.Core.Utils.FastMap.create();
            // colors.set('Bond',  {r:1, g:0, b:0});
            // colors.set('Selection',  {r:1, g:0, b:0});
            // colors.set('Highlight',  {r:1, g:0, b:0});
            // params.style.theme.colors = colors;


            const visualId = getVisualId(entityId);

            if (selectNodes(visualId).length > 0) return Promise.resolve(visualId);

            // params = {style: {
            //     type: 'BallsAndSticks',
            //     params: { probeRadius: false, atomRadius: 0.15, bondRadius: 0.07, detail: 'Automatic' },
            //     theme: { template: Visualization.Molecule.Default.UniformThemeTemplate, colors: Visualization.Molecule.Default.UniformThemeTemplate.colors.set('Uniform', { r: 1, g: 0, b: 0 }), transparency: { alpha: 0.75 } }
            // }}

            // {style: {
            //     type: 'Surface',
            //     params: {probeRadius: 0.01, automaticDensity: true, density: 1, smoothing: 10, isWireframe: false},
            //     theme: { template: Visualization.Molecule.Default.SurfaceThemeTemplate, colors: Visualization.Molecule.Default.SurfaceThemeTemplate.colors, transparency: { alpha: 0.35 }}}}


            let action = Bootstrap.Tree.Transform.build()
                .add(selectNodes(entityId)[0], Transformer.Molecule.CreateVisual, params, {ref: visualId});

            return controller.applyTransform(action).then(() => {
                defaultlVisuals[visualId] = Object.assign({}, selectNodes(visualId)[0].props.model.theme, {isSticky: true});
                return Promise.resolve(visualId);
            });
        };

        const getEntity = function(entityId){
          return selectNodes(entityId)
        };

        const createSelectionFromList = function(params){

            params.residues = params.sequenceNumbers.map(r => {return {authAsymId: params.chainId, seqNumber: r}}); //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/int`erfaces/litemol.core.structure.query.residueidschema.html
            return createSelection(params);

        };

        const createSelectionFromRange = function (params) {

            params.residues = [];
            for (let i = params.beginIx; i <= params.endIx; i++) {
                params.residues.push({authAsymId: params.chainId, seqNumber: i}); //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/int`erfaces/litemol.core.structure.query.residueidschema.html
            }
            return createSelection(params);
        };

        const createSelection = function (params) {

            const entityId = params.rootId,
                name = params.name,
                chainId = params.chainId,
                residues = params.residues,
                atomNames = params.atomNames;

            if (residues.length === 0) return Promise.resolve(undefined);

            controllerAvailability();

            const entity = selectNodes(entityId)[0];
            if (!entity) return Promise.reject("Non-existing entity");

            const resConcat = residues.map(r=> `${r.authAsymId}${r.seqNumber}`).join("");

            let selectionId = params.selectionId !== undefined ?  params.selectionId : getSelectionId(entityId, chainId, resConcat);
            if (selectNodes(selectionId).length > 0) {
                return Promise.resolve(selectionId);
            }

            // console.log(Query.residues);
            let query = Query.residues.apply(null, residues);
            // console.log(query);
            // var query = Query.sequence(entityId, chainId, { seqNumber: startResidueNumber }, { seqNumber: endResidueNumber });

            if (atomNames && atomNames.length > 0){
                let aqPredicate = AQ.equal(AQ.atomName, AQ.value(atomNames[0]));
                for (let i = 1; i < atomNames.length; i++){
                    aqPredicate = AQ.or(aqPredicate, AQ.equal(AQ.atomName, AQ.value(atomNames[i])));
                }
                query = query.intersectWith(AQ.query(aqPredicate));
            }

            let action = Bootstrap.Tree.Transform.build()
                .add(entity, Transformer.Molecule.CreateSelectionFromQuery, {
                    query: query,
                    name: name
                }, {ref: selectionId, isBinding: false});

            return controller.applyTransform(action).then(() => Promise.resolve(selectionId));
        };

        const changeEntityVisibility = function (entityId, visible) {
            controllerAvailability();

            const entity = controller.context.select(entityId)[0];
            Bootstrap.Command.Entity.SetVisibility.dispatch(controller.context, {entity: entity, visible: visible});

        };

        const hideEntity = function (entityId) {
            controllerAvailability();

            changeEntityVisibility(entityId, false);
        };

        const showEntity = function (entityId) {
            controllerAvailability();

            changeEntityVisibility(entityId, true);
        };

        const toggleEntity = function (entitiyId, on) {
            controllerAvailability();

            const entity = selectNodes(entitiyId)[0];
            if ((entity.state.isCollapsed && on === false) || (!entity.state.isCollapsed && on === true)) return;
            controller.command(LiteMol.Bootstrap.Command.Entity.ToggleExpanded, entity);
        };

        const createGroup = function (groupName, groupDesc, entityId) {
            controllerAvailability();

            const groupId = getGroupId(groupName, entityId);

            if (selectNodes(groupId).length > 0) return Promise.resolve(groupId);

            const action = Bootstrap.Tree.Transform.build()
                .add(selectNodes(entityId)[0], Transformer.Basic.CreateGroup, {
                    label: groupName,
                    description: groupDesc
                }, {ref: groupId});
            return controller.applyTransform(action).then(function () {
                return Promise.resolve(groupId);
            });
        };

        const removeEntity = function (entityId) {
            controllerAvailability();

            const entity = selectNodes(entityId);
            if (entity.length > 0) controller.command(LiteMol.Bootstrap.Command.Tree.RemoveNode, entity[0]);
        };

        function dehighlightAll() {
            controllerAvailability();

            controller.selectEntities(Tree.Selection.subtree().ofType(Bootstrap.Entity.Molecule.Model)).forEach(
                function (model) {
                    Command.Molecule.Highlight.dispatch(controller.context, {
                        model: model,
                        query: LiteMol.Core.Structure.Query.everything(),
                        isOn: false
                    });
                });
        }

        const highlightResidue = function (modelId, chainId, resNum) {
            controllerAvailability();

            const model = controller.selectEntities(modelId)[0];
            if (!model) return;
            const query = modSequence('1', {authAsymId: chainId}, {seqNumber: resNum}, {seqNumber: resNum});
            // const query = Query.sequence('1', { authAsymId: chainId } , { seqNumber: resNum }, { seqNumber: resNum });
            Command.Molecule.Highlight.dispatch(controller.context, {model: model, query: query, isOn: true});
        };

        const registerHighlightCallback = function (f) {
            highlightCallbacks.push(f);
        };

        function getModelId(id) {
            return settings.modelPrefix + id;
        }

        function getVisualId(id) {
            return settings.visualPrefix + id;
        }

        function getGroupId(entityId, groupName) {
            return settings.groupPrefix + entityId + '-' + groupName;

        }

        function getSelectionId(entityId, chainId, resConcat) {
            return settings.selectionPrefix +
                (entityId ? entityId + "-" : "") +
                (chainId ? chainId + "-" : "") +
                (resConcat ? resConcat + "-" : "");
        }

        function colorSelections(modelId, selColors, idRestriction = "") {
            controllerAvailability();

            if (selColors.length == 0) return;
            const model = controller.selectEntities(modelId)[0];
            if (!model) return;

            const entries = [];

            selColors.forEach(sc => {

                if ('selectionId' in selColors[0]) {
                    const sel = controller.context.select(sc.selectionId);
                    if (sel.length > 0) {
                        entries.push({
                            query: sel[0].transform.params.query,
                            color: {r: sc.color.r, g: sc.color.g, b: sc.color.b}
                        })
                    }
                } else {
                    entries.push({
                        entity_id: '1',
                        struct_asym_id: sc.chainId,
                        start_residue_number: sc.begin,
                        end_residue_number: sc.end,
                        boundaryOnly: sc.boundaryOnly,
                        color: {r: sc.color.r, g: sc.color.g, b: sc.color.b}
                    })
                }

            });
            const coloring = {
                base: {r: 192, g: 192, b: 192},
                entries: entries
            };
            const theme = CustomTheme.createTheme(model.props.model, coloring);
            const themeTransparent = CustomTheme.createTheme(model.props.model, coloring);
            themeTransparent.transparency = {alpha: settings.surfaceTransparencyAlpha};
            // instead of "polymer-visual", "model" or any valid ref can be used: all "child" visuals will be colored.
            const visuals = controller.selectEntities(Bootstrap.Tree.Selection.subtree(model).ofType(Bootstrap.Entity.Molecule.Visual));
            visuals.forEach(visual => {
                if (visual.ref.search(settings.visualPrefix) == 0 && visual.ref.search(idRestriction) < 0) { //apply only on macromolecule visuals (not waters or ligands which have automatically geenrated names)
                    if (visual.props.style.type === 'Surface') CustomTheme.applyTheme(controller, visual.ref, themeTransparent);
                    else CustomTheme.applyTheme(controller, visual.ref, theme);

                }

            });
            // CustomTheme.applyTheme(controller, modelId, theme);
        }

        const initializePlugin = function (idContainer) {
            if (!controller) {
                controller = LiteMol.Plugin.create({
                    target: '#' + idContainer,
                    viewportBackground: '#ffffff',
                    layoutState: {
                        collapsedControlsLayout: LiteMol.Bootstrap.Components.CollapsedControlsLayout.Landscape,
                        hideControls: true,
                        isExpanded: false
                    },
                    allowAnalytics: false
                });
                // window.lmController = controller;

                Event.Molecule.ModelHighlight.getStream(controller.context).subscribe(function (e) {
                    //e.residues[0].authName + e.residues[0].chain.authAsymId + e.residues[0].authSeqNumber
                    highlightCallbacks.forEach(function (f) {
                        f(e);
                    });
                });
            }
        };

        const destroyPlugin = function() {
            controllerAvailability();

            controller.destroy();
        }

        function moleculeLoaded() {
            controllerAvailability();

            return controller.selectEntities(Bootstrap.Tree.Selection.subtree().ofType(Bootstrap.Entity.Molecule.Visual)).length > 0;
        }

        function setSurfaceTransparency(val, idFilter) {
            controllerAvailability();

            settings.surfaceTransparencyAlpha = val;

            const visuals = controller.selectEntities(Bootstrap.Tree.Selection.subtree().ofType(Bootstrap.Entity.Molecule.Visual));
            visuals.forEach(visual => {
                if (visual.props.style.type === 'Surface' && visual.ref.search(idFilter)<0) {
                    const theme = Object.assign({}, visual.props.model.theme, {isSticky: true});
                    theme.transparency = {alpha: settings.surfaceTransparencyAlpha};
                    CustomTheme.applyTheme(controller, visual.ref, theme);
                }
            });

            // defaultlVisuals[visualId] = Object.assign({}, selectNodes(visualId)[0].props.model.theme, {isSticky: true} );
        }

        function getAuthSeqNumber(modelId, chainId, resNum){
            let model = selectNodes(modelId);

            if (model.length == 0) return undefined;

            let query = Query.residues({authAsymId: chainId, seqNumber: resNum})
            let res = LiteMol.Core.Structure.Query.apply(query, model[0].props.model);
            let frag = res.unionFragment();

            if (frag.residueIndices.length == 0) return undefined;

            return model[0].props.model.data.residues.authSeqNumber[frag.residueIndices[0]]

        }

        function getController() {
            return controller;
        }

        function getLiteMol(){
            return LiteMol;
        }

        return {
            initializePlugin: initializePlugin
            , destroyPlugin: destroyPlugin
            , loadMolecule: loadMolecule
            , registerHighlightCallback: registerHighlightCallback
            , highlightResidue: highlightResidue
            , dehighlightAll: dehighlightAll
            , createSelectionFromRange: createSelectionFromRange
            , createSelectionFromList: createSelectionFromList
            , colorSelections: colorSelections
            , focusSelection: focusSelection
            , hideModelsExcept: hideModelsExcept
            , hideEntity: hideEntity
            , showEntity: showEntity
            , toggleEntity: toggleEntity
            , createGroup: createGroup
            , removeEntity: removeEntity
            , createVisual: createVisual
            , resetVisuals: resetVisuals
            , moleculeLoaded: moleculeLoaded
            , setSurfaceTransparency: setSurfaceTransparency
            , selectNodes: selectNodes
            , getController: getController
            , getLiteMol: getLiteMol
            , getEntity: getEntity
            , getStyleDefinition: getStyleDefinition
            , getAuthSeqNumber: getAuthSeqNumber
        }

    })(LiteMol || (LiteMol = {}));
}

//LiteMol's hack to not check entityId in mmCIF, because that is not provided by the SIFTS mapping
const Query = LiteMol.Core.Structure.Query;
function modSequence(entityId, asymId, startId, endId, includeHet) { return Query.Builder.build(function () { return modCompileSequence(entityId, asymId, startId, endId, includeHet); }); }
function modCompileSequence(seqEntityId, seqAsymId, start, end, includeHet) {
    function isAllHet(residues){
        return residues.isHet.reduce((acc, val)=> acc && val, true);
    }

    return function (ctx) {
        var _a = ctx.structure.data, residues = _a.residues, chains = _a.chains, seqNumber = residues.seqNumber,
            atomStartIndex = residues.atomStartIndex, atomEndIndex = residues.atomEndIndex, entityId = chains.entityId,
            count = chains.count, residueStartIndex = chains.residueStartIndex,
            residueEndIndex = chains.residueEndIndex, fragments = new Query.FragmentSeqBuilder(ctx);
        var parent = ctx.structure.parent, sourceChainIndex = chains.sourceChainIndex, isComputed = parent && sourceChainIndex;
        var targetAsymId = typeof seqAsymId === 'string' ? { asymId: seqAsymId } : seqAsymId;
        var optTargetAsymId = new OptimizedId(targetAsymId, isComputed ? parent.data.chains : chains);
        //optAsymId.isSatisfied();
        for (var cI = 0; cI < count; cI++) {
            if (/*entityId[cI] !== seqEntityId
                    ||*/ !optTargetAsymId.isSatisfied(isComputed ? sourceChainIndex[cI] : cI)) {
                continue;
            }
            var i = residueStartIndex[cI], last = residueEndIndex[cI], startIndex = -1, endIndex = -1;
            for (; i < last; i++) {
                if (seqNumber[i] >= start.seqNumber) {
                    startIndex = i;
                    break;
                }
            }
            if (i === last)
                continue;
            for (i = startIndex; i < last; i++) {
                if (seqNumber[i] >= end.seqNumber) {
                    break;
                }
            }
            endIndex = i;
            if (ctx.hasRange(atomStartIndex[startIndex], atomEndIndex[endIndex]) && (!isAllHet(residues) || includeHet)) {
                fragments.add(Query.Fragment.ofIndexRange(ctx, atomStartIndex[startIndex], atomEndIndex[endIndex]));
            }
        }
        return fragments.getSeq();
    };
}
var OptimizedId = (function () {
    function OptimizedId(id, arrays) {
        this.columns = [];
        for (var _i = 0, _a = Object.keys(id); _i < _a.length; _i++) {
            var key = _a[_i];
            if (id[key] !== void 0 && !!arrays[key]) {
                this.columns.push({ value: id[key], array: arrays[key] });
            }
        }
    }
    OptimizedId.prototype.isSatisfied = function (i) {
        for (var _i = 0, _a = this.columns; _i < _a.length; _i++) {
            var c = _a[_i];
            if (c.value !== c.array[i])
                return false;
        }
        return true;
    };
    return OptimizedId;
}());



module.exports = createPlugin;
