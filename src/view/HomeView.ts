import { BaseView, addDomEvents, addHubEvents } from "../base";
import { closest, all, first, empty, prev, remove } from "mvdom";
import { elAbsOffset, elCopy, elFrom } from "../ts/app";
import { entityRef } from "../ts/utils";
import { render } from "../ts/render";
import { dso } from "../ts/ds";

export class HomeView extends BaseView {
	_dragItem: any;
	_dragHolder: any;
	_lastPageX: any;
	_currentBarWidth: any;
	_startValue: any;

	postDisplay() {
		var view = this; // best practice, set the view variable first. 
		refreshLists.call(view);
	}

	events = addDomEvents(this.events, {
		// create new item
		"keyup; input.new-feature": (evt:any) => {
			var inputEl = evt.target;

			// enter
			if (evt.which === 13){
				var val = inputEl.value;
				dso("Feature").create({name: val}).then(() => {
					inputEl.value = "";
				});
			}
		},

		"click; .table-header .row .cell.feature .edit": (evt:any) => {
			var view = this;
			var targetEl = evt.target;
			var tableEl = closest(targetEl, ".table")!;
			if(targetEl.classList.contains("active")){
				targetEl.classList.remove("active");
				targetEl.innerHTML = "edit";
				tableEl.classList.remove("drag-edit-mode");
			}else{
				targetEl.classList.add("active");
				targetEl.innerHTML = "view";
				tableEl.classList.add("drag-edit-mode");
			}
		},

		"click; .table-header .row .cell.impl .edit": (evt:any) => {
			var view = this;
			var targetEl = evt.target;
			var tableEl = closest(targetEl, ".table")!;
			if(targetEl.classList.contains("active")){
				targetEl.classList.remove("active");
				targetEl.innerHTML = "edit";
				tableEl.classList.remove("edit-mode");
				all(view.el, ".rows-con [data-prop]:not(.progress-cell)").forEach((propEl:any) => {
					propEl.removeAttribute("data-editable");
				});
			}else{
				targetEl.classList.add("active");
				targetEl.innerHTML = "view";
				tableEl.classList.add("edit-mode");
				all(view.el, ".rows-con [data-prop]:not(.progress-cell)").forEach((propEl:any) => {
					propEl.setAttribute("data-editable", "");
				});
			}
		},

		"mousedown; .row .drag-col .icon": (evt:any) => {
			var view = this;
			var targetEl = evt.target;
			var rowEl = closest(targetEl, ".row")!;
			var rowCloneEl = elCopy(rowEl);
			var rowsConEl = closest(targetEl, ".rows-con")!;

			view._dragItem = rowCloneEl;
			view._dragHolder = rowEl;

			view._dragHolder.classList.add("drag-holder");
			view._dragItem.classList.add("drag-item");
			rowsConEl.appendChild(view._dragItem);

			view._dragItem.style.left = evt.pageX + "px";
			view._dragItem.style.top = evt.pageY + "px";
			view._dragItem.style.opacity = .5;
		},

		"mousedown; .row .slide-valve": (evt:any) => {
			var view = this;
			var targetEl = evt.target;
			view._dragItem = targetEl;
			view._lastPageX = evt.pageX;
			view._currentBarWidth = closest(targetEl, ".slide-con")!.clientWidth;

			// set init value
			view._startValue = elAbsOffset(view._dragItem).left + view._dragItem.clientWidth / 2 - elAbsOffset(closest(targetEl, ".slide-con")).left;
		},

		"keyup; .slide-bar input": (evt:any) => {
			var view = this;
			var inputEl = evt.target;
			var slideBarEl = closest(inputEl, ".slide-bar");
			
			// enter
			if (evt.which === 13){
				var val = inputEl.value;
				if(!val){
					val = 0;
				}

				setPosition.call(view, slideBarEl, val);
			}
		},

		// show slide bar
		"click; .table.edit-mode .progress-bar": (evt:any) => {
			var view = this;
			var progressBarEl = closest(evt.target, ".progress-bar")!;
			var cellEl = closest(progressBarEl, ".cell")!;
			var value = progressBarEl.getAttribute("data-progress")!;
			let valueNum = isNaN(parseInt(value)) ? 0 : parseInt(value);

			var slideBarEl = render("HomeView-slide-bar");
			setPosition.call(view, slideBarEl, valueNum);

			empty(cellEl);
			cellEl.appendChild(slideBarEl);
			cellEl.classList.add("init-slide-cell");
		},

		"click; .btn-delete": (evt:any) => {
			var view = this;
			var entityInfo:any = entityRef(evt.target);
			dso(entityInfo.type).remove(entityInfo.id);
		}
	});

	docEvents = addDomEvents({}, {
		"click": (evt:any) => {
			var view = this;
			var targetEl = evt.target;
			var currentProgressCell = closest(targetEl, ".cell.progress-cell");

			all(view.el, ".cell.progress-cell").forEach(function(cellEl){
				if(!currentProgressCell || currentProgressCell != cellEl){
					var slideBarEl = first(cellEl, ".slide-bar");
					// FIXME stopPropagation can not work
					if(!cellEl.classList.contains("init-slide-cell")){
						if(slideBarEl){
							empty(cellEl);
							var value  = (<HTMLInputElement>first(slideBarEl, "input")).value;
							let valueNum = isNaN(parseInt(value)) ? 0 : parseInt(value);
							var progressBarEl = render("HomeView-progress-bar", value);
							cellEl.appendChild(progressBarEl);

							var propInfo:any = getPropInfo(cellEl);
							propInfo.value = value;
							var entityInfo = entityRef(cellEl, propInfo.type);
							if (entityInfo){
								var vals:any = {};
								vals[propInfo.name] = propInfo.value;
								dso(entityInfo.type).update(entityInfo.id, vals);
							}
						}
					}
					cellEl.classList.remove("init-slide-cell");
				}
			});
		},
		"mousemove": (evt:any) => {
			var view = this;
			if(view._dragItem){

				// for table rows
				if(view._dragItem.classList.contains("row")){
					view._dragItem.style.left = evt.pageX + "px";
					view._dragItem.style.top = evt.pageY + "px";

					var rowsConEl = closest(view._dragItem, ".rows-con")!;
					var rows = all(rowsConEl, ".row:not(.drag-item):not(.drag-holder)");
					for(var i = 0; i < rows.length; i++){
						var row = rows[i];
						var rowOffset = elAbsOffset(row);
						if(evt.pageX > rowOffset.left && evt.pageY > rowOffset.top && evt.pageX < rowOffset.left + row.clientWidth && evt.pageY < rowOffset.top + row.clientHeight){
							if(evt.pageY > rowOffset.top + row.clientHeight / 2){
								rowsConEl.insertBefore(view._dragHolder, row);
								rowsConEl.insertBefore(row, view._dragHolder);
							}else{
								rowsConEl.insertBefore(view._dragHolder, row);
							}

							var dargNameEl = first(view._dragItem, ".name");
							var holderNameEl = first(view._dragHolder, ".name");
							var parentId = row.getAttribute("data-parent-id");
							if(parentId){
								view._dragItem.classList.add("secondary");
								view._dragHolder.classList.add("secondary");
							}else{
								if(evt.pageX - rowOffset.left > 24){
									var prevRow = prev(view._dragHolder, ".row:not(.secondary)");
									if(prevRow){
										view._dragItem.classList.add("secondary");
										view._dragHolder.classList.add("secondary");
									}else{
										view._dragItem.classList.remove("secondary");
										view._dragHolder.classList.remove("secondary");
									}
								}else{
									view._dragItem.classList.remove("secondary");
									view._dragHolder.classList.remove("secondary");
								}
							}
							break;
						}
					}
				// for slide valve
				}else if(view._dragItem.classList.contains("slide-valve")){
					var deltaX = evt.pageX - view._lastPageX + view._startValue;
					var left = deltaX / view._currentBarWidth;
					left = left > 1 ? 1 : left;
					left = left < 0 ? 0 : left;
					left = Math.floor(left * 100);
					view._dragItem.style.left = left + "%";

					var slideBarEl = closest(view._dragItem, ".slide-bar")!;
					(<HTMLInputElement>first(slideBarEl, "input")).value = left.toString();
				}
				
			}
		},

		"mouseup": (evt:any) => {
			var view = this;
			if(view._dragItem){
				// for table rows
				if(view._dragItem.classList.contains("row")){
					remove(view._dragItem);

					if(view._dragHolder.classList.contains("secondary")){
						var parentRow = prev(view._dragHolder, ".row:not(.secondary)");
						if(parentRow){
							view._dragHolder.setAttribute("data-parent-id", parentRow.getAttribute("data-entity-id"));
						}else{
							view._dragHolder.setAttribute("data-parent-id", "");
						}
					}else{
						view._dragHolder.setAttribute("data-parent-id", "");
					}

					view._dragHolder.classList.remove("drag-holder");
					view._dragHolder = null;
					saveOrders.call(view);
				}


				view._dragItem = null;
			}
		}
	});

	hubEvents = addHubEvents(this.hubEvents, {
		"dsHub; Feature": (data,info) => {
			refreshLists.call(this);
		}
	});
}





function refreshLists(this: HomeView){
	var view = this;
	var tableEl = first(view.el, ".table")!;
	var conEl = first(tableEl, ".table-content .rows-con")!;
	empty(conEl);
	dso("Feature").getFeaturesByRank().then((features:any) => {
		features = features || [];
		for(var i = 0; i < features.length; i++){
			var item = features[i];
			item.totalRequirementProgress = item.totalRequirementProgress || 0;
			item.totalFunctionalProgress = item.totalFunctionalProgress || 0;
			var html = render("HomeView-table-row-item", item);
			conEl.appendChild(html);
		}

		if(tableEl.classList.contains("edit-mode")){
			all(conEl, "[data-prop]:not(.progress-cell)").forEach((propEl) => {
				propEl.setAttribute("data-editable", "");
			});
		}
	});	
}

function saveOrders(this: HomeView){
	var view = this;
	var features:any[] = [];
	all(view.el, ".rows-con .row").forEach((row) => {
		var obj:any = entityRef(row, "Feature");
		delete obj.type;
		obj.parentId = row.getAttribute("data-parent-id");
		obj.parentId = obj.parentId ? obj.parentId * 1 : null;
		features.push(obj);
	});
	dso("Feature").reorderFeatures(features);
}

function setPosition(this: HomeView, slideBarEl:any, value:any){
	var view = this;
	value = value * 1;
	value = isNaN(value) ? 0 : value;

	var inputEl = <HTMLInputElement>first(slideBarEl, "input")!;
	var valveEl = first(slideBarEl, ".slide-valve")!;

	inputEl.value = value;
	valveEl.style.left = value + "%";

}

function getPropInfo(propEl:any){
	var dataPropStr = propEl.getAttribute("data-prop");
	var typeAndName = dataPropStr.split(".");
	return {type:typeAndName[0],name:typeAndName[1]};
}
