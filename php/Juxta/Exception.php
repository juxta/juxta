<?php namespace Juxta;

class Exception extends \Exception
{
}

class Exception_SessionNotFound extends Exception
{

	protected $message = 'Session not found';

}

class Exception_Connection extends Exception
{
}

class Db_Exception extends Exception
{
}

class Db_Exception_Connect extends Db_Exception
{

	protected $message = 'Connect error';

}

class Db_Exception_Query extends Db_Exception
{
}