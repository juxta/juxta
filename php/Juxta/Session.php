<?php namespace Juxta;

class Session
{

	/**
	 *
	 */
	public function __construct()
	{
		session_start();
	}


	/**
	 * @return array
	 */
	public function getConnections()
	{
		return isset($_SESSION['connections']) ? $_SESSION['connections'] : null;
	}


	/**
	 * @param array $connection
	 */
	public function saveConnection(array $connection)
	{
		$_SESSION['connections'][] = $connection;
	}


	/**
	 *
	 */
	public function deleteConnection($cid)
	{
		foreach ($_SESSION['connections'] as $id => $connection) {
			if ($connection['cid'] === $cid) {
				unset($_SESSION['connections'][$id]);

				return true;
			}
		}

		return  false;
	}


	/**
	 *
	 */
	public function deleteConnections()
	{
		unset($_SESSION['connections']);
	}

}