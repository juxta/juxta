<?php namespace Juxta;

class Db_Mysqli
{

	/**
	 * @var \mysqli
	 */
	protected $connection;


	/**
	 * @param array $params
	 * @throws Db_Exception_Connect
	 */
	public function __construct(array $params)
	{
		$this->connection = @new \mysqli($params['host'], $params['user'], $params['password'], '', $params['port']);

		if ($this->connection->connect_error) {
			throw new Db_Exception_Connect($this->connection->connect_error, $this->connection->connect_errno);
		}
	}


	/**
	 * Prepare a row
	 *
	 * @param $row
	 * @param null $columns
	 * @param int $type
	 * @return array|null
	 */
	protected static function prepareRow($row, $columns = null, $type = Db::FETCH_NUM)
	{
		if (!is_array($columns)) {
			return $row;
		}

		$values = null;

		foreach ($columns as $column) {
			if (!array_key_exists($column, $row)) {
				continue;
			}
			if ($type === Db::FETCH_NUM || $type === Db::FETCH_BOTH) {
				$values[] = $row[$column];
			}
			if ($type === Db::FETCH_ASSOC || $type === Db::FETCH_BOTH) {
				$values[$column] = $row[$column];
			}
		}

		return $values;
	}


	/**
	 * Run a query
	 *
	 * @param string $sql
	 * @return \mysqli_result|bool
	 * @throws Db_Exception_Query
	 */
	public function query($sql)
	{
		$queryResult = $this->connection->query($sql);

		if ($this->connection->error) {
			throw new Db_Exception_Query($this->connection->error, $this->connection->errno);
		}

		return $queryResult;
	}


	/**
	 * Fetch one or all result rows as an associative, a numeric array, or both
	 *
	 * @param \mysql_result|bool $result
	 * @param array $columns
	 * @param int $type
	 * @param bool $fetchRow
	 * @return mixed
	 */
	public static function fetch($result, $columns = null, $type = Db::FETCH_NUM, $fetchRow = false)
	{
		if (is_bool($result)) {
			return $result;
		}

		if (is_bool($type)) {
			$fetchRow = $type;
			$type = Db::FETCH_NUM;
		}

		if (is_numeric($columns)) {
			$type = $columns;
			$columns = null;
		}

		$mapFetchType = array(
			Db::FETCH_ASSOC => MYSQLI_ASSOC,
			Db::FETCH_NUM => MYSQLI_NUM,
			Db::FETCH_BOTH => MYSQLI_BOTH,
		);

		$rows = null;

		while ($row = $result->fetch_array(empty($columns) ? $mapFetchType[$type] : MYSQL_ASSOC)) {

			$row = self::prepareRow($row, $columns, $type);

			if ($fetchRow) {
				return $row;
			}

			$rows[] = $row;
		}

		return $rows;
	}


	/**
	 * Run a query and fetch all result rows
	 *
	 * @param $sql
	 * @param array $columns
	 * @param int $type
	 * @return array|null
	 */
	public function fetchAll($sql, $columns = null, $type = Db::FETCH_NUM)
	{
		return self::fetch($this->query($sql), $columns, $type, false);
	}


	/**
	 * Run a query and fetch a result row
	 *
	 * @param string $sql
	 * @param array $columns
	 * @param int $type
	 * @return array|null
	 */
	public function fetchRow($sql, $columns = null, $type = Db::FETCH_NUM)
	{
		return self::fetch($this->query($sql), $columns, $type, true);
	}

}
