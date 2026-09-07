import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CatalogFilters, CustomerCategory } from '@/types';

interface BookFiltersProps {
    categories: CustomerCategory[];
    filters: CatalogFilters;
    search: string;
    onSearchChange: (value: string) => void;
    onChange: <K extends keyof CatalogFilters>(
        key: K,
        value: CatalogFilters[K],
    ) => void;
    onReset: () => void;
}

export function BookFilters({
    categories,
    filters,
    search,
    onSearchChange,
    onChange,
    onReset,
}: BookFiltersProps) {
    const selectedCategories = filters.categories ?? [];
    const active = Boolean(
        filters.search ||
        selectedCategories.length > 0 ||
        filters.availability ||
        filters.sort !== 'latest',
    );

    const toggleCategory = (slug: string) => {
        const next = selectedCategories.includes(slug)
            ? selectedCategories.filter((item) => item !== slug)
            : [...selectedCategories, slug];
        onChange('categories', next);
    };

    return (
        <aside className="border-border bg-card flex flex-col gap-5 border p-5">
            <div>
                <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Filter & Cari
                    </h2>
                    {active && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-muted-foreground hover:text-foreground h-7 rounded-none px-2 text-xs"
                        >
                            <X className="size-3.5" /> Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Cari Buku
                </Label>
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Judul, penulis, ISBN..."
                        className="border-border h-10 rounded-none pl-9 text-xs"
                    />
                </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Urutkan
                </Label>
                <Select
                    value={filters.sort}
                    onValueChange={(value) =>
                        onChange(
                            'sort',
                            value as CatalogFilters['sort'],
                        )
                    }
                >
                    <SelectTrigger className="w-full rounded-none text-xs">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        <SelectItem value="latest">Terbaru</SelectItem>
                        <SelectItem value="title_asc">Judul A-Z</SelectItem>
                        <SelectItem value="title_desc">Judul Z-A</SelectItem>
                        <SelectItem value="price_asc">Harga Terendah</SelectItem>
                        <SelectItem value="price_desc">
                            Harga Tertinggi
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Availability */}
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Ketersediaan
                </Label>
                <Select
                    value={filters.availability || 'all'}
                    onValueChange={(value) =>
                        onChange(
                            'availability',
                            value === 'all'
                                ? ''
                                : (value as CatalogFilters['availability']),
                        )
                    }
                >
                    <SelectTrigger className="w-full rounded-none text-xs">
                        <SelectValue placeholder="Ketersediaan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                        <SelectItem value="all">Semua Stok</SelectItem>
                        <SelectItem value="available">Tersedia</SelectItem>
                        <SelectItem value="out_of_stock">Stok Habis</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Categories Multi-Select Checkboxes */}
            <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Kategori
                    </Label>
                    {selectedCategories.length > 0 && (
                        <span className="text-primary text-[10px] font-bold">
                            {selectedCategories.length} dipilih
                        </span>
                    )}
                </div>
                <div className="flex max-h-64 flex-col gap-2.5 overflow-y-auto pr-1">
                    {categories.map((category) => {
                        const isChecked = selectedCategories.includes(
                            category.slug,
                        );
                        return (
                            <label
                                key={category.id}
                                className="hover:text-primary flex cursor-pointer items-center gap-2.5 text-xs select-none"
                            >
                                <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() =>
                                        toggleCategory(category.slug)
                                    }
                                    className="rounded-none"
                                />
                                <span
                                    className={
                                        isChecked
                                            ? 'text-foreground font-semibold'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {category.name}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
