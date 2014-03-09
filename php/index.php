<?php

error_reporting(E_ALL | E_STRICT);

ini_set('display_errors', 'on');

require_once 'Juxta/App.php';
require_once 'Juxta/Exception.php';
require_once 'Juxta/Config.php';
require_once 'Juxta/Connections.php';
require_once 'Juxta/Session.php';
require_once 'Juxta/Db.php';
require_once 'Juxta/Db/Mysqli.php';

//

use Juxta\App;
use Juxta\Config;

$config = new Config(require_once __DIR__ . '/config.php');

$app = new App($config);

echo $app->run();
