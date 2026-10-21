<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Exceptions\BusinessException;
use App\Support\ErrorResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ErrorResponseTest extends TestCase
{
    public function test_unexpected_json_error_never_exposes_exception_detail(): void
    {
        $request = Request::create('/areas', 'POST', server: ['HTTP_ACCEPT' => 'application/json']);
        $response = new Response('database password leaked', 500);

        $result = ErrorResponse::respond($response, new \RuntimeException('database password leaked'), $request);

        $payload = $result->getData(true);

        $this->assertSame(500, $result->getStatusCode());
        $this->assertSame('Terjadi Kendala Sistem', $payload['title']);
        $this->assertSame('Permintaan belum dapat diselesaikan. Silakan coba kembali beberapa saat lagi.', $payload['message']);
        $this->assertStringNotContainsString('database password leaked', $result->getContent());
    }

    public function test_business_error_keeps_its_safe_user_message(): void
    {
        $request = Request::create('/areas', 'POST', server: ['HTTP_ACCEPT' => 'application/json']);
        $exception = new BusinessException('Area ini masih digunakan dan tidak dapat dihapus.');

        $result = ErrorResponse::respond(new Response('', 422), $exception, $request);

        $this->assertSame(422, $result->getStatusCode());
        $this->assertSame('Area ini masih digunakan dan tidak dapat dihapus.', $result->getData(true)['message']);
    }
}
