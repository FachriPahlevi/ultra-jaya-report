<?php

declare(strict_types=1);

namespace App\Support;

use App\Exceptions\BusinessException;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class ErrorResponse
{
    private const MESSAGES = [
        400 => ['title' => 'Permintaan Tidak Valid', 'message' => 'Permintaan tidak dapat diproses. Periksa data Anda lalu coba kembali.'],
        401 => ['title' => 'Silakan Login', 'message' => 'Silakan login kembali untuk melanjutkan.'],
        403 => ['title' => 'Akses Ditolak', 'message' => 'Anda tidak memiliki izin untuk melakukan tindakan ini.'],
        404 => ['title' => 'Data Tidak Ditemukan', 'message' => 'Halaman atau data yang Anda tuju tidak ditemukan.'],
        405 => ['title' => 'Tindakan Tidak Tersedia', 'message' => 'Tindakan ini tidak tersedia. Silakan kembali ke halaman sebelumnya.'],
        409 => ['title' => 'Data Telah Berubah', 'message' => 'Data tidak dapat diproses dalam kondisi saat ini. Muat ulang halaman lalu coba kembali.'],
        413 => ['title' => 'File Terlalu Besar', 'message' => 'Ukuran unggahan melebihi batas server. Silakan pilih file yang lebih kecil.'],
        419 => ['title' => 'Sesi Telah Berakhir', 'message' => 'Sesi Anda telah berakhir. Muat ulang halaman lalu coba kembali.'],
        422 => ['title' => 'Periksa Data Anda', 'message' => 'Beberapa data belum sesuai. Periksa kembali isian Anda.'],
        429 => ['title' => 'Terlalu Banyak Percobaan', 'message' => 'Terlalu banyak permintaan. Tunggu beberapa saat lalu coba kembali.'],
        500 => ['title' => 'Terjadi Kendala Sistem', 'message' => 'Permintaan belum dapat diselesaikan. Silakan coba kembali beberapa saat lagi.'],
        503 => ['title' => 'Layanan Belum Tersedia', 'message' => 'Layanan sedang tidak tersedia. Silakan coba kembali beberapa saat lagi.'],
        'fallback' => ['title' => 'Gagal Memproses', 'message' => 'Permintaan tidak dapat diproses. Silakan coba kembali.'],
        'network' => ['title' => 'Koneksi Terputus', 'message' => 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba kembali.'],
        'photo_too_large' => 'Ukuran foto melebihi batas maksimal 2 MB. Silakan pilih foto yang lebih kecil.',
    ];

    public static function messages(): array
    {
        return self::MESSAGES;
    }

    public static function respond(Response $response, Throwable $exception, Request $request): Response
    {
        $status = $response->getStatusCode();

        // Preserve login redirects and Inertia's redirect-based field validation.
        if ($status < 400) {
            return $response;
        }

        $messages = self::messages();
        $payload = $messages[$status] ?? ($status >= 500 ? $messages[500] : $messages['fallback']);
        $payload['status'] = $status;
        $payload['user_message'] = true;

        if ($exception instanceof BusinessException) {
            $payload['message'] = $exception->getMessage();
        }

        if ($exception instanceof ValidationException) {
            $payload['errors'] = $exception->errors();
            $payload['message'] = Arr::first(Arr::flatten($payload['errors'])) ?? $payload['message'];
        }

        // Keep rate-limit and authentication headers, but discard debug response headers/body.
        $headers = array_intersect_key($response->headers->all(), array_flip(['retry-after', 'www-authenticate']));

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json($payload, $status, $headers);
        }

        // Standalone HTML also works when Vite, React, or the requested page is broken.
        return response()->view('errors.application', $payload, $status, $headers);
    }
}
