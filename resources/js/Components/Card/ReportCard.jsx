import { useState } from "react";
import { formatDate } from "@/lib/format.ts";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import { ChevronDown, ChevronUp } from "lucide-react";

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

// Renders plain text or bullet-list text with expand/collapse
function RichText({ text, maxLines = 3, stopPropagation = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.trim() === "" || text === "-") {
    return <span className="text-[12px] text-gray-400">–</span>;
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const isList =
    lines.length > 1 &&
    lines.every((l) => /^[-•*]|^\d+[.)]\s/.test(l));

  const cleanLine = (l) => l.replace(/^[-•*]\s*|^\d+[.)]\s*/, "");
  const visibleLines = expanded ? lines : lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;

  const toggle = (e) => {
    if (stopPropagation) e.stopPropagation();
    setExpanded((v) => !v);
  };

  if (isList) {
    return (
      <div>
        <ul className="space-y-1 m-0 p-0 list-none">
          {visibleLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-gray-700 leading-snug">
              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span>{cleanLine(line)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            onClick={toggle}
            className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1.5 active:opacity-70"
          >
            {expanded
              ? <><ChevronUp className="w-3 h-3" /> Tampilkan lebih sedikit</>
              : <><ChevronDown className="w-3 h-3" /> +{lines.length - maxLines} lainnya</>
            }
          </button>
        )}
      </div>
    );
  }

  // Plain text
  const fullText = lines.join(" ");
  const isLong = fullText.length > 100;

  return (
    <div>
      <p className="text-[12.5px] text-gray-700 leading-snug whitespace-pre-wrap break-words">
        {expanded || !isLong ? fullText : fullText.slice(0, 100) + "…"}
      </p>
      {isLong && (
        <button
          onClick={toggle}
          className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mt-1 active:opacity-70"
        >
          {expanded
            ? <><ChevronUp className="w-3 h-3" /> Lebih sedikit</>
            : <><ChevronDown className="w-3 h-3" /> Selengkapnya</>
          }
        </button>
      )}
    </div>
  );
}

function ContentSection({ label, children }) {
  return (
    <div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function ReportCard({ report, isSelected, onSelect }) {
  const isSolved = !!report.finished_date;
  const activityLabel = report.activity_type?.description ?? report.activity_type?.name ?? "-";
  const hasPhotos = report.photo_before || report.photo_after;
  const hasActivity = report.activity && report.activity !== "-";
  const hasIssue = report.issue && report.issue !== "-";

  return (
    <div
      onClick={() => onSelect(report)}
      className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden active:scale-[0.99] cursor-pointer
        ${isSelected ? "border-blue-400 shadow-blue-100 shadow-md" : "border-gray-100 shadow-sm"}`}
    >
      {/* Top accent line for solved */}
      {isSolved && <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-300" />}
      {!isSolved && <div className="h-0.5 bg-gradient-to-r from-amber-400 to-amber-300" />}

      <div className="p-3.5">
        {/* Header: avatar + author + date + status */}
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
              <div className="shrink-0">
                {isSolved ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    Solved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    Pending
                  </span>
                )}
              </div>
            </div>
            {/* Activity type badge */}
            <div className="mt-1.5">
              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-semibold">{activityLabel}</span>
            </div>
          </div>
        </div>

        {/* Content: Activity + Issue */}
        {(hasActivity || hasIssue) && (
          <div className="mt-3 flex flex-col gap-3">
            {hasActivity && (
              <ContentSection label="Activity">
                <RichText text={report.activity} maxLines={3} />
              </ContentSection>
            )}
            {hasIssue && (
              <ContentSection label="Issue">
                <RichText text={report.issue} maxLines={3} />
              </ContentSection>
            )}
          </div>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
            <PhotoSlot src={report.photo_before} label="Before" />
            <PhotoSlot src={report.photo_after} label="After" />
          </div>
        )}

        {/* Footer: finished date if solved */}
        {isSolved && report.finished_date && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10.5px] text-gray-400">Finished at</span>
            <span className="text-[11px] font-semibold text-emerald-600">{formatDate(report.finished_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}