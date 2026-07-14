export default function Pagination({ page, totalPages, onChange, center = false }) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex gap-1 flex-wrap ${center ? "justify-center" : ""}`}>
            <button
                disabled={page === 1}
                onClick={() => onChange(page - 1)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground ${page === 1 ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                dangerouslySetInnerHTML={{ __html: "&laquo;" }}
            />
            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all
                        ${p === page
                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                            : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer"}`}
                >
                    {p}
                </button>
            ))}
            <button
                disabled={page === totalPages}
                onClick={() => onChange(page + 1)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground ${page === totalPages ? "opacity-40 cursor-default" : "cursor-pointer"}`}
                dangerouslySetInnerHTML={{ __html: "&raquo;" }}
            />
        </div>
    );
}