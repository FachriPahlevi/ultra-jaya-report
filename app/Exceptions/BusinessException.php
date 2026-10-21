<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Contracts\Debug\ShouldntReport;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** An expected failure whose message is safe to display to the user. */
final class BusinessException extends HttpException implements ShouldntReport
{
    public function __construct(string $message, int $status = 422)
    {
        parent::__construct($status, $message);
    }
}
