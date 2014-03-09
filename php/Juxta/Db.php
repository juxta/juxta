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
	 * @param $params
	 * @return array
	 */
	public static function connectionFromArray($params)
	{
		$connection = array(
			'host' => isset($params['host']) ? $params['host'] : self::DEFAULT_HOST,
			'port' => isset($params['port']) ? $params['port'] : self::DEFAULT_PORT,
			'charset' => isset($params['charset']) ? $params['charset'] : self::DEFAULT_CHARSET,
		);

		if (isset($params['user'])) {
			$connection['user'] = $params['user'];
		}

		if (isset($params['password'])) {
			$connection['password'] = $params['password'];
		}

		return $connection;
	}


	/**
	 * Create dtabase object
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
