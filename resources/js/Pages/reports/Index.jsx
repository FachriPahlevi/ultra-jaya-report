import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { ROUTES } from "@/lib/constants.ts";
import { formatDate } from "@/lib/format.ts";
import BtnDefault from "@/Components/Button/BtnDefault";

export default function Index({ areaReports = { data: [], links: [], meta: {} }, myReports = { data: [], links: [], meta: {} } }) {
    const [selectedAreaReport, setSelectedAreaReport] = useState(null);
    const [selectedMyReport, setSelectedMyReport] = useState(null);

    const selectAreaReport = (report) => {
        setSelectedAreaReport(selectedAreaReport?.id === report.id ? null : report);
    };

    const selectMyReport = (report) => {
        setSelectedMyReport(selectedMyReport?.id === report.id ? null : report);
    };

    const goSolve = () => {
        if (!selectedAreaReport) return;
        router.visit(`${ROUTES.solveReport}/${selectedAreaReport.id}`);
    };

    const goEdit = () => {
        if (!selectedMyReport) return;
        router.visit(`/reports/${selectedMyReport.id}`);
    };

    return (
        <AppLayout title="Report Lists">
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-[-0.5px] m-0">Report Lists</h2>
                    </div>
                    <Link href={ROUTES.issueReport} className="no-underline">
                        <BtnDefault className="gap-2 px-[18px]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            New Issue
                        </BtnDefault>
                    </Link>
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-5 border-b border-border flex items-baseline gap-2.5">
                        <h3 className="text-[15px] font-bold text-foreground m-0">Area Report</h3>
                        <span className="text-xs text-muted-foreground">area yang ditangani akun ini (PIC)</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
                                    <th className="p-2 whitespace-nowrap">No</th>
                                    <th className="p-2 whitespace-nowrap">Created</th>
                                    <th className="p-2 whitespace-nowrap">Updated</th>
                                    <th className="p-2 whitespace-nowrap">Submitted By</th>
                                    <th className="p-2 whitespace-nowrap">Type</th>
                                    <th className="p-2 whitespace-nowrap">Activity</th>
                                    <th className="p-2 whitespace-nowrap">Issue</th>
                                    <th className="p-2 whitespace-nowrap">Photo</th>
                                    <th className="p-2 whitespace-nowrap">Photo After</th>
                                    <th className="p-2 whitespace-nowrap">Finished</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areaReports.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-10 text-center text-muted-foreground text-[13px]">
                                            No area reports found
                                        </td>
                                    </tr>
                                ) : (
                                    areaReports.data.map((report, i) => {
                                        const isSolved = !!report.finished_date;
                                        return (
                                            <tr
                                                key={report.id}
                                                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedAreaReport?.id === report.id ? "bg-accent" : ""} ${isSolved ? "bg-[#16a34a]/5" : ""}`}
                                                onClick={() => selectAreaReport(report)}
                                            >
                                                <td className="p-2.5 text-[13px] text-muted-foreground font-semibold">{(areaReports.meta?.from ?? 0) + i}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">{formatDate(report.created_at)}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">{formatDate(report.updated_at)}</td>
                                                <td className="p-2.5 text-[13px] font-semibold text-foreground">{report.submitted_by ?? "-"}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">
                                                    <span className="inline-block px-2 py-0.5 bg-accent text-primary rounded text-[11.5px] font-semibold">
                                                        {report.type ?? "-"}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-[13px] text-foreground">{report.activity ?? "-"}</td>
                                                <td className="p-2.5 text-[13px] text-foreground max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{report.issue ?? "-"}</td>
                                                <td className="p-2.5 text-[13px] text-foreground">
                                                    {report.photo ? (
                                                        <a href={report.photo} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium no-underline hover:underline">View</a>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-[13px] text-foreground">
                                                    {report.photo_after ? (
                                                        <a href={report.photo_after} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium no-underline hover:underline">View</a>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-[13px] text-foreground">
                                                    {report.finished_date ? (
                                                        <span className="text-[#16a34a] text-xs font-semibold">{formatDate(report.finished_date)}</span>
                                                    ) : (
                                                        <span className="text-[#d97706] text-xs font-semibold">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {areaReports.links?.length > 3 && (
                        <div className="px-6 py-4 border-t border-border flex gap-1 flex-wrap">
                            {areaReports.links.map((link, idx) => {
                                const active = link.active;
                                const hasUrl = !!link.url;
                                return (
                                    <button
                                        key={idx}
                                        disabled={!hasUrl}
                                        onClick={() => hasUrl && router.visit(link.url, { preserveScroll: true })}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${active ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"} ${!hasUrl ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-5 border-b border-border flex items-baseline gap-2.5">
                        <h3 className="text-[15px] font-bold text-foreground m-0">My Report</h3>
                        <span className="text-xs text-muted-foreground">report yang pernah disubmit akun ini</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold text-muted-foreground tracking-wide uppercase border-b border-border">
                                    <th className="p-2 whitespace-nowrap">No</th>
                                    <th className="p-2 whitespace-nowrap">Created</th>
                                    <th className="p-2 whitespace-nowrap">Updated</th>
                                    <th className="p-2 whitespace-nowrap">Area</th>
                                    <th className="p-2 whitespace-nowrap">Type</th>
                                    <th className="p-2 whitespace-nowrap">Activity</th>
                                    <th className="p-2 whitespace-nowrap">Issue</th>
                                    <th className="p-2 whitespace-nowrap">Photo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myReports.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-10 text-center text-muted-foreground text-[13px]">
                                            You haven't submitted any reports yet
                                        </td>
                                    </tr>
                                ) : (
                                    myReports.data.map((report, i) => (
                                        <tr
                                            key={report.id}
                                            className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedMyReport?.id === report.id ? "bg-accent" : ""}`}
                                            onClick={() => selectMyReport(report)}
                                        >
                                            <td className="p-2.5 text-[13px] text-muted-foreground font-semibold">{(myReports.meta?.from ?? 0) + i}</td>
                                            <td className="p-2.5 text-[13px] text-foreground">{formatDate(report.created_at)}</td>
                                            <td className="p-2.5 text-[13px] text-foreground">{formatDate(report.updated_at)}</td>
                                            <td className="p-2.5 text-[13px] font-semibold text-foreground">{report.area ?? "-"}</td>
                                            <td className="p-2.5 text-[13px] text-foreground">
                                                <span className="inline-block px-2 py-0.5 bg-accent text-primary rounded text-[11.5px] font-semibold">
                                                    {report.type ?? "-"}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-[13px] text-foreground">{report.activity ?? "-"}</td>
                                            <td className="p-2.5 text-[13px] text-foreground max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{report.issue ?? "-"}</td>
                                            <td className="p-2.5 text-[13px] text-foreground">
                                                {report.photo ? (
                                                    <a href={report.photo} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium no-underline hover:underline">View</a>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {myReports.links?.length > 3 && (
                        <div className="px-6 py-4 border-t border-border flex gap-1 flex-wrap">
                            {myReports.links.map((link, idx) => {
                                const active = link.active;
                                const hasUrl = !!link.url;
                                return (
                                    <button
                                        key={idx}
                                        disabled={!hasUrl}
                                        onClick={() => hasUrl && router.visit(link.url, { preserveScroll: true })}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${active ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"} ${!hasUrl ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedAreaReport && (
                    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white rounded-xl py-3.5 px-5 flex items-center gap-4 shadow-lg z-[300] min-w-[340px] animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold">
                                #{selectedAreaReport.id} · {selectedAreaReport.type ?? "-"} · {formatDate(selectedAreaReport.created_at)}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                {selectedAreaReport.finished_date ? (
                                    <span className="text-[#4ade80]">✓ Solved {formatDate(selectedAreaReport.finished_date)}</span>
                                ) : (
                                    <span className="text-amber-400">● Pending</span>
                                )}
                            </div>
                        </div>
                        {!selectedAreaReport.finished_date && (
                            <BtnDefault onClick={goSolve} className="px-[18px] py-2">
                                Solve
                            </BtnDefault>
                        )}
                        <button
                            onClick={() => setSelectedAreaReport(null)}
                            className="bg-white/10 text-white border-none w-7 h-7 rounded-md cursor-pointer flex items-center justify-center transition-opacity hover:opacity-80"
                            aria-label="Close"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                )}

                {selectedMyReport && (
                    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white rounded-xl py-3.5 px-5 flex items-center gap-4 shadow-lg z-[300] min-w-[340px] animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold">
                                #{selectedMyReport.id} · {selectedMyReport.type ?? "-"} · {formatDate(selectedMyReport.created_at)}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                Status: <span className="text-amber-400">edited</span>
                            </div>
                        </div>
                        <BtnDefault
                            onClick={goEdit}
                            className="px-[18px] py-2"
                        >
                            Edit
                        </BtnDefault>
                        <button
                            onClick={() => setSelectedMyReport(null)}
                            className="bg-white/10 text-white border-none w-7 h-7 rounded-md cursor-pointer flex items-center justify-center transition-opacity hover:opacity-80"
                            aria-label="Close"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-in-from-bottom-2 {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in { animation-duration: 0.15s; animation-fill-mode: both; }
                .slide-in-from-bottom-2 { animation-name: slide-in-from-bottom-2; }
            ` }} />
        </AppLayout>
    );
}
