const blender = require('color-blend');
let LiteMol = require('litemol').default;
const globalSettings = require('./settings');
const {globals} = require("browserify-css/config/jshint");
//const services = require('./services');

window.LiteMol = LiteMol

const STRUCTURE_FOMAT = require('./pdb.mapping.js').STRUCTURE_FORMAT;

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
            ,confidenceInfix: 'confidence'
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

        const loadMolecule = function (pdbId, source, dataFormat, url, tempFactorThrashold) {
            controllerAvailability();

            const modelId = getModelId(pdbId);
            const visualId = getVisualId(modelId);
            if (selectNodes(modelId).length > 0) return Promise.resolve(modelId);

            let format;
            if (dataFormat === STRUCTURE_FOMAT.mmCIF) {
                format = LiteMol.Core.Formats.Molecule.SupportedFormats.mmCIF;
            } else if (dataFormat === STRUCTURE_FOMAT.PDB) {
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
                })

            return controller.applyTransform(action)               
                .then( () => {
                    const visual = selectNodes(visualId);
                    if (visual.length === 0) throw Error('Litemol could not access or process the structure file <br/> (' + url + ')');

                    defaultlVisuals[visualId] = Object.assign({}, visual[0].props.model.theme, {isSticky: true});
                    // let visual = selectNodes(visualId)[0];
                    return Promise.resolve(modelId);
                    // Command.Visual.UpdateBasicTheme.dispatch(controller.context, {visual: visual, theme: visual.props.style.theme});
                    // Command.Visual.UpdateBasicTheme.dispatch(`controller`.context, {visual: visual, theme: createMainTheme()});
                })
        };

        const createSubSelectionForAFCofidence = function(selectionId, tempFactorThrashold) {
            const sel = controller.selectEntities(selectionId)[0];
            const model = controller.selectEntities(Bootstrap.Tree.Selection.byRef(selectionId).ancestorOfType(Bootstrap.Entity.Molecule.Model))[0];
            const resIxs = [...new Set(model.props.model.data.atoms.residueIndex.filter((resIx, ix) => model.props.model.data.atoms.tempFactor[ix] > tempFactorThrashold))]
            const  query = Query.residuesFromIndices(resIxs);
            const confidenceSelectionID = `${selectionId}-${settings.confidenceInfix}`;

            let action = Bootstrap.Tree.Transform.build()
                .add(sel, Transformer.Molecule.CreateSelectionFromQuery, {query: query, name: `Confident`}, {ref: confidenceSelectionID, isBinding: false})
            return controller.applyTransform(action);
        }

        const createVisualsForAFConfidence = function(modelId, surfaceVisualId, tempFactorThrashold) {
            
            const model = controller.selectEntities(modelId)[0];
            const resIxs = [...new Set(model.props.model.data.atoms.residueIndex.filter((resIx, ix) => model.props.model.data.atoms.tempFactor[ix] > tempFactorThrashold))]
            const  query = Query.residuesFromIndices(resIxs);
            
            const confidenceSelectionID = `${settings.selectionPrefix}${settings.confidenceInfix}-${modelId}`;
            const confidenceVisualID = `${settings.visualPrefix}${settings.confidenceInfix}-${modelId}`;
            const confidenceSelectionSurfID = `${confidenceSelectionID}-surf`;
            const confidenceVisualSurfID = `${confidenceVisualID}-surf`;                        

            let action = Bootstrap.Tree.Transform.build()
                .add(model, Transformer.Molecule.CreateSelectionFromQuery, {query: query, name: `Confident`}, {ref: confidenceSelectionID, isBinding: false})
                .then(Transformer.Molecule.CreateVisual, {style: Bootstrap.Visualization.Molecule.Default.ForType.get('Cartoons')}, {ref: confidenceVisualID})                            
            return controller.applyTransform(action)                
                .then(()=> {                    
                    const surfaceParent = controller.selectEntities(surfaceVisualId)[0].parent;
                    
                    let action = Bootstrap.Tree.Transform.build()
                        .add(surfaceParent, Transformer.Molecule.CreateSelectionFromQuery, {query: query, name: `Confident surface`}, {ref: confidenceSelectionSurfID, isBinding: false})
                        .then(Transformer.Molecule.CreateVisual, {style: getDefaultSurfaceVis()}, {ref: confidenceVisualSurfID})
                    return controller.applyTransform(action)
                })  
                .then(() => {
                    let visual = selectNodes(confidenceVisualID)[0];
                    defaultlVisuals[confidenceVisualID] = Object.assign({}, visual.props.model.theme, {isSticky: true});
                    visual = selectNodes(confidenceVisualSurfID)[0];
                    defaultlVisuals[confidenceVisualSurfID] = Object.assign({}, visual.props.model.theme, {isSticky: true});

                    hideEntity(confidenceVisualID);
                    hideEntity(confidenceVisualSurfID);
                })
        }

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

        const setAFConfidenceVisibility = function(modelId, showConfident){

            const model = controller.selectEntities(modelId)[0];            
            let confidentEntityIds = controller.selectEntities(Bootstrap.Tree.Selection.subtree(model).ofType(Bootstrap.Entity.Molecule.Visual)).filter(e => e.ref.indexOf(`${settings.confidenceInfix}`) >= 0);
            let allEntityIds = [model.children[0].ref, model.children[1].children[0].children[0]]; //the first selection is the default one + first visual of first selection of first group (= second child) TODO: rewrite, to have user selection id
            
            controller.selectEntities(Bootstrap.Tree.Selection.subtree(model).ofType(Bootstrap.Entity.Group))

            
            // viss.forEach(vis => {
            //     if (vis.ref.startsWith(`${settings.visualPrefix}confidence`)) {
            //         confidentEntityIds.push(vis.ref);
            //     }
            // })
            if (showConfident) {
                allEntityIds.forEach(id => hideEntity(id));
                confidentEntityIds.forEach(id => showEntity(id));
                
            } else {
                confidentEntityIds.forEach(id => hideEntity(id));
                allEntityIds.forEach(id => showEntity(id));
            };
        }

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

        const createVisual = function (entityId, params/*, isUserDefined = false*/, createAfConfidenceVisual=false) {
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

            const visualIdConfidence = `${settings.confidenceInfix}-${visualId}`;

            // params = {style: {
            //     type: 'BallsAndSticks',
            //     params: { probeRadius: false, atomRadius: 0.15, bondRadius: 0.07, detail: 'Automatic' },
            //     theme: { template: Visualization.Molecule.Default.UniformThemeTemplate, colors: Visualization.Molecule.Default.UniformThemeTemplate.colors.set('Uniform', { r: 1, g: 0, b: 0 }), transparency: { alpha: 0.75 } }
            // }}

            // {style: {
            //     type: 'Surface',
            //     params: {probeRadius: 0.01, automaticDensity: true, density: 1, smoothing: 10, isWireframe: false},
            //     theme: { template: Visualization.Molecule.Default.SurfaceThemeTemplate, colors: Visualization.Molecule.Default.SurfaceThemeTemplate.colors, transparency: { alpha: 0.35 }}}}

            const root = selectNodes(entityId)[0];
            let confidenceSelection; 
            if (createAfConfidenceVisual) {
                const selections = controller.selectEntities(Bootstrap.Tree.Selection.subtree(root).ofType(Bootstrap.Entity.Molecule.Selection)).filter(s => s.ref !== entityId)
                if (selections.length > 0) {
                    confidenceSelection =  selections[0];
                }
            }

            let action = Bootstrap.Tree.Transform.build()
                .add(root, Transformer.Molecule.CreateVisual, params, {ref: visualId});

            if (createAfConfidenceVisual && confidenceSelection) {
                action.add(confidenceSelection, Transformer.Molecule.CreateVisual, params, {ref: visualIdConfidence});
            }

            return controller.applyTransform(action).then(() => {
                //if (!isUserDefined) {
                    defaultlVisuals[visualId] = Object.assign({}, selectNodes(visualId)[0].props.model.theme, {isSticky: true});
                    if (createAfConfidenceVisual && confidenceSelection) {
                        defaultlVisuals[visualIdConfidence] = Object.assign({}, selectNodes(visualIdConfidence)[0].props.model.theme, {isSticky: true});
                    }
                //}

                return visualId;
            });
        };

        const getEntity = function(entityId){
          return selectNodes(entityId)
        };

        const createSelectionFromList = function(params){

            params.residues = params.sequenceNumbers.map(r => {return {authAsymId: params.chainId, seqNumber: r}}); //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.core.structure.query.residueidschema.html
            return createSelection(params);

        };

        const createSelectionFromRange = function (params) {

            params.residues = [];
            for (let i = params.beginIx; i <= params.endIx; i++) {
                params.residues.push({authAsymId: params.chainId, seqNumber: i}); //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.core.structure.query.residueidschema.html
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

        const hideEntityIfInHiddenModel = function(entityId) {            
            let ent = selectNodes(entityId)[0];
            while (ent.type.id != Bootstrap.Entity.Molecule.Model.id) ent = ent.parent;
            if (ent.state.visibility > 0) hideEntity(entityId);
        }

        const showEntity = function (entityId, showConfident = true) {
            controllerAvailability();

            if (showConfident){
                changeEntityVisibility(entityId, true);
            } else {
                controller.selectEntities(Tree.Selection.subtree().ofType(Bootstrap.Entity.Molecule.Model)).forEach( entity => {
                    if (entity.ref.indexOf(settings.confidenceInfix) < 0) {
                        changeEntityVisibility(entityId, true);
                    }
                })
            }            
        };

        const showSelectionVisual = function(visualId, showConfidentOnly){            
            const selectionNode = selectNodes(visualId)[0].parent;
            const visuals = controller.selectEntities(Tree.Selection.subtree(selectionNode).ofType(Bootstrap.Entity.Molecule.Visual))
            const visualsConfident = visuals.filter(v => v.ref.indexOf(settings.confidenceInfix) >= 0);
            const visualsAll = visuals.filter(v => v.ref.indexOf(settings.confidenceInfix) < 0);
            let showConfident = true, showAll = false;
            if (!showConfidentOnly){
                showConfident = false;
                showAll = true;                
            } 
            visualsConfident.forEach(v => changeEntityVisibility(v.ref, showConfident));
            visualsAll.forEach(v => changeEntityVisibility(v.ref, showAll));
        }

        const hideSelectionVisual = function(visualId){
            hideEntity(selectNodes(visualId)[0].parent);
            //const selectionNode = selectNodes(visualId)[0].parent;
            //controller.selectEntities(Tree.Selection.subtree(selectionNode).ofType(Bootstrap.Entity.Molecule.Visual)).forEach( v => hideEntity(v.ref));
        }

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


        const focusResidue = function (modelId, chainId, resNum, neighborhoodSize) {
            controllerAvailability();

            const model = controller.selectEntities(modelId)[0];
            if (!model) return;
            const query = modSequence('1', {authAsymId: chainId}, {seqNumber: resNum}, {seqNumber: resNum}).ambientResidues(neighborhoodSize);
            Command.Molecule.FocusQuery.dispatch(controller.context, {model: model, query: query});
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

        function colorSelections(modelId, selColors, idRestrictions = []) {
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
                let notRestricted = true;
                for (const id of idRestrictions) {
                    if (visual.ref.search(id) >= 0) {
                        notRestricted = false;
                        break;
                    }
                }
                if (visual.ref.search(settings.visualPrefix) == 0 && notRestricted) { //apply only on macromolecule visuals (not waters or ligands which have automatically geenrated names)
                    if (visual.props.style.type === 'Surface') CustomTheme.applyTheme(controller, visual.ref, themeTransparent);
                    else CustomTheme.applyTheme(controller, visual.ref, theme);

                }

            });
            // CustomTheme.applyTheme(controller, modelId, theme);
        }


        const initializePlugin = function (globals) {
            const idContainer = globals.lmContainerId;
            const activeStructure = globals.activeStructure;
            const labelCallback = globals.opts.labelCallback;            

            const HighlightCustomElements = function (context) {
                context.highlight.addProvider(function (info) {
                    // console.log(info)
                    if (info.kind === 0 /*|| info.source.ref.indexOf(globalSettings.interactiveSelectionPrefix) < 0*/) return null;

                    //the info contains information about the selected atom ID -> we find relevant inforamtion to be passed to the labelCallback
                    const atomIx = info.elements[0];
                    //find parent model
                    let model = info.source;
                    while (model.type.info.shortName != 'M_M') model = model.parent;

                    const atoms = model.props.model.data.atoms;
                    const atomInfo = {
                        authName: atoms.authName[atomIx],
                        elementSymbol: atoms.elementSymbol[atomIx],
                        name: atoms.name[atomIx]
                    }
                    const residueIx = atoms.residueIndex[atomIx];

                    const residues = model.props.model.data.residues;

                    if (residues.isHet[residueIx]) return null;

                    const resInfo = {
                        asymId: residues.asymId[residueIx],
                        authAsymId: residues.authAsymId[residueIx],
                        authName: residues.authName[residueIx],
                        authSeqNumber: residues.authSeqNumber[residueIx],
                        entityId: residues.entityId[residueIx],
                        name: residues.name[residueIx],
                        seqNumber: residues.seqNumber[residueIx]
                    }
                    //this will be enriched by uniprot seq number as that might not be the same as seqNumber
                    // when there are missing regions in uniprot relative to structure
                    // Example is 6i53 where first position in chain A (asymID: B) is 45 (seqNumber), but it is
                    // at position 37 in UniProt as there are 8 residues missing (28-35 in PDB sequence) before
                    // the first observed position
                    // Additionally, we need to use residueIx and not seqNumber as the input to mapPosStructToUnp as
                    // the seqNumber can be higher then residueIx (e.g. in case of 2I4I, the PDB sequence starts actually two residues before the start of O00571)
                    //resInfo.unpSeqNumber = activeStructure.record.mapPosStructToUnp(resInfo.seqNumber);
                    //TODO not sure how this should be correctly computed as in cases of 2I4I we would like to use residueIx but in case of 5E7I:A we would likte to use seqNumber
                    resInfo.unpSeqNumber = resInfo.authSeqNumber;

                    const unpPos = activeStructure.record.mapPosPdbToUnp(resInfo.seqNumber);

                    return labelCallback({atomInfo: atomInfo, resInfo: resInfo, unpPos: unpPos});
                })

                // model = plugin.context.select('mod6i53')[0]
                // res = q(model.props.model.queryContext)
                // res[0].fragments[0].residueIndices[0]

            }

            if (!controller) {
                const specs = LiteMol.Plugin.getDefaultSpecification();
                if (labelCallback) specs.behaviours.push(HighlightCustomElements);
                controller = LiteMol.Plugin.create({
                    target: '#' + idContainer,
                    viewportBackground: '#ffffff',
                    layoutState: {
                        collapsedControlsLayout: LiteMol.Bootstrap.Components.CollapsedControlsLayout.Landscape,
                        hideControls: true,
                        isExpanded: false
                    },
                    allowAnalytics: false,
                    customSpecification: specs
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

            if (model.length === 0) return undefined;

            let query = Query.residues({authAsymId: chainId, seqNumber: resNum});
            let res = Query.apply(query, model[0].props.model);
            let frag = res.unionFragment();

            if (frag.residueIndices.length === 0) return undefined;

            return model[0].props.model.data.residues.authSeqNumber[frag.residueIndices[0]]

        }

        function getAuthSeqNumberRange(modelId, chainId, resNumBegin, resNumEnd){
            let model = selectNodes(modelId);

            if (model.length === 0) return [];

            const residues = [];
            let query = undefined;
            for (let i = resNumBegin; i <= resNumEnd; i++) {
                const r = {authAsymId: chainId, seqNumber: i};
                if (!query) {
                    query = Query.residues(r);
                } else {
                    query = Query.or(query, Query.residues(r))
                }
            }
            // let query = Query.residues([residues[0]);
            let res = Query.apply(query, model[0].props.model);
            let frag = res.unionFragment();

            if (frag.residueIndices.length === 0) return [];

            let authSeqNumbers = frag.residueIndices.map(ri => model[0].props.model.data.residues.authSeqNumber[ri]);
            return authSeqNumbers;

            // return model[0].props.model.data.residues.authSeqNumber[frag.residueIndices[0]]

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
            , focusResidue: focusResidue
            , dehighlightAll: dehighlightAll
            , createSelectionFromRange: createSelectionFromRange
            , createSelectionFromList: createSelectionFromList
            , colorSelections: colorSelections
            , focusSelection: focusSelection
            , hideModelsExcept: hideModelsExcept
            , hideEntity: hideEntity
            , hideEntityIfInHiddenModel: hideEntityIfInHiddenModel
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
            , getAuthSeqNumberRange: getAuthSeqNumberRange
            , createVisualsForAFConfidence: createVisualsForAFConfidence
            , setAFConfidenceVisibility: setAFConfidenceVisibility
            , createSubSelectionForAFCofidence: createSubSelectionForAFCofidence
            , showSelectionVisual: showSelectionVisual
            , hideSelectionVisual: hideSelectionVisual
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

//for debugging purposes
// window.LiteMol = LiteMol


module.exports = createPlugin;
