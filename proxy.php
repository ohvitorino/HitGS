<?php
/**
 * Created by
 * User: brunop
 * Date: 1/28/2015
 * Time: 4:22 PM
 */


if ($_GET['url']) {
	$url = rawurldecode($_GET['url']);
}
else {
	$url = "http://geo.vliz.be/geoserver/wms?" . urldecode($_SERVER['QUERY_STRING']);
}

$parts = parse_url($url);

if (count($parts) < 2) {
	header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");
}
else {
//access checks
	$ref = $_SERVER['HTTP_REFERER'];
	if (false === strpos($_SERVER['HTTP_USER_AGENT'], "MSIE 7")
			and false === strpos($_SERVER['HTTP_USER_AGENT'], "MSIE 8")
	) {
		header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");
	}


	$url = $parts['scheme'] . "://" . $parts['host'] . $parts['path'];
	$query = $parts['query'];

	if (false !== strpos($parts['fragment'], "&")) {
		$query .= "#" . $parts['fragment'];
	}

	$gets = explode("&", stripslashes($query));
	$url .= "?";

	foreach ($gets as $get) {
		$eq = strpos($get, "=");
		$key = substr($get, 0, $eq);
		$val = substr($get, $eq + 1);
		if ($key == "request" and $val == "map") continue;
		if ($key == "server") continue;
		if (strtolower($key) == "force_download" and $val == 1) {
			header("Pragma: public");
			header("Expires: 0");
			header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
			header("Cache-Control: public");
			continue;
		}
		$url .= $key . "=" . urlencode($val) . "&";

		if (strtolower($key) == "format" || strtolower($key) == "outputformat") {
			Header("Content-type: " . urlencode($val), true);
		}
	}
	$url = rtrim($url, " &?=");


	echo file_get_contents($url);
}