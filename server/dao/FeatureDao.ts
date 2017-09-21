import { BaseDao } from "./BaseDao";
import {db} from "./db";


export class FeatureDao extends BaseDao{

	constructor(){
		super("Feature");
	}
	
	reorderFeatures(features:any){
		var self = this;
		var entity = this._entity;
		var rank = 1;

		return new Promise(async function(resolve, reject){
			for(var i = 0; i < features.length; i++){
				var feature = features[i];
				feature.rank = rank++;
				var id = feature.id

				// put the new entity properties in the dbEntity
				feature = Object.assign(await self.get(id), feature);
				
				//make sure we do not change the .id
				delete feature.id;
				self.update(id, feature);
			}
			// we resolve 
			resolve(features);
		});
	}

	

	getFeaturesByRank(){
		var entity = this._entity;

		return new Promise(async function(resolve, reject){
			var data = await db.getData(entity);
			var features:any[] = [];
			for(let key in data){
				features.push(data[key]);
			}

			features.sort(function(a, b){
				if(a.rank && b.rank){
					return a.rank > b.rank ? 1 : -1;
				}else{
					return a.id > b.id ? 1 : -1;
				}
			});
			// we resolve 
			resolve(features);
		});
	}
}