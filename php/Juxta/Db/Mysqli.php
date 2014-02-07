<?php namespace Juxta;

class Db_Mysqli
{

	/**
	 * @var \mysqli
	 */
	protected $connection;


	/**
	 * @param $params
	 */
	public function __construct($params)
	{
		$this->connection = new \mysqli($params['host'], $params['user'], $params['password']);

		if ($this->connection->connect_error) {
			throw new Db_Exception_Connect($this->connection->connect_error, $this->connection->connect_errno);
		}
	}


	/**
	 * Run a query
	 *
	 * @param $sql
	 * @param null $columns
	 * @return array|bool|\mysqli_result
	 * @throws Db_Exception_Query
	 */
	public function query($sql, $columns = null)
	{
		$queryResult = $this->connection->query($sql);

		if ($this->connection->error) {
			throw new Db_Exception_Query($this->connection->error, $this->connection->errno);
		}

		if (is_bool($queryResult)) {
			return $queryResult;
		}

		$result = array();

		while ($row = $queryResult->fetch_array(is_array($columns) ? MYSQLI_BOTH : (int)$columns)) {

			if (is_array($columns)) {
				$values = array();

				foreach ($columns as $column) {
					$values[] = $row[$column];
				}

				$result[] = $values;

			} else {
				$result[] = $row;
			}
		};

		return $result;
	}

}