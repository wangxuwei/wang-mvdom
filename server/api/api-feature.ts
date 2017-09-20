import { featureDao } from "../dao/daos";

const baseURI = "/api";
export const routes: any[] = [];
var entityType = "feature";

// --------- Gerneric APIs --------- //
routes.push({
	method: 'GET',
	path: baseURI + "/" + entityType + "/list", 
	handler: async function (request: any, reply: any) {
		var jsonString = request.url.query.opts;
		var opts = null;
		if(jsonString && jsonString != "undefined"){
			opts = JSON.parse(jsonString);
		}
		var list = await featureDao.list(opts);
		reply(list);
	}
});

routes.push({
	method: 'GET',
	path: baseURI + "/" + entityType + "/get",
	handler: async function(request: any, reply: any){
		var entity = await featureDao.get(parseInt(request.url.query.id));
		reply(entity || {});
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/" + entityType + "/create",
	handler: async function(request: any, reply: any){
		var entity = JSON.parse(request.payload.entity);
		entity = Object.assign({}, entity);
		var entityId = await featureDao.create(entity);
		entity.id = entityId;
		reply(entity);
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/" + entityType + "/update", 
	handler: async function(request: any, reply: any){
		var entity = JSON.parse(request.payload.entity);
		var id = request.payload.id * 1;
		entity = Object.assign({}, entity);
		entity = await featureDao.update(id, entity);
		reply(entity);
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/" + entityType + "/delete", 
	handler: async function(request: any, reply: any){
		var entityId = await featureDao.delete(request.payload.id);
		reply({id: entityId});
	}
});
// --------- /Generic APIs --------- //

routes.push({
	method: 'GET',
	path: baseURI + "/" + entityType + "/getFeaturesByRank",
	handler: async function(request: any, reply: any){
		var result = await featureDao.getFeaturesByRank();
		reply(result);
	}
});

routes.push({
	method: 'POST',
	path: baseURI + "/" + entityType + "/reorderFeatures",
	handler: async function(request: any, reply: any){
		var features = JSON.parse(request.payload.features);
		await featureDao.reorderFeatures(features);
		reply();
	}
});