<?php
/*
 * Juxta 0.0.1 http://juxta.ru
 *
 * Licensed under the MIT license
 *
 * @category   Juxta
 * @package    Juxta_PHP
 * @copyright  Copyright (c) 2010-2011 Alexey Golovnya
 * @license    MIT License
 * @version    0.0.1
 */

require 'exceptions.php';

/*
 * Juxta for MySQL PHP backend main class
 *
 * @category   Juxta
 * @package    Juxta_PHP
 */
class Juxta
{

	/**
	 * @var int
	 */
	static $defaultPort = 3306;


	/**
	 * Config
	 *
	 * @var array
	 */
	private $_config = array();


	/**
	 * Connection
	 *
	 * @var
	 */
	private $_mysql = NULL;


	/**
	 * Constructor
	 *
	 * @param array $config
	 */
	public function __construct($config = array())
	{
		$this->_config = $config;
		$this->route();
	}


	/**
	 * Destructor
	 *
	 */
	public function __destruct()
	{
		if (isset($this->_mysql)) {
			$this->_mysql->close();
		}
	}


	/**
	 * Creates a connection
	 *
	 * @param array $connection
	 */
	private function _connect($connection)
	{
		if (!$this->_mysql) {
			$this->_mysql = new mysqli(
				$connection['host'],
				$connection['user'],
				$connection['password'],
				null,
				$connection['port']
			);

			if ($this->_mysql->connect_error) {
				throw new JuxtaConnectionException(
					$this->_mysql->connect_error,
					$this->_mysql->connect_errno
				);
			}

			if (!empty($connection['charset'])) {
				$this->_mysql->set_charset($connection['charset']);
			}
		}
	}


	/**
	 * Makes query
	 *
	 * @param string $sql
	 * @param $cols
	 * @return array
	 */
	private function _query($cid, $sql, $cols = null)
	{
		//
		if (empty($_SESSION['connections'][$cid])) {
			throw new JuxtaSessionException();
		}

		$params = $_SESSION['connections'][$cid];

		$this->_connect($params);

		$result = $this->_mysql->query($sql);
		if ($this->_mysql->error) {
			throw new JuxtaQueryException($this->_mysql->error, $this->_mysql->errno);
		}

		if (is_bool($result)) {
			return $result;
		}

		$response = array();
		if ($result) {
			while ($row = mysqli_fetch_array($result, is_int($cols) ? $cols : MYSQLI_BOTH)) {
				$toResponse = array();
				if (is_array($cols)) {
					foreach ($cols as $col) {
						$toResponse[] = $row[$col];
					}
				} else {
					$toResponse = $row;
				}
				$response[] = $toResponse;
			}
		}

		return $response;
	}


	/**
	 * Routing
	 *
	 */
	public function route()
	{
		$cid = isset($_GET['cid']) ? $_GET['cid'] : 0;

		if (isset($_GET['show'])) {
			switch ($_GET['show']) {
				case 'databases':
					$response = $this->_showDatabases($cid);
					break;
				case 'processlist':
					$response = $this->_showProcesslist($cid);
					break;
				case 'status':
					$response = $this->_showStatus($cid);
					$response['contents'] = $_GET['show'];
					break;
				case 'variables':
					$response = $this->_showVariables($cid);
					break;
				case 'charsets':
					$response = $this->_showCharsets($cid);
					break;
				case 'collations':
					$response = $this->_getCollations($cid);
					break;
				case 'engines':
					$response = $this->_showEngines($cid);
					break;
				case 'users':
					$response = $this->_showUsers($cid);
					break;
				case 'tables':
					$response = $this->_showTables($cid, $_GET['from']);
					break;
				case 'table':
					$response = $this->_showTable($cid, $_GET['table'], $_GET['from']);
					break;
				case 'views':
					$response = $this->_showViews($cid, $_GET['from']);
					break;
				case 'view':
					$response = $this->_showCreateView($cid, $_GET['view'], $_GET['from']);
					break;
				case 'routines':
					$response = $this->_showRoutines($cid, $_GET['from']);
					break;
				case 'procedure':
					$response = $this->_showCreateProcedure($cid, $_GET['procedure'], $_GET['from']);
					break;
				case 'function':
					$response = $this->_showCreateFunction($cid, $_GET['function'], $_GET['from']);
					break;
				case 'triggers':
					$response = $this->_showTriggers($cid, $_GET['from']);
					break;
				case 'trigger':
					$response = $this->_showCreateTrigger($cid, $_GET['trigger'], $_GET['from']);
					break;

				case 'properties':
					if (isset($_GET['database'])) {
						$response = $this->_showDatabaseProperties($cid, $_GET['database']);

					} elseif (isset($_GET['table'])) {
						$response = $this->_showTableProperties($cid, $_GET['table'], $_GET['from']);
					}
					break;
			}

		} elseif (isset($_GET['get'])) {
			//
			switch ($_GET['get']) {
				case 'session':

					if (!empty($_SESSION['connections'][$cid])) {
						$connection = $_SESSION['connections'][$cid];
						unset($connection['password']);
						$response = array('connection' => $connection);

					} else {
						throw new JuxtaSessionException();
					}
					break;

				case 'connections':
					$response = $this->_getConnections();
					break;
			}

		} elseif (isset($_GET['login'])) {
			//
			try {
				$connection = array(
					'host' => $_POST['host'],
					'port' => $_POST['port'] ? $_POST['port'] : self::$defaultPort,
					'user' => $_POST['user'],
					'password' => $_POST['password'],
					'charset' => $_POST['charset'] ? $_POST['charset'] : 'utf8',
				);

				if (isset($_POST['id'])) {
					$connection['id'] = $_POST['id'];

					if (isset($this->_config['stored_connections'][$connection['id']], $this->_config['stored_connections'][$connection['id']]['name'])) {
						$connection['name'] = $this->_config['stored_connections'][$connection['id']]['name'];
					}
				}

				$this->_connect($connection);

				$cid = 0;
				if (!empty($_SESSION['connections'])) {
					$cid = array_reduce($_SESSION['connections'], function($cid, $connection) {
						return max($cid, $connection['cid']);
					}, -1) + 1;
				}

				$connection['cid'] = $cid;

				$_SESSION['connections'][$cid] = $connection;

				unset($connection['password']);

				$response = array(
					'status' => 'ok',
					'to' => $connection,
				);

			} catch (JuxtaConnectionException $e) {
				$response = array('status' => 'ok', 'message' => $e->getMessage());
			}

		} elseif (isset($_REQUEST['logout'])) {
			//
			if ($_REQUEST['logout'] === 'all') {
				session_destroy();
			} elseif (isset($_REQUEST['cid'])) {
				unset($_SESSION['connections'][$_REQUEST['cid']]);
			}

			$response = array('status' => 'ok', 'logout' => 'done', 's' => $_SESSION);

		} elseif (isset($_GET['create']) && $_GET['create'] == 'database') {
			switch ($_GET['create']) {
				case 'database':
				$response = $this->_createDatabase($cid, $_POST['name']);
			}

		} elseif (isset($_GET['drop'])) {
			switch ($_GET['drop']) {
				// Drop databases
				case 'database':
				case 'databases':
					if (!empty($_POST['database'])) {
						$_POST['databases'] = $_POST['database'];
					}
					$response = $this->_dropDatabases($cid, (array)$_POST['databases']);
					break;

				//
				case 'users':
					$response = $this->_dropUsers($cid, (array)$_POST['users']);
					break;

				// Drop tables
				case 'table':
				case 'tables':
					if (!empty($_POST['table'])) {
						$_POST['tables'] = $_POST['table'];
					}
					$response = $this->_dropTables($cid, (array)$_POST['tables'], $_GET['from']);
					break;
				// Drop views
				case 'view':
				case 'views':
					if (!empty($_POST['view'])) {
						$_POST['views'] = $_POST['view'];
					}
					$response = $this->_dropViews($cid, (array)$_POST['views'], $_GET['from']);
					break;
				// Drop stored procedures
				case 'function':
					$_REQUEST['functions'] = (array)$_REQUEST['function'];
				case 'functions':
					$_REQUEST['routines']['function'] = $_REQUEST['functions'];
				case 'procedure':
					$_REQUEST['procedures'] = (array)$_REQUEST['procedure'];
				case 'procedures':
					$_REQUEST['routines']['procedure'] = $_REQUEST['procedures'];
				case 'routine':
				case 'routines':
					if (!empty($_POST['routine'])) {
						$_REQUEST['routines'] = $_REQUEST['routines'];
					}
					$response = $this->_dropRoutines($cid, (array)$_REQUEST['routines'], $_GET['from']);
					break;
				// Drop triggers
				case 'trigger':
				case 'triggers':
					if (!empty($_REQUEST['trigger'])) {
						$_REQUEST['triggers'] = $_REQUEST['trigger'];
					}
					$response = $this->_dropTriggers($cid, (array)$_REQUEST['triggers'], $_GET['from']);
					break;
			}

		} elseif (isset($_GET['kill'])) {
			$response = $this->_kill($cid, (array)$_REQUEST['processes']);

		} elseif (isset($_GET['browse'])) {
			$response = $this->_browse(
				$cid,
				$_GET['browse'],
				$_GET['from'],
				isset($_GET['limit']) ? $_GET['limit'] : 30,
				isset($_GET['offset']) ? $_GET['offset'] : 0
			);
		}

		//
		if (isset($response)) {
			print json_encode(array_merge(array('status' => 'ok'), (array)$response));
		} else {
			throw new JuxtaException('Invalid request');
		}
	}


	/**
	 * Returns stored and established connections
	 *
	 * @return array
	 */
	private function _getConnections()
	{
		$connections = array();
		$established = array();

		if (!empty($_SESSION['connections'])) {
			$connections += $_SESSION['connections'];

			foreach ($connections as $connection) {
				//
				if (isset($connection['id'])) {
					$established[] = $connection['id'];
				}
			}
		}

		if (!empty($this->_config['stored_connections'])) {
			foreach ($this->_config['stored_connections'] as $id => $connection) {
				//var_dump($id, !in_array($id, $established));
				if (!in_array($id, $established)) {
					$connection['id'] = $id;
					$connections[] = $connection;
				}
			}
		}

		if (!empty($connections)) {
			foreach ($connections as $id => $connection) {
				//
				unset($connections[$id]['password']);

				if (isset($connections[$id]['port'])) {
					$connections[$id]['port'] = (int)$connections[$id]['port'];
				}
				if (empty($connections[$id]['port'])) {
					$connections[$id]['port'] = self::$defaultPort;
				}

				if (empty($connections[$id]['name'])) {
					$connections[$id]['name'] = "{$connections[$id]['user']}@{$connections[$id]['host']}";

					if ($connections[$id]['port'] != self::$defaultPort) {
						$connections[$id]['name'] .= ":{$connection['port']}";
					}
				}
			}

			usort($connections, function($prev, $next) { return strcmp($prev['name'], $next['name']); });
		}

		return array(
			'contents' => 'connections',
			'connections' => $connections,
		);
	}


	/**
	 * Returns list of databases
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showDatabases($cid)
	{
		$databases = $this->_query($cid, "SHOW DATABASES", array(0));

		return array('contents' => 'databases', 'data' => $databases);
	}


	/**
	 * Creates a database
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _createDatabase($cid, $name, $collation = null)
	{
		$this->_query($cid, "CREATE DATABASE `{$name}`");

		return array('database' => 'created', 'name' => $name);
	}


	/**
	 * Drops databases
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _dropDatabases($cid, array $databases)
	{
		$dropped = array();

		foreach ($databases as $database) {
			try {
				$this->_query($cid, "DROP DATABASE `{$database}`");
				$dropped[] = $database;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Gets a database's properties
	 *
	 * @param int $cid
	 * @param string $database Database name
	 * @return array
	 */
	private function _showDatabaseProperties($cid, $database)
	{
		$properties = array('name' => $database);

		$sql1 = "SELECT `DEFAULT_CHARACTER_SET_NAME` as `name`, "
			 . "`DEFAULT_COLLATION_NAME` as `collation` "
			 . "FROM `information_schema`.`SCHEMATA` "
			 . "WHERE `SCHEMA_NAME` = '{$database}'";

		$charset = $this->_query($cid, $sql1);
		if ($charset) {
			$properties['charset'] = $charset[0]['name'];
			$properties['collation'] = $charset[0]['collation'];
		}

		$sql2 = "SELECT COUNT(*) AS `tables`, SUM(`TABLE_ROWS`) AS `rows`, "
			  . "SUM(`DATA_LENGTH`) AS `data_length`, "
			  . "SUM(`INDEX_LENGTH`) AS `index_length` "
			  . "FROM `INFORMATION_SCHEMA`.`TABLES` "
			  . "WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'";

		$statistics = $this->_query($cid, $sql2);
		if ($statistics) {
			$properties['tables']= $statistics[0]['tables'];
			$properties['rows']= $statistics[0]['rows'];
			$properties['data_length']= (int)$statistics[0]['data_length'];
			$properties['index_length']= (int)$statistics[0]['index_length'];
		}

		return array(
			'contents' => 'database-properties',
			'properties' => $properties,
			'charset' => $statistics
		);
	}


	/**
	 * Returns list of processes
	 *
	 * @param int $cid
	 * @retrun array
	 */
	private function _showProcesslist($cid)
	{
		$processlist = $this->_query($cid, "SHOW PROCESSLIST", array(0, 1, 2, 3, 4, 5, 7));

		return array(
			'contents' => 'processlist',
			'data' => $processlist
		);
	}


	/**
	 * Kills processes
	 *
	 * @param int $cid
	 * @param array $processes list of processes ids
	 * @return array
	 */
	private function _kill($cid, array $processes)
	{
		$killed = null;

		foreach ($processes as $process) {
			try {
				$this->_query($cid, "KILL {$process}");
				$killed[] = $process;
			} catch (JuxtaQueryException $exception) {
				$exception->addtoResponse(array('killed' => $killed));
				throw $exception;
			}
		}

		return array('killed' => $killed);
	}


	/**
	 * Retruns list of status variables
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showStatus($cid)
	{
		return array('contents' => 'status', 'data' => $this->_query($cid, "SHOW STATUS", array(0, 1)));
	}


	/**
	 * Returns list of system variables
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showVariables($cid)
	{
		$variables = $this->_query($cid, "SHOW VARIABLES", array(0, 1));

		return array('contents' => 'variables', 'data' => $variables);
	}


	/**
	 * Returns list of available character sets
	 *
	 * @param int $cid
	 * @retrun array
	 */
	private function _showCharsets($cid)
	{
		$charsets = $this->_query($cid, "SHOW CHARSET",
			array('Charset', 'Default collation', 'Description'));

		return array('contents' => 'charsets', 'data' => $charsets);
	}


	/**
	 * Lists all available collations
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showCollations($cid)
	{
		$response = null;

		$collations = $this->_query($cid, "SHOW COLLATION", array('Charset', 'Collation'));
		if (is_array($collations)) {
			foreach ($collations as $collation) {
				if (!array_key_exists($collation[0], $response)) {
					$response[$collation[0]] = array();
				}
				$response[$collation[0]][] = $collation[1];
			}
		}

		return array('contents' => 'collations', 'data' => $response);
	}


	/**
	 * Returns information about server's storage engines
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showEngines($cid)
	{
		$engines = $this->_query($cid, "SHOW ENGINES", array('Engine', 'Support', 'Comment'));

		return array('contents' => 'engines', 'data' => $engines);
	}


	/**
	 * Lists users
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showUsers($cid)
	{
		$users = $this->_query($cid, "SELECT * FROM mysql.user");
		if (is_array($users)) {
			$response = array();
			foreach ($users as $user) {
				$user['Gloval_priv'] = 'ALL';
				$response[] = array(
					$user['User'],
					$user['Host'],
					$user['Password'] ? 'YES' : 'NO',
					$user['Gloval_priv'],
					$user['Grant_priv'] ? 'YES' : ''
				);
			}
		}

		return array('contents' => 'users', 'data' => $response);
	}


	/**
	 * Drops users
	 *
	 * @param int $cid
	 * @param array $users List of users (in)
	 * @return array
	 */
	private function _dropUsers($cid, array $users)
	{
		$dropped = array();

		foreach ($users as $user) {
			try {
				$this->_query($cid, "DROP USER {$user}");
				$dropped[] = $user;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Returns information about tables in a database
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showTables($cid, $database = '')
	{
		$sql = "SELECT * FROM `INFORMATION_SCHEMA`.`TABLES` "
			 . "WHERE `TABLE_SCHEMA` = '{$database}' "
			 . "AND `TABLE_TYPE` <> 'VIEW'";

		$tables = $this->_query($cid, $sql, array('TABLE_NAME', 'ENGINE',
											'TABLE_ROWS', 'DATA_LENGTH',
											'UPDATE_TIME'));

		return array('contents' => 'tables', 'from' => $database, 'data' => $tables);
	}


	/**
	 * Drops tables
	 *
	 * @param int $cid
	 * @param array $tables Tables
	 * @param string $from Database
	 * @return array
	 */
	private function _dropTables($cid, array $tables, $from)
	{
		$dropped = null;

		foreach ($tables as $table) {
			try {
				$this->_query($cid, "DROP TABLE `{$from}`.`{$table}`;");
				$dropped[] = $table;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Returns information about tables in a database
	 *
	 * @param int $cid
	 * @return array
	 */
	private function _showTable($cid, $table, $database = '')
	{
		$table = $this->_query(
			$cid,
			"SHOW COLUMNS FROM `{$table}` FROM `{$database}`",
			MYSQLI_BOTH
		);

		$columns = array();

		while (list($field, $type, $isNull, $key, $default, $extra) = current($table)) {
			// Name
			$column = array($field);

			// type
			$column[] = trim(preg_replace('/unsigned|zerofill/', '', $type));

			// in_null
			$column[] = $isNull;

			// attributes
			preg_match_all('/unsigned|zerofill/', $type, $matches);
			if (!empty($matches[0])) {
				$column[] = $matches[0];
			} else {
				$column[] = null;
			}

			// default
			$column[] = $default;

			// options
			$options = null;
			if ($key === 'PRI') {
				$options[] = 'primary';
			}
			if (preg_match('/auto_increment/', $extra)) {
				$options[] = 'auto_increment';
			}
			if (preg_match('/on update CURRENT_TIMESTAMP/', $extra)) {
				$options[] = 'on update current_timestamp';
			}
			$column[] = $options;

			$columns[] = $column;

			next($table);
		}

		return array(
			'content' => array('column', 'type', 'is_null', 'atributes', 'default', 'options'),
			'from' => $database,
			'columns' => $columns,
			'table' => $table,
		);
	}


	/**
	 * Returns tables's properties
	 *
	 * @param int $cid
	 * @param string $table Table name
	 * @param string $database Database
	 * @return array
	 */
	private function _showTableProperties($cid, $table, $database)
	{
		$properties = $this->_query($cid, "SHOW TABLE STATUS FROM `{$database}` LIKE '{$table}'", MYSQLI_ASSOC);

		if (!empty($properties)) {
			$properties = array_change_key_case($properties[0], CASE_LOWER);
		}

		return array('properties' => $properties);
	}


	/**
	 * Returns information about views in a database
	 *
	 * @param int $cid
	 * @param string $database Database
	 * @return array
	 */
	private function _showViews($cid, $database = '')
	{
		$sql = "SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` "
			 . "WHERE `TABLE_SCHEMA` = '{$database}'";
		$views = $this->_query($cid, $sql, array('TABLE_NAME', 'DEFINER', 'IS_UPDATABLE'));

		return array('contents' => 'views', 'from' => $database, 'data' => $views);
	}


	/**
	 * Return create view statement
	 *
	 * @param int $cid
	 * @param string $name View name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateView($cid, $name, $database)
	{
		$view = $this->_query($cid, "SHOW CREATE VIEW `{$database}`.`{$name}`");

		return array(
			'view' => $name,
			'from' => $database,
			'statement' => $view[0]['Create View']
		);
	}


	/**
	 * Drops views
	 *
	 * @param int $cid
	 * @param array $views List of views
	 * @param $from string Database
	 * @return array
	 */
	private function _dropViews($cid, array $views, $from)
	{
		$dropped = null;

		foreach ($views as $view) {
			try {
				$this->_query($cid, "DROP VIEW `{$from}`.`{$view}`;");
				$dropped[] = $view;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Returns information about stored procedures and functions
	 *
	 * @param int $cid
	 * @param $database Database
	 * @return array
	 */
	private function _showRoutines($cid, $database = '')
	{
		$sql = "SELECT `ROUTINE_NAME`, LOWER(`ROUTINE_TYPE`) AS `ROUTINE_TYPE`, "
			 . "`DEFINER`, `DTD_IDENTIFIER` "
			 . "FROM `INFORMATION_SCHEMA`.`ROUTINES` "
			 . "WHERE `ROUTINE_SCHEMA` = '{$database}'";
		$routines = $this->_query(
			$cid,
			$sql,
			array('ROUTINE_NAME', 'ROUTINE_TYPE', 'DEFINER', 'DTD_IDENTIFIER')
		);

		return array(
			'contents' => 'routines',
			'from' => $database,
			'data' => $routines
		);
	}


	/**
	 * Return create procedure statement
	 *
	 * @param int $cid
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateProcedure($cid, $name, $database)
	{
		$procedure = $this->_query($cid, "SHOW CREATE PROCEDURE `{$database}`.`{$name}`");

		return array(
			'procedure' => $name,
			'from' => $database,
			'statement' => $procedure[0]['Create Procedure']
		);
	}


	/**
	 * Return create function statement
	 *
	 * @param int $cid
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateFunction($cid, $name, $database)
	{
		$function = $this->_query($cid, "SHOW CREATE FUNCTION `{$database}`.`{$name}`");

		return array(
			'function' => $name,
			'from' => $database,
			'statement' => $function[0]['Create Function']
		);
	}



	/**
	 * Drops stored procedures and functions
	 *
	 * @param int $cid
	 * @param array $rouitines
	 * @param string $from
	 * @return array
	 */
	private function _dropRoutines($cid, array $routines, $from)
	{
		$dropped = array();

		if (isset($routines['function'])) {
			foreach ($routines['function'] as $function) {
				try {
					$this->_query($cid, "DROP FUNCTION `{$from}`.`{$function}`;");
					$dropped['function'][] = $function;
				} catch (JuxtaQueryException $e) {
					$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
					throw $e;
				}
			}
		}
		if (isset($routines['procedure'])) {
			foreach ($routines['procedure'] as $procedure) {
				try {
					$this->_query($cid, "DROP PROCEDURE `{$from}`.`{$procedure}`;");
					$dropped['procedure'][] = $procedure;
				} catch (JuxtaQueryException $e) {
					$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
					throw $e;
				}
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Lists triggers
	 *
	 * @param int $cid
	 * @param string $database Database
	 * @return array
	 */
	private function _showTriggers($cid, $database = '')
	{
		$triggers = $this->_query(
			$cid,
			"SHOW TRIGGERS FROM `{$database}`",
			array('Trigger', 'Table', 'Event', 'Timing')
		);

		return array(
			'contents' => 'triggers',
			'from' => $database,
			'data' => $triggers
		);
	}


	/**
	 * Return create trigger statement
	 *
	 * @param int $cid
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateTrigger($cid, $name, $database)
	{
		$trigger = $this->_query($cid, "SHOW CREATE TRIGGER `{$database}`.`{$name}`");

		return array(
			'trigger' => $name,
			'from' => $database,
			'statement' => $trigger[0]['SQL Original Statement']
		);
	}


	/**
	 * Drops triggers
	 *
	 * @param int $cid
	 * @param array $triggers Triggers
	 * @param string $database Database
	 * @return array
	 */
	private function _dropTriggers($cid, array $triggers, $database)
	{
		$dropped = array();
		foreach ($triggers as $trigger) {
			try {
				$this->_query($cid, "DROP TRIGGER `{$database}`.`{$trigger}`");
				$dropped[] = $trigger;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped));
				throw $e;
			}
		}

		return array('triggers' => $triggers, 'dropped' => $dropped);
	}


	/**
	 * Browse table data
	 *
	 * @param int $cid
	 * @param string $table Table name
	 * @param string $database Database
	 * @param int $limit
	 * @param int $offset
	 * @return array
	 */
	private function _browse($cid, $table, $database, $limit = 30, $offset = 0)
	{
		$columns = $this->_query(
			$cid,
			"SHOW COLUMNS IN `{$table}` FROM `{$database}`",
			array('Field', 'Key', 'Type')
		);
		$total = $this->_query($cid, "SELECT COUNT(*) as `count` FROM `{$database}`.`{$table}`");
		$data = $this->_query($cid, "SELECT * FROM `{$database}`.`{$table}` LIMIT {$offset}, {$limit}");

		return array('data' => $data, 'columns' => $columns, 'total' => $total[0]['count']);
	}

}
