<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Report;
use App\Models\User;
use App\Services\ReportCapabilities;

class ReportPolicy
{
    public function view(User $user, Report $report): bool
    {
        return (new ReportCapabilities($user))->view($report);
    }

    public function update(User $user, Report $report): bool
    {
        return (new ReportCapabilities($user))->update($report);
    }

    public function delete(User $user, Report $report): bool
    {
        return (new ReportCapabilities($user))->delete($report);
    }

    public function close(User $user, Report $report): bool
    {
        return (new ReportCapabilities($user))->close($report);
    }
}
