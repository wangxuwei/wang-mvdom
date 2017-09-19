
export function elFrom(str:string){
	var node = document.createElement("div");
	node.innerHTML = str;
	return node.firstChild;
};

export function elCopy(el:HTMLElement){
	var html = el.outerHTML;
	var copyEl = elFrom(html);
	return copyEl;
};

export function elAbsOffset(el:any){
	var offset = {left: el.offsetLeft, top: el.offsetTop};
	if(el.offsetParent != null){
		var topOffset = elAbsOffset(el.offsetParent);
		offset.left += topOffset.left;
		offset.top += topOffset.top;
	}
	return offset; 
}