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

require 'exceptions.php';

/*
 * Juxta for MySQL PHP backend main class
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 */
class Juxta
{

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
		}
	}


	/**
	 * Makes query
	 *
	 * @param string $sql
	 * @param $cols
	 * @return array
	 */
	private function _query($sql, $cols = null)
	{
		//
		if (!isset($_SESSION['host'])
			|| !isset($_SESSION['user'])
			|| !isset($_SESSION['password'])
		) {
			throw new JuxtaSessionException();
		}
		//
		$this->_connect(array(
			'host' => $_SESSION['host'],
			'user' => $_SESSION['user'],
			'password' => $_SESSION['password'],
			'port' => $_SESSION['port'])
		);

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
		if (isset($_GET['show'])) {
			switch ($_GET['show']) {
				case 'databases':
					$response = $this->_showDatabases();
					break;
				case 'processlist':
					$response = $this->_showProcesslist();
					break;
				case 'status':
				case 'status-full':
					$response = $this->_showStatus();
					$response['contents'] = $_GET['show'];
					break;
				case 'variables':
					$response = $this->_showVariables();
					break;
				case 'charsets':
					$response = $this->_showCharsets();
					break;
				case 'collations':
					$response = $this->_getCollations();
					break;
				case 'engines':
					$response = $this->_showEngines();
					break;
				case 'users':
					$response = $this->_showUsers();
					break;
				case 'tables':
					$response = $this->_showTables($_GET['from']);
					break;
				case 'table':
					$response = $this->_showTable($_GET['table'], $_GET['from']);
					break;
				case 'views':
					$response = $this->_showViews($_GET['from']);
					break;
				case 'view':
					$response = $this->_showCreateView($_GET['view'], $_GET['from']);
					break;
				case 'routines':
					$response = $this->_showRoutines($_GET['from']);
					break;
				case 'procedure':
					$response = $this->_showCreateProcedure($_GET['procedure'], $_GET['from']);
					break;
				case 'function':
					$response = $this->_showCreateFunction($_GET['function'], $_GET['from']);
					break;
				case 'triggers':
					$response = $this->_showTriggers($_GET['from']);
					break;
				case 'trigger':
					$response = $this->_showCreateTrigger($_GET['trigger'], $_GET['from']);
					break;
				case 'properties':
					if (isset($_GET['database'])) {
						$response = $this->_showDatabaseProperties($_GET['database']);
					} elseif (isset($_GET['table'])) {
						$response = $this->_showTableProperties($_GET['table'], $_GET['from']);
					}
					break;
			}
		} elseif (isset($_GET['get'])) {
			switch ($_GET['get']) {
				case 'session':
					if (!empty($_SESSION['host'])) {
						$response = array(
							'connection' => array(
								'host' => $_SESSION['host'],
								'port' => $_SESSION['port'],
								'user' => $_SESSION['user']
							)
						);
					} else {
						throw new JuxtaSessionException();
					}
					break;
				case 'connections':
					$response = $this->_getConnections();
					break;
			}
		} elseif (isset($_GET['login'])) {
			try {
				$_POST['port'] = $_POST['port'] ? $_POST['port'] : 3306;
				$this->_connect(array(
					'host' => $_POST['host'],
					'port' => $_POST['port'],
					'user' => $_POST['user'],
					'password' => $_POST['password']
				));
				//
				$_SESSION['host'] = $_POST['host'];
				$_SESSION['port'] = $_POST['port'];
				$_SESSION['user'] = $_POST['user'];
				$_SESSION['password'] = $_POST['password'];
				//
				$response = array(
					'status' => 'ok',
					'result' => 'connected',
					'to' => array('host' => $_SESSION['host'], 'port' => $_SESSION['port'])
				);
			} catch (JuxtaConnectionException $e) {
				$response = array('status' => 'ok', 'result' => 'failed', 'message' => $e->getMessage());
			}
		} elseif (isset($_GET['logout'])) {
			session_destroy();
			$response = array('status' => 'ok', 'logout' => 'done');
		} elseif (isset($_GET['create']) && $_GET['create'] == 'database') {
			switch ($_GET['create']) {
				case 'database':
				$response = $this->_createDatabase($_POST['name']);
			}
		} elseif (isset($_GET['drop'])) {
			switch ($_GET['drop']) {
				// Drop databases
				case 'database':
				case 'databases':
					if (!empty($_POST['database'])) {
						$_POST['databases'] = $_POST['database'];
					}
					$response = $this->_dropDatabases((array)$_POST['databases']);
					break;
				// Drop tables
				case 'table':
				case 'tables':
					if (!empty($_POST['table'])) {
						$_POST['tables'] = $_POST['table'];
					}
					$response = $this->_dropTables((array)$_POST['tables'], $_GET['from']);
					break;
				// Drop views
				case 'view':
				case 'views':
					if (!empty($_POST['view'])) {
						$_POST['views'] = $_POST['view'];
					}
					$response = $this->_dropViews((array)$_POST['views'], $_GET['from']);
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
					$response = $this->_dropRoutines((array)$_REQUEST['routines'], $_GET['from']);
					break;
				// Drop triggers
				case 'trigger':
				case 'triggers':
					if (!empty($_REQUEST['trigger'])) {
						$_REQUEST['triggers'] = $_REQUEST['trigger'];
					}
					$response = $this->_dropTriggers((array)$_REQUEST['triggers'], $_GET['from']);
					break;
			}
		} elseif (isset($_GET['kill'])) {
			$response = $this->_kill((array)$_REQUEST['processes']);
		} elseif (isset($_GET['browse'])) {
			$response = $this->_browse(
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
	 * Returns stored connections
	 *
	 * @return array
	 */
	private function _getConnections()
	{
		$connections = array();
		if (isset($this->_config['stored_connections'])
			&& is_array($this->_config['stored_connections'])
		) {
			foreach ($this->_config['stored_connections'] as $connection) {
				// Don't pass password
				if (isset($connection['password'])) {
					unset($connection['password']);
				}
				// 3306 port default
				if (isset($connection['port'])) {
					$connection['port'] = (int)$connection['port'];
				}
				if (empty($connection['port'])) {
					$connection['port'] = 3306;
				}
				$connections[] = $connection;
			}
		}

		return array('contents' => 'connections', 'data' => $connections);
	}


	/**
	 * Returns list of databases
	 * 
	 * @return array
	 */
	private function _showDatabases()
	{
		$databases = $this->_query("SHOW DATABASES", array(0));
		return array('contents' => 'databases', 'data' => $databases);
	}


	/**
	 * Creates a database
	 *
	 * @return array
	 */
	private function _createDatabase($name, $collation = null)
	{
		$this->_query("CREATE DATABASE `{$name}`");

		return array('database' => 'created', 'name' => $name);
	}


	/**
	 * Drops databases
	 *
	 * @return array
	 */
	private function _dropDatabases(array $databases)
	{
		$dropped = array();

		foreach ($databases as $database) {
			try {
				$this->_query("DROP DATABASE `{$database}`");
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
	 * @param string $database Database name
	 * @return array
	 */
	private function _showDatabaseProperties($database)
	{
		$properties = array('name' => $database);

		$sql1 = "SELECT `DEFAULT_CHARACTER_SET_NAME` as `name`, "
			 . "`DEFAULT_COLLATION_NAME` as `collation` "
			 . "FROM `information_schema`.`SCHEMATA` "
			 . "WHERE `SCHEMA_NAME` = '{$database}'";

		$charset = $this->_query($sql1);
		if ($charset) {
			$properties['charset'] = $charset[0]['name'];
			$properties['collation'] = $charset[0]['collation'];
		}

		$sql2 = "SELECT COUNT(*) AS `tables`, SUM(`TABLE_ROWS`) AS `rows`, "
			  . "SUM(`DATA_LENGTH`) AS `data_length`, "
			  . "SUM(`INDEX_LENGTH`) AS `index_length` "
			  . "FROM `INFORMATION_SCHEMA`.`TABLES` "
			  . "WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'";

		$statistics = $this->_query($sql2);
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
	 * @retrun array
	 */
	private function _showProcesslist()
	{
		$processlist = $this->_query("SHOW PROCESSLIST", array(0, 1, 2, 3, 4, 5));

		return array(
			'contents' => 'processlist',
			'data' => $processlist
		);
	}


	/**
	 * Kills processes
	 *
	 * @param array $processes list of processes ids
	 * @return array
	 */
	private function _kill(array $processes)
	{
		$killed = null;

		foreach ($processes as $process) {
			try {
				$this->_query("KILL {$process}");
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
	 */
	private function _showStatus()
	{
		$response = array();

		$status = $this->_query("SHOW STATUS", array(0, 1));
		foreach ($status as $variable) {
			$response[$variable[0]] = $variable[1];
		}

		return array('contents' => 'status', 'data' => $response);
	}


	/**
	 * Returns list of system variables
	 *
	 * @return array
	 */
	private function _showVariables()
	{
		$variables = $this->_query("SHOW VARIABLES", array(0, 1));

		return array('contents' => 'variables', 'data' => $variables);
	}


	/**
	 * Returns list of available character sets
	 *
	 * @retrun array
	 */
	private function _showCharsets()
	{
		$charsets = $this->_query("SHOW CHARSET",
			array('Charset', 'Description', 'Default collation', 'Maxlen'));

		return array('contents' => 'charsets', 'data' => $charsets);
	}


	/**
	 * Lists all available collations
	 *
	 * @return array
	 */
	private function _showCollations()
	{
		$response = null;

		$collations = $this->_query("SHOW COLLATION", array('Charset', 'Collation'));
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
	 * @return array
	 */
	private function _showEngines()
	{
		$engines = $this->_query("SHOW ENGINES", array('Engine', 'Support', 'Comment'));

		return array('contents' => 'engines', 'data' => $engines);
	}


	/**
	 * Lists users
	 *
	 * @return array
	 */
	private function _showUsers()
	{
		$users = $this->_query("SELECT * FROM mysql.user");
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
	 * Returns information about tables in a database
	 *
	 * @return array
	 */
	private function _showTables($database = '')
	{
		$sql = "SELECT * FROM `INFORMATION_SCHEMA`.`TABLES` "
			 . "WHERE `TABLE_SCHEMA` = '{$database}' "
			 . "AND `TABLE_TYPE` <> 'VIEW'";

		$tables = $this->_query($sql, array('TABLE_NAME', 'ENGINE',
											'TABLE_ROWS', 'DATA_LENGTH',
											'UPDATE_TIME'));

		return array('contents' => 'tables',
			'from' => $database, 'data' => $tables
		);
	}


	/**
	 * Drops tables
	 *
	 * @param array $tables Tables
	 * @param string $from Database
	 * @return array
	 */
	private function _dropTables(array $tables, $from)
	{
		$dropped = null;

		foreach ($tables as $table) {
			try {
				$this->_query("DROP TABLE `{$from}`.`{$table}`;");
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
	 * @return array
	 */
	private function _showTable($table, $database = '')
	{
		$table = $this->_query(
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
	 * Return tables's properties
	 *
	 * @param string $table Table name
	 * @param string $database Database
	 * @return array
	 */
	private function _showTableProperties($table, $database)
	{
		$properties = $this->_query("SHOW TABLE STATUS FROM `{$database}` LIKE '{$table}'", MYSQLI_ASSOC);

		if (!empty($properties)) {
			$properties = array_change_key_case($properties[0], CASE_LOWER);
		}

		return array('properties' => $properties);
	}


	/**
	 * Returns information about views in a database
	 *
	 * @param string $database Database
	 * @return array
	 */
	private function _showViews($database = '')
	{
		$sql = "SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` "
			 . "WHERE `TABLE_SCHEMA` = '{$database}'";
		$views = $this->_query($sql, array('TABLE_NAME', 'DEFINER', 'IS_UPDATABLE'));

		return array('contents' => 'views', 'from' => $database, 'data' => $views);
	}


	/**
	 * Return create view statement
	 *
	 * @param string $name View name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateView($name, $database)
	{
		$view = $this->_query("SHOW CREATE VIEW `{$database}`.`{$name}`");

		return array(
			'view' => $name,
			'from' => $database,
			'statement' => $view[0]['Create View']
		);
	}


	/**
	 * Drops views
	 *
	 * @param array $views List of views
	 * @param $from string Database
	 * @return array
	 */
	private function _dropViews(array $views, $from)
	{
		$dropped = null;

		foreach ($views as $view) {
			try {
				$this->_query("DROP VIEW `{$from}`.`{$view}`;");
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
	 * @param $database Database
	 * @return array
	 */
	private function _showRoutines($database = '')
	{
		$sql = "SELECT `ROUTINE_NAME`, LOWER(`ROUTINE_TYPE`) AS `ROUTINE_TYPE`, "
			 . "`DEFINER`, `DTD_IDENTIFIER` "
			 . "FROM `INFORMATION_SCHEMA`.`ROUTINES` "
			 . "WHERE `ROUTINE_SCHEMA` = '{$database}'";
		$routines = $this->_query(
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
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateProcedure($name, $database)
	{
		$procedure = $this->_query("SHOW CREATE PROCEDURE `{$database}`.`{$name}`");

		return array(
			'procedure' => $name,
			'from' => $database,
			'statement' => $procedure[0]['Create Procedure']
		);
	}


	/**
	 * Return create function statement
	 *
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateFunction($name, $database)
	{
		$function = $this->_query("SHOW CREATE FUNCTION `{$database}`.`{$name}`");

		return array(
			'function' => $name,
			'from' => $database,
			'statement' => $function[0]['Create Function']
		);
	}



	/**
	 * Drops stored procedures and functions
	 *
	 * @param array $rouitines
	 * @param string $from
	 * @return array
	 */
	private function _dropRoutines(array $routines, $from)
	{
		$dropped = array();

		if (isset($routines['function'])) {
			foreach ($routines['function'] as $function) {
				try {
					$this->_query("DROP FUNCTION `{$from}`.`{$function}`;");
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
					$this->_query("DROP PROCEDURE `{$from}`.`{$procedure}`;");
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
	 * @param string $database Database
	 * @return array
	 */
	private function _showTriggers($database = '')
	{
		$triggers = $this->_query(
			"SHOW TRIGGERS FROM `{$database}`",
			array('Trigger', 'Table', 'Event', 'Timing', 'Created')
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
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	private function _showCreateTrigger($name, $database)
	{
		$trigger = $this->_query("SHOW CREATE TRIGGER `{$database}`.`{$name}`");

		return array(
			'trigger' => $name,
			'from' => $database,
			'statement' => $trigger[0]['SQL Original Statement']
		);
	}


	/**
	 * Drops triggers
	 *
	 * @param array $triggers Triggers
	 * @param string $database Database
	 * @return array
	 */
	private function _dropTriggers(array $triggers, $database)
	{
		$dropped = array();
		foreach ($triggers as $trigger) {
			try {
				$this->_query("DROP TRIGGER `{$database}`.`{$trigger}`");
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
	 * @param string $table Table name
	 * @param string $database Database
	 * @param int $limit
	 * @param int $offset
	 * @return array
	 */
	private function _browse($table, $database, $limit = 30, $offset = 0)
	{
		$columns = $this->_query(
			"SHOW COLUMNS IN `{$table}` FROM `{$database}`",
			array('Field', 'Key', 'Type')
		);
		$total = $this->_query("SELECT COUNT(*) as `count` FROM `{$database}`.`{$table}`");
		$data = $this->_query("SELECT * FROM `{$database}`.`{$table}` LIMIT {$offset}, {$limit}");

		return array('data' => $data, 'columns' => $columns, 'total' => $total[0]['count']);
	}

}
