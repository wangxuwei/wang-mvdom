import { hub } from "mvdom";
import { Dso, BaseEntity, Criteria } from "./ds";
import { DsoRest } from "./dsoRest";
import { ajax } from "./ajax";

export class Feature extends BaseEntity {
}


export class DsoFeatureRest<Feature> extends DsoRest<Feature>{
	private _entity: string;

	constructor() {
		super("Feature");
	}

	reorderFeatures(features:any[]){
		return ajax.post("/api/feature/reorderFeatures", {features: JSON.stringify(features || [])}).then(function(result){
			// we publish the dataservice event
			hub("dataHub").pub("Feature","update",result);
			return result;
		});
	}

	

	getFeaturesByRank(){
		return ajax.get("/api/feature/getFeaturesByRank").then(function(result){
			return result;
		});
	}

}