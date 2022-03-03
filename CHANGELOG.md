# Changelog

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

##  [Unreleased]

### Added

### Removed

### Fixed

##  [1.13]

### Added

- Ability to control visibility of low-confidence regions in AlphaFold structures.
- Added uniprot position in the `labelcallback`

### Removed

### Fixed

- Fix warning regarding default structure not found when loading MolArt
- Fix failing when not AF confidence settings specified

##  [1.12.1]

### Added

### Removed

### Fixed
- Fixed showing interactive visuals of structures which are currently not visible


##  [1.12.0]

### Added

- Ability to specify PyMOL export file name

### Removed

### Fixed

- Fixed unpSeqNumber passed in HighlightCustomElements
- Fixed not showing structure viewer error messages

##  [1.11.1]

### Added

### Removed

### Fixed

- Fixed unpSeqNumber passed in HighlightCustomElements


##  [1.11.0]

### Added

- Added `variantFilterDefaultBehavior` making ProtVista's |variant filter dialog to behave
as standard checkboxes. By default, when consequence clicked in ProtVista and that consequence
is already checked, all other checkboxes become unchecked which is not intuitive for some users.

### Removed

### Fixed

- Mapping in HighlightCustomElements when the structure starts before UniProt sequence (e.g. 2I4I)

##  [1.10.0] - 2021-10-27

### Added

- AlphaFold export to PyMOL
- Ability to show additional information about hovered element.
- Choose which structure to load by default.

### Removed

- Removed min-width of structure and sequence view

### Fixed

- User-defined visuals do not create default visuals (causing problems once removed)
- Failing when AlphaFold or SMR not available

##  [1.9.1] - 2021-10-15

### Added

### Removed

### Fixed

- User visuals stay colored after feature selection


##  [1.9.0] - 2021-10-15

### Added

- Controlling user visuals via MolArt API (add visual, remove visual)

### Removed

### Fixed


##  [1.8.0] - 2021-09-29

### Added

- AlphaFold DB structures available.
- Ability to specify default structure transparency level using lmInitSurfaceTransparency.
- Download all annotation data in CSV.
- Highlithing a region in the sequence view also highlights corresponding part of the structure in the
structure view. 

### Removed

### Fixed

- Taking into account inserted segments in structure with respect to sequence (e.g.6I53:A).
- Structure IDs show up as uppercase. 



##  [1.7.0] - 2020-10-22

### Added

- Get information about which regions in sequence have a structure mapped.
- Emitting an event every time a structure has been loaded.

### Removed

### Fixed

- Possible conflict of jQuery with Semantics UI jQuery object
- Returned "main" field in package.json

##  [1.6.0] - 2020-10-11

### Added

- Integrated new version of ProtVista which correctly handles changes in Proteins API 
- Ability to focus at a residue in the structure view.
- Convenience function to find out whether MolArt is loaded
- Ability to provide custom 3D structure
- Ability to provide custom sequence and sequence-structure mapping
- PredictProtein is passed sequence when UniProt ID is not available
- Possibility to pass also chain specification when restricting the list of structures
- Event listeners for sequence and structure mouse hover events
- Ability to control highliting of position in both sequence and structure views outside of MolArt
- Input options sanitization (e.g. Uniprot ID can be passed with trailing spaces)
- Destroy method of the MolArt object not only destroys LiteMol object, but also removes everything from the root container.
- SMR records sorted by coverage

### Removed

### Fixed

- SwissProt structures showing twice in ProtVista when PDBe mapping not availble 
- Beginning of region when shifting observed ranges
- Included updated ProtVista which handles problems with shifted ruler
- Issue with shifted arrow icon in categories headers in some scenarios (removed verctial bottom alignment)
- MouseMove emmiter events generated numbers outside of the range of sequence numbers.
- Dehighlight in structure view when mouse moved outside of sequence view.
- Using local jQuery for container object to avoid clashing with plugins which claim global jQuery instance
- Improved error message when LiteMol cannot process the structure file

##  [1.5.0] - 2019-09-30

### Added

- Ability to show unobserved structure regions in the sequence view

### Removed

- Showing TaxId in the structure description in the sequence view

### Fixed

- Keeping highlighted first or last residue in the structure when mouse moves past the end of sequence 
in the sequence view
- When clicking an overlay arrow icon in the sequence view and a feature was selected, i.e. the yellow bar was 
acive, the bar did not get hidden

## [1.4.0] - 2019-08-22

### Added

- PredictProtein as a default category 
- Possibility to specify different categories and features labels for PyMol export

### Fixed

- Fix of issue when a user selection is empty or non-empty but does not intersect with current structure
- Fixed issue with features being out of categories in PyMol export when special characters were present
- Fixing of PyMOL export issue when beginning or end of selection falls into an unobserved region
- Export to PyMOL was giving wrong selections if sequence and structure numbering did not match.
- Dependencies update

## [1.3.3] - 2019-05-09

### Fixed

- Fixed issue with positioning of the components when ProteinAPI takes too long to load.

## [1.3.2] - 2019-04-08

### Added

- Export to PyMOL restricted to current chain

### Fixed

- Fixed moving MolArt logo when scrolling 

## [1.3.1] - 2019-01-26

### Fixed

- Fix PyMol export selections when sequence and structure numbering does not match


## [1.3.0] - 2019-01-13

### Added
- PyMOL export now contains CA selection.
- PyMOL export now has hierarchical categories the same way the users sees them in sequence viewer.
- List of mapped structures in the sequence view can be sorted by name (by default it is sorted by coverage).
This can be set in the constructor.
- User defined highlights. The user can define custom selections to be shown on the structure. Can be useful, 
e.g. for showing pathogenic mutations on every structure. The format follows LiteMol's selection and 
 highlight "language".

### Fixed
- Fixed issue with logo showing out of plugin boundaries in some cases.
- Handled situation when category and feature type has the same name when exporting to PyMOL (e.g. ANTIGEN).


