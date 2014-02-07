<?php namespace Juxta;

class Db
{

	const DEFAULT_HOST = 'localhost';

	const DEFAULT_PORT = 3306;

	const DEFAULT_CHARSET = 'utf8';


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
	 * @param string $driver
	 * @param $params
	 * @return mixed
	 */
	public static function factory($driver = 'Mysqli', $params)
	{
		$className = 'Juxta\Db_' . ucfirst($driver);

		return new $className($params);
	}

}