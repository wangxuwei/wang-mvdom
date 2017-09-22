'use strict';
import {db} from "./db";
import {Crud, Criteria} from "./crud";

export class BaseEntity {
	id?: number;
}

export class BaseDao<E extends BaseEntity> implements Crud<E>{
	_entity: string;
	_seq: number;

	constructor(entity:string){
		this._entity = entity;
		initSeq.call(this);
	}

	async get(id:number): Promise<E>{
		var data = await db.getData(this._entity);
		return <E>data[id];
	}

	// create an entity, and return id.
	async create(dataEntity:E): Promise<E>{
		var data = await db.getData(this._entity);
		var entity:E = Object.assign({}, dataEntity);
		entity["id"] = getSeq.call(this);
		data[entity.id!] = entity;
		await db.setData(this._entity, data);
		return await this.get(entity.id!);
	}

	async update(id:number, dataEntity:E): Promise<E>{
		var entity: E;
		if(id){
			var data = await db.getData(this._entity);
			if(data[id]){
				entity = Object.assign({id: id}, data[id], dataEntity);
				data[id] = entity;
				db.setData(this._entity, data);
			}
		}

		return this.get(id);
	}

	async remove(id: number): Promise<boolean>{
		if(id){
			var data = await db.getData(this._entity);
			if(data[id]){
				delete data[id];
				await db.setData(this._entity, data);
			}
		}
		return new Promise<boolean>(function(resolve, reject){
			resolve(true);
		});
	}

	async first(criteria: Criteria): Promise<E | null>{
		var list:E[] = await this.list(criteria);
		return new Promise<E | null>(function(resolve, reject){
			if(list && list.length > 1){
				resolve(<E>list[0]);
			}else{
				resolve(null);
			}
		});
	};

	async list(criteria: Criteria): Promise<E[]> {
		var entityStore = await db.getData(this._entity);
		var tmpList:any[] = [], list;

		var item;

		// get the eventual filters
		var filters = (criteria && criteria.filter)?criteria.filter:null;
		if (filters){
			// make sure it is an array of filter
			filters = (filters instanceof Array)?filters:[filters];
		}


		// first, we go through the store to build the first list
		// NOTE: Here we do the filter here because we have to build the list anyway. 
		//       If we had the list as storage, we will sort first, and then, filter
		for (var k in entityStore){
			item = entityStore[k];
			// add it to the list if no filters or it passes the filters
			if (!filters || passFilter(item, filters)){
				tmpList.push(item);
			}
		}

		// implement the sorting
		// get the eventual orderBy
		var orderBy = (criteria && criteria.orderBy)?criteria.orderBy:null;
		var orderType = orderBy && orderBy.indexOf("!") == 0?"desc":"asc";
		tmpList.sort(function(a, b){
			if(orderType == "desc"){
				return a.rank < b.rank ? 1 : -1;
			}else{
				return a.rank > b.rank ? 1 : -1;
			}
		});

		// extract the eventual offset, limit from the opts, or set the default
		var offset = (criteria && criteria.offset)?criteria.offset:0;
		var limit = (criteria && criteria.limit)?criteria.limit:-1; // -1 means no limit
		
		// Set the "lastIndex + 1" for the for loop
		var l = (limit !== -1)?(offset + limit):tmpList.length;
		// make sure the l is maxed out by the tmpList.length
		l = (l > tmpList.length)?tmpList.length:l;

		list = [];
		for (var i = offset; i < l; i++){
			list.push(Object.assign({}, tmpList[i]));
		}

		return tmpList;
	}
}

// --------- BaseDao private method --------- //

async function initSeq(this: BaseDao<BaseEntity>){
	this._seq = 1;
	var data = await db.getData(this._entity);
	var maxId = this._seq;
	for(var k in data){
		maxId = Math.max(parseInt(k), maxId);
	}
	this._seq = maxId;
}

function getSeq(this: BaseDao<BaseEntity>){
	return this._seq++;
}
// --------- /BaseDao private method --------- //



var filterDefaultOp = "=";
// Important: filters must be an array
function passFilter(item:any, filters:any){
	
	var pass;

	// each condition in a filter are OR, so, first match we can break out.
	// A condition item is a js object, and each property is a AND
	var i = 0, l = filters.length, cond, k, v, propName, op, itemV;
	for (; i < l; i++){
		pass = true;

		cond = filters[i];
		for (k in cond){
			// TODO: For now, just support the simple case where key is the property name
			//       Will need to add support for the operator in the key name
			propName = k;
			op = filterDefaultOp; // TODO: will need to get it for key

			// value to match
			v = cond[k];

			// item value
			itemV = item[propName];


			switch(op){
			case "=":
				// special case if v is null (need to test undefined)
				if (v === null){
					pass = pass && (itemV == null);
				}else{
					pass = pass && (v === itemV);	
				}
				
				break;				
			}

			// if one fail, break at false, since within an object, we have AND
			if (!pass){
				break;
			}
		}

		// if one of those condition pass, we can return true since within the top filter array we have OR.
		if (pass){
			break;
		}
	}

	return pass;
}
