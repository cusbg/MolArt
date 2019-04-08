# Changelog

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

##  [Unreleased]

### Added

- Export to PyMOL restricted to current chain

### Fixed

- Export to PyMOL was giving wrong selections if sequence and structure numbering did not match.
- Fixed moving MolArt logo when scrolling 

## [1.3.0] - 2019-13-01

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


