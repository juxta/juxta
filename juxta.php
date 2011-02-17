<?php

/*
 * Juxta 0.0.1 http://juxta.ru
 * 
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * 
 * @package juxta-php
 * @version 0.0.1 
 * 
 */

header("Cache-Control: no-cache;");

if (isset($_GET['debug'])) {
	error_reporting(E_ALL | E_STRICT);
} else {
	error_reporting(0);
	header("Content-Type: application/json");
}

sleep(0);

session_start();

require 'config.php';
require 'juxta.class.php';

try {
	new Juxta($config);
} catch (JuxtaException $e) {
	print json_encode(array('status' => $e->getStatus(), 'error' => $e->getMessage(), 'errorno' => $e->getCode()));
}

?>
