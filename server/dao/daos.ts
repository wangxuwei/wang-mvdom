'use strict';
import { FeatureDao, Feature } from "./FeatureDao"

// export let featureDao: BaseDao = new BaseDao("Feature");
export let featureDao: FeatureDao<Feature> = new FeatureDao();