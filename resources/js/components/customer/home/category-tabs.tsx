import type { CustomerCategory } from '@/types';

interface CategoryTabsProps {
    categories: CustomerCategory[];
    activeCategory: string | null;
    onChange: (slug: string | null) => void;
}

export function CategoryTabs({
    categories,
    activeCategory,
    onChange,
}: CategoryTabsProps) {
    return (
        <div className="flex justify-center overflow-x-auto border-b border-slate-200">
            <div className="flex min-w-max gap-8 px-2">
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${activeCategory === null ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-slate-500 hover:text-[#0B1F3A]'}`}
                >
                    Semua
                </button>
                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => onChange(category.slug)}
                        className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${activeCategory === category.slug ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-slate-500 hover:text-[#0B1F3A]'}`}
                    >
                        {category.name === 'Pengembangan Diri'
                            ? 'Self Improvement'
                            : category.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
