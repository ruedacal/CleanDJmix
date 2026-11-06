import { Icon } from "./Icon.jsx";
import { cx } from "./primitives.jsx";

export function SortHeader({ field, sort, onSort, children, align = "left", className }) {
    const active = sort.field === field;
    const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
    return (
        <th scope="col" aria-sort={ariaSort} className={cx("px-2 py-2 font-normal", className)}>
            <button
                type="button"
                onClick={() => onSort(field)}
                className={cx(
                    "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                    align === "right" && "flex-row-reverse",
                    active ? "text-cyan-300" : "text-zinc-500 hover:text-zinc-200"
                )}
            >
                {children}
                <Icon
                    name="arrowUp"
                    className={cx("h-3 w-3 transition-transform", active ? "opacity-100" : "opacity-0", active && sort.dir === "desc" && "rotate-180")}
                />
            </button>
        </th>
    );
}
