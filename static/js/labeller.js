
function labeller () {
	
	// main -- main plot
	// context -- smaller context plot for zooming, scrolling

	//margins
	var main_margin = {top: 10, right: 10, bottom: 100, left: 40},
	context_margin = {top: 430, right: 10, bottom: 20, left: 40},
	width = 960 - main_margin.left - main_margin.right,
	main_height = 500 - main_margin.top - main_margin.bottom,
	context_height = 500 - context_margin.top - context_margin.bottom;

	//scales
	var main_xscale = d3.time.scale().range([0, width]),
	context_xscale = d3.time.scale().range([0, width]),
	main_yscale = d3.scale.linear().range([main_height, 0]),
	context_yscale = d3.scale.linear().range([context_height, 0]);

	//axes
	//can adjust multiscale time ticks: http://bl.ocks.org/mbostock/4149176
	var main_xaxis = d3.svg.axis().scale(main_xscale).orient("bottom"),
	context_xaxis = d3.svg.axis().scale(context_xscale).orient("bottom"),
	yaxis = d3.svg.axis().scale(main_yscale).orient("left");


	//plotting areas
	var svg = d3.select("#maindiv").append("svg")
	.attr("width", width + main_margin.left + main_margin.right)
	.attr("height", main_height + main_margin.top + main_margin.bottom);

	//something about clipping, not sure what this is doing yet
	svg.append("defs").append("clipPath")
	.attr("id", "clip")
	.append("rect")
	.attr("width", width)
	.attr("height", main_height);

	//main window
	var main = svg.append("g")
	.attr("class", "main")
	.attr("transform", "translate(" + main_margin.left + "," + main_margin.top + ")");

	// smaller context window
	var context = svg.append("g")
	.attr("class", "context")
	.attr("transform", "translate(" + context_margin.left + "," + context_margin.top + ")");

	//brushes
	var main_brush = d3.svg.brush()
	.x(main_xscale)
	.y(main_yscale)
	.on("brushend", brushed_main);

	var context_brush = d3.svg.brush()
	.x(context_xscale)
	.on("brush", brushed_context);

	//lines
	var main_line = d3.svg.line()
	.interpolate("monotone")
	.x(function(d) { return main_xscale(d.time); })
	.y(function(d) { return main_yscale(d.temp_c); });

	var context_line = d3.svg.line()
	.interpolate("monotone")
	.x(function(d) { return context_xscale(d.time); })
	.y(function(d) { return context_yscale(d.temp_c); });

	//load data and adjust scales
	var data;
	var quadtree
	var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

	function type(d) {
	  d.time = parseDate(d.time);
	  d.temp_c = +d.temp_c;
	  d.selected = +d.selected;
	  return d;
	}

	function pad_extent(extent,padding){
	  padding = (typeof padding === "undefined") ? 0.01 : padding;
	  range=extent[1]-extent[0];
	  //1*x is quick hack to handle date/time axes
	  return [(1*extent[0])-padding*range,(1*extent[1])+padding*range];

	}

	function init () {
	
		data=window.PLOTDATA;
		data = data.map(type);

	  //set scales based on loaded data
	  main_xscale.domain(pad_extent(d3.extent(data.map(function(d) { return d.time; }))));
	  main_yscale.domain(pad_extent(d3.extent(data.map(function(d) { return d.temp_c; }))));
		
	  context_xscale.domain(main_xscale.domain());
	  context_yscale.domain(main_yscale.domain());

	  //generate quadmap to handle brushing of the main plot
	  data.map(function(d){d.x=main_xscale(d.time);
	   d.y=main_yscale(d.temp_c);
	   return d;});

	  quadtree=d3.geom.quadtree(data);

	  //make the plots
	  makeplot(data);

	  //set default extent for context
	  var defaultExtent = [context_xscale.domain()[0],context_xscale.invert(context_xscale.range()[1]*(1/7))];
	  svg.select(".context_brush").call(context_brush.extent(defaultExtent));

	  //run brushing functions to make sure everything highlighted right
	  brushed_context();
	  brushed_main();
	}

	$(function () {
	 init();
	});

	//inital plotting function
	function makeplot(data) {
	  //main plot
	  main.append("path")
	  .datum(data)
	  .attr("class", "line")
	  .attr("d", main_line);

	  main.selectAll(".point")
	  .data(data)
	  .enter().append("circle")
	  .attr("class", "point")
	  .attr("cx", function(d) { return main_xscale(d.time); })
	  .attr("cy", function(d) { return main_yscale(d.temp_c); })
	  .attr("r", 4);

	  main.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + main_height + ")")
	  .call(main_xaxis);

	  main.append("g")
	  .attr("class", "y axis")
	  .call(yaxis);

	  main.append("g")
	  .attr("class", "main_brush")
	  .call(main_brush)
	  .call(main_brush.event);

	  //context plot
	  context.append("path")
	  .datum(data)
	  .attr("class", "line")
	  .attr("d", context_line);

	  context.selectAll(".point")
	  .data(data)
	  .enter().append("circle")
	  .attr("class", "point")
	  .attr("cx", function(d) { return context_xscale(d.time); })
	  .attr("cy", function(d) { return context_yscale(d.temp_c); })
	  .attr("r", 2);

	  context.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + context_height + ")")
	  .call(context_xaxis);


	  context.append("g")
	  .attr("class", "context_brush")
	  .call(context_brush)
	  .selectAll("rect")
	  .attr("y", -6)
	  .attr("height", context_height + 7);
	}



	function brushed_context() {
	  main_xscale.domain(context_brush.empty() ? context_xscale.domain() : context_brush.extent());

	  main.select(".line")
	  .attr("d", main_line);

	  main.selectAll(".point")
	  .attr("cx", function(d) { return main_xscale(d.time); });

	  main.select(".x.axis").call(main_xaxis);
	  }



	//keyboard functions to change the focus
	function transform_context(shift,scale) {
	  var currentExtent=context_brush.extent();

	  var offset0=((1-Math.pow(1.1,scale))+0.1*shift)*(currentExtent[1]-currentExtent[0]);
	  var offset1=((Math.pow(1.1,scale)-1)+0.1*shift)*(currentExtent[1]-currentExtent[0]);

	  //don't shift past the ends of the scale
	  //still need to work on the limiting code : scroll right shrinks.
	  var limits=context_xscale.domain();

	  //if we go off the left edge, don't allow us to move left
	  if((1*currentExtent[0])+offset0<limits[0]){
	    shift=0;
	    offset0=limits[0]-currentExtent[0];
	    offset1=offset0+((Math.pow(1.1,scale)-1)+0.1*shift)*(currentExtent[1]-currentExtent[0]);
	  }

	  //if we go off the right edge, don't allow us to move right
	  if((1*currentExtent[1])+offset1>limits[1]){
	    shift=0;
	    offset1=limits[1]-currentExtent[1];
	    offset0=offset1+((1-Math.pow(1.1,scale))+0.1*shift)*(currentExtent[1]-currentExtent[0]);
  
	  }

	//double check that the last bit didn't push us too far left
	  if((1*currentExtent[0])+offset0<limits[0]){
	    shift=0;
	    offset0=limits[0]-currentExtent[0];
	  }


	  //do shift and update brushing
	  var newExtent=[(1*currentExtent[0])+offset0,(1*currentExtent[1])+offset1];
	  svg.select(".context_brush").call(context_brush.extent(newExtent));

	  brushed_context();
	}

	function transform_wrapper(shift,scale){
	   return function(event) {
	        event.preventDefault();
	        transform_context(shift,scale);
	    };

	}

	d3.select('body').call(d3.keybinding()
	    .on('←', transform_wrapper(-1,0))
	    .on('→', transform_wrapper(1,0))
	    .on('↑', transform_wrapper(0,-1))
	    .on('↓', transform_wrapper(0,1)));

	// Find the nodes within the specified rectangle.
	function search(quadtree, brush_xmin, brush_ymin, brush_xmax, brush_ymax) {
	  quadtree.visit(function(node, rect_xmin, rect_ymin, rect_xmax, rect_ymax) {
	    var p = node.point;
	    if (p){
	      //select based on xor (so brushing toggles all points under brush)
	      p.selected = p.selected ^ ((p.x >= brush_xmin) && (p.x <= brush_xmax) && (p.y >= brush_ymin) && (p.y <= brush_ymax));

				post(p);
	    }
	    //true if brush and quadtree rectangle don't over lap -- we didn't brush anything in here.
	    //therefore, don't look at children of this node
	    return rect_xmin > brush_xmax || rect_ymin > brush_ymax || rect_xmax < brush_xmin || rect_ymax < brush_ymin;
	  });
	}

	function brushed_main(){
	  var extent = main_brush.extent();
	  //point.each(function(d) { d.selected = false; });
	  //convert based on context_xscale because this is what quadtree is defined on
	  // search(quadtree, context_xscale(extent[0][0]), main_yscale(extent[0][1]), context_xscale(extent[1][0]), main_yscale(extent[1][1]));
	  search(quadtree, context_xscale(extent[0][0]), main_yscale(extent[1][1]), context_xscale(extent[1][0]), main_yscale(extent[0][1]));

	  main.selectAll(".point").classed("selected", function(d) { return d.selected; });
	  context.selectAll(".point").classed("selected", function(d) { return d.selected; });
	  d3.selectAll(".main_brush").call(main_brush.clear());
	}

	function post (p) {
		$.ajax({
			type: "POST",
			url: "/point",
			data: JSON.stringify(p),
			dataType: 'json',
			contentType: 'application/json'
		});
	}
	
}


if (window.PLOTDATA) { labeller(); }