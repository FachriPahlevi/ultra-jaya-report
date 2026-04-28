<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Laporan Issue Report</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Times New Roman',serif; font-size:10pt; color:#1a1a2e; background:#fff; line-height:1.4; }
.page { width:190mm; padding:8mm 0 10mm; margin:0 auto; }
table { border-collapse:collapse; }
.logo-box { width:50px; height:50px; background:#1a1a2e; border-radius:3px; text-align:center; padding-top:7px; }
.logo-circle { width:32px; height:32px; border:2px solid #c9a84c; border-radius:50%; margin:0 auto; padding-top:5px; }
.sum-cell { text-align:center; padding:8px 6px; border:1px solid #e0d5b8; border-right:none; background:#f9f7f2; width:25%; }
.sum-cell:last-child { border-right:1px solid #e0d5b8; }
.card { border:1px solid #d8d0c0; border-radius:3px; margin-bottom:10px; page-break-inside:avoid; }
.badge { font-size:7pt; font-weight:bold; padding:2px 8px; border-radius:10px; }
.dt td { padding:2px 0; vertical-align:top; font-size:9pt; }
.dt td.l { width:100px; color:#777; white-space:nowrap; padding-right:4px; }
.dt td.c { width:8px; color:#999; }
.dt td.v { color:#1a1a2e; font-weight:bold; }
.photo-box { width:88px; height:75px; background:#f5f3ee; border:1px dashed #ccc; border-radius:2px; text-align:center; padding-top:22px; font-size:7pt; color:#bbb; }
.sig-line { border-top:1px solid #333; width:130px; margin:0 auto 3px; }
@page { size:A4; margin:0; }
</style>
</head>
<body>
<div class="page">

{{-- LETTERHEAD --}}
<table style="width:100%;border-bottom:3px solid #1a1a2e;padding-bottom:7px;margin-bottom:0">
<tr>
  <td style="width:54px;vertical-align:middle">
    <div class="logo-box"><div class="logo-circle"><span style="font-size:9pt;font-weight:bold;color:#c9a84c">UJ</span></div></div>
  </td>
  <td style="vertical-align:middle;padding-left:10px">
    <div style="font-size:15pt;font-weight:bold;letter-spacing:2px;text-transform:uppercase">PT Ultra Jaya Milk</div>
    <div style="font-size:7pt;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-top:1px">Industry &amp; Trade Division &mdash; Quality Assurance</div>
    <div style="font-size:7.5pt;color:#666;margin-top:4px">Jl. Raya Industri No. 123, Jakarta &nbsp;&bull;&nbsp; (021) 1234567 &nbsp;&bull;&nbsp; report@ultrajayamilk.co.id</div>
  </td>
  <td style="width:125px;text-align:right;vertical-align:top;padding-top:2px">
    <span style="background:#1a1a2e;color:#c9a84c;font-size:6pt;font-weight:bold;letter-spacing:1px;padding:2px 6px;border-radius:2px">Official Document</span>
    <div style="font-size:7.5pt;color:#555;margin-top:4px">No. Dok: IR/{{ now()->format('Y/m') }}</div>
    <div style="font-size:7.5pt;color:#555;margin-top:2px">{{ now()->translatedFormat('d F Y') }}</div>
  </td>
</tr>
</table>

<div style="height:2px;background:#c9a84c;margin-bottom:10px"></div>

{{-- TITLE --}}
<div style="text-align:center;padding:7px 0 6px;border-bottom:1px solid #ddd;margin-bottom:10px">
  <div style="font-size:12pt;font-weight:bold;letter-spacing:3px;text-transform:uppercase">Laporan Issue Report</div>
  <div style="font-size:8pt;color:#777;margin-top:2px">Periode: {{ $reports->min('created_at') ? $reports->min('created_at')->translatedFormat('d F Y') : '-' }} &mdash; {{ $reports->max('created_at') ? $reports->max('created_at')->translatedFormat('d F Y') : '-' }}</div>
</div>

@php
  $total=$reports->count(); $solved=$reports->whereNotNull('finished_date')->count();
  $pending=$reports->whereNull('finished_date')->count(); $withPhoto=$reports->whereNotNull('photo_before')->count();
  $pct=$total>0?number_format(($solved/$total)*100,1):'0.0';
@endphp

{{-- META BOX --}}
<table style="width:100%;border:1px solid #c9a84c;border-radius:3px;margin-bottom:10px">
<tr>
  <td style="padding:6px 10px;border-right:1px solid #c9a84c;width:25%">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px">Tanggal Cetak</div>
    <div style="font-size:8.5pt;font-weight:bold">{{ now()->translatedFormat('d F Y, H:i') }} WIB</div>
  </td>
  <td style="padding:6px 10px;border-right:1px solid #c9a84c;width:25%">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px">Total Laporan</div>
    <div style="font-size:8.5pt;font-weight:bold">{{ $total }} Laporan</div>
  </td>
  <td style="padding:6px 10px;border-right:1px solid #c9a84c;width:25%">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px">Periode</div>
    <div style="font-size:8.5pt;font-weight:bold">{{ $reports->min('created_at')?->translatedFormat('d M Y') ?? '-' }} &ndash; {{ $reports->max('created_at')?->translatedFormat('d M Y') ?? '-' }}</div>
  </td>
  <td style="padding:6px 10px;width:25%">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px">Tingkat Penyelesaian</div>
    <div style="font-size:8.5pt;font-weight:bold">{{ $pct }}%</div>
  </td>
</tr>
</table>

{{-- SUMMARY BAR --}}
<table style="width:100%;margin-bottom:12px">
<tr>
  <td style="text-align:center;padding:8px 6px;border:1px solid #1a1a2e;border-right:none;background:#1a1a2e;width:25%">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#c9a84c;letter-spacing:.8px">Total Laporan</div>
    <div style="font-size:16pt;font-weight:bold;color:#fff;line-height:1">{{ $total }}</div>
    <div style="font-size:6.5pt;color:#aaa;margin-top:1px">Keseluruhan</div>
  </td>
  <td class="sum-cell">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;letter-spacing:.8px">Selesai</div>
    <div style="font-size:16pt;font-weight:bold;color:#155724;line-height:1">{{ $solved }}</div>
    <div style="font-size:6.5pt;color:#aaa;margin-top:1px">Telah diselesaikan</div>
  </td>
  <td class="sum-cell">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;letter-spacing:.8px">Pending</div>
    <div style="font-size:16pt;font-weight:bold;color:#721c24;line-height:1">{{ $pending }}</div>
    <div style="font-size:6.5pt;color:#aaa;margin-top:1px">Belum diselesaikan</div>
  </td>
  <td class="sum-cell">
    <div style="font-size:6.5pt;text-transform:uppercase;color:#888;letter-spacing:.8px">Dengan Foto</div>
    <div style="font-size:16pt;font-weight:bold;color:#1a1a2e;line-height:1">{{ $withPhoto }}</div>
    <div style="font-size:6.5pt;color:#aaa;margin-top:1px">Memiliki dokumentasi</div>
  </td>
</tr>
</table>

{{-- SECTION HEADING --}}
<div style="border-bottom:1px solid #c9a84c;padding-bottom:3px;margin-bottom:8px">
  <span style="font-size:7.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:#c9a84c">&#9632; Detail Laporan</span>
</div>

{{-- CARDS --}}
@foreach($reports as $report)
@php
  $photoBefore=null;
  if($report->photo_before && file_exists(storage_path('app/public/'.$report->photo_before)))
    $photoBefore='data:image/jpeg;base64,'.base64_encode(file_get_contents(storage_path('app/public/'.$report->photo_before)));
  $photoAfter=null;
  if($report->photo_after && file_exists(storage_path('app/public/'.$report->photo_after)))
    $photoAfter='data:image/jpeg;base64,'.base64_encode(file_get_contents(storage_path('app/public/'.$report->photo_after)));
  $done=!is_null($report->finished_date);
@endphp
<div class="card">
  <table style="width:100%;background:#1a1a2e;padding:6px 10px">
  <tr>
    <td style="font-size:9pt;font-weight:bold;color:#c9a84c;letter-spacing:1.5px;vertical-align:middle">LAPORAN &nbsp;#{{ sprintf('%04d',$report->id) }}</td>
    <td style="font-size:7.5pt;color:#bbb;text-align:center;vertical-align:middle">{{ $report->created_at?->translatedFormat('d F Y, H:i') ?? '-' }} WIB</td>
    <td style="text-align:right;vertical-align:middle">
      @if($done)
        <span class="badge" style="background:#d4edda;color:#155724">&#10003; Selesai</span>
      @else
        <span class="badge" style="background:#f8d7da;color:#721c24">&#9679; Pending</span>
      @endif
    </td>
  </tr>
  </table>

  <table style="width:100%;padding:9px 10px">
  <tr>
    <td style="vertical-align:top">
      <table class="dt" style="width:100%">
        <tr><td class="l">Pelapor</td><td class="c">:</td><td class="v">{{ $report->author?->name ?? '-' }}</td></tr>
        <tr><td class="l">Area</td><td class="c">:</td><td class="v">{{ $report->area?->area ?? '-' }}</td></tr>
        <tr><td class="l">Jenis Aktivitas</td><td class="c">:</td><td class="v">{{ $report->activityType?->description ?? '-' }}</td></tr>
        <tr><td class="l">Aktivitas</td><td class="c">:</td><td class="v">{{ $report->activity ?? '-' }}</td></tr>
        <tr><td class="l">Tanggal Lapor</td><td class="c">:</td><td class="v">{{ $report->created_at?->translatedFormat('d F Y, H:i') ?? '-' }} WIB</td></tr>
        <tr>
          <td class="l">Status</td><td class="c">:</td>
          @if($done)
            <td class="v" style="color:#155724">Selesai &mdash; {{ $report->finished_date->translatedFormat('d F Y, H:i') }} WIB</td>
          @else
            <td class="v" style="color:#c0392b">Pending</td>
          @endif
        </tr>
      </table>
      <div style="background:#fffbf2;border-left:3px solid #c9a84c;padding:5px 9px;margin-top:7px;font-size:9pt;color:#333">
        <div style="font-size:6.5pt;text-transform:uppercase;letter-spacing:1px;color:#c9a84c;font-weight:bold;margin-bottom:2px">Deskripsi Issue</div>
        {{ $report->issue }}
      </div>
    </td>
    <td style="width:200px;vertical-align:top;padding-left:8px">
      <table style="width:100%"><tr>
        <td style="width:50%;text-align:center;padding-right:4px">
          <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px;margin-bottom:3px">Foto Awal</div>
          @if($photoBefore)
            <img src="{{ $photoBefore }}" style="width:88px;height:75px;object-fit:cover;border:1px solid #d0c8b8;border-radius:2px;display:block;margin:0 auto">
          @else
            <div class="photo-box">Tidak Ada<br>Foto</div>
          @endif
        </td>
        <td style="width:50%;text-align:center;padding-left:4px">
          <div style="font-size:6.5pt;text-transform:uppercase;color:#888;font-weight:bold;letter-spacing:.8px;margin-bottom:3px">Foto Akhir</div>
          @if($photoAfter)
            <img src="{{ $photoAfter }}" style="width:88px;height:75px;object-fit:cover;border:1px solid #d0c8b8;border-radius:2px;display:block;margin:0 auto">
          @else
            <div class="photo-box">Tidak Ada<br>Foto</div>
          @endif
        </td>
      </tr></table>
    </td>
  </tr>
  </table>
</div>
@endforeach

{{-- SIGNATURE --}}
<table style="width:100%;margin-top:18px;margin-bottom:10px">
<tr>
  <td></td>
  <td style="width:160px;text-align:center">
    <div style="font-size:8.5pt;color:#444;margin-bottom:40px">Dibuat oleh,</div>
    <div class="sig-line"></div>
    <div style="font-size:8pt;font-weight:bold">(&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;)</div>
    <div style="font-size:7pt;color:#888">Petugas Laporan</div>
  </td>
  <td style="width:160px;text-align:center">
    <div style="font-size:8.5pt;color:#444;margin-bottom:40px">Diketahui oleh,</div>
    <div class="sig-line"></div>
    <div style="font-size:8pt;font-weight:bold">(&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;)</div>
    <div style="font-size:7pt;color:#888">Supervisor / Manager</div>
  </td>
</tr>
</table>

{{-- FOOTER --}}
<table style="width:100%;border-top:2px solid #1a1a2e;padding-top:7px;margin-top:14px">
<tr>
  <td style="font-size:7.5pt;color:#888;line-height:1.6;vertical-align:bottom">
    Dokumen ini digenerate secara otomatis oleh Sistem Report PT Ultra Jaya Milk.<br>
    Dokumen ini merupakan bukti resmi laporan issue yang telah tercatat dalam sistem.<br>
    Dicetak pada: {{ now()->translatedFormat('d F Y, H:i:s') }} WIB
  </td>
  <td style="text-align:right;vertical-align:bottom">
    <div style="font-size:7pt;letter-spacing:1.5px;text-transform:uppercase;color:#c9a84c;font-weight:bold">Dokumen Resmi Perusahaan</div>
    <div style="font-size:7.5pt;color:#999;margin-top:2px">Halaman 1</div>
  </td>
</tr>
</table>

</div>
</body>
</html>