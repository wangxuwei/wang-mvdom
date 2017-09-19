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