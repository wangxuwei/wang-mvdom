import * as fs from "fs-extra-plus";
import * as path from "path";
var dataPath = "../../db/";

export module db {
	export async function getData(type: string) : Promise<{ [name: string]: {} }>{
		var jsonObject = {};
		try{
			let data = await fs.readFile(getJsonFile(type), 'utf8');
			jsonObject = JSON.parse(data);
		}catch(e){
		}
		return jsonObject;
	}

	export async function setData(type: string, jsonObject:{ [name: string]: {} }){
		let jsonData = JSON.stringify(jsonObject);
		var file = getJsonFile(type);
		await fs.writeFile(file, jsonData, {encoding: "utf8"});
	}
}

function getJsonFile(type: string){
	var filePath = path.join(__dirname, dataPath);
	fs.ensureDirSync(filePath);
	return path.join(__dirname, dataPath + type.toLowerCase() + ".json");
}
