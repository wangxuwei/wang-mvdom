import { hub } from "mvdom";
import { Dso, BaseEntity, Criteria } from "./ds";
import { ajax } from "./ajax";

/**
 * InMemory (browser) implementation of the DataService ("ds"). 
 * 
 * - Use this during initial development or proof of concepts that cannot have server persistence.
 * 
 * - All APIs respect the "ds" async contract (return Promise) so that changing 
 * 		to the dsAjax.js would be completely transparent.
 **/

export class DsoRest<E extends BaseEntity> implements Dso<E>{
	protected _type: string;

	constructor(type: string) {
		this._type = type;
	}

	create(entity: E): Promise<E> {
		var type = this._type;

		return ajax.post("/api/"+type.toLowerCase()+"/create", {entity: JSON.stringify(entity)}).then(function(entity){
			// we publish the dataservice event
			hub("dataHub").pub(type,"create",entity);
			return entity;
		});
	}

	update(id: number, entity: E): Promise<E> {
		var type = this._type;
		return ajax.post("/api/"+type.toLowerCase()+"/update", {id: id, entity: JSON.stringify(entity)}).then(function(entity){
			// we public the dataservice event
			hub("dataHub").pub(type, "update", entity);
			return entity;
		});
	}

	get(id: number): Promise<E> {
		var type = this._type;
		return ajax.get("/api/"+type.toLowerCase()+"/get", {id: id});
	};

	list(criteria: Criteria): Promise<E[]> {
		var type = this._type;
	
		// TODO: need to add the filtering support
		return ajax.get("/api/"+type.toLowerCase()+"/list", {
			opts: JSON.stringify(criteria)
		});
	};

	first(criteria: Criteria): Promise<E | null> {
		var type = this._type;
		// FIXME: need to implement
		return new Promise(function (resolve, reject) {
			resolve();
		});
	};

	remove(id: number): Promise<boolean> {
		var type = this._type;
	
		return ajax.post("/api/"+type.toLowerCase()+"/delete", {id: id}).then(function(id){
			// we publish the dataservice event
			hub("dataHub").pub(type,"delete",id);
			return id;
		});
	};
}