$(document).ready(function(){
	
	// Pixel for grid, drag and drop
	var pixel = 10;
	
	// Canvas
	var canvas = document.getElementById("canvas");
	canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	var ctx = canvas.getContext("2d");
	ctx.lineWidth = 1;
	ctx.font = $('#drop').css('font-size') + " " + $('#drop').css('font-familly');
	ctx.fillStyle = "blue";
	ctx.textAlign = "center";
	
	// Connectors list
	var connectors = [];
	
	// Current connector
	var connector = null;
	
	// Last clicked shape
	var current = null;
	
	// Grid creation
	createGrid();
	
	// Click on a shape component
	$('.component').click(function() {
		// Create the shape
		var drop = $('#drop');
		var component = $(this).html();
		var drag  = $('<div></div>');
		drag.addClass("drag");
		drag.html(component);
		current = drag.children(".shape");
		defaultShape();
		drop.prepend(drag);
		displayPanel(true);
		// Positioning correction
		drag.outerHeight(Math.ceil(drag.outerHeight() / pixel) * pixel);
		drag.outerWidth(Math.ceil(drag.outerWidth() / pixel) * pixel);
		
		// Click
		drag.click(function() {
			current = $(this).children(".shape");
			// Attach the connector with component
			if(connector != null) {
				if(connector.from == null) {
					connector.from = $(this).children(".shape");
				} else {
					connector.into = $(this).children(".shape");
					connectors.push(connector);
					connector = null;
					resetConnector();
					connect();
				}
			}
			displayPanel(true);
		});
		
		// Drag
		drag.draggable({
			containment : drop,
			grid : [pixel , pixel],
			cursor: "crosshair",
			drag: connect,
			stop: function() {
				// Positioning correction
				var left = $(this).css("left").replace("px", "");
				var top = $(this).css("top").replace("px", "");
				if(left % 10 != 0) {
					$(this).css("left", Math.floor(left / pixel) * pixel);
				}
				if(top % 10 != 0) {
					$(this).css("top", Math.floor(top / pixel) * pixel);
				}
				
				connect();
				current = drag.children(".shape");
				displayPanel(true);
			}
		});
		
		// Resize
		drag.resizable({
			containment : drop,
			grid : [pixel , pixel],
			minWidth : 80,
			minHeight : 60,
			resize: function() {
				updateScroll($(this).children(".shape"));
				connect();
			},
			stop:  function() {
				connect();
				current = drag.children(".shape");
				displayPanel(true);
			}
		});
		
		// Auto resize with double click
		drag.find(".ui-resizable-se").dblclick(function() {
			var shape = drag.children(".shape")
			// Create a clone for get the default height and width
			var clone = shape.clone();
			clone.css("visibility","hidden");
			clone.css("display","inline-block");
			clone.css("position","absolute");
			clone.css("width","auto");
			clone.css("height","auto");
			drop.prepend(clone);
			var height = clone.outerHeight();
			var width = clone.outerWidth();
			clone.remove();
			drag.outerHeight(Math.ceil(height / pixel) * pixel);
			drag.outerWidth(Math.ceil(width / pixel) * pixel);
			
			updateScroll(shape);
			connect();
		});
		
	});
	
	// Deactivate the connector, panel and remove the shape focus
	$(document).click(function (e) {
		var target = $(e.target);
		var focused = $(':focus');
		if(connector != null) {
			if (!(target.hasClass("drag") || target.parents().hasClass("drag") || target.hasClass("connector") || target.parents().hasClass("connector"))) {
				connector = null;
				resetConnector();
				connect();
			}
		}
		if(current != null && !(focused.parents().hasClass("menu-right") || target.hasClass("menu-right") || target.parents().hasClass("menu-right") || target.hasClass("drag") || target.parents().hasClass("drag"))) {
			displayPanel(false);
			current = null;
		}
	});
	
	// Attach component connector to cursor
	$("#drop").mousemove(function(e) {
		if(connector != null && connector.from != null && connector.into == null) {
			connect();
			var rect = canvas.getBoundingClientRect();
			var x = e.pageX - rect.left;
			var y = e.pageY - rect.top;
			var attr = getAttribute(connector.from);
			var slope = getSlope(attr.x, attr.y, x, y);
			var baseline = getBaseline(slope);
			var from = shape(attr, slope, x, y);
			
			drawConnector(connector.type, from.x, from.y, x, y, connector.text, baseline);
		}
	});
	
	// Line connector
	$("#arrow-line").click(function() {
		resetConnector();
		$(this).addClass("active");
		connector = {
			type: "line",
			text: $('#arrow-text').val().trim(),
			from: null,
			into: null
		}
	});
	
	// Point connector
	$("#arrow-point").click(function() {
		resetConnector();
		$(this).addClass("active");
		connector = {
			type: "point",
			text: $('#arrow-text').val().trim(),
			from: null,
			into: null
		}
	});
	
	// Fill connector
	$("#arrow-fill").click(function() {
		resetConnector();
		$(this).addClass("active");
		connector = {
			type: "fill",
			text: $('#arrow-text').val().trim(),
			from: null,
			into: null
		}
	});
	
	// Content text
	$("#content").on('input', function () {
		current.html($(this).val().trim().replace(/\n/g, "<br>"));
	});
	
	// Background color
	$("#background").on('input', function () {
		current.css("background-color", $(this).val());
	});
	
	// Horizontal align text
	$("input[name=h-align]").change(function () {
		var value = $(this).val();
		current.css("justify-content", value);
		if(value == "center") {
			current.css("text-align", "center");
		} else if(value == "flex-end") {
			current.css("text-align", "right");
		} else {
			current.css("text-align", "left");
		}
	});
	
	// Vertical align text
	$("input[name=v-align]").change(function () {
		current.css("align-items", $(this).val());
	});
	
	// Text size
	$("#textsize").on('input', function () {
		var value = parseInt($(this).val());
		var min = parseInt($(this).attr('min'));
		var max = parseInt($(this).attr('max'));
		if(isNaN(value)) {
			value = 16;
		} else if (value < min) {
			value = min;
		} else if (value > max) {
			value = max;
		}
		current.css("font-size", value + "px");
	});
	
	// Text family
	$("#textfamily").on('input', function () {
		current.css("font-family", $(this).val());
	});
	
	// Text style
	$("#textbold").change(function () {
		if($(this).is(':checked')) {
			current.css("font-weight", "bold");
		} else {
			current.css("font-weight", "normal");
		}
	});
	$("#textitalic").change(function () {
		if($(this).is(':checked')) {
			current.css("font-style", "italic");
		} else {
			current.css("font-style", "normal");
		}
	});
	$("#textunderline").change(function () {
		if($(this).is(':checked')) {
			current.css("text-decoration-line", "underline");
		} else {
			current.css("text-decoration-line", "none");
		}
	});
	
	// Text color
	$("#textcolor").on('input', function () {
		current.css("color", $(this).val());
	});
	
	// Connectors shape
	$("#remove").click(function () {
		var i = $('#arrows').val();
		connectors.splice(i, 1);
		connect();
		getConnectors();
	});
	
	// Delete shape and connectors
	$("#delete").click(function () {
		for (var i = connectors.length - 1; i >= 0; i--) {
			var c = connectors[i];
			if(current[0] == c.from[0] || current[0] == c.into[0]) {
				connectors.splice(i, 1);
			}
		}
		connect();
		current.parent().remove();
		displayPanel(false);
		current = null;
	});
	
	// Grid creation
	function createGrid() {
		var gridSize = pixel * 4;
		var smallGridSize = pixel;
		$("#drop").append('<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
				'<defs>' +
					'<pattern id="smallGrid" width="' + smallGridSize + '" height="' + smallGridSize + '" patternUnits="userSpaceOnUse">' +
						'<path d="M ' + smallGridSize + ' 0 L 0 0 0 ' + smallGridSize + '" fill="none" stroke="gray" stroke-width="0.25"/>' +
					'</pattern>' +
					'<pattern id="grid" width="' + gridSize + '" height="' + gridSize + '" patternUnits="userSpaceOnUse">' +
						'<rect width="100%" height="100%" fill="url(#smallGrid)"/>' +
						'<path d="M ' + gridSize + ' 0 L 0 0 0 ' + gridSize + '" fill="none" stroke="gray" stroke-width="0.5"/>' +
					'</pattern>' +
				'</defs>' +
				'<rect width="100%" height="100%" fill="url(#grid)" />' +
			'</svg>'
		);
	}
	
	// Default properties for shape
	function defaultShape() {
		current.css("background-color", "white");
		current.css("align-items", "center");
		current.css("text-align", "center");
		current.css("justify-content", "center");
		current.css("font-size", "16px");
		current.css("color", "black");
	}
	
	// Allows to add/remove focus and enable or disable the panel element 
	function displayPanel(display) {
		if(display) {
			$(".shape").removeClass("focus");
			current.addClass("focus");
			$("#content").val(current.html().trim().replace(/<br>/g, "\n"));
			$("#background").val(rgbToHex(current.css("background-color")));
			$("input[name=h-align][value=" + current.css("text-align") + "]").prop("checked", true);
			$("input[name=v-align][value=" + current.css("align-items") + "]").prop("checked", true);
			$("#textsize").val(current.css("font-size").replace("px", ""));
			$("#textfamily").val(current.css("font-family"));
			if(current.css("font-weight") == "700") {
				$("#textbold").prop("checked", true);
			} else {
				$("#textbold").prop("checked", false);
			}
			if(current.css("font-style") == "italic") {
				$("#textitalic").prop("checked", true);
			} else {
				$("#textitalic").prop("checked", false);
			}
			if(current.css("text-decoration-line") == "underline") {
				$("#textunderline").prop("checked", true);
			} else {
				$("#textunderline").prop("checked", false);
			}
			$("#textcolor").val(rgbToHex(current.css("color")));
			getConnectors();
		} else {
			current.removeClass("focus");
			$("#content").val("");
			$("#background").val("#ffffff");
			$("input[name=v-align]").prop("checked", false);
			$("input[name=h-align]").prop("checked", false);
			$("#textsize").val("");
			$("#textfamily").val("");
			$("#textbold").prop("checked", false);
			$("#textitalic").prop("checked", false);
			$("#textunderline").prop("checked", false);
			$("#textcolor").val("#000000");
			$("#arrows").empty();
		}
		$("#content").prop('disabled', !display);
		$("#background").prop('disabled', !display);
		$("input[name=v-align]").prop('disabled', !display);
		$("input[name=h-align]").prop('disabled', !display);
		$("#textsize").prop('disabled', !display);
		$("#textfamily").prop('disabled', !display);
		$("#textbold").prop('disabled', !display);
		$("#textitalic").prop('disabled', !display);
		$("#textunderline").prop('disabled', !display);
		$("#textcolor").prop('disabled', !display);
		$("#arrows").prop('disabled', !display);
		$("#remove").prop('disabled', !display);
		$("#delete").prop('disabled', !display);
	}
	
	// RGB to HEX
	function rgbToHex(rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	}
	
	// Integer value to HEX
	function hex(x) {
		var hex = parseInt(x).toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	
	function resetConnector() {
		$("#arrow-line").removeClass("active");
		$("#arrow-point").removeClass("active");
		$("#arrow-fill").removeClass("active");
	}
	
	// Connectors choice
	function getConnectors() {
		$("#arrows").empty();
		for (var i = 0; i < connectors.length; i++) {
			var c = connectors[i];
			if(current[0] == c.from[0] || current[0] == c.into[0]) {
				var text = i.toString();
				if(c.text != "") {
					text += " - " + c.text;
				}
				$("#arrows").append(new Option(text, i));
			}
		}
		if($("#arrows option").length == 0) {
			$("#arrows").append(new Option("", ""));
		}
	}
	
	// Allows to remove the scroll bar for automatic resize
	function updateScroll(shape) {
		shape.css("overflow", "hidden");
		setTimeout(function(){
		   shape.css("overflow", "");
		},20); // Timer for DOM update scrollbar
	}
	
	// Draw all connectors
	function connect() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (var i = 0; i < connectors.length; i++) {
			var c = connectors[i];
			var attr1 = getAttribute(c.from);
			var attr2 = getAttribute(c.into);
			var slope = getSlope(attr1.x, attr1.y, attr2.x, attr2.y);
			var baseline = getBaseline(slope);
			var from = shape(attr1, slope, attr2.x, attr2.y);
			var into = shape(attr2, slope, attr1.x, attr1.y);
			
			drawConnector(c.type, from.x, from.y, into.x, into.y, c.text, baseline);
		}
	}
	
	// Get axis position, width, height and type
	function getAttribute(shape) {
		var rect = canvas.getBoundingClientRect();
		var w = shape.outerWidth() / 2;
		var h = shape.outerHeight() / 2;
		var x = shape.offset().left + w - rect.left;
		var y = shape.offset().top + h - rect.top;
		var t = null;
		if(shape.hasClass("shape-square")) {
			t = "square";
		}
		return {
			x: x,
			y: y,
			w: w,
			h: h,
			t: t
		};
	}
	
	// Get Slope between two point
	function getSlope(x1, y1, x2, y2) {
		var slope;
		if(x2 == x1) {
			slope = null;
		} else {
			slope = (y2 - y1) / (x2 - x1);
			slope = Math.abs(slope);
		}
		return slope;
	}
	
	// Get spacing for text connector
	function getBaseline(slope) {
		var baseline = 5;
		if(slope == 0) {
			baseline = -baseline;
		} else if(slope != null) {
			if(slope <= 1) {
				baseline = (slope - 1) * baseline;
			} else {
				baseline = (-1 / slope + 1) * baseline;
			}
		}
		return baseline;
	}
	
	// Points coordinates for a shape
	function shape(attr, slope, x2, y2) {
		var pos = null
		if(attr.t == "square") {
			pos = square(attr, slope, x2, y2);
		} else {
			pos = {x: attr.x, y: attr.y};
		}
		return pos;
	}
	
	// Points coordinates for a square
	function square(attr, slope, x2, y2) {
		var x = attr.x;
		var y = attr.y;
		if(slope == null) {
			if(y <= y2) {
				y = y + attr.h;
			} else {
				y = y - attr.h;
			}
		} else if(slope == 0) {
			if(x <= x2) {
				x = x + attr.w;
			} else {
				x = x - attr.w;
			}
		} else {
			var q = Math.min(attr.w, attr.h / slope);
			if(x <= x2) {
				x = x + q;
			} else {
				x = x -  q;
			}
			if(y <= y2) {
				y = y + slope * q;
			} else {
				y = y - slope * q;
			}
		}
		return {x: x, y: y}
	}
	
	// Draw connector
	function drawConnector(type, x1, y1, x2, y2, text, baseline) {
		ctx.beginPath();
		if(type == "line") {
			drawLine(x1, y1, x2, y2);
		} else if(type == "point") {
			drawLine(x1, y1, x2, y2);
			drawPoint(x1, y1, x2, y2);
		} else if(type == "fill") {
			drawLine(x1, y1, x2, y2);
			drawFill(x1, y1, x2, y2);
		}
		if(text != null) {
			ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2 + baseline);
		}
		ctx.stroke();
	}
	
	// Draw line connector
	function drawLine(x1, y1, x2, y2) {
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
	}
	
	// Draw point arrow
	function drawPoint(x1, y1, x2, y2) {
		var headArrow = 10; // length of head arrow in pixels
		var dx = x2 - x1;
		var dy = y2 - y1;
		var angle = Math.atan2(dy, dx);
		
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - headArrow * Math.cos(angle - Math.PI / 6), y2 - headArrow * Math.sin(angle - Math.PI / 6));
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - headArrow * Math.cos(angle + Math.PI / 6), y2 - headArrow * Math.sin(angle + Math.PI / 6));
	}
	
	// Draw fill point arrow
	function drawFill(x1, y1, x2, y2) {
		var fillStyle = ctx.fillStyle; // Keep default style
		var headArrow = 10; // length of head arrow in pixels
		var dx = x2 - x1;
		var dy = y2 - y1;
		var angle = Math.atan2(dy, dx);

		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - headArrow * Math.cos(angle - Math.PI / 6), y2 - headArrow * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(x2 - headArrow * Math.cos(angle + Math.PI / 6), y2 - headArrow * Math.sin(angle + Math.PI / 6));
		ctx.fillStyle = "black";
		ctx.fill();
		ctx.fillStyle = fillStyle;
	}
	
});