<?php namespace Juxta;

class Db
{

    const EXTENSION_MYSQLI = 'Mysqli';

    const EXTENSION_PDO = 'Pdo';

    const DEFAULT_HOST = 'localhost';

    const DEFAULT_PORT = 3306;

    const DEFAULT_CHARSET = 'utf8';

    const FETCH_ASSOC = 1;

    const FETCH_NUM = 2;

    const FETCH_BOTH = 3;

    /**
     * @var array
     */
    public static $privileges = array(
        'Select_priv' => 'SELECT',
        'Insert_priv' => 'INSERT',
        'Update_priv' => 'UPDATE',
        'Delete_priv' => 'DELETE',
        'File_priv' => 'FILE',
        'Create_priv' => 'CREATE',
        'Alter_priv' => 'ALTER',
        'Index_priv' => 'INDEX',
        'Drop_priv' => 'DROP',
        'Create_tmp_table_priv' => 'CREATE TEMPORARY TABLES',
        'Show_view_priv' => 'SHOW VIEW',
        'Create_routine_priv' => 'CREATE ROUTINE',
        'Alter_routine_priv' => 'ALTER ROUTINE',
        'Execute_priv' => 'EXECUTE',
        'Create_view_priv' => 'CREATE VIEW',
        'References_priv' => 'REFERENCES',
        'Event_priv' => 'EVENT',
        'Trigger_priv' => 'TRIGGER',
        'Super_priv' => 'SUPER',
        'Process_priv' => 'PROCESS',
        'Reload_priv' => 'RELOAD',
        'Shutdown_priv' => 'SHUTDOWN',
        'Show_db_priv' => 'SHOW DATABASES',
        'Lock_tables_priv' => 'LOCK TABLES',
        'Create_user_priv' => 'CREATE USER',
        'Repl_client_priv' => 'REPLICATION CLIENT',
        'Repl_slave_priv' => 'REPLICATION SLAVE',
        'Create_tablespace_priv' => 'CREATE TABLESPACE',
    );

    /**
     * Prepare connection params from array
     *
     * @param $params
     * @return array
     */
    public static function connectionFromArray($params)
    {
        $connection = array_intersect_key($params, array_flip(array('host', 'port', 'user', 'password', 'charset')));

        if (array_key_exists('host', $connection)) {
            $connection['host'] = trim($connection['host']);
        }

        if (empty($connection['host'])) {
            $connection['host'] = self::DEFAULT_HOST;
        }

        if (array_key_exists('port', $connection)) {
            $connection['port'] = (int)$connection['port'];
        }

        if (empty($connection['charset'])) {
            $connection['charset'] = self::DEFAULT_CHARSET;
        }

        if (empty($connection['user'])) {
            unset($connection['user']);
        }

        if (empty($connection['password'])) {
            unset($connection['password']);
        }

        return $connection;
    }

    /**
     * Create database object
     *
     * @param $params
     * @param string $extension
     * @return mixed
     */
    public static function factory($params, $extension = self::EXTENSION_MYSQLI)
    {
        $className = 'Juxta\Db_' . ucfirst($extension);

        return new $className($params);
    }
}
