import {on, closest, empty, trigger} from "mvdom";
import {entityRef} from "./utils";
import {dso} from "./ds";

/*
	Module: PROP-COMMIT
	Scope: app.domsync.*

	Responsibilities: 
		- Behavior make any data-prop element editable data-prop
		- TODO: provide API to put data into an DOM tree based on the data-prop pattern

	APIs:
		- None (for now), use and trigger DOM Events

	Structures: 
		- propInfo: {type:"",name:""} (ex {type:"Project",name:"name"})

  Events: 
    - Consume: "click;[data-editable]"
    - Trigger: "PROP_EDIT_COMMIT",propInfo when user press enter when editing
    - Trigger: "PROP_EDIT_CANCEL",propInfo if pressed esc
*/
(function(){
	// manage the click to edit logic
	on(document, "click", "[data-editable]:not(.active)" , (event) => {
		var target = closest(event.target, "[data-editable]")!;
		target.classList.add("active");
		var origVal  = target.innerText;
		var origHtml = target.innerHTML;
		var inputHTML = "<input type='text' />";
		var node = document.createElement("div");
		node.innerHTML = inputHTML;
		var inputEl = <HTMLInputElement>node.firstChild;
		inputEl.value = origVal;
		empty(target);
		target.appendChild(inputEl);
		inputEl.select()
		inputEl.focus();

		on(inputEl, "keyup", (event:any) => {
			// press enter
			if (event.which === 13){
				commit();
			}
			// press esc
			else if (event.which=== 27){
				cancel();
			}
		});

		// on loose focus, we cancel
		on(inputEl, "blur",function(){
			cancel();
		});


		function commit(){
			var propInfo:any = getPropInfo(target);
			propInfo.value = inputEl.value;
			trigger(target, "PROP_EDIT_COMMIT", {cancelable: false, detail: propInfo});
			target.classList.remove("active");			
		}

		function cancel(){
			empty(target);
			target.innerHTML = origHtml;
			trigger(target, "PROP_EDIT_CANCEL");
			target.classList.remove("active");				
		}
	});

	// return {type:"",name:""}
	// ex: data-prop="Project.name" >> {type="Project",name:"name"}
	function getPropInfo(propEl:HTMLElement){
		var dataPropStr = propEl.getAttribute("data-prop") + "";
		var typeAndName = dataPropStr.split(".");
		return {type:typeAndName[0],name:typeAndName[1]};
	}

})();

/*
	Module: COMMIT-TO-DAO

	Reponsibilities: 
		- Listen to the PROP-COMMIT event and call the appropriate DAO for an update

	Structures:
		- PROP-COMMIT.propInfo 
		- britejs.dao entityInfo

	Events:
		- Listen: PROP_EDIT_COMMIT
*/
(function(){
	// get the PROP_EDIT_COMMIT and change the 
	//FIXME: mvdom bug, can not get Data
	on(document, "PROP_EDIT_COMMIT", function(event:any){
		var propInfo = event.detail;
		var entityInfo = entityRef(event.target, propInfo.type);
		if (entityInfo){
			var vals:any = {};
			vals[propInfo.name] = propInfo.value;
			dso(entityInfo.type).update(entityInfo.id, vals);
		}else{
			console.log("WARNING: no parent " + propInfo.type + " element for", event.target);
		}
	});	
})();