/**
 * Created by brunop on 1/28/2015.
 */

$(function () {
	"use strict";

	// DOM Elements

	var btnSubmit           = $('#btnSubmit');
	var txtLayerName        = $('#txtLayerName');
	var txtServerURL        = $('#txtServer');
	var lblErrorLayerName   = $('#lblErrorLayerName');
	var ddlRequestType      = $('#ddlRequestType');
	var ddlOutputFormat     = $('#ddlOutputFormat');
	var txtRequest          = $('#txtRequest');
	var txtCQL              = $('#txtCQL');
	var txtResult           = $('#txtResult');

	if(ol !== 'undefined') {
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

	var prepareURL = function (url) {
		if (url.indexOf('/', url.length - 1) == -1) {
			url += '/';
		}
		return url;
	};

	var requestServerInformation = function () {
		var url = txtServerURL.val();

		url = prepareURL(url) + 'rest/workspaces.json';

		$.ajax({
			url: url,
			type: 'GET',
			dataType: 'application/json; charset=utf-8',
			processData: false,
			contentType: 'application/json',
			success: function(data) {
				alert(data);
			},
			error: function(xhr, ajaxOptions, throwError) {
				alert(xhr.status);
				alert(xhr.responseText);
			}
		});
	};

	var handleServerNameInput = function () {
		clearTimeout(counter);
		counter = setTimeout(requestServerInformation, 2000);
	};

	var submitRequest = function () {

		$.ajax({
			url: txtRequest.val(),

			type: 'GET',
			dataType: 'text/javascript',
			processData: false,
			contentType: 'text/javascript',

			async: false,

			success: function (data) {
				console.log(data);
				txtResult.val(JSON.stringify(data));
			},
			error: function (xhr, ajax, throwError) {
				txtResult.val(xhr.status + ' : ' + xhr.responseText);
				console.log(xhr);
				console.log(ajax);
			}
		});
	};

	var validateLayerName = function() {
		var layerName = $(this).val();

		if(/\w:\w/.test(layerName.trim()) === false) {
			lblErrorLayerName.text('Wrong format. Use "workspace:layer".');
		} else {
			lblErrorLayerName.text('');
		}

	};

	var generateRequestURL = function() {
		var serverURL = txtServerURL.val();
		var layerName = txtLayerName.val();
		var reqType = ddlRequestType.val();
		var operation = $('input[name=request]:checked').val();
		var outputFormat = ddlOutputFormat.val();

		// Fix output format for request
		if(outputFormat == "json") {
			outputFormat = "&outputFormat=text/javascript&format_options=callback:getJson";
		} else {
			outputFormat = "";
		}

		// Handle layer name
		var layer = layerName.split(':');

		var url = "";
		switch (reqType) {
			case "WMS":
				url = prepareURL(serverURL);
				break;
			case "WFS":
			default:
				url = prepareURL(serverURL) + layer[0]
				+ '/ows?service=WFS&version=1.0.0&request='
				+ operation + '&typeName=' + layerName
				+ outputFormat;
		}

		txtRequest.val(url);
	};


	// Bind events
	btnSubmit.on('click', submitRequest);

	txtServerURL.on('change', handleServerNameInput);

	txtLayerName.on('change', validateLayerName);

	txtServerURL.on('change', generateRequestURL);
	txtLayerName.on('change', generateRequestURL);
	ddlRequestType.on('change', generateRequestURL);
	$('input[name=request]').on('change', generateRequestURL);
	txtCQL.on('change', generateRequestURL);
	ddlOutputFormat.on('change', generateRequestURL);

});