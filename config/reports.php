<?php

return [
    'photos' => [
        'disk' => env('REPORT_PHOTO_DISK', 'public'),
        'max_upload_kb' => 3072,
        'max_dimension' => 1600,
        'jpeg_quality' => 82,
    ],
];
