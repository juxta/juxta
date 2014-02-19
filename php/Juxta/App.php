<?php namespace Juxta;

class App
{

	/**
	 * @var Config
	 */
	protected $config;


	/**
	 * @var Connections
	 */
	protected $connections;


	/**
	 * @var string
	 */
	protected $driver = 'Mysqli';


	/**
	 * @param Config $config
	 */
	public function __construct(Config $config)
	{
		$this->config = $config;
		$this->connections = new Connections(new Session(), $this->config);
	}


	/**
	 * @return mixed
	 */
	public function run()
	{
		$cid = isset($_REQUEST['cid']) ? (int)$_REQUEST['cid'] : 0;

		$response = null;

		try {

			if (isset($_GET['login'])) {

				$response = $this->connect(Db::connectionFromArray($_POST));

			} elseif (isset($_GET['logout'])) {

				$response = $this->close($cid);

			} elseif (isset($_GET['flush'])) {

				$response = $this->closeAll();

			} elseif (isset($_GET['get'])) {
				switch ($_GET['get']) {

					case 'session':
						$response = $this->getSession($cid);
						break;

					case 'connections':
						$response = $this->getConnections();
						break;
				}

			} elseif (isset($_GET['show'])) {
				switch ($_GET['show']) {

					case 'databases':
						$response = $this->showDatabases($cid);
						break;

					case 'processlist':
						$response = $this->showProcesslist($cid);
						break;

					case 'users':
						$response = $this->showUsers($cid);
						break;

					case 'status':
						$response = $this->showStatus($cid);
						break;

					case 'variables':
						$response = $this->showVariables($cid);
						break;

					case 'charsets':
						$response = $this->showCharsets($cid);
						break;

					case 'engines':
						$response = $this->showEngines($cid);
						break;

					case 'tables':
						$response = $this->showTables($cid, $_GET['from']);
						break;

					case 'table':
						$response = $this->showTable($cid, $_GET['table'], $_GET['from']);
						break;

					case 'views':
						$response = $this->showViews($cid, $_GET['from']);
						break;

					case 'view':
						$response = $this->showCreateView($cid, $_GET['view'], $_GET['from']);
						break;

					case 'routines':
						$response = $this->showRoutines($cid, $_GET['from']);
						break;

					case 'procedure':
						$response = $this->showCreateProcedure($cid, $_GET['procedure'], $_GET['from']);
						break;

					case 'function':
						$response = $this->showCreateFunction($cid, $_GET['function'], $_GET['from']);
						break;

					case 'triggers':
						$response = $this->showTriggers($cid, $_GET['from']);
						break;

					case 'trigger':
						$response = $this->showCreateTrigger($cid, $_GET['trigger'], $_GET['from']);
						break;

					case 'properties':
						if (isset($_GET['database'])) {
							$response = $this->showDatabaseProperties($cid, $_GET['database']);

						} elseif (isset($_GET['table'])) {
							$response = $this->showTableProperties($cid, $_GET['table'], $_GET['from']);
						}
						break;
				}

			} elseif (isset($_GET['create'])) {
				switch ($_GET['create']) {
					case 'database':
						$response = $this->createDatabase($cid, $_POST['name']);
						break;
				}

			} elseif (isset($_GET['drop'])) {
				switch ($_GET['drop']) {
					case 'databases':
						$response = $this->dropDatabases($cid, (array)$_POST['databases']);
						break;

					case 'users':
						$response = $this->dropUsers($cid, (array)$_POST['users']);
						break;

					case 'tables':
						$response = $this->dropTables($cid, (array)$_POST['tables'], $_GET['from']);
						break;

					case 'views':
						$response = $this->dropViews($cid, (array)$_POST['views'], $_GET['from']);
						break;

					case 'functions':
						$_REQUEST['routines']['function'] = $_REQUEST['functions'];
					case 'procedures':
						$_REQUEST['routines']['procedure'] = $_REQUEST['procedures'];
					case 'routines':
						if (!empty($_POST['routine'])) {
							$_REQUEST['routines'] = $_REQUEST['routine'];
						}
						$response = $this->dropRoutines($cid, (array)$_REQUEST['routines'], $_GET['from']);
						break;

					case 'triggers':
						$response = $this->dropTriggers($cid, (array)$_REQUEST['triggers'], $_GET['from']);
						break;
				}

			} elseif (isset($_GET['kill'])) {
				$response = $this->kill($cid, (array)$_REQUEST['processes']);

			} elseif (isset($_GET['browse'])) {
				$response = $this->browse($cid, $_GET['browse'], $_GET['from'], isset($_GET['limit']) ? $_GET['limit'] : 30,
					isset($_GET['offset']) ? $_GET['offset'] : 0);

			}

		} catch (Exception $e) {

			$status = array(
				'Juxta\Exception_SessionNotFound' => "session_not_found",
				'Juxta\Db_Exception_Connect' => "connection_error",
				'Juxta\Db_Exception_Query' => "query_error",
			);

			$response = array('error' => isset($status[get_class($e)]) ? $status[get_class($e)] : 'error',
				'errormsg' => $e->getMessage(), 'errorno' => $e->getCode());

			$response += (array)$e->getAttachment();
		}

		return json_encode($response);
	}


	/**
	 * @param $cid
	 * @return Db_Mysqli
	 * @throws Exception_SessionNotFound
	 */
	protected function getDb($cid)
	{
		$connection = $this->connections->getByCid($cid);

		if (empty($connection)) {
			throw new Exception_SessionNotFound();
		}

		return Db::factory($this->driver, $connection);
	}


	/**
	 * Connect to server and save connection
	 *
	 * @param array $connection
	 * @return array|string
	 */
	protected function connect(array $connection)
	{
		try {
			Db::factory($this->driver, $connection);

			$cid = $this->connections->save($connection);

			unset($connection['password']);

			$connection['cid'] = $cid;

			return $connection;

		} catch (Db_Exception_Connect $e) {

			return $e->getMessage();
		}
	}


	/**
	 * Close connection
	 *
	 * @param $cid
	 * @return bool
	 */
	protected function close($cid)
	{
		return $this->connections->delete($cid);
	}


	/**
	 * Close all connections
	 *
	 * @return bool
	 */
	protected function closeAll()
	{
		$this->connections->deleteAll();

		return true;
	}


	/**
	 * Return established connection by Connection ID
	 *
	 * @param $cid
	 * @return array
	 * @throws Exception_SessionNotFound
	 */
	protected function getSession($cid)
	{
		$current = $this->connections->getByCid($cid, true);

		if (empty($current)) {
			throw new Exception_SessionNotFound();
		}

		return $current;
	}


	/**
	 * Get all connection
	 *
	 * @return array
	 */
	public function getConnections()
	{
		return $this->connections->getAll();
	}


	/**
	 * Return list of databases
	 *
	 * @param $cid
	 * @return array
	 */
	protected function showDatabases($cid)
	{
		return $this->getDb($cid)->query("SHOW DATABASES", array('Database'));
	}


	/**
	 * Create a database
	 *
	 * @param $cid
	 * @param $name
	 * @return bool
	 */
	protected function createDatabase($cid, $name)
	{
		return $this->getDb($cid)->query("CREATE DATABASE `{$name}`");
	}


	/**
	 * Drop databases
	 *
	 * @param $cid
	 * @param array $databases
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropDatabases($cid, array $databases)
	{
		$dropped = array();

		foreach ($databases as $database) {
			try {
				$this->getDb($cid)->query("DROP DATABASE `{$database}`");
				$dropped[] = $database;

			} catch (Db_Exception_Query $e) {

				if (!empty($dropped)) {
					$e->attach(array('dropped' => $dropped));
				}

				throw $e;
			}
		}

		return $dropped;
	}


	/**
	 * Database properties
	 *
	 * @param int $cid
	 * @param string $database Database name
	 * @return array
	 */
	protected function showDatabaseProperties($cid, $database)
	{
		$properties = array('name' => $database);

		$sql1 = "SELECT `DEFAULT_CHARACTER_SET_NAME` as `name`, "
			. "`DEFAULT_COLLATION_NAME` as `collation` "
			. "FROM `information_schema`.`SCHEMATA` "
			. "WHERE `SCHEMA_NAME` = '{$database}'";

		$charset = $this->getDb($cid)->query($sql1, MYSQL_BOTH);

		if ($charset) {
			$properties['charset'] = $charset[0]['name'];
			$properties['collation'] = $charset[0]['collation'];
		}

		$sql2 = "SELECT COUNT(*) AS `tables`, SUM(`TABLE_ROWS`) AS `rows`, "
			. "SUM(`DATA_LENGTH`) AS `data_length`, "
			. "SUM(`INDEX_LENGTH`) AS `index_length` "
			. "FROM `INFORMATION_SCHEMA`.`TABLES` "
			. "WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'";

		$statistics = $this->getDb($cid)->query($sql2, MYSQL_ASSOC);

		if ($statistics) {
			$properties['tables']= $statistics[0]['tables'];
			$properties['rows']= $statistics[0]['rows'];
			$properties['data_length']= (int)$statistics[0]['data_length'];
			$properties['index_length']= (int)$statistics[0]['index_length'];
		}

		return $properties;
	}


	/**
	 * Return list of processes
	 *
	 * @param $cid
	 * @return array
	 */
	protected function showProcesslist($cid)
	{
		return $this->getDb($cid)->query("SHOW PROCESSLIST", array('Id', 'User', 'Host', 'db', 'Command', 'Time', 'Info'));
	}


	/**
	 * Kill processes
	 *
	 * @param $cid
	 * @param array $processes
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function kill($cid, array $processes)
	{
		$killed = null;

		foreach ($processes as $process) {
			try {
				$this->getDb($cid)->query("KILL {$process}");
				$killed[] = $process;

			} catch (Db_Exception_Query $exception) {
				$exception->attach(array('killed' => $killed));
				throw $exception;
			}
		}

		return $killed;
	}


	/**
	 * Users
	 *
	 * @param int $cid
	 * @return array
	 */
	protected function showUsers($cid)
	{
		$users = $this->getDb($cid)->query("SELECT * FROM mysql.user");

		$response = null;

		if (is_array($users)) {
			foreach ($users as $user) {
				$user['Global_priv'] = '';

				$response[] = array($user['User'], $user['Host'], $user['Password'] ? 'YES' : 'NO',
					$user['Global_priv'], $user['Grant_priv'] ? 'YES' : '');
			}
		}

		return $response;
	}


	/**
	 * Drop users
	 *
	 * @param $cid
	 * @param array $users
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropUsers($cid, array $users)
	{
		$dropped = array();

		foreach ($users as $user) {
			try {
				$this->getDb($cid)->query("DROP USER {$user}");
				$dropped[] = $user;

			} catch (Db_Exception_Query $e) {
				$e->attach(array('dropped' => $dropped));
				throw $e;
			}
		}

		return $dropped;
	}


	/**
	 * Return list of status variables
	 *
	 * @param int $cid
	 * @return array
	 */
	protected function showStatus($cid)
	{
		return $this->getDb($cid)->query("SHOW STATUS", array('Variable_name', 'Value'));
	}


	/**
	 * Return  list of system variables
	 *
	 * @param int $cid
	 * @return array
	 */
	protected function showVariables($cid)
	{
		return $this->getDb($cid)->query("SHOW VARIABLES", array('Variable_name', 'Value'));
	}


	/**
	 * Return  list of available character sets
	 *
	 * @param $cid
	 * @return array
	 */
	protected function showCharsets($cid)
	{
		return $this->getDb($cid)->query("SHOW CHARSET", array('Charset', 'Default collation', 'Description'));
	}


	/**
	 * Return information about server's storage engines
	 *
	 * @param int $cid
	 * @return array
	 */
	private function showEngines($cid)
	{
		return $this->getDb($cid)->query("SHOW ENGINES", array('Engine', 'Support', 'Comment'));
	}


	/**
	 * Return information about tables in a database
	 *
	 * @param $cid
	 * @param $database
	 * @return array
	 */
	protected function showTables($cid, $database)
	{
		return $this->getDb($cid)
			->query("SHOW TABLE STATUS FROM `{$database}`", array('Name', 'Engine', 'Rows', 'Data_length'));
	}


	/**
	 * Drop tables
	 *
	 * @param $cid
	 * @param array $tables
	 * @param $from
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropTables($cid, array $tables, $from)
	{
		$dropped = null;

		foreach ($tables as $table) {
			try {
				$this->getDb($cid)->query("DROP TABLE `{$from}`.`{$table}`;");
				$dropped[] = $table;

			} catch (Db_Exception_Query $e) {
				$e->attach(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return $dropped;
	}


	/**
	 * Return information about tables in a database
	 *
	 * @param $cid
	 * @param $table
	 * @param $database
	 * @return array
	 */
	protected function showTable($cid, $table, $database)
	{
		$table = $this->getDb($cid)->query("SHOW COLUMNS FROM `{$table}` FROM `{$database}`", MYSQLI_BOTH);

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
	 * @param int $cid
	 * @param string $table Table name
	 * @param string $database Database
	 * @return array
	 */
	protected function showTableProperties($cid, $table, $database)
	{
		$properties = $this->getDb($cid)->query("SHOW TABLE STATUS FROM `{$database}` LIKE '{$table}'", MYSQLI_ASSOC);

		if (!empty($properties)) {
			$properties = array_change_key_case($properties[0], CASE_LOWER);
		}

		return $properties;
	}


	/**
	 * Return information about views in a database
	 *
	 * @param int $cid
	 * @param string $database Database
	 * @return array
	 */
	protected function showViews($cid, $database)
	{
		return $this->getDb($cid)->query(
				"SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` WHERE `TABLE_SCHEMA` = '{$database}'",
				array('TABLE_NAME', 'DEFINER', 'IS_UPDATABLE')
			);
	}


	/**
	 * Drop views
	 *
	 * @param $cid
	 * @param array $views
	 * @param $from
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropViews($cid, array $views, $from)
	{
		$dropped = null;

		foreach ($views as $view) {
			try {
				$this->getDb($cid)->query("DROP VIEW `{$from}`.`{$view}`;");
				$dropped[] = $view;

			} catch (Db_Exception_Query $e) {
				$e->attach(array('dropped' => $dropped, 'from' => $from));
				throw $e;
			}
		}

		return $dropped;
	}


	/**
	 * Return create view statement
	 *
	 * @param int $cid
	 * @param string $name View name
	 * @param string $database Database name
	 * @return array
	 */
	protected function showCreateView($cid, $name, $database)
	{
		$view = $this->getDb($cid)->query("SHOW CREATE VIEW `{$database}`.`{$name}`");

		return array('view' => $name, 'from' => $database, 'statement' => $view[0]['Create View']);
	}


	/**
	 * Return information about stored procedures and functions
	 *
	 * @param int $cid
	 * @param $database
	 * @return array
	 */
	protected function showRoutines($cid, $database)
	{
		$sql = "SELECT `ROUTINE_NAME`, LOWER(`ROUTINE_TYPE`) AS `ROUTINE_TYPE`, "
			. "`DEFINER`, `DTD_IDENTIFIER` "
			. "FROM `INFORMATION_SCHEMA`.`ROUTINES` "
			. "WHERE `ROUTINE_SCHEMA` = '{$database}'";

		return $this->getDb($cid)->query($sql, array('ROUTINE_NAME', 'ROUTINE_TYPE', 'DEFINER', 'DTD_IDENTIFIER'));
	}


	/**
	 * Drop stored procedures and functions
	 *
	 * @param $cid
	 * @param array $routines
	 * @param $from
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropRoutines($cid, array $routines, $from)
	{
		$dropped = array();

		if (isset($routines['function'])) {
			foreach ($routines['function'] as $function) {
				try {
					$this->getDb($cid)->query("DROP FUNCTION `{$from}`.`{$function}`;");
					$dropped['function'][] = $function;

				} catch (Db_Exception_Query $e) {
					$e->attach(array('dropped' => $dropped, 'from' => $from));
					throw $e;
				}
			}
		}
		if (isset($routines['procedure'])) {
			foreach ($routines['procedure'] as $procedure) {
				try {
					$this->getDb($cid)->query("DROP PROCEDURE `{$from}`.`{$procedure}`;");
					$dropped['procedure'][] = $procedure;

				} catch (Db_Exception_Query $e) {
					$e->attach(array('dropped' => $dropped, 'from' => $from));
					throw $e;
				}
			}
		}

		return $dropped;
	}


	/**
	 * Return create procedure statement
	 *
	 * @param int $cid
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	protected function showCreateProcedure($cid, $name, $database)
	{
		$procedure = $this->getDb($cid)->query("SHOW CREATE PROCEDURE `{$database}`.`{$name}`");

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
	protected function showCreateFunction($cid, $name, $database)
	{
		$function = $this->getDb($cid)->query("SHOW CREATE FUNCTION `{$database}`.`{$name}`");

		return array(
			'function' => $name,
			'from' => $database,
			'statement' => $function[0]['Create Function']
		);
	}


	/**
	 * Triggers
	 *
	 * @param int $cid
	 * @param string $database Database
	 * @return array
	 */
	protected function showTriggers($cid, $database)
	{
		return $this->getDb($cid)
			->query("SHOW TRIGGERS FROM `{$database}`", array('Trigger', 'Table', 'Event', 'Timing'));
	}


	/**
	 * Return create trigger statement
	 *
	 * @param int $cid
	 * @param string $name Trigger name
	 * @param string $database Database name
	 * @return array
	 */
	protected function showCreateTrigger($cid, $name, $database)
	{
		$trigger = $this->getDb($cid)->query("SHOW CREATE TRIGGER `{$database}`.`{$name}`");

		return array('trigger' => $name, 'from' => $database, 'statement' => $trigger[0]['SQL Original Statement']);
	}


	/**
	 * Drop triggers
	 *
	 * @param $cid
	 * @param array $triggers
	 * @param $database
	 * @return array
	 * @throws \Exception
	 * @throws Db_Exception_Query
	 */
	protected function dropTriggers($cid, array $triggers, $database)
	{
		$dropped = array();
		foreach ($triggers as $trigger) {
			try {
				$this->getDb($cid)->query("DROP TRIGGER `{$database}`.`{$trigger}`");
				$dropped[] = $trigger;

			} catch (Db_Exception_Query $e) {
				$e->attach(array('dropped' => $dropped));
				throw $e;
			}
		}

		return $dropped;
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
	protected function browse($cid, $table, $database, $limit = 30, $offset = 0)
	{
		$columns = $this->getDb($cid)->query("SHOW COLUMNS IN `{$table}` FROM `{$database}`", array('Field', 'Key', 'Type'));
		$total = $this->getDb($cid)->query("SELECT COUNT(*) as `count` FROM `{$database}`.`{$table}`");
		$data = $this->getDb($cid)->query("SELECT * FROM `{$database}`.`{$table}` LIMIT {$offset}, {$limit}");

		return array('data' => $data, 'columns' => $columns, 'total' => $total[0]['count']);
	}

}
