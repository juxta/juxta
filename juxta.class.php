<?php

/*
 * Juxta 0.1 http://juxta.ru
 * 
 * Copyright (c) 2010 Alexey Golovnya
 * Licensed under the MIT license
 * 
 * @package juxta-php
 * @version 0.1 
 * 
 */
 
function size($value) {
	if ($value < 1024) {
		return $value;
	}
	$value = round($value / 1024, 0);
	if ($value < 1024) {
		return $value . ' K';
	}
	$value = round($value / 1024, 0);
	if ($value < 1024) {
		return $value . ' M';
	} else {
		return $value . ' G';
	}
}

/*
 * Juxta backend class
 * 
 */

class Juxta {
	private $config = array();
	private $mysql = NULL;

	public function __construct(array $config) {
		$this->config = $config;
		//
		if ($_GET['debug']) {
			$this->route($_GET);
		} else {
			$this->route($_POST);
		}
	}

	public function __destruct() {
		if ($this->mysql) {
			$this->mysql->close();
		}
	}

	private function query($sql, $cols) {
		//
		if (!$this->mysql) {
			$connection = array(
				'host' => $this->config['stored_connections'][0]['host'],
				'user' => $this->config['stored_connections'][0]['user'],
				'password' => $this->config['stored_connections'][0]['password'],
			);
			$this->mysql = @new mysqli($connection['host'], $connection['user'], $connection['password']);
			if ($this->mysql->connect_error) {
				throw new JuxtaConnectionException($this->mysql->connect_error, $this->mysql->connect_errno);
			}
		}
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

	public function route($data) {
		switch ($data['show']) {
			case 'stored_connections':
				$response = $this->storedConnections();
				break;
			case 'databases':
				$response = $this->databases();
				break;
			case 'processlist':
				$response = $this->processlist();
				break;
			case 'users':
				$response = $this->users();
				break;
			case 'tables':
				$response = $this->tables($data['from']);
				break;
			case 'views':
				$response = $this->views($data['from']);
				break;
			case 'routines':
				$response = $this->routines($data['from']);
				break;
			case 'triggers':
				$response = $this->triggers($data['from']);
				break;
			default:
				throw new JuxtaException('Not clear request');
		}
		print json_encode(array_merge(array('status' => 'ok'), (array)$response));
	}

	private function storedConnections() {
		$connections = array();
		if (is_array($this->config['stored_connections'])) {
			foreach ($this->config['stored_connections'] as $connection) {
				if ($connection['password']) {
					unset($connection['password']);
				}
				$connections[] = $connection;
			}
		}
		return array('contents' => 'stored_connections', 'data' => $connections);
	}

	private function databases() {
		$databases = $this->query("SHOW DATABASES", array(0));
		return array('contents' => 'databases', 'data' => $databases);
	}

	private function processlist() {
		$processlist = $this->query("SHOW PROCESSLIST", array(0, 1, 2, 3, 4, 5));
		return array('contents' => 'processlist', 'data' => $processlist);
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


?>
