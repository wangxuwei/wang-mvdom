import { registerHelper } from "handlebars";

Handlebars.registerHelper("echo", function (cond: string, val: any) {
	return (cond) ? val : "";
});

Handlebars.registerHelper("symbol", function (name: string, classNames:string, options: any) {
	classNames = typeof classNames == 'string' ? classNames : '';
	var html = ['<svg class="symbol '+classNames+'">'];
	html.push('<use xlink:href="#' + name + '"></use>');
	html.push('</svg>');
	return html.join('\n');
});

Handlebars.registerHelper('check', function (this: any, lvalue:any, operator:string, rvalue:any, options:any) {
	
	var operators:any, result;

	if (arguments.length < 3) {
		throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
	}

	if (typeof options === "undefined") {
		options = rvalue;
		rvalue = operator;
		operator = "===";
	}

	operators = {
		'===': function (l:any, r:any) { return l === r; },
		'!==': function (l:any, r:any) { return l !== r; },
		'<': function (l:any, r:any) { return l < r; },
		'>': function (l:any, r:any) { return l > r; },
		'<=': function (l:any, r:any) { return l <= r; },
		'>=': function (l:any, r:any) { return l >= r; },
		'typeof': function (l:any, r:any) { return typeof l == r; }
	};

	if (!operators[operator]) {
		throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
	}

	result = operators[operator](lvalue, rvalue);

	if (result) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}

});

// we can use like this {{{incl "tmpl-test" data ...}}}
Handlebars.registerHelper("incl", function(templateName:string, data:any, options:any) {
	var params = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
	if(params.length == 1){
		params = params[0];
	}
	
	var tmpl = Handlebars.templates[templateName];
	var html = tmpl(params);
	return html;
});