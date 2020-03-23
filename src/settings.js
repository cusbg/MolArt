module.exports = {
    homepage: 'https://github.com/davidhoksza/MolArt/',
    loadAllChains: true
    , pvMappedStructuresCat: {
        id: 'EXPERIMENTAL_STRUCTURES'
        , idPredicted: 'PREDICTED_STRUCTURES'
        , name: 'Experimental structures'
        , namePredicted: 'Predicted structures'
        , clazz: 'up_pftv_category_EXPERIMENTAL_STRUCTURES'
        , clazzPred: 'up_pftv_category_EXPERIMENTAL_STRUCTURES'
    }
    , pvPredictProteinCat: {
        id: 'PREDICT_PROTEIN'
        , clazz: 'up_pftv_category_PREDICT_PROTEIN'
    }
    , pvVariationCat: {
        clazz: 'up_pftv_category_VARIATION'
    }
    , pvCategories: {
        clazz: 'up_pftv_category-container'
    }
    ,pvCategoryPrefix: 'up_pftv_category_'

    , pvCustomCategoryContainer: {
        clazz: 'up_pftv_category_on_the_fly'
    }

    , variationColors: {
        min: [200, 200, 200]
        , max: [50, 50, 50]
    }
    , boundaryFeatureTypes: ['DISULFID']
    , useCorsForSmr: false
    , sortStructuresOptions: {
        id: 'id'
    }
    , corsServer: 'https://dobrman.ms.mff.cuni.cz/'

    , urlPredictProtein: 'https://api.predictprotein.org/v1/results/'

    , colors: {
        'pvStructureObserved': "#2E86C1",
        'pvStructureUnobserved': "#BDBFC1"
    }
}
