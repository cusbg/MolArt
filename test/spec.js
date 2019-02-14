/* eslint-disable max-len,indent */
// const MolArt = require('MolArt');

it('should test the enableTooltips option');
it('should test the highlightByHovering option');
it('should test the highlightByHovering option disregards experimental and predicted structures');
it('predictprotein test');
it('order of categories when predictprotein present');

let lmController;
let pvController;

function initPlugin(done, uniprotId, parameters) {
    if (parameters === undefined) parameters = {};

    const pv3d = new MolArt(Object.assign({}, parameters, {
        uniprotId: uniprotId,
        containerId: 'pv3dContainer'
    }));

    let initialized = false;

    pv3d.on('pvReady', function () {
        if (!initialized) {
            initialized = true; //PV calls onready event every time it loads some of the data sources
            lmController = pv3d.getLmController();
            pvController = pv3d.getPvController();
            setTimeout(function () { // need time to process the loaded data
                done();
            }, 1000);
        }
    });

    // window.pv3d = pv3d;

    return pv3d;
}

function clearPlugin(){
    $('#pv3dContainer').empty();
}

function createMockServer (uniprotId) {
    let server = sinon.fakeServer.create();

    server.autoRespond = true;
    for (let address in mockData[uniprotId]) {
        server.respondWith(address, mockData[uniprotId][address]);
    }

    for (let address in mockFeatures) {
        server.respondWith(address, mockFeatures[address]);
    }

    return server;
}

function getActiveStructurePdbNum(pv3d, num) {
    const rec = pv3d.getGlobals().activeStructure.record;
    return rec.mapPosUnpToPdb(num);
}


describe('Given UniProt ID P37840', function () {

    let uniprotId = 'P37840';

    describe('When Protein API is available', function () {

        describe('When SIFTS API is available', function () {


            let pv3d;
            this.timeout(5000);

            function lmGetModels() {
                const LiteMol = pv3d.getLmController().getPlugin().getLiteMol();
                return pv3d.getLmController().getPlugin().selectNodes(LiteMol.Bootstrap.Tree.Selection.subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Model));
            }

            function lmGetModel(pdbId) {
                const LiteMol = pv3d.getLmController().getPlugin().getLiteMol();
                const lm = pv3d.getLmController().getPlugin().getController();

                const models = lm.selectEntities(LiteMol.Bootstrap.Tree.Selection.subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Model));
                let model;

                for (let i = 0; i < models.length; i++) {
                    if (models[i].ref.toLowerCase().indexOf(pdbId.toLowerCase()) >= 0) {
                        model = models[i];
                        return model;
                    }
                }

                return model;
            }

            function lmGetAtomIndices(pdbId, pdbResNum, chainId) {
                const m = lmGetModel(pdbId);
                const LiteMol = pv3d.getLmController().getPlugin().getLiteMol();
                const frags = LiteMol.Core.Structure.Query.apply(LiteMol.Core.Structure.Query.residuesById(pdbResNum).inside(LiteMol.Core.Structure.Query.chainsById(chainId)), m.props.model).fragments;

                let atomIndices = [];

                for (let i = 0; i < frags.length; i++) {
                    atomIndices = atomIndices.concat(Array.from(frags[i].atomIndices));
                }

                return atomIndices;
            }

            function lmGetVisuals(pdbId) {
                const LiteMol = pv3d.getLmController().getPlugin().getLiteMol();
                if (!pdbId) return pv3d.getLmController().getPlugin().selectNodes(LiteMol.Bootstrap.Tree.Selection.subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual));
                const lm = pv3d.getLmController().getPlugin().getController();
                const m = lmGetModel(pdbId);

                return lm.selectEntities(LiteMol.Bootstrap.Tree.Selection.byRef(m.ref).subtree().ofType(LiteMol.Bootstrap.Entity.Molecule.Visual));
            }

            function lmGetResidueColors(pdbId, chainId, resId) {
                const atomIndices = lmGetAtomIndices(pdbId, resId, chainId);
                const visuals = lmGetVisuals(pdbId);

                const colors = [];

                for (let i = 0; i < visuals.length; i++) {
                    const v = visuals[i];

                    colors[i] = [];
                    for (let j = 0; j < atomIndices.length; j++) {
                        const c = {};

                        v.props.model.theme.setElementColor(atomIndices[j], c);
                        colors[i].push(c);
                    }
                }

                return colors;
            }

            function rgbToString(c) {
                return String(c.r) + String(c.g) + String(c.b);
            }

            function lmGetColors(pdbId, chainId, pdbStart, pdbEnd) {
                const colors = [];

                for (let resId = pdbStart; resId <= pdbEnd; resId++) {
                    const resColors = lmGetResidueColors(pdbId, chainId, resId);

                    for (let ixVisual = 0; ixVisual < 1; ixVisual++) { //consider only the first visual, i.e. the underlying cartoon
                        for (let ixCol = 0; ixCol < resColors[ixVisual].length; ixCol++) {
                            const c = rgbToString(resColors[ixVisual][ixCol]);

                            if (colors.indexOf(c) < 0) colors.push(c);
                        }
                    }
                }

                return colors;
            }

            function headerShouldMatchActiveStructure() {
                headerShouldMatchStructure(pv3d.getGlobals().activeStructure.pdbId, pv3d.getGlobals().activeStructure.chainId);
            }

            function headerShouldMatchStructure(pdbId, chainId) {
                const headerPdbId = lmController.getHeaderPdbId();
                const headerChainId = lmController.getHeaderChainId();

                expect(pdbId === headerPdbId).to.be.true;
                expect(chainId === headerChainId).to.be.true;
            }

            function activeStructureShouldBeHighlighted() {
                expect($('.pv3d-pv-structure-bar').css('display')).to.not.equal('none');
            }

            function pluginConsistency() {
                headerShouldMatchActiveStructure();
                activeStructureShouldBeHighlighted();
            }

            function consistencyTesting() {
                describe('The whole plugin', function () {
                    it('should conform to general consistency constraints', function () {
                        pluginConsistency();
                    });
                });
            }

            let server;

            before((done) => {

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

                const fasta = mockData['P37840']['https://www.uniprot.org/uniprot/P37840.fasta'];

                const customDataSources = [
                    {
                        source: 'RANDOM',
                        useExtension: false,
                        data: initializeTestDataSet(fasta.split("\n").slice(1).join(''), 'MY_CATEGORY1')
                    },
                    {
                        source: 'RANDOM',
                        useExtension: false,
                        data: initializeTestDataSet(fasta.split("\n").slice(1).join(''), 'MY_CATEGORY2')
                    }
                    ,
                    {
                        source: 'RANDOM',
                        useExtension: true,
                        url: 'http://localhost/test/data/externalFeatures_'
                    }
                ];

                server = createMockServer(uniprotId);
                pv3d = initPlugin(done, uniprotId, {customDataSources: customDataSources});

            });

            after(() => {
                server.restore();
            });

            describe('When data is loaded', () => {

                consistencyTesting();

                describe('The header', () => {

                    it('should contain uniprotId ' + uniprotId, () => {
                        expect(pv3d.getPvController().getHeaderLinkContainer().text()).to.contain(uniprotId);
                    });

                    it('should have pdb id set in the list', () => {
                        const pdbId = lmController.getHeaderPdbId();

                        expect(pdbId).to.not.be.null;
                        expect(pdbId).to.not.be.empty;
                    });

                    it('should have pdb chain set in the list', () => {
                        const chainId = lmController.getHeaderChainId();

                        expect(chainId).to.not.be.null;
                        expect(chainId).to.not.be.empty;
                    });

                    it('should have pdb link set to the selected value of the list', () => {
                        expect(lmController.getHeaderLinkContainer().text()).to.have.string(lmController.getHeaderPdbId());
                    });

                    it('should have a working download button');//, ()=>{
                      //expect($('.pv3d-button.pv3d-download').click).to.throw()
                    //})
                });

                describe('ProtVista', () => {

                    it('should have full navruler visible', function () {
                        nr = pv3d.getGlobals().container.find('#up_pftv_svg-navruler');
                        endStop = nr.find('.resize.e');
                        expect(endStop.position().left < (nr.position().left + nr.width())).to.be.true;

                    });

                    it('should have 3 external categories loaded', () => {
                        expect(pv3d.getGlobals().container.find('*[title="MY_CATEGORY1"],*[title="MY_CATEGORY2"],*[title="MY_CATEGORY_EXTERNAL1"]').length).to.equal(3);
                    })
                });

                describe('When a residue in LiteMol is highlighted ProtVista', () => {

                    before(() => {
                        pv3d.getLmController().highlightCallback({data: {residues: [{seqNumber:82}]} });
                    });

                    after(()=>{
                        pv3d.getLmController().highlightCallback({data: {residues: []} })
                    });

                    it('should show a highlight bar', () => {
                        expect(pv3d.getGlobals().container.find('.pv3d-pv-highlight-bar').css('display') == 'block').to.be.true;
                    });
                });

                describe('When a residue in ProtVista is highlighted LiteMol', () => {
                    it('should highlight it as well'); //, function () {

                    //e = new Event('click'); e.offsetX = 600; $('path[name="MOLECULE_PROCESSING_0"]')[0].dispatchEvent(e);
                    // e = new Event('mousemove'); e.offsetX = 200; $('.up_pftv_category-viewer svg')[0].dispatchEvent(e);
                    //
                    // });
                });

                describe('When a single feature within the mapped region is selected', () => {
                    it('it should be highlighted in LiteMol', function (done) {


                        const e = new Event('click');

                        $('path[name="DOMAINS_AND_SITES_1"]')[0].dispatchEvent(e);
                        setTimeout(function () {
                            // residues with uniprotId 31-41 should be highlighted

                            const pdbStart = getActiveStructurePdbNum(pv3d, 31);
                            const pdbStartMinusOne = getActiveStructurePdbNum(pv3d, 30);
                            const pdbEnd = getActiveStructurePdbNum(pv3d, 31);
                            const pdbId = pv3d.getGlobals().activeStructure.pdbId;
                            const chainId = pv3d.getGlobals().activeStructure.chainId;

                            const colorToContrast = rgbToString(lmGetResidueColors(pdbId, chainId, pdbStartMinusOne)[0][0]);

                            const colors = lmGetColors(pdbId, chainId, pdbStart, pdbEnd);

                            expect(colors).to.have.lengthOf(1);
                            expect(colors[0]).to.not.equal(colorToContrast);

                            done();

                        }, 100);

                    });
                });

                describe('When a variant aminoacid is selected', () => {
                    it('it should be highlighted in LiteMol', function (done) {

                        const glob = pv3d.getGlobals();

                        const e = new Event('click'); $('.tick.up_pftv_aa_G text')[0].dispatchEvent(e);
                        setTimeout(function () {
                            const colors = lmGetColors('1xq8', 'A', glob.pdbRecords[0].getPdbStart(), glob.pdbRecords[0].getPdbEnd());
                            expect(colors.length).to.equal(4);
                            done();
                        }, 100);
                    });
                });

                describe('When the plugin is loaded with excluded STRUCTURAL features', () => {
                    before(done => {
                        clearPlugin();
                        pv3d = initPlugin(done, uniprotId, {exclusions: ['STRUCTURAL']});
                    });

                    describe('ProtVista', () => {
                        it('should not show the "Structural features" track', () => {
                            expect(pv3d.getGlobals().container.find('.up_pftv_category_STRUCTURAL *').length).to.equal(0);
                        })
                    })
                });

                describe('When the plugin is loaded with STRUCTURAL features as the first category', () => {
                    before(done => {
                        clearPlugin();
                        pv3d = initPlugin(done, uniprotId, {categoryOrder: ['STRUCTURAL']});
                    });

                    describe('ProtVista', () => {
                        it('should show the "Structural features" track as the first after the mapped structures category', () => {
                            expect($(pv3d.getGlobals().container.find('.up_pftv_category')[1]).parent().attr('class')).to.equal('up_pftv_category_STRUCTURAL');
                        })
                    })

                });


                const pdbId = '4znn';
                const chainId = 'A';

                describe('When active structure changes to ' + pdbId, () => {

                    describe('and the respective PDB structure is available', () => {

                        let structureBar;
                        let sbWidthBeforeChange;
                        let cntVisualsBefore;
                        let colorsBefore;

                        let pdbStart = 47, pdbEnd = 56; // using pdb coordinates not the CIF coordinates, because the LiteMol query used in lmGetAtomIndices


                        before((done) => {
                            // consistencyTesting();
                            structureBar = $('.pv3d-pv-structure-bar');
                            sbWidthBeforeChange = structureBar.width();

                            cntVisualsBefore = lmGetVisuals().length;

                            pv3d.getGlobals().activeStructure.set(pdbId, chainId).then(() => {
                                colorsBefore = lmGetColors(pv3d.getGlobals().activeStructure.pdbId, pv3d.getGlobals().activeStructure.chainId, pdbStart, pdbEnd);
                                // pdbStart = getActiveStructurePdbNum(pv3d, 47);
                                // pdbEnd = getActiveStructurePdbNum(pv3d, 56);
                                done();
                            });
                        });

                        describe('ProtVista', function () {
                            it('should have the ' + pdbId + chainId + ' set as the global active structure', function () {
                                expect(pv3d.getGlobals().activeStructure.pdbId.toLowerCase() === pdbId.toLowerCase()).to.be.true;
                                expect(pv3d.getGlobals().activeStructure.chainId.toLowerCase() === chainId.toLowerCase()).to.be.true;
                            });

                            it('should highlight the selected structure', function () {
                                expect(sbWidthBeforeChange !== structureBar.width()).to.be.true;
                            });
                        });

                        describe('LiteMol', function () {
                            it('should change the header to match active structure', function () {
                                headerShouldMatchActiveStructure();
                            });
                            it('should load that new structure', function () {
                                expect(cntVisualsBefore < lmGetVisuals().length).to.be.true;
                                expect(lmGetModels().length).to.equal(2);
                            });
                        });

                        describe('When single feature partially covering the mapped region is selected', () => {
                            before( function(done) {
                                const e = new Event('click'); e.offsetX = 600; $('path[name="STRUCTURAL_4"]')[0].dispatchEvent(e);
                                setTimeout(done, 100);
                            });

                            it('it should be highlighted in LiteMol', function (){
                                const colors = lmGetColors(pv3d.getGlobals().activeStructure.pdbId, pv3d.getGlobals().activeStructure.chainId, pdbStart, pdbEnd);
                                expect(colors).to.have.lengthOf(2);
                            });

                            after( function(done) {
                                e = new Event('click'); e.offsetX = 600; $('path[name="STRUCTURAL_4"]')[0].dispatchEvent(e);
                                setTimeout(done, 100);
                            });

                        });

                        describe('When single feature fully covering the mapped regsion is selected', () => {

                            before (function(done){
                                e = new Event('click'); e.offsetX = 600; $('path[name="MOLECULE_PROCESSING_0"]')[0].dispatchEvent(e);
                                setTimeout(done, 100);
                            });
                            it('it should be highlighted in LiteMol', function () {
                                const colors = lmGetColors(pv3d.getGlobals().activeStructure.pdbId, pv3d.getGlobals().activeStructure.chainId, pdbStart, pdbEnd);
                                expect(colors).to.have.lengthOf(1);
                                expect(colors[0] != colorsBefore[0]).to.be.true;
                            });
                        });

                        describe('When single feature outside of the mapped regsion is selected', () => {
                            before (function(done){
                                e = new Event('click'); e.offsetX = 600; $('path[name="STRUCTURAL_0"]')[0].dispatchEvent(e);
                                setTimeout(done, 100);
                            });
                            it('it should not change the state of LiteMol', function () {
                                const colors = lmGetColors(pv3d.getGlobals().activeStructure.pdbId, pv3d.getGlobals().activeStructure.chainId, pdbStart, pdbEnd);
                                expect(colors).to.have.lengthOf(1);
                                expect(colors[0] == colorsBefore[0]).to.be.true;
                            });
                        });
                    });


                    describe('and the respective PDB structure is not available due to service inaccessibility', () => {

                        before((done) => {
                            pv3d.getGlobals().activeStructure.set('2kkw', 'a').then(() => done()).catch(() => done());
                        });

                        it('should show a message', function () {
                            expect(pv3d.getGlobals().container.find('.pv3d-lm .error-message-container').css('display')).to.equal('block');
                        });
                    });

                    describe('and after returning to the available structure the error message', () => {
                        before((done) => {
                            pv3d.getGlobals().activeStructure.set(pdbId, chainId).then(() => done());
                        });

                        consistencyTesting();

                        it('should be hidden', function () {
                            expect(pv3d.getGlobals().container.find('.pv3d-lm .error-message-container').css('display')).to.equal('none');

                        });
                    });
                });

                const pdbId1 = '3q29';
                const chainId1 = 'A';
                const chainId2 = 'C';

                function headerMatch(pdbId, chainId) {
                    describe('Header', function(){
                        it('Should match the ' + chainId + ' chain', function(){
                            headerShouldMatchStructure(pdbId, chainId);
                        })
                    })
                }
                describe('When active structure changes to ' + pdbId1 + chainId1, () => {

                    before((done) => {

                        pv3d.getGlobals().activeStructure.set(pdbId1, chainId1).then(() => {
                            done();
                        });

                    });

                    headerMatch(pdbId1, chainId1);

                    describe('and the chain changes by clicking on it in ProtVista', () => {


                        before( function(done) {
                            const e = new Event('click'); e.offsetX = 600; $('.up_pftv_3q29_c')[3].dispatchEvent(e);
                            setTimeout(done, 100);
                        });

                        headerMatch(pdbId1, chainId2);
                    });
                });
            });

            describe('When external data are passed', () => {

            });
        });
    });

    describe('When Protein API is not available, the component', function () {
        it('should show information message about inaccessibility of the API');
    });

});

describe('Given existing Uniprot ID  with no matching structure (P00846), LiteMol plugin', function () {
    const uniprotId = 'P00846';
    let pv3d;
    let server;

    before((done) => {
        clearPlugin();
        server = createMockServer(uniprotId);
        pv3d = initPlugin(done, uniprotId);
    });

    after(() => {
        server.restore();
    });

    it('should show information window', function () {
        expect(pv3d.getGlobals().container.find('.error-message-container').css('display') === 'block').to.be.true;

    });

});

describe('Given non-existing Uniprot ID (XXX), the plugin', function () {

  this.timeout(5000);

    const uniprotId = 'XXX';
    let pv3d;

    before((done) => {
        clearPlugin();
        pv3d = initPlugin(done, uniprotId);
    });

    it('should show an information message', function () {
        expect(pv3d.getGlobals().container.find('error-message-container').css('display') === 'block');
    });

});
