import { formatDate } from "@/lib/format.ts";
import ExpandableImage from "@/Components/UI/ExpandableImage";

const avatarColors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500"];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

function PhotoSlot({ src, label }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      {src ? (
        <ExpandableImage
          src={`/storage/${src}`}
          alt={label}
          className="w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-gray-100"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-gray-300 text-[10px]">No Photo</span>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-[11px] text-gray-400 flex-shrink-0 w-14">{label}</span>
      <span className="text-[11px] text-gray-400">:</span>
      <span className="text-[12px] text-gray-700 break-words min-w-0">{value || "-"}</span>
    </div>
  );
}

export default function ReportCard({ report, isSelected, onSelect }) {
  const isSolved = !!report.finished_date;
  const activityLabel = report.activity_type?.description ?? report.activity_type?.name ?? "-";

  return (
    <div
      onClick={() => onSelect(report)}
      className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden active:scale-[0.99] cursor-pointer
        ${isSelected ? "border-blue-400 shadow-blue-100 shadow-md" : "border-gray-100 shadow-sm"}`}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold ${getAvatarColor(report.author?.name)}`}>
            {getInitials(report.author?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 leading-tight truncate">{report.author?.name ?? "-"}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(report.created_at)}</p>
              </div>
              <div className="flex-shrink-0">
                {isSolved ? (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {formatDate(report.finished_date)}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    Pending
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1.5">
              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-semibold">{activityLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-1">
          <InfoRow label="Activity" value={report.activity} />
          <InfoRow label="Issue" value={report.issue} />
        </div>

        {(report.photo_before || report.photo_after) && (
          <div className="mt-3 flex gap-4">
            <PhotoSlot src={report.photo_before} label="Before" />
            <PhotoSlot src={report.photo_after} label="After" />
          </div>
        )}
      </div>
    </div>
  );
}