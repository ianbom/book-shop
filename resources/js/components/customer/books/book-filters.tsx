import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    onChange: (
        key: Exclude<keyof CatalogFilters, 'search'>,
        value: string,
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
    const active = Boolean(
        filters.search ||
        filters.category ||
        filters.availability ||
        filters.sort !== 'latest',
    );

    return (
        <div className="space-y-4 border-y border-slate-200 py-5">
            <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Cari judul, penulis, atau ISBN..."
                    className="h-11 border-slate-200 pl-10"
                />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) =>
                        onChange('category', value === 'all' ? '' : value)
                    }
                >
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.availability || 'all'}
                    onValueChange={(value) =>
                        onChange('availability', value === 'all' ? '' : value)
                    }
                >
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Ketersediaan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Stok</SelectItem>
                        <SelectItem value="available">Tersedia</SelectItem>
                        <SelectItem value="out_of_stock">Stok Habis</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.sort}
                    onValueChange={(value) => onChange('sort', value)}
                >
                    <SelectTrigger className="w-full sm:ml-auto sm:w-48">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="latest">Terbaru</SelectItem>
                        <SelectItem value="title_asc">Judul A-Z</SelectItem>
                        <SelectItem value="title_desc">Judul Z-A</SelectItem>
                        <SelectItem value="price_asc">
                            Harga Terendah
                        </SelectItem>
                        <SelectItem value="price_desc">
                            Harga Tertinggi
                        </SelectItem>
                    </SelectContent>
                </Select>
                {active && (
                    <Button
                        variant="ghost"
                        onClick={onReset}
                        className="text-slate-600"
                    >
                        <X className="size-4" /> Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
