# Activity data model

The hierarchy has exactly two levels:

- `activities`: name, description, active status; no parent or category column.
- `sub_activities`: required `activity_id`, name, description, required `category` (`ISSUE` or `REPORT`, default `ISSUE`). Active status follows the activity.
- `activity_managers`: multiple managers per activity, unique `(activity_id, user_id)`.
- `sub_activity_supervisors`: multiple supervisors per sub-activity, unique `(sub_activity_id, user_id)`.

Assignment endpoints validate active users and the recipient's permissions, independent of role names. Reviewers need `reports.review.area`; closers need `reports.solve.own.area` or `reports.solve.all`. The assigning operator needs the separate `activities.assign.manager` / `activities.assign.supervisor` permissions. Editing an activity alone does not grant assignment permission. Category management requires `activities.category.manage` (assigned to Super Admin by default).

Reports require `sub_activity_id`. `reports.activity_id` is retained for existing reporting queries and exports and is derived by the Report model from the selected sub-activity; it cannot independently reassign a report to another activity. `category_snapshot` is populated server-side from the sub-activity. Changing a sub-activity's category does not reclassify existing reports. Selecting a different sub-activity when editing a report takes that sub-activity's category.

A report can be closed only if its snapshot is `ISSUE`, its status is open, and its user has close permission. Scoped supervisors additionally need both the report's sub-area assignment and sub-activity assignment. Managers review reports through their activity assignment.

Activity and sub-activity deletion is soft. Items referenced by reports (including deleted reports) cannot be deleted through CRUD. Deactivate the activity instead. Historical report relationships include soft-deleted records.

## Development database setup

The original activity and report migrations define the new schema. For a new database, use `php artisan migrate` and the project's seeders.

The application has not gone live. There is no legacy schema conversion command. To rebuild a disposable development database, the following command recreates all tables and seeds initial data; it deletes existing database contents:

```bash
php artisan migrate:fresh --seed
```

