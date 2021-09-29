# MolArt (MOLeculAR structure annoTator)

MolArt is a responsive, easy-to-use JavaScript plugin which enables users to
view annotated protein sequence (including variation data from large scale
studies) and overlay the annotations over a corresponding experimental
or predicted protein structure.
It couples protein sequence annotation capabilities provided by [ProtVista](https://github.com/ebi-uniprot/ProtVista)
 (or more precisely its [modified responsive version](https://github.com/davidhoksza/protvista) 
 implemented when developing MolArt) with structure visualization 
 capabilities provided by [LiteMol](https://github.com/dsehnal/LiteMol). 
 Since it does not have any software dependencies and all the data are obtained on the fly,
  it is easy to integrate it to any web page.

Examples of MolArt's use can be found at https://cusbg.github.io/MolArt/.

[Documentation](https://github.com/davidhoksza/MolArt/tree/master/docs) shows usage of the plugin.

The plugin is being developed at the Luxembourg Center for Systems Biomedicine, University of Luxembourg.

To cite MolArt use: **MolArt: A molecular structure annotation and visualization tool** (doi: [10.1093/bioinformatics/bty489](https://doi.org/10.1093/bioinformatics/bty489))


<div style="text-align:center;">
    <img src="gitweb/teaser.png" style="width:80%"/>
</div>


## Features overview

- Visualization of protein structure as provided by LiteMol
- Annotation of protein sequence as provided by ProtVista
- Annotations of protein sequence from [PredictProtein](https://en.wikipedia.org/wiki/Predictprotein) 
- Mapping of structure on corresponding substring in the sequence
- Automatic retrieval of sequence data based on UniProt ID and corresponding experimental structures from PDB
- Retrieval of predicted models from [AlphaFold DB](https://alphafold.ebi.ac.uk/) and [SWISS-MODEL Repository](https://swissmodel.expasy.org/repository) (SMR) if 
no PDB structure is available
- Controlling transparency of the structure to see both cartoon and surface view of the structure
- Hovering over position in sequence to highlight it in structure and vice versa
- Color overlay any sequence feature over the structure
- Color overlay all sequence features of given type over the structure
- Color overlay individual variation over the structure
- Color overlay all mutations to given amino acid over the structure
- Color overlay mutation frequency of residues over the structure
- Exports of the structure and annotations to [PyMol](https://pymol.org/2/) for advanced inspection 
(the export does not include variants)
- Upload of custom annotations
- Ability to control which structures will be shown
- Ability to select and highlight specific residues (not necessarily corresponding to annotations) and specific atoms .
The selection can be visualized either as a surface, a balls and stick representation or simply van der 
Waals-based spheres with given color and transparency.
- Ability to provide custom sequence and mapping



## Data sources

- Sequence and annotation data
  - Sequence information comes from [UniProt website REST API](https://www.uniprot.org/help/api) or can be provided by the user
  - Sequence annotations are provided by 
    - ProtVista plugin which utilizes the EBI's 
  [Proteins REST API](https://www.ebi.ac.uk/proteins/api/doc/). 
  Proteins API includes access to variation, proteomics and antigen services containing 
  "annotations imported and mapped from large scale data sources, such as 1000 Genomes, 
  ExAC (Exome Aggregation Consortium), COSMIC (Catalogue Of Somatic Mutations In Cancer), 
  PeptideAtlas, MaxQB (MaxQuant DataBase), EPD (Encyclopedia of Proteome Dynamics) and HPA, 
  along with UniProtKB annotations for these feature types".
    - [PredictProtein API](https://en.wikipedia.org/wiki/Predictprotein) which gives access to a range
    of integrated sequence-based [prediction methods](https://www.predictprotein.org/about) such as
    conservation or prediction of functional changes. If the user prefers only experimental data, 
    the PredictProtein annotations can be easily turned off with the exclusion parameter as 
    described in the [documentation](https://github.com/davidhoksza/MolArt/tree/master/docs) 
  
- Structure mapping
    - Automatic
        - To obtain the mapping between UniProt and PDB, MolArt is using the [SIFTS API](https://www.ebi.ac.uk/pdbe/api/doc/sifts.html), part of the [PDBe REST API](http://www.ebi.ac.uk/pdbe/pdbe-rest-api).
        - In case the SIFTS mapping yields no PDB structures, SMR is queried using its [API](https://swissmodel.expasy.org/docs/repository_help#smr_api) for available models.
    - Custom
        - When working with sequence which is not in UniProt or when the mapping is not known, 
        sequence-structure mapping can be provided. This includes
            - Molecule-level mapping, i.e. which PDB structures correspond to the sequence
            - Residue-level mapping, i.e. which regions in sequence correspond to which regions in the structure

- Structure data
  - In case an experimental structure is available in PDB for given UniProt ID, this structure is downloaded by LiteMol. In this case, MolArt instructs LiteMol to use the mmCIF format.
  - In case there is no experimental structure in PDB, but a model exists in SMR, MolArt instructs LiteMol to use the PDB-format structure data from SMR.

## How to use MolArt

- Obtain the JavaScript file with MolArt and link it from your web page
- Create a container DIV (or SPAN) element which will hold the viewer
- Create a JavaScript object and pass it reference to the DIV

The detail description of how to incorporate MolArt into your project can be found in the [developer documentation](https://github.com/davidhoksza/MolArt/tree/master/docs).

### Examples of use
Exmpales of how to use MolArt are located in the ``examples`` folder.
- See the ``bare.html`` file for a bare bones example of how to use the plugin.
- The ``plugin-page.html`` is slightly styled plugin usage.
- For an advanced example, see the ``web`` directory. It contains a simple web application which enables querying Uniprot (only top 10 matches are retrieved) and for every found record one can click the UniProt ID which creates a new tab with new instance of MolArt for that UniProt ID.

## Contributing

We would be happy to hear about your use cases, experiences and ideas/feature requests. Either raise an issue [here](https://github.com/davidhoksza/MolArt/issues) or get in touch by mail (david.hoksza at gmail).

## Support

Please submit your issues through the MolArt's repository issue tracker available [here](https://github.com/davidhoksza/MolArt/issues).

## License

This project is licensed under the Apache 2.0 license, quoted below.

Copyright (c) 2018 David Hoksza

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## Support

<p align="center">
  <img src="img/logo-elixir.png" />
</p>

PrankWeb is a part of services provided by ELIXIR – European research infrastructure for biological information.
See [services](https://www.elixir-czech.cz/services) provided [ELIXIR's Czech Republic Node](https://www.elixir-czech.cz/).

