module.exports = `data_4RIL
#
_entry.id       4RIL

#
_citation.id                            primary
_citation.title                         "Structure of the toxic core of alpha-synuclein from invisible crystals."
_citation.journal_abbrev                Nature
_citation.journal_volume                525
_citation.page_first                    486
_citation.page_last                     490
_citation.year                          2015
_citation.journal_id_ASTM               NATUAS
_citation.country                       UK
_citation.journal_id_ISSN               0028-0836
_citation.journal_id_CSD                0006
_citation.book_publisher                ?
_citation.pdbx_database_id_PubMed       26352473
_citation.pdbx_database_id_DOI          10.1038/nature15368

#
loop_
_citation_author.citation_id       
_citation_author.name              
_citation_author.ordinal           
primary   "Rodriguez, J.A."  1
primary     "Ivanova, M.I."  2
primary      "Sawaya, M.R."  3
primary        "Cascio, D."  4
primary       "Reyes, F.E."  5
primary           "Shi, D."  6
primary       "Sangwan, S."  7
primary    "Guenther, E.L."  8
primary     "Johnson, L.M."  9
primary         "Zhang, M." 10
primary         "Jiang, L." 11
primary      "Arbing, M.A." 12
primary    "Nannenga, B.L." 13
primary        "Hattne, J." 14
primary    "Whitelegge, J." 15
primary    "Brewster, A.S." 16
primary "Messerschmidt, M." 17
primary        "Boutet, S." 18
primary      "Sauter, N.K." 19
primary         "Gonen, T." 20
primary   "Eisenberg, D.S." 21
#
_cell.entry_id               4RIL
_cell.length_a               70.810
_cell.length_b               4.820
_cell.length_c               16.790
_cell.angle_alpha            90.00
_cell.angle_beta             105.68
_cell.angle_gamma            90.00
_cell.Z_PDB                  4
_cell.pdbx_unique_axis       ?
_cell.length_a_esd           ?
_cell.length_b_esd           ?
_cell.length_c_esd           ?
_cell.angle_alpha_esd        ?
_cell.angle_beta_esd         ?
_cell.angle_gamma_esd        ?

#
_symmetry.entry_id                             4RIL
_symmetry.space_group_name_H-M                 "C 1 2 1"
_symmetry.pdbx_full_space_group_name_H-M       ?
_symmetry.cell_setting                         ?
_symmetry.Int_Tables_number                    5
_symmetry.space_group_name_Hall                ?

#
loop_
_entity.id                             
_entity.type                           
_entity.src_method                     
_entity.pdbx_description               
_entity.formula_weight                 
_entity.pdbx_number_of_molecules       
_entity.pdbx_ec                        
_entity.pdbx_mutation                  
_entity.pdbx_fragment                  
_entity.details                        
1 polymer syn Alpha-synuclein 944.083 1 ? ? ? ?
2   water nat           water  18.015 2 ? ? ? ?
#
_entity_name_com.entity_id       1
_entity_name_com.name            "Non-A beta component of AD amyloid, Non-A4 component of amyloid precursor, NACP"

#
_entity_poly.entity_id                          1
_entity_poly.type                               polypeptide(L)
_entity_poly.nstd_linkage                       no
_entity_poly.nstd_monomer                       no
_entity_poly.pdbx_seq_one_letter_code           GAVVTGVTAVA
_entity_poly.pdbx_seq_one_letter_code_can       GAVVTGVTAVA
_entity_poly.pdbx_strand_id                     A
_entity_poly.pdbx_target_identifier             ?

#
loop_
_entity_poly_seq.entity_id       
_entity_poly_seq.num             
_entity_poly_seq.mon_id          
_entity_poly_seq.hetero          
1  1 GLY n
1  2 ALA n
1  3 VAL n
1  4 VAL n
1  5 THR n
1  6 GLY n
1  7 VAL n
1  8 THR n
1  9 ALA n
1 10 VAL n
1 11 ALA n
#
_pdbx_entity_src_syn.entity_id                  1
_pdbx_entity_src_syn.pdbx_src_id                1
_pdbx_entity_src_syn.pdbx_alt_source_flag       sample
_pdbx_entity_src_syn.pdbx_beg_seq_num           ?
_pdbx_entity_src_syn.pdbx_end_seq_num           ?
_pdbx_entity_src_syn.organism_scientific        "Homo sapiens"
_pdbx_entity_src_syn.organism_common_name       human
_pdbx_entity_src_syn.ncbi_taxonomy_id           9606
_pdbx_entity_src_syn.details                    "Synthetic peptide GAVVTGVTAVA corresponding to segment 68-78 of human alpha-synuclein"

#
_struct_ref.id                             1
_struct_ref.db_name                        UNP
_struct_ref.db_code                        SYUA_HUMAN
_struct_ref.pdbx_db_accession              P37840
_struct_ref.entity_id                      1
_struct_ref.pdbx_seq_one_letter_code       GAVVTGVTAVA
_struct_ref.pdbx_align_begin               68
_struct_ref.pdbx_db_isoform                ?

#
_struct_ref_seq.align_id                          1
_struct_ref_seq.ref_id                            1
_struct_ref_seq.pdbx_PDB_id_code                  4RIL
_struct_ref_seq.pdbx_strand_id                    A
_struct_ref_seq.seq_align_beg                     1
_struct_ref_seq.pdbx_seq_align_beg_ins_code       ?
_struct_ref_seq.seq_align_end                     11
_struct_ref_seq.pdbx_seq_align_end_ins_code       ?
_struct_ref_seq.pdbx_db_accession                 P37840
_struct_ref_seq.db_align_beg                      68
_struct_ref_seq.pdbx_db_align_beg_ins_code        ?
_struct_ref_seq.db_align_end                      78
_struct_ref_seq.pdbx_db_align_end_ins_code        ?
_struct_ref_seq.pdbx_auth_seq_align_beg           68
_struct_ref_seq.pdbx_auth_seq_align_end           78

#
loop_
_chem_comp.id                   
_chem_comp.type                 
_chem_comp.mon_nstd_flag        
_chem_comp.name                 
_chem_comp.pdbx_synonyms        
_chem_comp.formula              
_chem_comp.formula_weight       
ALA "L-peptide linking" y   ALANINE ?  "C3 H7 N O2"  89.093
GLY   "peptide linking" y   GLYCINE ?  "C2 H5 N O2"  75.067
HOH         non-polymer .     WATER ?        "H2 O"  18.015
THR "L-peptide linking" y THREONINE ?  "C4 H9 N O3" 119.119
VAL "L-peptide linking" y    VALINE ? "C5 H11 N O2" 117.146
#
_exptl.crystals_number       4
_exptl.entry_id              4RIL
_exptl.method                "Electron crystallography"

#
_exptl_crystal.id                        1
_exptl_crystal.density_Matthews          1.46
_exptl_crystal.density_meas              ?
_exptl_crystal.density_percent_sol       15.81
_exptl_crystal.description               ?
_exptl_crystal.F_000                     ?
_exptl_crystal.preparation               ?

#
_exptl_crystal_grow.crystal_id          1
_exptl_crystal_grow.method              "batch crystallization"
_exptl_crystal_grow.pH                  4.0
_exptl_crystal_grow.temp                310
_exptl_crystal_grow.pdbx_details        "1 mg of synthetic peptide GAVVTGVTAVA was dissolved in 1 ml of sterile water and shaken overnight in an orbital mixing plate, pH 4.0, batch crystallization, temperature 310K"
_exptl_crystal_grow.temp_details        ?
_exptl_crystal_grow.pdbx_pH_range       ?

#
_diffrn.id                         1
_diffrn.ambient_temp               100
_diffrn.ambient_temp_details       ?
_diffrn.crystal_id                 1

#
_diffrn_detector.diffrn_id                  1
_diffrn_detector.detector                   "CMOS DETECTOR"
_diffrn_detector.type                       "TVIPS F416 CMOS CAMERA"
_diffrn_detector.pdbx_collection_date       2014-08-28
_diffrn_detector.details                    ?

#
_diffrn_radiation.diffrn_id                            1
_diffrn_radiation.pdbx_diffrn_protocol                 "Single wavelength"
_diffrn_radiation.monochromator                        ?
_diffrn_radiation.wavelength_id                        1
_diffrn_radiation.pdbx_monochromatic_or_laue_m_l       M
_diffrn_radiation.pdbx_scattering_type                 electron

#
_diffrn_radiation_wavelength.id               1
_diffrn_radiation_wavelength.wavelength       0.0251
_diffrn_radiation_wavelength.wt               1.0

#
_diffrn_source.diffrn_id                       1
_diffrn_source.source                          "TRANSMISSION ELECTRON MICROSCOPE"
_diffrn_source.type                            "TECNAI F20 TEM"
_diffrn_source.pdbx_wavelength_list            0.0251
_diffrn_source.pdbx_wavelength                 ?
_diffrn_source.pdbx_synchrotron_site           ?
_diffrn_source.pdbx_synchrotron_beamline       ?

#
_reflns.d_resolution_high                1.430
_reflns.d_resolution_low                 16.430
_reflns.number_obs                       1073
_reflns.pdbx_Rmerge_I_obs                0.175
_reflns.pdbx_netI_over_sigmaI            5.500
_reflns.pdbx_redundancy                  4.400
_reflns.percent_possible_obs             89.900
_reflns.B_iso_Wilson_estimate            10.330
_reflns.entry_id                         4RIL
_reflns.observed_criterion_sigma_F       ?
_reflns.observed_criterion_sigma_I       ?
_reflns.number_all                       1073
_reflns.pdbx_Rsym_value                  ?
_reflns.R_free_details                   ?
_reflns.limit_h_max                      ?
_reflns.limit_h_min                      ?
_reflns.limit_k_max                      ?
_reflns.limit_k_min                      ?
_reflns.limit_l_max                      ?
_reflns.limit_l_min                      ?
_reflns.observed_criterion_F_max         ?
_reflns.observed_criterion_F_min         ?
_reflns.pdbx_chi_squared                 ?
_reflns.pdbx_scaling_rejects             ?
_reflns.pdbx_ordinal                     1
_reflns.pdbx_diffrn_id                   1

#
loop_
_reflns_shell.d_res_high                 
_reflns_shell.d_res_low                  
_reflns_shell.number_measured_obs        
_reflns_shell.number_measured_all        
_reflns_shell.number_unique_obs          
_reflns_shell.Rmerge_I_obs               
_reflns_shell.meanI_over_sigI_obs        
_reflns_shell.pdbx_Rsym_value            
_reflns_shell.pdbx_chi_squared           
_reflns_shell.pdbx_redundancy            
_reflns_shell.percent_possible_obs       
_reflns_shell.number_unique_all          
_reflns_shell.percent_possible_all       
_reflns_shell.pdbx_ordinal               
_reflns_shell.pdbx_diffrn_id             
1.430  1.600 ? 1245 ? 0.565  2.500 ? ? 4.400 ? 286 82.500 1 1
3.200 16.430 ?  478 ? 0.080 13.000 ? ? 3.800 ? 126 94.000 2 1
#
_refine.entry_id                                     4RIL
_refine.ls_d_res_high                                1.4300
_refine.ls_d_res_low                                 16.4300
_refine.pdbx_ls_sigma_F                              0.000
_refine.pdbx_data_cutoff_high_absF                   ?
_refine.pdbx_data_cutoff_low_absF                    ?
_refine.ls_percent_reflns_obs                        87.8800
_refine.ls_number_reflns_obs                         1073
_refine.ls_number_reflns_all                         1073
_refine.pdbx_ls_cross_valid_method                   THROUGHOUT
_refine.pdbx_R_Free_selection_details                RANDOM
_refine.details                                      ?
_refine.ls_R_factor_all                              0.2512
_refine.ls_R_factor_obs                              0.2512
_refine.ls_R_factor_R_work                           0.2483
_refine.ls_wR_factor_R_work                          ?
_refine.ls_R_factor_R_free                           0.2750
_refine.ls_wR_factor_R_free                          ?
_refine.ls_percent_reflns_R_free                     11.8400
_refine.ls_number_reflns_R_free                      127
_refine.ls_R_factor_R_free_error                     ?
_refine.B_iso_mean                                   12.7500
_refine.solvent_model_param_bsol                     ?
_refine.solvent_model_param_ksol                     ?
_refine.pdbx_isotropic_thermal_model                 ?
_refine.aniso_B[1][1]                                -3.9876
_refine.aniso_B[2][2]                                3.4908
_refine.aniso_B[3][3]                                0.4968
_refine.aniso_B[1][2]                                0.0000
_refine.aniso_B[1][3]                                -1.5509
_refine.aniso_B[2][3]                                0.0000
_refine.correlation_coeff_Fo_to_Fc                   0.9126
_refine.correlation_coeff_Fo_to_Fc_free              0.9002
_refine.overall_SU_R_Cruickshank_DPI                 0.1080
_refine.overall_SU_R_free                            ?
_refine.pdbx_overall_ESU_R                           ?
_refine.pdbx_overall_ESU_R_Free                      ?
_refine.overall_SU_ML                                ?
_refine.overall_SU_B                                 ?
_refine.solvent_model_details                        ?
_refine.pdbx_solvent_vdw_probe_radii                 ?
_refine.pdbx_solvent_ion_probe_radii                 ?
_refine.pdbx_solvent_shrinkage_radii                 ?
_refine.ls_number_parameters                         ?
_refine.ls_number_restraints                         ?
_refine.pdbx_starting_model                          4RIK
_refine.pdbx_method_to_determine_struct              "MOLECULAR REPLACEMENT"
_refine.pdbx_stereochemistry_target_values           ?
_refine.pdbx_stereochem_target_val_spec_case         ?
_refine.overall_FOM_work_R_set                       ?
_refine.B_iso_max                                    74.500
_refine.B_iso_min                                    3.000
_refine.pdbx_overall_phase_error                     ?
_refine.occupancy_max                                ?
_refine.occupancy_min                                ?
_refine.pdbx_ls_sigma_I                              ?
_refine.ls_redundancy_reflns_obs                     ?
_refine.ls_R_factor_R_free_error_details             ?
_refine.pdbx_data_cutoff_high_rms_absF               ?
_refine.overall_FOM_free_R_set                       ?
_refine.pdbx_diffrn_id                               1
_refine.pdbx_refine_id                               "Electron crystallography"
_refine.pdbx_TLS_residual_ADP_flag                   ?
_refine.pdbx_overall_SU_R_free_Cruickshank_DPI       ?
_refine.pdbx_overall_SU_R_Blow_DPI                   ?
_refine.pdbx_overall_SU_R_free_Blow_DPI              ?

#
_refine_analyze.entry_id                            4RIL
_refine_analyze.Luzzati_coordinate_error_obs        0.305
_refine_analyze.Luzzati_sigma_a_obs                 ?
_refine_analyze.Luzzati_d_res_low_obs               ?
_refine_analyze.Luzzati_coordinate_error_free       ?
_refine_analyze.Luzzati_sigma_a_free                ?
_refine_analyze.Luzzati_d_res_low_free              ?
_refine_analyze.number_disordered_residues          ?
_refine_analyze.occupancy_sum_non_hydrogen          ?
_refine_analyze.occupancy_sum_hydrogen              ?
_refine_analyze.pdbx_Luzzati_d_res_high_obs         ?
_refine_analyze.pdbx_refine_id                      "Electron crystallography"

#
_refine_hist.pdbx_refine_id                       "Electron crystallography"
_refine_hist.cycle_id                             LAST
_refine_hist.pdbx_number_atoms_protein            66
_refine_hist.pdbx_number_atoms_nucleic_acid       0
_refine_hist.pdbx_number_atoms_ligand             0
_refine_hist.number_atoms_solvent                 2
_refine_hist.number_atoms_total                   68
_refine_hist.d_res_high                           1.4300
_refine_hist.d_res_low                            16.4300

#
loop_
_refine_ls_restr.type                          
_refine_ls_restr.number                        
_refine_ls_restr.dev_ideal                     
_refine_ls_restr.dev_ideal_target              
_refine_ls_restr.weight                        
_refine_ls_restr.pdbx_restraint_function       
_refine_ls_restr.pdbx_refine_id                
       t_dihedral_angle_d 16     ? ?  2.000   SINUSOIDAL "Electron crystallography"
          t_trig_c_planes  1     ? ?  2.000     HARMONIC "Electron crystallography"
             t_gen_planes 10     ? ?  5.000     HARMONIC "Electron crystallography"
                     t_it 65     ? ? 20.000     HARMONIC "Electron crystallography"
                    t_nbd  ?     ? ?      ?            ? "Electron crystallography"
       t_improper_torsion  ?     ? ?      ?            ? "Electron crystallography"
            t_pseud_angle  ?     ? ?      ?            ? "Electron crystallography"
t_chiral_improper_torsion 11     ? ?  5.000 SEMIHARMONIC "Electron crystallography"
        t_sum_occupancies  ?     ? ?      ?            ? "Electron crystallography"
       t_utility_distance  ?     ? ?      ?            ? "Electron crystallography"
          t_utility_angle  ?     ? ?      ?            ? "Electron crystallography"
        t_utility_torsion  ?     ? ?      ?            ? "Electron crystallography"
     t_ideal_dist_contact 76     ? ?  4.000 SEMIHARMONIC "Electron crystallography"
                 t_bond_d 65 0.010 ?  2.000     HARMONIC "Electron crystallography"
              t_angle_deg 90 1.650 ?  2.000     HARMONIC "Electron crystallography"
          t_omega_torsion  ? 4.080 ?      ?            ? "Electron crystallography"
          t_other_torsion  ? 6.490 ?      ?            ? "Electron crystallography"
#
_refine_ls_shell.d_res_high                           1.4300
_refine_ls_shell.d_res_low                            1.6000
_refine_ls_shell.pdbx_total_number_of_bins_used       5
_refine_ls_shell.percent_reflns_obs                   87.8800
_refine_ls_shell.number_reflns_R_work                 245
_refine_ls_shell.R_factor_all                         0.2642
_refine_ls_shell.R_factor_R_work                      0.2532
_refine_ls_shell.R_factor_R_free                      0.3310
_refine_ls_shell.percent_reflns_R_free                14.3400
_refine_ls_shell.number_reflns_R_free                 41
_refine_ls_shell.R_factor_R_free_error                ?
_refine_ls_shell.number_reflns_all                    286
_refine_ls_shell.number_reflns_obs                    ?
_refine_ls_shell.redundancy_reflns_obs                ?
_refine_ls_shell.pdbx_refine_id                       "Electron crystallography"

#
_struct.entry_id                      4RIL
_struct.title                         "Structure of the amyloid forming segment, GAVVTGVTAVA, from the NAC domain of Parkinson's disease protein alpha-synuclein, residues 68-78, determined by electron diffraction"
_struct.pdbx_descriptor               Alpha-synuclein
_struct.pdbx_model_details            ?
_struct.pdbx_CASP_flag                ?
_struct.pdbx_model_type_details       ?

#
_struct_keywords.entry_id            4RIL
_struct_keywords.text                "Amyloid, alpha-synuclein, Parkinson's Disease, Toxic Core, NACore, Lipid Binding Protein"
_struct_keywords.pdbx_keywords       "LIPID BINDING PROTEIN"

#
loop_
_struct_asym.id                                
_struct_asym.pdbx_blank_PDB_chainid_flag       
_struct_asym.pdbx_modified                     
_struct_asym.entity_id                         
_struct_asym.details                           
A N N 1 ?
B N N 2 ?
#
_struct_biol.id            1
_struct_biol.details       
;The biological unit is a pair of beta-sheets. One
sheet is composed of chain A and unit cell translations along the b dimension.
The other sheet is composed of the symmetry mate -x+1/2,y+1/2,-z, and unit
cell translations along b.
;


#
_atom_sites.entry_id                        4RIL
_atom_sites.fract_transf_matrix[1][1]       0.014122
_atom_sites.fract_transf_matrix[1][2]       0.000000
_atom_sites.fract_transf_matrix[1][3]       0.003964
_atom_sites.fract_transf_matrix[2][1]       0.000000
_atom_sites.fract_transf_matrix[2][2]       0.207469
_atom_sites.fract_transf_matrix[2][3]       0.000000
_atom_sites.fract_transf_matrix[3][1]       0.000000
_atom_sites.fract_transf_matrix[3][2]       0.000000
_atom_sites.fract_transf_matrix[3][3]       0.061861
_atom_sites.fract_transf_vector[1]          0.00000
_atom_sites.fract_transf_vector[2]          0.00000
_atom_sites.fract_transf_vector[3]          0.00000

#
loop_
_atom_type.symbol       
C
N
O
#
loop_
_atom_site.group_PDB                
_atom_site.id                       
_atom_site.type_symbol              
_atom_site.label_atom_id            
_atom_site.label_alt_id             
_atom_site.label_comp_id            
_atom_site.label_asym_id            
_atom_site.label_entity_id          
_atom_site.label_seq_id             
_atom_site.pdbx_PDB_ins_code        
_atom_site.Cartn_x                  
_atom_site.Cartn_y                  
_atom_site.Cartn_z                  
_atom_site.occupancy                
_atom_site.B_iso_or_equiv           
_atom_site.pdbx_formal_charge       
_atom_site.auth_seq_id              
_atom_site.auth_comp_id             
_atom_site.auth_asym_id             
_atom_site.auth_atom_id             
_atom_site.pdbx_PDB_model_num       
_atom_site.pdbe_label_seq_id        
  ATOM  1 N   N . GLY A 1  1 ? -1.664 2.302  6.349 1.00 23.58 ?  68 GLY A   N 1   1
  ATOM  2 C  CA . GLY A 1  1 ? -1.194 2.605  5.007 1.00 23.02 ?  68 GLY A  CA 1   1
  ATOM  3 C   C . GLY A 1  1 ?  0.105 1.901  4.702 1.00 21.89 ?  68 GLY A   C 1   1
  ATOM  4 O   O . GLY A 1  1 ?  0.121 0.676  4.579 1.00 20.14 ?  68 GLY A   O 1   1
  ATOM  5 N   N . ALA A 1  2 ?  1.197 2.666  4.558 1.00 16.28 ?  69 ALA A   N 1   2
  ATOM  6 C  CA . ALA A 1  2 ?  2.509 2.094  4.221 1.00 15.41 ?  69 ALA A  CA 1   2
  ATOM  7 C   C . ALA A 1  2 ?  3.664 2.731  5.005 1.00 12.05 ?  69 ALA A   C 1   2
  ATOM  8 O   O . ALA A 1  2 ?  3.668 3.942  5.227 1.00 10.77 ?  69 ALA A   O 1   2
  ATOM  9 C  CB . ALA A 1  2 ?  2.764 2.186  2.712 1.00 15.67 ?  69 ALA A  CB 1   2
  ATOM 10 N   N . VAL A 1  3 ?  4.640 1.905  5.417 1.00  5.98 ?  70 VAL A   N 1   3
  ATOM 11 C  CA . VAL A 1  3 ?  5.852 2.304  6.129 1.00  3.93 ?  70 VAL A  CA 1   3
  ATOM 12 C   C . VAL A 1  3 ?  7.023 1.700  5.344 1.00  5.93 ?  70 VAL A   C 1   3
  ATOM 13 O   O . VAL A 1  3 ?  7.217 0.485  5.388 1.00  6.66 ?  70 VAL A   O 1   3
  ATOM 14 C  CB . VAL A 1  3 ?  5.856 1.891  7.629 1.00  7.66 ?  70 VAL A  CB 1   3
  ATOM 15 C CG1 . VAL A 1  3 ?  7.148 2.337  8.330 1.00  6.70 ?  70 VAL A CG1 1   3
  ATOM 16 C CG2 . VAL A 1  3 ?  4.661 2.494  8.333 1.00  6.73 ?  70 VAL A CG2 1   3
  ATOM 17 N   N . VAL A 1  4 ?  7.702 2.522  4.533 1.00  3.26 ?  71 VAL A   N 1   4
  ATOM 18 C  CA . VAL A 1  4 ?  8.782 2.087  3.638 1.00  4.61 ?  71 VAL A  CA 1   4
  ATOM 19 C   C . VAL A 1  4 ? 10.065 2.743  4.088 1.00  4.32 ?  71 VAL A   C 1   4
  ATOM 20 O   O . VAL A 1  4 ? 10.149 3.973  4.071 1.00  3.00 ?  71 VAL A   O 1   4
  ATOM 21 C  CB . VAL A 1  4 ?  8.458 2.457  2.171 1.00  8.53 ?  71 VAL A  CB 1   4
  ATOM 22 C CG1 . VAL A 1  4 ?  9.486 1.874  1.188 1.00  9.58 ?  71 VAL A CG1 1   4
  ATOM 23 C CG2 . VAL A 1  4 ?  7.041 2.046  1.790 1.00  9.20 ?  71 VAL A CG2 1   4
  ATOM 24 N   N . THR A 1  5 ? 11.066 1.952  4.438 1.00  3.32 ?  72 THR A   N 1   5
  ATOM 25 C  CA . THR A 1  5 ? 12.360 2.426  4.896 1.00  3.88 ?  72 THR A  CA 1   5
  ATOM 26 C   C . THR A 1  5 ? 13.504 1.769  4.092 1.00  5.43 ?  72 THR A   C 1   5
  ATOM 27 O   O . THR A 1  5 ? 13.567 0.539  4.039 1.00  6.20 ?  72 THR A   O 1   5
  ATOM 28 C  CB . THR A 1  5 ? 12.540 2.051  6.351 1.00  6.84 ?  72 THR A  CB 1   5
  ATOM 29 O OG1 . THR A 1  5 ? 11.414 2.503  7.130 1.00  9.13 ?  72 THR A OG1 1   5
  ATOM 30 C CG2 . THR A 1  5 ? 13.891 2.524  6.943 1.00 10.98 ?  72 THR A CG2 1   5
  ATOM 31 N   N . GLY A 1  6 ? 14.417 2.588  3.546 1.00  6.04 ?  73 GLY A   N 1   6
  ATOM 32 C  CA . GLY A 1  6 ? 15.571 2.100  2.793 1.00  6.46 ?  73 GLY A  CA 1   6
  ATOM 33 C   C . GLY A 1  6 ? 16.874 2.688  3.292 1.00  7.38 ?  73 GLY A   C 1   6
  ATOM 34 O   O . GLY A 1  6 ? 16.959 3.896  3.501 1.00  6.32 ?  73 GLY A   O 1   6
  ATOM 35 N   N . VAL A 1  7 ? 17.913 1.864  3.436 1.00  4.11 ?  74 VAL A   N 1   7
  ATOM 36 C  CA . VAL A 1  7 ? 19.223 2.311  3.884 1.00  5.04 ?  74 VAL A  CA 1   7
  ATOM 37 C   C . VAL A 1  7 ? 20.243 1.730  2.870 1.00  4.68 ?  74 VAL A   C 1   7
  ATOM 38 O   O . VAL A 1  7 ? 20.244 0.519  2.678 1.00  5.69 ?  74 VAL A   O 1   7
  ATOM 39 C  CB . VAL A 1  7 ? 19.532 1.802  5.294 1.00  9.15 ?  74 VAL A  CB 1   7
  ATOM 40 C CG1 . VAL A 1  7 ? 21.007 1.991  5.629 1.00  9.39 ?  74 VAL A CG1 1   7
  ATOM 41 C CG2 . VAL A 1  7 ? 18.606 2.431  6.367 1.00  9.75 ?  74 VAL A CG2 1   7
  ATOM 42 N   N . THR A 1  8 ? 21.105 2.570  2.279 1.00  3.68 ?  75 THR A   N 1   8
  ATOM 43 C  CA . THR A 1  8 ? 22.201 2.169  1.357 1.00  4.35 ?  75 THR A  CA 1   8
  ATOM 44 C   C . THR A 1  8 ? 23.468 2.783  1.930 1.00  6.01 ?  75 THR A   C 1   8
  ATOM 45 O   O . THR A 1  8 ? 23.530 4.005  2.031 1.00  6.48 ?  75 THR A   O 1   8
  ATOM 46 C  CB . THR A 1  8 ? 21.874 2.496 -0.083 1.00 12.43 ?  75 THR A  CB 1   8
  ATOM 47 O OG1 . THR A 1  8 ? 20.601 1.921 -0.394 1.00 14.76 ?  75 THR A OG1 1   8
  ATOM 48 C CG2 . THR A 1  8 ? 22.929 1.954 -1.075 1.00 13.32 ?  75 THR A CG2 1   8
  ATOM 49 N   N . ALA A 1  9 ? 24.453 1.977  2.339 1.00  7.04 ?  76 ALA A   N 1   9
  ATOM 50 C  CA . ALA A 1  9 ? 25.628 2.542  2.994 1.00  9.57 ?  76 ALA A  CA 1   9
  ATOM 51 C   C . ALA A 1  9 ? 26.967 1.849  2.849 1.00 11.59 ?  76 ALA A   C 1   9
  ATOM 52 O   O . ALA A 1  9 ? 27.052 0.628  2.756 1.00  8.18 ?  76 ALA A   O 1   9
  ATOM 53 C  CB . ALA A 1  9 ? 25.328 2.729  4.478 1.00 10.30 ?  76 ALA A  CB 1   9
  ATOM 54 N   N . VAL A 1 10 ? 28.017 2.646  2.956 1.00 10.58 ?  77 VAL A   N 1  10
  ATOM 55 C  CA . VAL A 1 10 ? 29.405 2.206  3.043 1.00 12.39 ?  77 VAL A  CA 1  10
  ATOM 56 C   C . VAL A 1 10 ? 29.896 2.880  4.314 1.00 18.51 ?  77 VAL A   C 1  10
  ATOM 57 O   O . VAL A 1 10 ? 30.171 4.075  4.301 1.00 16.08 ?  77 VAL A   O 1  10
  ATOM 58 C  CB . VAL A 1 10 ? 30.273 2.561  1.816 1.00 17.83 ?  77 VAL A  CB 1  10
  ATOM 59 C CG1 . VAL A 1 10 ? 31.744 2.243  2.085 1.00 18.89 ?  77 VAL A CG1 1  10
  ATOM 60 C CG2 . VAL A 1 10 ? 29.778 1.831  0.567 1.00 17.39 ?  77 VAL A CG2 1  10
  ATOM 61 N   N . ALA A 1 11 ? 29.916 2.136  5.427 1.00 17.81 ?  78 ALA A   N 1  11
  ATOM 62 C  CA . ALA A 1 11 ? 30.340 2.647  6.726 1.00 23.47 ?  78 ALA A  CA 1  11
  ATOM 63 C   C . ALA A 1 11 ? 31.643 1.988  7.097 1.00 51.68 ?  78 ALA A   C 1  11
  ATOM 64 O   O . ALA A 1 11 ? 31.622 0.916  7.734 1.00 58.63 ?  78 ALA A   O 1  11
  ATOM 65 C  CB . ALA A 1 11 ? 29.289 2.350  7.778 1.00 24.49 ?  78 ALA A  CB 1  11
  ATOM 66 O OXT . ALA A 1 11 ? 32.691 2.485  6.653 1.00 74.50 ?  78 ALA A OXT 1  11
HETATM 67 O   O . HOH B 2  . ?  9.830 4.990  7.085 1.00 11.92 ? 101 HOH A   O 1 101
HETATM 68 O   O . HOH B 2  . ? 18.548 3.873  0.260 1.00 20.36 ? 102 HOH A   O 1 102
#
loop_
_pdbx_poly_seq_scheme.asym_id             
_pdbx_poly_seq_scheme.entity_id           
_pdbx_poly_seq_scheme.seq_id              
_pdbx_poly_seq_scheme.mon_id              
_pdbx_poly_seq_scheme.ndb_seq_num         
_pdbx_poly_seq_scheme.pdb_seq_num         
_pdbx_poly_seq_scheme.auth_seq_num        
_pdbx_poly_seq_scheme.pdb_mon_id          
_pdbx_poly_seq_scheme.auth_mon_id         
_pdbx_poly_seq_scheme.pdb_strand_id       
_pdbx_poly_seq_scheme.pdb_ins_code        
_pdbx_poly_seq_scheme.hetero              
A 1  1 GLY  1 68  1 GLY GLY A . n
A 1  2 ALA  2 69  2 ALA ALA A . n
A 1  3 VAL  3 70  3 VAL VAL A . n
A 1  4 VAL  4 71  4 VAL VAL A . n
A 1  5 THR  5 72  5 THR THR A . n
A 1  6 GLY  6 73  6 GLY GLY A . n
A 1  7 VAL  7 74  7 VAL VAL A . n
A 1  8 THR  8 75  8 THR THR A . n
A 1  9 ALA  9 76  9 ALA ALA A . n
A 1 10 VAL 10 77 10 VAL VAL A . n
A 1 11 ALA 11 78 11 ALA ALA A . n
#
_pdbx_struct_assembly.id                       1
_pdbx_struct_assembly.details                  author_defined_assembly
_pdbx_struct_assembly.method_details           ?
_pdbx_struct_assembly.oligomeric_details       decameric
_pdbx_struct_assembly.oligomeric_count         10

#
_pdbx_struct_assembly_gen.assembly_id           1
_pdbx_struct_assembly_gen.oper_expression       1,2,3,4,5,6,7,8,9,10
_pdbx_struct_assembly_gen.asym_id_list          A,B

#
loop_
_pdbx_struct_oper_list.id                       
_pdbx_struct_oper_list.type                     
_pdbx_struct_oper_list.name                     
_pdbx_struct_oper_list.symmetry_operation       
_pdbx_struct_oper_list.matrix[1][1]             
_pdbx_struct_oper_list.matrix[1][2]             
_pdbx_struct_oper_list.matrix[1][3]             
_pdbx_struct_oper_list.vector[1]                
_pdbx_struct_oper_list.matrix[2][1]             
_pdbx_struct_oper_list.matrix[2][2]             
_pdbx_struct_oper_list.matrix[2][3]             
_pdbx_struct_oper_list.vector[2]                
_pdbx_struct_oper_list.matrix[3][1]             
_pdbx_struct_oper_list.matrix[3][2]             
_pdbx_struct_oper_list.matrix[3][3]             
_pdbx_struct_oper_list.vector[3]                
 1         "identity operation" 1_555           x,y,z  1.0000000000 0.0000000000 0.0000000000  0.0000000000 0.0000000000 1.0000000000 0.0000000000  0.0000000000 0.0000000000 0.0000000000  1.0000000000 0.0000000000
 2 "crystal symmetry operation" 1_535         x,y-2,z  1.0000000000 0.0000000000 0.0000000000  0.0000000000 0.0000000000 1.0000000000 0.0000000000 -9.6400000000 0.0000000000 0.0000000000  1.0000000000 0.0000000000
 3 "crystal symmetry operation" 1_545         x,y-1,z  1.0000000000 0.0000000000 0.0000000000  0.0000000000 0.0000000000 1.0000000000 0.0000000000 -4.8200000000 0.0000000000 0.0000000000  1.0000000000 0.0000000000
 4 "crystal symmetry operation" 1_565         x,y+1,z  1.0000000000 0.0000000000 0.0000000000  0.0000000000 0.0000000000 1.0000000000 0.0000000000  4.8200000000 0.0000000000 0.0000000000  1.0000000000 0.0000000000
 5 "crystal symmetry operation" 1_575         x,y+2,z  1.0000000000 0.0000000000 0.0000000000  0.0000000000 0.0000000000 1.0000000000 0.0000000000  9.6400000000 0.0000000000 0.0000000000  1.0000000000 0.0000000000
 6 "crystal symmetry operation" 4_535 -x+1/2,y-3/2,-z -1.0000000000 0.0000000000 0.0000000000 35.4050000000 0.0000000000 1.0000000000 0.0000000000 -7.2300000000 0.0000000000 0.0000000000 -1.0000000000 0.0000000000
 7 "crystal symmetry operation" 4_545 -x+1/2,y-1/2,-z -1.0000000000 0.0000000000 0.0000000000 35.4050000000 0.0000000000 1.0000000000 0.0000000000 -2.4100000000 0.0000000000 0.0000000000 -1.0000000000 0.0000000000
 8 "crystal symmetry operation" 4_555 -x+1/2,y+1/2,-z -1.0000000000 0.0000000000 0.0000000000 35.4050000000 0.0000000000 1.0000000000 0.0000000000  2.4100000000 0.0000000000 0.0000000000 -1.0000000000 0.0000000000
 9 "crystal symmetry operation" 4_565 -x+1/2,y+3/2,-z -1.0000000000 0.0000000000 0.0000000000 35.4050000000 0.0000000000 1.0000000000 0.0000000000  7.2300000000 0.0000000000 0.0000000000 -1.0000000000 0.0000000000
10 "crystal symmetry operation" 4_575 -x+1/2,y+5/2,-z -1.0000000000 0.0000000000 0.0000000000 35.4050000000 0.0000000000 1.0000000000 0.0000000000 12.0500000000 0.0000000000 0.0000000000 -1.0000000000 0.0000000000
#
_pdbx_phasing_MR.entry_id                         4RIL
_pdbx_phasing_MR.method_rotation                  ?
_pdbx_phasing_MR.method_translation               ?
_pdbx_phasing_MR.model_details                    "Phaser MODE: MR_AUTO"
_pdbx_phasing_MR.R_factor                         ?
_pdbx_phasing_MR.R_rigid_body                     ?
_pdbx_phasing_MR.correlation_coeff_Fo_to_Fc       ?
_pdbx_phasing_MR.correlation_coeff_Io_to_Ic       ?
_pdbx_phasing_MR.d_res_high_rotation              ?
_pdbx_phasing_MR.d_res_low_rotation               ?
_pdbx_phasing_MR.d_res_high_translation           ?
_pdbx_phasing_MR.d_res_low_translation            ?
_pdbx_phasing_MR.packing                          ?
_pdbx_phasing_MR.reflns_percent_rotation          ?
_pdbx_phasing_MR.reflns_percent_translation       ?
_pdbx_phasing_MR.sigma_F_rotation                 ?
_pdbx_phasing_MR.sigma_F_translation              ?
_pdbx_phasing_MR.sigma_I_rotation                 ?
_pdbx_phasing_MR.sigma_I_translation              ?

#
_phasing.method       MR

#
loop_
_software.pdbx_ordinal               
_software.name                       
_software.version                    
_software.date                       
_software.type                       
_software.contact_author             
_software.contact_author_email       
_software.classification             
_software.location                   
_software.language                   
_software.citation_id                
1     Aimless          0.3.11                   19/08/14 program      "Phil Evans"                                ?    "data scaling" http://www.mrc-lmb.cam.ac.uk/harry/pre/aimless.html   ? ?
2      PHASER           2.5.6 "Tue May 20 11:52:06 2014" program   "Randy J. Read"      cimr-phaser@lists.cam.ac.uk           phasing         http://www-structmed.cimr.cam.ac.uk/phaser/   ? ?
3  BUSTER-TNT "BUSTER 2.10.0"                          ? program "Gerard Bricogne" buster-develop@GlobalPhasing.com        refinement                http://www.globalphasing.com/buster/   ? ?
4 PDB_EXTRACT            3.15           "July. 29, 2014" package               PDB         deposit@deposit.rcsb.org "data extraction"           http://sw-tools.pdb.org/apps/PDB_EXTRACT/ C++ ?
5         XDS               .                          ?       ?                 ?                                ?  "data reduction"                                                   ?   ? ?
6      XSCALE               .                          ?       ?                 ?                                ?    "data scaling"                                                   ?   ? ?
7      BUSTER               .                          ?       ?                 ?                                ?        refinement                                                   ?   ? ?
#
_em_3d_reconstruction.entry_id                        4RIL
_em_3d_reconstruction.id                              1
_em_3d_reconstruction.image_processing_id             1
_em_3d_reconstruction.num_particles                   .
_em_3d_reconstruction.symmetry_type                   .
_em_3d_reconstruction.algorithm                       ?
_em_3d_reconstruction.details                         ?
_em_3d_reconstruction.num_class_averages              ?
_em_3d_reconstruction.resolution                      ?
_em_3d_reconstruction.resolution_method               ?
_em_3d_reconstruction.method                          ?
_em_3d_reconstruction.nominal_pixel_size              ?
_em_3d_reconstruction.actual_pixel_size               ?
_em_3d_reconstruction.magnification_calibration       ?

#
_em_buffer.id                1
_em_buffer.specimen_id       1
_em_buffer.pH                .
_em_buffer.details           ?
_em_buffer.name              ?

#
_em_entity_assembly.id                       1
_em_entity_assembly.name                     "amyloid forming segment GAVVTGVTAVA from the NAC domain of alpha-synuclein"
_em_entity_assembly.parent_id                0
_em_entity_assembly.source                   .
_em_entity_assembly.type                     COMPLEX
_em_entity_assembly.details                  ?
_em_entity_assembly.entity_id_list           ?
_em_entity_assembly.synonym                  ?
_em_entity_assembly.oligomeric_details       ?

#
_em_image_scans.entry_id                    4RIL
_em_image_scans.id                          1
_em_image_scans.image_recording_id          1
_em_image_scans.scanner_model               .
_em_image_scans.dimension_height            ?
_em_image_scans.dimension_width             ?
_em_image_scans.frames_per_image            ?
_em_image_scans.sampling_size               ?
_em_image_scans.citation_id                 ?
_em_image_scans.number_digital_images       ?
_em_image_scans.od_range                    ?
_em_image_scans.quant_bit_size              ?
_em_image_scans.details                     ?

#
_em_imaging.entry_id                            4RIL
_em_imaging.id                                  1
_em_imaging.specimen_id                         1
_em_imaging.accelerating_voltage                200
_em_imaging.electron_source                     .
_em_imaging.illumination_mode                   "FLOOD BEAM"
_em_imaging.mode                                DIFFRACTION
_em_imaging.microscope_model                    "FEI TECNAI F20"
_em_imaging.calibrated_defocus_max              ?
_em_imaging.alignment_procedure                 ?
_em_imaging.c2_aperture_diameter                ?
_em_imaging.calibrated_defocus_min              ?
_em_imaging.calibrated_magnification            ?
_em_imaging.cryogen                             ?
_em_imaging.details                             ?
_em_imaging.nominal_cs                          ?
_em_imaging.nominal_defocus_max                 ?
_em_imaging.nominal_defocus_min                 ?
_em_imaging.nominal_magnification               ?
_em_imaging.residual_tilt                       ?
_em_imaging.specimen_holder_model               "GATAN 626 SINGLE TILT LIQUID NITROGEN CRYO TRANSFER HOLDER"
_em_imaging.recording_temperature_maximum       ?
_em_imaging.recording_temperature_minimum       ?
_em_imaging.citation_id                         ?
_em_imaging.date                                ?
_em_imaging.temperature                         ?
_em_imaging.tilt_angle_min                      ?
_em_imaging.tilt_angle_max                      ?
_em_imaging.astigmatism                         ?
_em_imaging.detector_distance                   ?
_em_imaging.electron_beam_tilt_params           ?
_em_imaging.specimen_holder_type                ?

#
_em_sample_support.id                   1
_em_sample_support.specimen_id          1
_em_sample_support.details              ?
_em_sample_support.grid_material        ?
_em_sample_support.grid_mesh_size       ?
_em_sample_support.grid_type            ?
_em_sample_support.method               ?
_em_sample_support.film_material        ?

#
_em_vitrification.entry_id                  4RIL
_em_vitrification.id                        1
_em_vitrification.specimen_id               1
_em_vitrification.cryogen_name              ETHANE
_em_vitrification.humidity                  ?
_em_vitrification.chamber_temperature       ?
_em_vitrification.details                   ?
_em_vitrification.instrument                "FEI VITROBOT MARK IV"
_em_vitrification.citation_id               ?
_em_vitrification.method                    ?
_em_vitrification.temp                      ?
_em_vitrification.time_resolved_state       ?

#
_em_experiment.entry_id                    4RIL
_em_experiment.id                          1
_em_experiment.entity_assembly_id          1
_em_experiment.reconstruction_method       CRYSTALLOGRAPHY
_em_experiment.aggregation_state           "3D ARRAY"

#
_em_single_particle_entity.entry_id                  4RIL
_em_single_particle_entity.id                        1
_em_single_particle_entity.image_processing_id       1
_em_single_particle_entity.point_symmetry            ?

#
_em_image_processing.id                       1
_em_image_processing.image_recording_id       1
_em_image_processing.details                  ?

#
_em_image_recording.id                                1
_em_image_recording.imaging_id                        1
_em_image_recording.film_or_detector_model            "TVIPS TEMCAM-F416 (4k x 4k)"
_em_image_recording.avg_electron_dose_per_image       .35
_em_image_recording.average_exposure_time             3.5
_em_image_recording.details                           ?
_em_image_recording.num_grids_imaged                  ?
_em_image_recording.num_diffraction_images            ?
_em_image_recording.num_real_images                   ?
_em_image_recording.detector_mode                     ?

#
_em_specimen.experiment_id               1
_em_specimen.id                          1
_em_specimen.concentration               .
_em_specimen.vitrification_applied       YES
_em_specimen.staining_applied            NO
_em_specimen.embedding_applied           NO
_em_specimen.shadowing_applied           NO
_em_specimen.details                     .

#
_pdbx_entity_nonpoly.entity_id       2
_pdbx_entity_nonpoly.name            water
_pdbx_entity_nonpoly.comp_id         HOH

#
loop_
_pdbx_nonpoly_scheme.asym_id             
_pdbx_nonpoly_scheme.entity_id           
_pdbx_nonpoly_scheme.mon_id              
_pdbx_nonpoly_scheme.ndb_seq_num         
_pdbx_nonpoly_scheme.pdb_seq_num         
_pdbx_nonpoly_scheme.auth_seq_num        
_pdbx_nonpoly_scheme.pdb_mon_id          
_pdbx_nonpoly_scheme.auth_mon_id         
_pdbx_nonpoly_scheme.pdb_strand_id       
_pdbx_nonpoly_scheme.pdb_ins_code        
B 2 HOH 1 101 13 HOH HOH A .
B 2 HOH 2 102 14 HOH HOH A .
#
loop_
_chem_comp_bond.comp_id                  
_chem_comp_bond.pdbx_stereo_config       
_chem_comp_bond.pdbx_ordinal             
_chem_comp_bond.pdbx_aromatic_flag       
_chem_comp_bond.atom_id_1                
_chem_comp_bond.atom_id_2                
_chem_comp_bond.value_order              
ALA N  1 N   N   CA SING
ALA N  2 N   N    H SING
ALA N  3 N   N   H2 SING
ALA N  4 N  CA    C SING
ALA N  5 N  CA   CB SING
ALA N  6 N  CA   HA SING
ALA N  7 N   C    O DOUB
ALA N  8 N   C  OXT SING
ALA N  9 N  CB  HB1 SING
ALA N 10 N  CB  HB2 SING
ALA N 11 N  CB  HB3 SING
ALA N 12 N OXT  HXT SING
GLY N  1 N   N   CA SING
GLY N  2 N   N    H SING
GLY N  3 N   N   H2 SING
GLY N  4 N  CA    C SING
GLY N  5 N  CA  HA2 SING
GLY N  6 N  CA  HA3 SING
GLY N  7 N   C    O DOUB
GLY N  8 N   C  OXT SING
GLY N  9 N OXT  HXT SING
HOH N  1 N   O   H1 SING
HOH N  2 N   O   H2 SING
THR N  1 N   N   CA SING
THR N  2 N   N    H SING
THR N  3 N   N   H2 SING
THR N  4 N  CA    C SING
THR N  5 N  CA   CB SING
THR N  6 N  CA   HA SING
THR N  7 N   C    O DOUB
THR N  8 N   C  OXT SING
THR N  9 N  CB  OG1 SING
THR N 10 N  CB  CG2 SING
THR N 11 N  CB   HB SING
THR N 12 N OG1  HG1 SING
THR N 13 N CG2 HG21 SING
THR N 14 N CG2 HG22 SING
THR N 15 N CG2 HG23 SING
THR N 16 N OXT  HXT SING
VAL N  1 N   N   CA SING
VAL N  2 N   N    H SING
VAL N  3 N   N   H2 SING
VAL N  4 N  CA    C SING
VAL N  5 N  CA   CB SING
VAL N  6 N  CA   HA SING
VAL N  7 N   C    O DOUB
VAL N  8 N   C  OXT SING
VAL N  9 N  CB  CG1 SING
VAL N 10 N  CB  CG2 SING
VAL N 11 N  CB   HB SING
VAL N 12 N CG1 HG11 SING
VAL N 13 N CG1 HG12 SING
VAL N 14 N CG1 HG13 SING
VAL N 15 N CG2 HG21 SING
VAL N 16 N CG2 HG22 SING
VAL N 17 N CG2 HG23 SING
VAL N 18 N OXT  HXT SING
#`;
