# Changelog

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

##  [Unreleased]

### Added

- Ability to provide custom 3D structure
- Ability to provide custom sequence and sequence-structure mapping
- PredictProtein is passed sequence when UniProt ID is not available
- Possibility to pass also chain specification when restricting the list of structures
- Event listeners for sequence and structure mouse hover events
- Ability to control highliting of position in both sequence and structure views outside of MolArt

### Removed

### Fixed

- Beginning of region when shifting observed ranges
- Included updated ProtVista which handles problems with shifted ruler

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


