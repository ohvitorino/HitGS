/**
 * Created by brunop on 1/28/2015.
 */

$(function () {
	"use strict";

	// DOM Elements

	var btnSubmit = $('#btnSubmit');
	var txtLayerName = $('#txtLayerName');
	var txtServerURL = $('#txtServer');
	var lblErrorLayerName = $('#lblErrorLayerName');
	var ddlRequestType = $('#ddlRequestType');
	var ddlOutputFormat = $('#ddlOutputFormat');
	var txtRequest = $('#txtRequest');
	var txtCQL = $('#txtCQL');
	var txtResult = $('#txtResult');
	var txtMaxFeatures = $('#txtMaxFeatures');

	if (ol !== 'undefined') {
		var map = new ol.Map({
			target: 'map',
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM()
				})
			],
			view: new ol.View({
				center: ol.proj.transform([3.4963456, 51.4455533], 'EPSG:4326', 'EPSG:3857'),
				zoom: 2
			})
		});
	}

	// Vars

	var counter = null;

	// Methods

	var prepareServerURL = function (url) {
		if (url.indexOf('/', url.length - 1) == -1) {
			url += '/';
		}
		return url;
	};

	var requestServerInformation = function () {
		var url = txtServerURL.val();

		url = prepareServerURL(url) + 'rest/workspaces.json';

		$.ajax({
			url: 'proxy.php',

			data: {
				url: url
			},

			type: 'GET',
			dataType: 'json',

			contentType: 'application/json',

			success: function (data) {
				console.log(data);
			},
			error: function (xhr, ajaxOptions, throwError) {
				console.error(xhr);
			}
		});
	};

	var handleServerNameInput = function () {
		clearTimeout(counter);
		counter = setTimeout(requestServerInformation, 2000);
	};

	var validateLayerName = function () {
		var layerName = $(this).val();

		if (/\w:\w/.test(layerName.trim()) === false) {
			lblErrorLayerName.text('Wrong format. Use "workspace:layer".');
		} else {
			lblErrorLayerName.text('');
		}

	};

	var generateRequestURL = function () {
		var serverURL       = txtServerURL.val();
		var layerName       = txtLayerName.val();
		var reqType         = ddlRequestType.val();
		var operation       = $('input[name=request]:checked').val();
		var outputFormat    = ddlOutputFormat.val();
		var maxFeatures     = txtMaxFeatures.val();
		var CQLFilter       = txtCQL.val();

		// Fix output format for request
		if (outputFormat == "json") {
			//outputFormat = "&outputFormat=text/javascript&format_options=callback:getJson";
			outputFormat = "&outputFormat=application/json";
		} else {
			outputFormat = "";
		}

		// Handle layer name
		var layer = layerName.split(':');

		var url = "";
		switch (reqType) {
			case "WMS":
				url = prepareServerURL(serverURL);
				break;
			case "WFS":
			default:
				url = prepareServerURL(serverURL);
				url += layer[0];
				url += '/ows?service=WFS&version=2.0.0&request=' + operation;
				url +=  '&typeName=' + layerName;
				url += '&count=' + maxFeatures;
				url += outputFormat;
				url += '&CQL_FILTER=' + encodeURIComponent(CQLFilter);
		}

		txtRequest.val(url);
	};

	var submitRequest = function () {
		txtResult.html('');

		var outputFormat = ddlOutputFormat.val();

		$.ajax({
			url: 'proxy.php',

			data: {
				url: txtRequest.val()
			},

			type: 'GET',
			dataType: outputFormat == 'json' ? 'json' : 'text',
			contentType: outputFormat == 'json' ? 'application/json' : 'text/xml',

			async: true,

			success: function (data) {
				updateResultBox(data);

				updateCodeHighlight();
			},
			error: function (xhr, ajax, throwError) {
				txtResult.html('<pre>' + xhr.status + ' : ' + xhr.responseText + '</pre>');
				console.log(xhr);
				console.log(ajax);
			}
		});
	};

	var updateCodeHighlight = function () {
		$('pre code').each(function (i, block) {
			if (hljs !== 'undefined') {
				hljs.highlightBlock(block);
			}
		});
	};

	var updateResultBox = function (data) {
		var outputFormat = ddlOutputFormat.val();

		var pre = $("<pre>");
		var code = $("<code>", {class: outputFormat});
		code.appendTo(pre);
		pre.appendTo(txtResult);

		if (outputFormat == 'json') {
			code.html(JSON.stringify(data, undefined, 2));
		} else {
			code.text(data);
		}
	}


	// Bind events
	btnSubmit.on('click', submitRequest);

	txtServerURL.on('change', handleServerNameInput);

	txtLayerName.on('change', validateLayerName);

	txtServerURL.on('change', generateRequestURL);
	txtLayerName.on('change', generateRequestURL);
	txtMaxFeatures.on('change', generateRequestURL);
	txtCQL.on('change', generateRequestURL);
	ddlRequestType.on('change', generateRequestURL);
	ddlOutputFormat.on('change', generateRequestURL);
	$('input[name=request]').on('change', generateRequestURL);

	generateRequestURL();
	txtResult.html('');

});