/**
 * Created by brunop on 1/28/2015.
 */

//http://geo1dev.vliz.be/geoserver/dataportal-tests/wms?service=WMS&version=1.1.0&request=GetMap&layers=dataportal-tests:bioobservations&styles=&bbox=3.146897315979,51.0995597839355,4.61533880233765,51.5502967834473&width=1075&height=330&srs=EPSG:4326&format=image%2Fpng

$(function () {
	"use strict";

	var PROXY = 'proxy.php';

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
	var progress = $('.progress');

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
	var currentWMSLayer = null;

	// Methods

	var prepareServerURL = function (url) {
		if (url.indexOf('/', url.length - 1) == -1) {
			url += '/';
		}
		return url;
	};

	var requestServerInformation = function () {
		//var url = txtServerURL.val();
		//
		//url = prepareServerURL(url) + 'rest/workspaces.json';
		//
		//$.ajax({
		//	url: PROXY,
		//
		//	data: {
		//		url: url
		//	},
		//
		//	type: 'GET',
		//	dataType: 'json',
		//
		//	contentType: 'application/json',
		//
		//	success: function (data) {
		//		console.log(data);
		//	},
		//	error: function (xhr, ajaxOptions, throwError) {
		//		console.error(xhr);
		//	}
		//});
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
				url += layer[0];
				url += '/wms';
				break;
			case "WFS":
			default:
				url = prepareServerURL(serverURL);
				url += layer[0];
				url += '/ows?service=WFS&version=2.0.0&request=' + operation;
				url +=  '&typeName=' + layerName;

				if(maxFeatures.length > 0)
					url += '&count=' + maxFeatures;

				url += outputFormat;

				if(CQLFilter.length > 0)
					url += '&CQL_FILTER=' + encodeURIComponent(CQLFilter);
		}

		txtRequest.val(url);
	};

	var submitRequest = function () {
		var reqType         = ddlRequestType.val();
		var layerName       = txtLayerName.val();

		txtResult.html('');

		switch (reqType) {
			case 'WMS':
				var url = txtRequest.val();
				var wmsSource = new ol.source.ImageWMS({
					url: url,
					params: {'LAYERS': layerName},
					serverType: 'geoserver'
				});

				map.removeLayer(currentWMSLayer);

				currentWMSLayer = new ol.layer.Image({
					source: wmsSource
				});

				map.addLayer(currentWMSLayer);
				break;
			case 'WFS':
			default:
				var outputFormat = ddlOutputFormat.val();

				showLoader();

				$.ajax({
					url: PROXY,

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

						hideLoader();
					},
					error: function (xhr, ajax, throwError) {
						txtResult.html('<pre>' + xhr.status + ' : ' + xhr.responseText + '</pre>');
						console.log(xhr);
						console.log(ajax);

						hideLoader();
					}
				});
				break;
		}

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
	};

	var hideWFSControls = function() {
		var reqType         = ddlRequestType.val();
		var groups          = $('[id^="wfsgroup"]');

		switch (reqType) {
			case 'WMS':
				groups.addClass('hidden');
				break;
			case 'WFS':
			default:
				groups.removeClass('hidden');
				break;
		}
	};

	var clearResultArea = function() {
		txtResult.html('');
	};

	var showLoader = function() {
		btnSubmit.find('span').toggleClass('spinning');
	};

	var hideLoader = function() {
		btnSubmit.find('span').toggleClass('spinning');
	};

	// Bind events
	btnSubmit.on('click', submitRequest);

	txtServerURL.on('change', handleServerNameInput);

	txtLayerName.on('change', validateLayerName);

	txtServerURL.on('change', generateRequestURL);
	txtLayerName.on('change', generateRequestURL);
	txtMaxFeatures.on('change', generateRequestURL);
	txtCQL.on('change', generateRequestURL);
	ddlRequestType.on('change', generateRequestURL);
	ddlRequestType.on('change', hideWFSControls);
	ddlOutputFormat.on('change', generateRequestURL);
	$('input[name=request]').on('change', generateRequestURL);

	generateRequestURL();
	hideWFSControls();
	clearResultArea();

});