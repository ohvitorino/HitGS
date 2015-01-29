<?php
/**
 * Created by
 * User: brunop
 * Date: 1/28/2015
 * Time: 4:22 PM
 */


if (isset($_GET['url'])) {
	$url = rawurldecode($_GET['url']);
} else {
	header($_SERVER["SERVER_PROTOCOL"] . " 404 Not Found");
	die;
}

$parts = parse_url($url);

if (count($parts) < 2) {
	header($_SERVER["SERVER_PROTOCOL"] . " 404 Not Found");
} else {
	//access checks

	$url = $parts['scheme'] . "://" . $parts['host'] . $parts['path'];
	$query = $parts['query'];

	if (isset($parts['fragment']) and false !== strpos($parts['fragment'], "&")) {
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

		$url .= $key . "=" . urlencode($val) . "&";

		if (strtolower($key) == "format" || strtolower($key) == "outputformat") {
			Header("Content-type: " . urlencode($val), true);
		}
	}
	$url = rtrim($url, " &?=");


	echo file_get_contents($url);
}