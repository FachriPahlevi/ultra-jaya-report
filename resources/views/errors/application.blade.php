<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="app-error-title" content="{{ $title }}">
    <meta name="app-error-message" content="{{ $message }}">
    <title>{{ $title }}</title>
    <style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;margin:0;min-height:100vh;display:grid;place-items:center}main{max-width:32rem;margin:1.5rem;padding:2rem;background:white;border-radius:1rem;border:1px solid #e2e8f0}h1{font-size:1.5rem}p{line-height:1.6}a{color:#1d4ed8}</style>
</head>
<body>
    <main>
        <h1>{{ $title }}</h1>
        <p>{{ $message }}</p>
        <a href="{{ url('/') }}">Kembali ke halaman utama</a>
    </main>
</body>
</html>
