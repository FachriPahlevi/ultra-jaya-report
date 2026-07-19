import { useState } from "react";
import { formatDate } from "@/lib/format.ts";
import ExpandableImage from "@/Components/UI/ExpandableImage";
import ModalOverlay from "@/Components/Modal/ModalOverlay";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { HiOutlineX } from "react-icons/hi";

const avatarColors = ["bg-slate-500", "bg-slate-600", "bg-slate-500", "bg-slate-600", "bg-slate-500", "bg-slate-600", "bg-slate-500"];

function getInitials(name) {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
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
                <ExpandableImage src={`/storage/${src}`} alt={label} className="w-16 h-16 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-gray-100" />
            ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-300 text-[10px]">No Photo</span>
                </div>
            )}
        </div>
    );
}

function RichText({ text, maxLines = 3, stopPropagation = true }) {
    const [expanded, setExpanded] = useState(false);

    if (!text || text.trim() === "" || text === "-") {
        return <span className="text-[12px] text-gray-400">–</span>;
    }

    const lines = text
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^[-•*]|^\d+[.)]\s/.test(l));
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
                            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span>{cleanLine(line)}</span>
                        </li>
                    ))}
                </ul>
                {hasMore && (
                    <button onClick={toggle} className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold mt-1.5 active:opacity-70">
                        {expanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" /> Tampilkan lebih sedikit
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" /> +{lines.length - maxLines} lainnya
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }

    const fullText = lines.join(" ");
    const isLong = fullText.length > 100;

    return (
        <div>
            <p className="text-[12.5px] text-gray-700 leading-snug whitespace-pre-wrap break-words">{expanded || !isLong ? fullText : fullText.slice(0, 100) + "…"}</p>
            {isLong && (
                <button onClick={toggle} className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold mt-1 active:opacity-70">
                    {expanded ? (
                        <>
                            <ChevronUp className="w-3 h-3" /> Lebih sedikit
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3" /> Selengkapnya
                        </>
                    )}
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

// Delete confirmation modal component
function DeleteConfirmModal({ isOpen, onClose, onConfirm, report }) {
    if (!report) return null;

    return (
        <ModalOverlay id="delete-confirm-modal" isOpen={isOpen} onClose={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-gray-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Report</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-gray-600 text-sm">Are you sure you want to delete report #{report.id}?</p>
                    <p className="text-gray-400 text-xs mt-2">This action cannot be undone.</p>
                </div>

                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}

export default function ReportCard({ report, isSelected, onSelect, onDelete, showDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const isSolved = report.status === "closed";
    const activityLabel = report.sub_activity?.name ?? report.activity_type?.name ?? "-";
    const hasPhotos = report.photo_before || report.photo_after;
    const hasActivity = report.activity && report.activity !== "-";
    const hasIssue = report.issue && report.issue !== "-";

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete();
    };

    return (
        <>
            <div
                onClick={() => onSelect(report)}
                className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden active:scale-[0.99] cursor-pointer
                    ${isSelected ? "border-gray-300 shadow-md" : "border-gray-100 shadow-sm"}`}
            >
                <div className="h-0.5 bg-gray-100" />

                <div className="p-3.5">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[13px] font-bold ${getAvatarColor(report.author?.name)}`}>
                            {getInitials(report.author?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold text-gray-900 leading-tight truncate">{report.author?.name ?? "-"}</p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-gray-400">
                                        {report.author?.role && <span>{report.author.role}</span>}
                                        <span>{formatDate(report.created_at)}</span>
                                        {report.updated_at && report.updated_at !== report.created_at && <span className="text-gray-300">↑ {formatDate(report.updated_at)}</span>}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-white text-slate-600">{report.area?.area ?? "-"}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    {isSolved ? (
                                        <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">Closed</span>
                                    ) : (
                                        <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full">Open</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {(hasActivity || hasIssue) && (
                        <div className="mt-3 flex flex-col gap-3">
                            {hasActivity && (
                                <ContentSection label="Activity">
                                    <RichText text={`${activityLabel}${report.activity ? `\n${report.activity}` : ""}`} maxLines={3} />
                                </ContentSection>
                            )}
                            {hasIssue && (
                                <ContentSection label="Issue">
                                    <RichText text={report.issue} maxLines={3} />
                                </ContentSection>
                            )}
                        </div>
                    )}

                    {hasPhotos && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4">
                            <PhotoSlot src={report.photo_before} label="Before" />
                            <PhotoSlot src={report.photo_after} label="After" />
                        </div>
                    )}

                    {isSolved && report.closed_at && (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10.5px] text-gray-400">Closed at</span>
                            <span className="text-[11px] font-semibold text-slate-700">{formatDate(report.closed_at)}</span>
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleConfirmDelete} report={report} />
        </>
    );
}
