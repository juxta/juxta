<?php namespace Juxta;

use Juxta\Exception\SessionNotFound;
use Juxta\Db\Exception\Query;
use Juxta\Db\Exception\Connect;

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

                    case 'indexes':
                        $response = $this->showIndexes($cid, $_GET['table'], $_GET['from']);
                        break;

                    case 'foreign':
                        $response = $this->showForeign($cid, $_GET['table'], $_GET['from']);
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

                        } elseif (isset($_GET['view'])) {
                            $response = $this->showViewProperties($cid, $_GET['view'], $_GET['from']);

                        } elseif (isset($_GET['procedure'])) {
                            $response = $this->showProcedureProperties($cid, $_GET['procedure'], $_GET['from']);

                        } elseif (isset($_GET['function'])) {
                            $response = $this->showFunctionProperties($cid, $_GET['function'], $_GET['from']);

                        } elseif (isset($_GET['trigger'])) {
                            $response = $this->showTriggerProperties($cid, $_GET['trigger'], $_GET['from']);
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

            } elseif (isset($_GET['truncate'])) {
                $response = $this->truncate($cid, (array)$_POST['tables'], $_POST['from']);

            } elseif (isset($_GET['browse'])) {
                $response = $this->browse($cid, $_GET['browse'], $_GET['from'], isset($_GET['limit']) ? $_GET['limit'] : 30,
                    isset($_GET['offset']) ? $_GET['offset'] : 0);

            }

        } catch (\Juxta\Exception\Exception $e) {

            $status = array(
                'Juxta\Exception\SessionNotFound' => "session_not_found",
                'Juxta\Db\Exception\Connect' => "connection_error",
                'Juxta\Db\Exception\Query' => "query_error",
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
     * @throws \Juxta\Exception\SessionNotFound
     */
    protected function getDb($cid)
    {
        $connection = $this->connections->getByCid($cid);

        if (empty($connection)) {
            throw new SessionNotFound();
        }

        return Db::factory($connection);
    }

    /**
     * Connect to server and save connection
     *
     * @param array $connection
     * @return array|string
     */
    protected function connect(array $connection)
    {
        if (empty($connection['password'])) {
            $stored = $this->connections->getByKey(Connections::key($connection));
        }

        if (!empty($stored) && array_key_exists('password', $stored)) {
            $connection['password'] = $stored['password'];
        }

        try {
            $db = Db::factory($connection);

        } catch (Connect $e) {
            return "{$e->getCode()} {$e->getMessage()}";
        }

        $version = $db->fetchAll("SHOW VARIABLES LIKE '%version%'", DB::FETCH_ASSOC);

        foreach ($version as $row) {
            if (in_array($row['Variable_name'], array('version', 'version_comment'))) {
                $connection['server'][$row['Variable_name']] = $row['Value'];
            }
        }

        $connection = $this->connections->save($connection);

        return Connections::maskPassword($connection);
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
     * @throws \Juxta\Exception\SessionNotFound
     */
    protected function getSession($cid)
    {
        $current = $this->connections->getByCid($cid, true);

        if (empty($current)) {
            throw new SessionNotFound();
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
        return $this->getDb($cid)->fetchAll("SHOW DATABASES", array('Database'));
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
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropDatabases($cid, array $databases)
    {
        $dropped = array();

        foreach ($databases as $database) {
            try {
                $this->getDb($cid)->query("DROP DATABASE `{$database}`");
                $dropped[] = $database;

            } catch (Query $e) {

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

        $charset = $this->getDb($cid)->fetchAll($sql1, null, Db::FETCH_BOTH);

        if ($charset) {
            $properties['charset'] = $charset[0]['name'];
            $properties['collation'] = $charset[0]['collation'];
        }

        $sql2 = "SELECT COUNT(*) AS `tables`, SUM(`TABLE_ROWS`) AS `rows`, "
            . "SUM(`DATA_LENGTH`) AS `data_length`, "
            . "SUM(`INDEX_LENGTH`) AS `index_length` "
            . "FROM `INFORMATION_SCHEMA`.`TABLES` "
            . "WHERE `TABLE_SCHEMA` = '{$database}' AND `TABLE_TYPE` <> 'VIEW'";

        $statistics = $this->getDb($cid)->fetchAll($sql2, null, Db::FETCH_BOTH);

        if ($statistics) {
            $properties['tables'] = $statistics[0]['tables'];
            $properties['rows'] = $statistics[0]['rows'];
            $properties['data_length'] = (int)$statistics[0]['data_length'];
            $properties['index_length'] = (int)$statistics[0]['index_length'];
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
        return $this->getDb($cid)->fetchAll("SHOW PROCESSLIST", array('Id', 'User', 'Host', 'db', 'Command', 'Time', 'Info'));
    }

    /**
     * Kill processes
     *
     * @param $cid
     * @param array $processes
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function kill($cid, array $processes)
    {
        $killed = null;

        foreach ($processes as $process) {
            try {
                $this->getDb($cid)->query("KILL {$process}");
                $killed[] = $process;

            } catch (Query $e) {
                $e->attach(array('killed' => $killed));
                throw $e;
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
        $users = null;

        foreach ($this->getDb($cid)->fetchAll("SELECT * FROM mysql.user", Db::FETCH_ASSOC) as $row) {

            $user = array($row['User'], $row['Host'], !empty($row['Password']) ? 'YES' : 'NO',
                $row['Grant_priv'] === 'Y' ? 'YES' : '');

            $privileges = array();

            foreach (Db::$privileges as $privilege => $title) {
                if (isset($row[$privilege]) && $row[$privilege] === 'Y') {
                    $privileges[] = $title;
                }
            }

            if (count($privileges) === 0) {
                $privileges = 'USAGE';

            } else if (count($privileges) === count(Db::$privileges)) {
                $privileges = 'ALL';

            } else {
                $privileges = implode(', ', $privileges);
            }

            $user[] = $privileges;

            $users[] = $user;

        }

        return $users;
    }

    /**
     * Drop users
     *
     * @param $cid
     * @param array $users
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropUsers($cid, array $users)
    {
        $dropped = array();

        foreach ($users as $user) {
            try {
                $this->getDb($cid)->query("DROP USER {$user}");
                $dropped[] = $user;

            } catch (Query $e) {
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
        return $this->getDb($cid)->fetchAll("SHOW STATUS", array('Variable_name', 'Value'));
    }

    /**
     * Return  list of system variables
     *
     * @param int $cid
     * @return array
     */
    protected function showVariables($cid)
    {
        return $this->getDb($cid)->fetchAll("SHOW VARIABLES", array('Variable_name', 'Value'));
    }

    /**
     * Return  list of available character sets
     *
     * @param $cid
     * @return array
     */
    protected function showCharsets($cid)
    {
        return $this->getDb($cid)->fetchAll("SHOW CHARSET", array('Charset', 'Default collation', 'Description'));
    }

    /**
     * Return information about server's storage engines
     *
     * @param int $cid
     * @return array
     */
    private function showEngines($cid)
    {
        return $this->getDb($cid)->fetchAll("SHOW ENGINES", array('Engine', 'Support', 'Comment'));
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
        $tables = $this->getDb($cid)->fetchAll(
            "SHOW TABLE STATUS FROM `{$database}` WHERE `Engine` IS NOT NULL",
            array('Name', 'Engine', 'Rows', 'Data_length', 'Index_length')
        );

        if (!empty($tables)) {
            $tables = array_map(
                function ($table) {
                    $table[3] += $table[4];
                    unset($table[4]);
                    return $table;
                },
                $tables
            );
        }

        return $tables;
    }

    /**
     * Drop tables
     *
     * @param $cid
     * @param array $tables
     * @param $from
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropTables($cid, array $tables, $from)
    {
        $dropped = null;

        foreach ($tables as $table) {
            try {
                $this->getDb($cid)->query("DROP TABLE `{$from}`.`{$table}`;");
                $dropped[] = $table;

            } catch (Query $e) {
                $e->attach(array('dropped' => $dropped, 'from' => $from));
                throw $e;
            }
        }

        return $dropped;
    }

    /**
     * Truncate tables
     *
     * @param $cid
     * @param array $tables
     * @param $from
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function truncate($cid, array $tables, $from)
    {
        $truncated = null;

        foreach ($tables as $table) {
            try {
                $this->getDb($cid)->query("TRUNCATE TABLE `{$from}`.`{$table}`;");
                $truncated[] = $table;

            } catch (Query $e) {
                $e->attach(array('truncated' => $truncated, 'from' => $from));
                throw $e;
            }
        }

        return $truncated;
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
        $table = $this->getDb($cid)->fetchAll("SHOW COLUMNS FROM `{$table}` FROM `{$database}`");

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
            'content' => array('column', 'type', 'is_null', 'attributes', 'default', 'options'),
            'from' => $database,
            'columns' => $columns,
            'table' => $table,
        );
    }

    /**
     * Return indices from a table
     *
     * @param int $cid Connection ID
     * @param string $table Table name
     * @param string $database Database
     * @return array|null
     */
    protected function showIndexes($cid, $table, $database)
    {
        $columns = $this->getDb($cid)->fetchAll(
            "SHOW INDEXES FROM {$database}.{$table}",
            array('Key_name', 'Index_type', 'Non_unique', 'Column_name')
        );

        $indexes = null;

        foreach ($columns as $column) {
            if (isset($indexes[$column[0]])) {
                $indexes[$column[0]][3][] = $column[3];
            } else {
                $indexes[$column[0]] = $column;
                $indexes[$column[0]][3] = (array)$indexes[$column[0]][3];
            }
        }

        if (is_array($indexes)) {
            $indexes = array_values($indexes);
        }

        return $indexes;
    }

    /**
     * Return foreign keys from a table
     *
     * @param int $cid Connection ID
     * @param string $table Table name
     * @param string $database Database
     * @return array|null
     */
    protected function showForeign($cid, $table, $database)
    {
        $sql = <<<SQL
SELECT
	kcu.CONSTRAINT_NAME,
	kcu.COLUMN_NAME,
	CONCAT(kcu.REFERENCED_TABLE_NAME, '.', kcu.REFERENCED_COLUMN_NAME),
	rc.UPDATE_RULE,
	rc.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
	ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
WHERE
	kcu.TABLE_SCHEMA  = '{$database}'
	AND kcu.TABLE_NAME = '{$table}'
	AND kcu.CONSTRAINT_NAME <> 'PRIMARY'
SQL;

        return $this->getDb($cid)->fetchAll($sql);
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
        $properties = $this->getDb($cid)->fetchRow("SHOW TABLE STATUS FROM `{$database}` LIKE '{$table}'", Db::FETCH_ASSOC);

        if (!empty($properties)) {
            $properties = array_change_key_case($properties, CASE_LOWER);
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
        return $this->getDb($cid)->fetchAll(
            "SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` WHERE `TABLE_SCHEMA` = '{$database}'",
            array('TABLE_NAME', 'IS_UPDATABLE')
        );
    }

    /**
     * Drop views
     *
     * @param $cid
     * @param array $views
     * @param $from
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropViews($cid, array $views, $from)
    {
        $dropped = null;

        foreach ($views as $view) {
            try {
                $this->getDb($cid)->query("DROP VIEW `{$from}`.`{$view}`;");
                $dropped[] = $view;

            } catch (Query $e) {
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
        $view = $this->getDb($cid)->fetchAll("SHOW CREATE VIEW `{$database}`.`{$name}`", true, Db::FETCH_ASSOC);

        return array('view' => $name, 'from' => $database, 'statement' => $view[0]['Create View']);
    }

    /**
     * Return view properties
     *
     * @param int $cid
     * @param string $name View name
     * @param string $database Database
     * @return array
     */
    protected function showViewProperties($cid, $name, $database)
    {
        $sql = "SELECT * FROM `INFORMATION_SCHEMA`.`VIEWS` WHERE `TABLE_SCHEMA` = '{$database}' "
            . " AND `TABLE_NAME` = '{$name}'";

        $properties = $this->getDb($cid)->fetchRow($sql, Db::FETCH_ASSOC);

        if (!empty($properties)) {
            $properties = array_change_key_case($properties, CASE_LOWER);
        }

        return $properties;
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

        return $this->getDb($cid)->fetchAll($sql, array('ROUTINE_NAME', 'ROUTINE_TYPE', 'DTD_IDENTIFIER'));
    }

    /**
     * Drop stored procedures and functions
     *
     * @param $cid
     * @param array $routines
     * @param $from
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropRoutines($cid, array $routines, $from)
    {
        $dropped = array();

        if (isset($routines['function'])) {
            foreach ($routines['function'] as $function) {
                try {
                    $this->getDb($cid)->query("DROP FUNCTION `{$from}`.`{$function}`;");
                    $dropped['function'][] = $function;

                } catch (Query $e) {
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

                } catch (Query $e) {
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
        $procedure = $this->getDb($cid)->fetchRow("SHOW CREATE PROCEDURE `{$database}`.`{$name}`", DB::FETCH_ASSOC);

        return array(
            'procedure' => $name,
            'from' => $database,
            'statement' => $procedure['Create Procedure']
        );
    }

    /**
     * Return stored procedure properties
     *
     * @param int $cid Connection ID
     * @param string $name Routine name
     * @param string $database Database
     * @return array
     */
    protected function showProcedureProperties($cid, $name, $database)
    {
        $sql = "SELECT * FROM `INFORMATION_SCHEMA`.`ROUTINES` WHERE `ROUTINE_SCHEMA` = '{$database}' "
            . " AND `ROUTINE_NAME` = '{$name}' AND ROUTINE_TYPE = 'PROCEDURE'";

        $properties = $this->getDb($cid)->fetchRow($sql, Db::FETCH_ASSOC);

        if (!empty($properties)) {
            $properties = array_change_key_case($properties, CASE_LOWER);
        }

        return $properties;
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
        $function = $this->getDb($cid)->fetchRow("SHOW CREATE FUNCTION `{$database}`.`{$name}`", DB::FETCH_ASSOC);

        return array('function' => $name, 'from' => $database, 'statement' => $function['Create Function']);
    }

    /**
     * Return stored function properties
     *
     * @param int $cid Connection ID
     * @param string $name Routine name
     * @param string $database Database
     * @return array
     */
    protected function showFunctionProperties($cid, $name, $database)
    {
        $sql = "SELECT * FROM `INFORMATION_SCHEMA`.`ROUTINES` WHERE `ROUTINE_SCHEMA` = '{$database}' "
            . " AND `ROUTINE_NAME` = '{$name}' AND ROUTINE_TYPE = 'FUNCTION'";

        $properties = $this->getDb($cid)->fetchRow($sql, Db::FETCH_ASSOC);

        if (!empty($properties)) {
            $properties = array_change_key_case($properties, CASE_LOWER);
        }

        return $properties;
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
            ->fetchAll("SHOW TRIGGERS FROM `{$database}`", array('Trigger', 'Event', 'Timing', 'Table'));
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
        $trigger = $this->getDb($cid)->fetchRow("SHOW CREATE TRIGGER `{$database}`.`{$name}`", Db::FETCH_ASSOC);

        return array('trigger' => $name, 'from' => $database, 'statement' => $trigger['SQL Original Statement']);
    }

    /**
     * Drop triggers
     *
     * @param $cid
     * @param array $triggers
     * @param $database
     * @return array
     * @throws \Juxta\Db\Exception\Query
     */
    protected function dropTriggers($cid, array $triggers, $database)
    {
        $dropped = array();

        foreach ($triggers as $trigger) {
            try {
                $this->getDb($cid)->query("DROP TRIGGER `{$database}`.`{$trigger}`");
                $dropped[] = $trigger;

            } catch (Query $e) {
                $e->attach(array('dropped' => $dropped));
                throw $e;
            }
        }

        return $dropped;
    }

    /**
     * Return trigger properties
     *
     * @param int $cid Connection ID
     * @param string $name Trigger name
     * @param string $database Database
     * @return array
     */
    protected function showTriggerProperties($cid, $name, $database)
    {
        $sql = "SELECT * FROM `INFORMATION_SCHEMA`.`TRIGGERS` WHERE `TRIGGER_SCHEMA` = '{$database}' "
            . " AND `TRIGGER_NAME` = '{$name}'";

        $properties = $this->getDb($cid)->fetchRow($sql, Db::FETCH_ASSOC);

        if (!empty($properties)) {
            $properties = array_change_key_case($properties, CASE_LOWER);
        }

        return $properties;
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
        $data = $this->getDb($cid)->fetchAll("SELECT * FROM `{$database}`.`{$table}` LIMIT {$offset}, {$limit}");
        $columns = $this->getDb($cid)->fetchAll("SHOW COLUMNS IN `{$table}` FROM `{$database}`", array('Field', 'Key', 'Type'));
        $total = $this->getDb($cid)->fetchRow("SELECT COUNT(*) AS `count` FROM `{$database}`.`{$table}`", Db::FETCH_ASSOC);

        return array('data' => $data, 'columns' => $columns, 'total' => $total['count']);
    }
}