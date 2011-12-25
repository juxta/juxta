<?php
/*
 * Juxta 0.0.1 http://juxta.ru
 *
 * Licensed under the MIT license
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 * @copyright	Copyright (c) 2010-2011 Alexey Golovnya
 * @license 	MIT License
 * @version 	0.0.1
 */

/*
 * Exceptions raised in Juxta class
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 */
class JuxtaException extends Exception
{

	/**
	 * Status
	 *
	 * @var string
	 */
	protected $_status = 'error';


	/**
	 *
	 * @var array
	 */
	private $_toResponse = array();


	/**
	 * Returns status
	 *
	 * @return string
	 */
	public function getStatus()
	{
		return $this->_status;
	}


	/**
	 * Add information to response
	 *
	 * @param array
	 */
	public function addToResponse(array $toResponse = array())
	{
		$this->_toResponse = array_merge($this->_toResponse, $toResponse);
	}


	/**
	 *
	 * @return array
	 */
	public function toResponse()
	{
		return $this->_toResponse;
	}

}

/**
 * Connection exception
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 */
class JuxtaConnectionException extends JuxtaException
{

	/**
	 * Status
	 *
	 * @var string
	 */
	protected $_status = 'connect_error';

}

/**
 * Query exception
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 */
class JuxtaQueryException extends JuxtaException
{

	/**
	 * Status
	 *
	 * @var string
	 */
	protected $_status = 'error';

}

/**
 * Session exception
 *
 * @category	Juxta
 * @package 	Juxta_PHP
 */ 
class JuxtaSessionException extends JuxtaException
{

	/**
	 * Status
	 *
	 * @var string
	 */
	protected $_status = 'session_not_found';

}
