<?php
/*
 * Juxta 0.0.1 http://juxta.ru
 *
 * Licensed under the MIT license
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 * @copyright	Copyright (c) 2010-2011 Alexey Golovnya
 * @license 	MIT License
 * @version 	0.0.1
 */

header("Cache-Control: no-cache;");
header("Content-Type: application/json");

error_reporting(E_ALL | E_STRICT);

if (isset($_REQUEST['debug']) && $_REQUEST['debug'] === 'true') {
	define('DEBUG', true);
} else {
	define('DEBUG', false);
}

function juxtaErrorHandler($no, $str, $file, $line)
{
	if (DEBUG) {
		throw new JuxtaException("{$str} in {$file}:{$line}", $no);
		return true;
	}
}

set_error_handler('juxtaErrorHandler');

session_start();

require 'config.php';
require 'juxta.class.php';

try {
	new Juxta($config);
} catch (JuxtaException $e) {
	$response = array(
		'status' => $e->getStatus(),
		'error' => $e->getMessage(),
		'errorno' => $e->getCode()
	);

	$toResponse = $e->toResponse(); 
	if (!empty($toResponse)) {
		$response = array_merge($response, $e->toResponse());
	}

	echo json_encode($response);
}
