<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Report;
use PHPUnit\Framework\TestCase;

class ReportTest extends TestCase
{
    public function test_only_open_report_is_editable(): void
    {
        $openReport = new Report(['status' => Report::STATUS_OPEN]);
        $closedReport = new Report(['status' => Report::STATUS_CLOSED]);

        $this->assertTrue($openReport->isOpen());
        $this->assertFalse($closedReport->isOpen());
    }
}
