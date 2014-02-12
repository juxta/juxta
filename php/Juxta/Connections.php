<?php namespace Juxta;

class Connections
{

	/**
	 * @var Juxta_Session
	 */
	protected $session;


	/**
	 * @var array
	 */
	protected $config;


	/**
	 * @param Juxta_Session $session
	 * @param array $config
	 */
	public function __construct(Session $session, Config $config)
	{
		$this->session = $session;
		$this->config = $config;
	}


	/**
	 * Compose connection key
	 *
	 * @param array $connection
	 * @return string
	 */
	public static function key(array $connection)
	{
		$key = isset($connection['user']) ? $connection['user'] : '';

		$key .= '@';

		$key .= isset($connection['host']) ? $connection['host'] : Db::DEFAULT_HOST;

		$key .= ':';

		$key .= isset($connection['port']) ? $connection['port'] : Db::DEFAULT_PORT;

		return $key;
	}


	/**
	 * @param array $connection
	 * @return array
	 */
	protected static function maskPassword(array $connection)
	{
		if (isset($connection['password'])) {
			if (isset($connection['cid'])) {
				unset($connection['password']);

			} else {
				$connection['password'] = true;
			}
		}

		return $connection;
	}


	/**
	 * @param bool $mask
	 * @return array|null
	 */
	public function getAll($mask = true)
	{
		$stored = array();
		$established = array();

		if (!empty($this->config['connections'])) {
			foreach ($this->config['connections'] as $connection) {
				$stored[self::key($connection)] = $connection;
			}
		}

		foreach ((array)$this->session->getConnections() as $connection) {
			$established[self::key($connection)] = $connection;
		}

		$connections = array_merge($stored, $established);


		ksort($connections);

		if ($mask) {
			$connections = array_map(array($this, 'maskPassword'), $connections);
		}

		return !empty($connections) ? $connections : null;
	}


	/**
	 * @param $key
	 * @param bool $mask
	 * @return array|null
	 */
	public function getByKey($key, $mask = false)
	{
		$connections = $this->getAll($mask);

		if (isset($connections[$key])) {
			return $connections[$key];
		}
	}


	/**
	 * Return connection with Connection ID
	 *
	 * @param $cid
	 * @param bool $mask
	 * @return array|null
	 */
	public function getByCid($cid, $mask = false)
	{
		$connection = array_filter((array)$this->getAll($mask), function($c) use ($cid) { return isset($c['cid']) && $c['cid'] == $cid; });

		return $connection ? reset($connection) : null;
	}


	/**
	 * @param array $connection
	 * @return int
	 */
	public function save(array $connection)
	{
		$cid = array_reduce((array)$this->getAll(), function($cid, $connection) {
				return max($cid, $connection['cid']);
		}, -1) + 1;

		$connection['cid'] = $cid;

		$this->session->saveConnection($connection);

		return $cid;
	}


	/**
	 * @param $cid
	 * @return bool
	 */
	public function delete($cid)
	{
		return $this->session->deleteConnection($cid);
	}


	/**
	 *
	 */
	public function deleteAll()
	{
		$this->session->deleteConnections();
	}

}