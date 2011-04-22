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
			$response = $this->createDatabase($_POST['name'], $_GET['collation']);
		}
		//
		if (isset($response)) {
			print json_encode(array_merge(array('status' => 'ok'), (array)$response));
		} else {
			throw new JuxtaException('Not clear request');
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
	
	private function views($database = '') {
		$views = $this->query("SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` WHERE `TABLE_SCHEMA` = '{$database}'", array('TABLE_NAME', 'DEFINER', 'IS_UPDATABLE'));
		return array('contents' => 'views', 'from' => $database, 'data' => $views);
	}
	
	private function routines($database = '') {
		$routines = $this->query("SELECT * FROM `INFORMATION_SCHEMA`.`ROUTINES` WHERE `ROUTINE_SCHEMA` = '{$database}'", array('ROUTINE_NAME', 'DEFINER', 'DTD_IDENTIFIER'));
		return array('contents' => 'routines', 'from' => $database, 'data' => $routines);
	}
	
	private function triggers($database = '') {
		$triggers = $this->query("SHOW TRIGGERS FROM `{$database}`", array('trigger', 'table', 'event', 'timing', 'created'));
		return array('contents' => 'triggers', 'from' => $database, 'data' => $triggers);
	}
}

/*
 * Exceptions raised in Juxta class
 * 
 */

class JuxtaException extends Exception {
	protected $status = 'error';

	public function getStatus() {
		return $this->status;
	}
}

class JuxtaConnectionException extends JuxtaException {
	protected $status = 'connect_error';
}

class JuxtaQueryException extends JuxtaException {
	protected $status = 'error';
}

class JuxtaSessionException extends JuxtaException {
	protected $status = 'session_not_found';
}


?>
