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

/*
 * Juxta backend class
 * 
 */

class Juxta {
	private $config = array();
	private $mysql = NULL;

	public function __construct($config = array()) {
		$this->config = $config;
		$this->route();
	}

	public function __destruct() {
		if (isset($this->mysql)) {
			$this->mysql->close();
		}
	}

	private function connect($connection) {
		if (!$this->mysql) {
			$this->mysql = new mysqli($connection['host'], $connection['user'], $connection['password'], null, $connection['port']);
			if ($this->mysql->connect_error) {
				throw new JuxtaConnectionException($this->mysql->connect_error, $this->mysql->connect_errno);
			}
		}
	}

	private function query($sql, $cols) {
		//
		if (!isset($_SESSION['host']) || !isset($_SESSION['user']) || !isset($_SESSION['password'])) {
			throw new JuxtaSessionException('Please login');
		}
		//
		$this->connect(array('host' => $_SESSION['host'], 'user' => $_SESSION['user'], 'password' => $_SESSION['password'], 'port' => $_SESSION['port']));

		$result = $this->mysql->query($sql);
		if ($this->mysql->error) {
			throw new JuxtaQueryException($this->mysql->error, $this->mysql->errno);
		}
		//
		$response = array();
		if ($result) {
			while ($row = mysqli_fetch_array($result)) {
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

	public function route() {
		if (isset($_GET['show'])) {
			switch ($_GET['show']) {
				case 'stored_connections':
					$response = $this->storedConnections();
					break;
				case 'databases':
					$response = $this->databases();
					break;
				case 'database-properties':
					$response = $this->databaseProperties($_REQUEST['database']);
					break;
				case 'processlist':
					$response = $this->processlist();
					break;
				case 'status':
				case 'status-full':
					$response = $this->status();
					$response['contents'] = $_GET['show'];
					break;
				case 'variables':
					$response = $this->variables();
					break;
				case 'charsets':
					$response = $this->charsets();
					break;
				case 'engines':
					$response = $this->engines();
					break;
				case 'users':
					$response = $this->users();
					break;
				case 'tables':
					$response = $this->tables($_GET['from']);
					break;
				case 'views':
					$response = $this->views($_GET['from']);
					break;
				case 'routines':
					$response = $this->routines($_GET['from']);
					break;
				case 'triggers':
					$response = $this->triggers($_GET['from']);
					break;
			}
		} elseif (isset($_GET['get'])) {
			switch ($_GET['get']) {
				case 'connections':
					$response = $this->storedConnections();
					break;
				case 'collations':
					$response = $this->collations();
					break;
			}
		} elseif (isset($_GET['login'])) {
			try {
				$_POST['port'] = $_POST['port'] ? $_POST['port'] : 3306;
				$this->connect(array(
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
				$response = $this->createDatabase($_POST['name']);
			}
		} elseif (isset($_GET['drop'])) {
			switch ($_GET['drop']) {
				// Drop databases
				case 'database':
				case 'databases':
					if (!empty($_POST['database'])) {
						$_POST['databases'] = $_POST['database'];
					}
					$response = $this->dropDatabases((array)$_POST['databases']);
					break;
				// Drop tables
				case 'table':
				case 'tables':
					if (!empty($_POST['table'])) {
						$_POST['tables'] = $_POST['table'];
					}
					$response = $this->dropTables((array)$_POST['tables'], $_GET['from']);
					break;
				// Drop views
				case 'view':
				case 'views':
					if (!empty($_POST['view'])) {
						$_POST['views'] = $_POST['view'];
					}
					$response = $this->dropViews((array)$_POST['views'], $_GET['from']);
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
					$response = $this->dropRoutines((array)$_REQUEST['routines'], $_GET['from']);
					break;
				// Drop triggers
				case 'trigger':
				case 'triggers':
					if (!empty($_REQUEST['trigger'])) {
						$_REQUEST['triggers'] = $_REQUEST['trigger'];
					}
					$response = $this->dropTriggers((array)$_REQUEST['triggers'], $_GET['from']);
					break;
			}
		}
		//
		if (isset($response)) {
			print json_encode(array_merge(array('status' => 'ok'), (array)$response));
		} else {
			throw new JuxtaException('Invalid request');
		}
	}

	private function storedConnections() {
		$connections = array();
		if (isset($this->config['stored_connections']) && is_array($this->config['stored_connections'])) {
			foreach ($this->config['stored_connections'] as $connection) {
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

	private function databases() {
		$databases = $this->query("SHOW DATABASES", array(0));
		return array('contents' => 'databases', 'data' => $databases);
	}

	private function createDatabase($name, $collation = null) {
		$this->query("CREATE DATABASE `{$name}`");
		return array('database' => 'created', 'name' => $name);
	}

	private function dropDatabases(array $databases) {
		$dropped = array();
		foreach ($databases as $database) {
			try {
				$this->query("DROP DATABASE `{$database}`");
				$dropped[] = $database;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}


	/**
	 * Get database properties
	 *
	 * @param string $database Database name
	 * @return array
	 */
	private function databaseProperties($database) {
		$properties = array(
			'name' => $database,
		);

		$charset = $this->query("SELECT `DEFAULT_CHARACTER_SET_NAME` as `name`, `DEFAULT_COLLATION_NAME` as `collation` FROM `information_schema`.`SCHEMATA` WHERE `SCHEMA_NAME` = '{$database}'");
		if ($charset) {
			$properties['charset'] = $charset[0]['name'];
			$properties['collation'] = $charset[0]['collation'];
		}

		$statistics = $this->query("SELECT COUNT(*) AS `tables`, SUM(`TABLE_ROWS`) AS `rows`, SUM(`DATA_LENGTH`) AS `data_length`, SUM(`INDEX_LENGTH`) AS `index_length` FROM `INFORMATION_SCHEMA`.`TABLES` WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'"/*, array('tables', 'rows', 'data_length', 'index_length')*/);
		if ($statistics) {
			$properties['tables']= $statistics[0]['tables'];
			$properties['rows']= $statistics[0]['rows'];
			$properties['data_length']= (int)$statistics[0]['data_length'];
			$properties['index_length']= (int)$statistics[0]['index_length'];
		}

		return array('contents' => 'database-properties', 'properties' => $properties, 'charset' => $statistics);
	}
	
	private function processlist() {
		$processlist = $this->query("SHOW PROCESSLIST", array(0, 1, 2, 3, 4, 5));
		return array('contents' => 'processlist', 'data' => $processlist);
	}
	
	private function status() {
		$response = array();
		$status = $this->query("SHOW STATUS", array(0, 1));
		foreach ($status as $variable) {
			$response[$variable[0]] = $variable[1];
		}
		return array('contents' => 'status', 'data' => $response);
	}

	private function variables() {
		$variables = $this->query("SHOW VARIABLES", array(0, 1));
		return array('contents' => 'variables', 'data' => $variables);
	}

	private function charsets() {
		$charsets = $this->query("SHOW CHARSET", array('Charset', 'Description', 'Default collation', 'Maxlen'));
		return array('contents' => 'charsets', 'data' => $charsets);
	}

	private function collations() {
		$collations = $this->query("SHOW COLLATION", array('Charset', 'Collation'));
		$response = array();
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

	private function engines() {
		$engines = $this->query("SHOW ENGINES", array('Engine', 'Support', 'Comment'));
		return array('contents' => 'engines', 'data' => $engines);
	}
	
	private function users() {
		$users = $this->query("SELECT * FROM mysql.user");
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

	private function tables($database = '') {
		$tables = $this->query("SELECT * FROM `INFORMATION_SCHEMA`.`TABLES` WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'", array('TABLE_NAME', 'ENGINE', 'TABLE_ROWS', 'DATA_LENGTH', 'UPDATE_TIME'));
		return array('contents' => 'tables', 'from' => $database, 'data' => $tables);
	}

	private function dropTables(array $tables, $from) {
		$dropped = array();
		foreach ($tables as $table) {
			try {
				$this->query("DROP TABLE `{$from}`.`{$table}`;");
				$dropped[] = $table;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}

	private function views($database = '') {
		$views = $this->query("SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` WHERE `TABLE_SCHEMA` = '{$database}'", array('TABLE_NAME', 'DEFINER', 'IS_UPDATABLE'));
		return array('contents' => 'views', 'from' => $database, 'data' => $views);
	}

	private function dropViews(array $views, $from) {
		$dropped = array();
		foreach ($views as $view) {
			try {
				$this->query("DROP VIEW `{$from}`.`{$view}`;");
				$dropped[] = $view;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return array('dropped' => $dropped);
	}

	private function routines($database = '') {
		$routines = $this->query("SELECT `ROUTINE_NAME`, LOWER(`ROUTINE_TYPE`) AS `ROUTINE_TYPE`, `DEFINER`, `DTD_IDENTIFIER` FROM `INFORMATION_SCHEMA`.`ROUTINES` WHERE `ROUTINE_SCHEMA` = '{$database}'", array('ROUTINE_NAME', 'ROUTINE_TYPE', 'DEFINER', 'DTD_IDENTIFIER'));
		return array('contents' => 'routines', 'from' => $database, 'data' => $routines);
	}

	/**
	 * Drops stored procedures and functions
	 *
	 * @param array $rouitines
	 * @param string $from
	 * @return array
	 */
	private function dropRoutines(array $routines, $from) {
		$dropped = array();
		if (isset($routines['function'])) {
			foreach ($routines['function'] as $function) {
				try {
					$this->query("DROP FUNCTION `{$from}`.`{$function}`;");
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
					$this->query("DROP PROCEDURE `{$from}`.`{$procedure}`;");
					$dropped['procedure'][] = $procedure;
				} catch (JuxtaQueryException $e) {
					$e->addtoResponse(array('dropped' => $dropped, 'from' => $from));
					throw $e;
				}
			}
		}

		return array('dropped' => $dropped);
	}

	private function triggers($database = '') {
		$triggers = $this->query("SHOW TRIGGERS FROM `{$database}`", array('Trigger', 'Table', 'Event', 'Timing', 'Created'));
		return array('contents' => 'triggers', 'from' => $database, 'data' => $triggers);
	}
	
	private function dropTriggers(array $triggers, $database) {
		$dropped = array();
		foreach ($triggers as $trigger) {
			try {
				$this->query("DROP TRIGGER `{$database}`.`{$trigger}`");
				$dropped[] = $trigger;
			} catch (JuxtaQueryException $e) {
				$e->addtoResponse(array('dropped' => $dropped));
				throw $e;
			}
		}

		return array('triggers' => $triggers, 'dropped' => $dropped);
	}

}

/*
 * Exceptions raised in Juxta class
 * 
 */

class JuxtaException extends Exception {

	protected $_status = 'error';

	private $_toResponse = array();

	public function getStatus() {
		return $this->_status;
	}

	public function addToResponse(array $toResponse = array()) {
		$this->_toResponse = array_merge($this->_toResponse, $toResponse);
	}

	public function toResponse() {
		return $this->_toResponse;
	}

}

class JuxtaConnectionException extends JuxtaException {
	protected $_status = 'connect_error';
}

class JuxtaQueryException extends JuxtaException {
	protected $_status = 'error';
}

class JuxtaSessionException extends JuxtaException {
	protected $_status = 'session_not_found';
}


?>
