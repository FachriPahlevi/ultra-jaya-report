import { router } from "@inertiajs/react";

export default function Pagination({ links = [], center = false }) {
  if (!links || links.length <= 3) return null;

  const handlePageClick = (url) => {
    if (!url) return;

    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(url);

    const params = {};
    currentUrl.searchParams.forEach((value, key) => {
      if (key !== "page") {
        params[key] = value;
      }
    });

    const page = targetUrl.searchParams.get("page");
    if (page) {
      params.page = page;
    }

    router.get(route("reports.index"), params, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  return (
    <div
      className={`px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex gap-1 flex-wrap ${
        center ? "justify-center" : ""
      }`}
    >
      {links.map((link, idx) => (
        <button
          key={idx}
          disabled={!link.url}
          onClick={() => handlePageClick(link.url)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all
            ${
              link.active
                ? "bg-primary border-primary text-primary-foreground shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }
            ${!link.url ? "opacity-40 cursor-default" : "cursor-pointer"}`}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </div>
  );
}