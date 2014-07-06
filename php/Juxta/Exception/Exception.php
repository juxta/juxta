<?php namespace Juxta\Exception;

class Exception extends \Exception
{
    /**
     * @var mixed
     */
    protected $attachment;

    /**
     * @param $object
     */
    public function attach($object)
    {
        $this->attachment = $object;
    }

    /**
     * @return array
     */
    public function getAttachment()
    {
        return $this->attachment;
    }
}