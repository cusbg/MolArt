# Developers documentation

## Obtaining MOLART

#### Using precompiled distribution file

The easiest way is to simply download the precompiled distribution file
``molart.js`` from the [dist](https://github.com/davidhoksza/MolArt/tree/master/dist) directory.

#### Building MOLART from source code

Other option, especially if you want to do some modification to the code before using it, is to build MOLART
directly from the source codes.

###### Obtain the source

Download the Github repository with the following command:

```
git clone https://github.com/davidhoksza/MolArt
```

###### Building the source codes

MOLART uses [Gulp](https://gulpjs.com/) as its build system. So if Gulp is not installed on your system yet, you will first need to download it and only then run its default task to build MOLART.

```
npm install -g gulp
npm install
gulp
```

This process will result in a single file in the ``dist`` directory with single file
named ``molart.js``, the only file needed to use the plugin.

#### Using MOLART as a NPM package

If your application uses NPM as the packaging system, MOLART can be
also easily obtain with NPM using:

```
npm install git://github.com/davidhoksza/MolArt
```

## Using the plugin

#### Include the code into a web page

All javascript files, style sheets, SVG and font files used by ProtVista and LiteMol are included in the MOLART distribution js file, so that is the only thing you need to embed into your web page. You can embed it into your HTML using the script tag:

```
<script type="text/javascript" src="molart.js"></script>
```

or, if you are using Browserify or Webpack to bundle your Javascript the above script tag is of course not required and the require` statement discussed bellow is sufficient.

#### Create a container

Create a DIV or SPAN element.

```
<div id="pluginContainer"></div>
```

If this is the only element in the page then the plugin will span the whole width and height of the window. However, you can limit the width, height or position of the plugin which will then take the provided space and resize accordingly. For example, you can use the following styles to center the plugin in the middle of the window and make it 50% width and 80% height of the window:

```
<div id="pluginContainer" style="position: absolute;  width: 50%; height: 80vh; left:25%; top:10%"></div>
```

However, please bear in mind that there exists a minimal width (800px) the plugin needs to comfortably accommodate all its components. So if you set the width of the container below this threshold, horizontal scrollbar will appear.

#### Create instance of MOLART

Finally, you need to create an instance of the plugin and specify a UniProt ID and the ID of the container.

```javascript
var MolArt = require('MolArt');
molart = new MolArt({
    uniprotId: 'P37840',
    containerId: 'pluginContainer'
});
```


If you are using a bundling system to build your application, not using NPM and not using the `script` tag to embed MolArt, you need to change the `require` location to point to the plugin script. The above syntax should work just fine if you are using NPM.

#### Destroy MOLART

If you need to create an instance repeatedly , e.g. every time a user clicks on UniprotID you open/create a tab and spawn a new instance of MOLART and when she closes the tab, you remove all its content. In such situations LiteMol (or rather THREE.js) does not release all the WebGL related structures and still tries to draw something into HTML elements which are not available any more. To get rid of the warning messages, you can call the `destroy` method. However, if there are still some callback functions active, which try to access LiteMol, you will get the

## Options and parameters

All parameters for ProtVista are also available in MOLART, which simply
takes them and passes them to ProtVista. These include ability to exclude
cateogires, customization of their order and also ability to specify
custom categories/data sources. The full description with examples can be
found in [ProtVista's documentation](http://ebi-uniprot.github.io/ProtVista/developerGuide.html#starting-protvista).

#### Define visibility and order of categories

In order to exclude categories or customize their order, simply pass additional
parameters to the `MolArt` object as you would when using ProtVista only. The list 
of all categories available in ProtVista can be found [here](https://github.com/davidhoksza/ProtVista/blob/90000af6e11131d138faab050d89e30f27e03e19/src/config.json#L2).

```javascript
molart = new MolArt({
    uniprotId: 'P37840',
    containerId: 'pluginContainer',
    categoryOrder: ['PTM'],
    exclusions: ['SEQUENCE_INFORMATION', 'STRUCTURAL', 'TOPOLOGY', 'MUTAGENESIS', 'MOLECULE_PROCESSING']
});
```

Since the core of MOLART lies in mapping between the sequence and structure,
the customization does not impact the experimental/predicted structures category
which always appears first.

#### Custom data sources

You can also provide custom annotations which will be automatically
mapped over the structures. The format of the annotation data
is defined in ProtVista documentation in [Adding your own sources](http://ebi-uniprot.github.io/ProtVista/developerGuide.html#adding-your-own-sources) section.
However, unlike in ProtVista, in MOLART you can pass the data directly
in the constructor and the annotations can thus be
generated on the fly, if needed. Moreover, MOLART lets you to
use multiple data sources.

The following example shows how to mix "local"
with "external" data sources. In the following example, three categories
are created two of which consists of randomly generated data while the third
downloads data from http://localhost/externalFeatures_P37840.json (if available).

```javascript
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
                type: "MY_REGION",
                category: catName,
                begin: String(ix1),
                end: String(ix2),
                color: "#FF7094"
            }
        ]
    };
}

const sequence = 'MDVFMKGLSKAKEGVVAAAEKTKQGVAEAAGKTKEGVLYVGSKTKEGVVHGVATVAEKTKEQVTNVGGAVVTGVTAVAQKTVEGAGSIAAATGFVKKDQLGKNEEGAPQEGILEDMPVDPDNEAYEMPSEEGYQDYEPEA';
const customDataSources = [
    {
        source: 'RANDOM',
        useExtension: false,
        data: initializeTestDataSet(sequence, 'MY_CATEGORY1')
    },
    {
        source: 'RANDOM',
        useExtension: false,
        data: initializeTestDataSet(sequence, 'MY_CATEGORY2')
    }
    ,
    {
        source: 'RANDOM',
        useExtension: true,
        url: 'http://localhost/externalFeatures_'
    }
];

const MolArt = require('MolArt');
molart = new MolArt({
    uniprotId: 'P37840',
    containerId: 'pluginContainer',
    customDataSources: customDataSources
});
```

#### Other options

- ```sortStructures``` - when set to ```id``` the lists of experimental and predicted
structures are sorted by their name. This changes the default behavior when the lists
are sorted by coverage, i.e. how much of the sequence is covered by a structure. 

- ```categoriesTooltips``` - array of arrays of size two containing category code and
its tooltip text. This option allows to set user-defined titles for categories. An example can be found in the plugin page example (```categoriesTooltips: [['DOMAINS_AND_SITES', 'Describes various domains and sites'], ['PTM', 'Post-translational modifications']]```).
The tooltips for tracks can be set using the ProtVista [custom config file](http://ebi-uniprot.github.io/ProtVista/developerGuide.html#further-customization) option.
Since all options passed to MolArt's constructor are further passed to ProtVista,
this option is available in MolArt as well.

- ```enableTooltips``` (default ```true```) - when set to ```false``` hovering over a category
does not show a tooltip for that category as ProtVista does by default. This option
was added because default category tooltips in ProtVista are not very illustrative.

- ```highlightByHovering``` (default ```false```) - when set to ```true```
hovering over an annotation in sequence view highlights the corresponding part
of the structure in the structure view. By default, an annotation is highlighted
only when clicked on in the sequence view.

- ```alwaysLoadPredicted``` (default ```false```) - when set to ```true```
MolArt always connects to SMR and downloads available models; by default, 
it will query SMR only when no experimental structure is available.

- ```pdbIds``` (default ```undefined```) - list of PDB IDs (such as ```['6cu7', '6flt']```) which are
supposed to be shown in the Experimental structures category. 
Structures in the mapping outside of this list will not be shown. If
not set or the list is empty, no restriction takes place.

- ```smrIds``` (default ```undefined```) - list of PDB IDs (such as ```['3q27.1']```) which are
supposed to be shown in the Predicted structures category. 
Structures in the mapping outside of this list will not be shown. If
not set or the list is empty, no restriction takes place.

- ```extraHighlights``` (default ```undefined```) - allows to highlight a list of residues and
even restrict atoms of the residues. Moreover, one can specify the type of highlight. Specifically, 
on needs to pass an object containing 
an array where each elements defines a selection and how that selection should be viusalized.
The LiteMol documentation specifies available parameters for the [balls and sticks](https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.ballsandsticksparams.html)
and [surface](https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.surfaceparams.html)
visualizations. If the object has controlVisibility set to `true`, a dropdown will be shown in the
header where the user can turn on and of the defined highlights. 

    ```
    extraHighlights: {
        controlVisibility: false, //whether the list of custom highlights will be shown as a dropdown through which the can control visibility of the individual highlights
        label: 'Extra selections',
        content: [
            {
                label: 'Extra 1 - CA, CE',
                showOnStart: true,
                sequenceNumbers: [58, 50],
                atomNames: ['CA', 'CE'],
                visual: {
                    type: 'BallsAndSticks',
                    //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.ballsandsticksparams.html
                    params: { useVDW: true, vdwScaling: 1, bondRadius: 0.13, detail: 'Automatic' },
                    color: {r:1, g: 0, b: 0},
                    alpha: 1
                }

            }, {
                label: 'Extra 2',
                showOnStart: false,
                sequenceNumbers: [60, 61, 62],
                //atomNames: ['C'],
                visual: {
                    type: 'Surface',
                    //https://webchemdev.ncbr.muni.cz/LiteMol/SourceDocs/interfaces/litemol.bootstrap.visualization.molecule.surfaceparams.html
                    params: {isWireframe: true, probeRadius: 0, density: 1.25, smoothing: 3},
                    color: {r: 0, g: 0, b: 1},
                    alpha: 0.8
                }
            }
        ]
    }
    
    ```
 
