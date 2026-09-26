import { ArrowUpDown } from 'lucide-react';

type Props = {
    label: string;
    field: string;
    sort?: string;
    direction?: string;
    onSort: (field: string) => void;
    align?: 'left' | 'right';
};

export function SortableHeading({
    label,
    field,
    sort,
    direction,
    onSort,
    align = 'left',
}: Props) {
    return (
        <th
            scope="col"
            aria-sort={
                sort === field
                    ? direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
            className="px-4 py-4"
        >
            <button
                type="button"
                onClick={() => onSort(field)}
                className={`hover:text-foreground flex w-full items-center gap-1.5 whitespace-nowrap ${align === 'right' ? 'justify-end' : ''}`}
            >
                {label}
                <ArrowUpDown className="size-3.5" aria-hidden="true" />
            </button>
        </th>
    );
}
