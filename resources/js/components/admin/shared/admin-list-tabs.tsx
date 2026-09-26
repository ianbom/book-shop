type Tab = { label: string; value: string };

type Props = {
    label: string;
    tabs: Tab[];
    active: string;
    onChange: (value: string) => void;
};

export function AdminListTabs({ label, tabs, active, onChange }: Props) {
    return (
        <nav className="border-b bg-white px-3 pt-3 sm:px-4" aria-label={label}>
            <div className="flex min-w-max gap-1 overflow-x-auto pb-3">
                {tabs.map((tab) => {
                    const selected = active === tab.value;

                    return (
                        <button
                            key={tab.value || 'all'}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(tab.value)}
                            className={
                                selected
                                    ? 'bg-primary text-primary-foreground h-10 min-w-30 rounded-lg px-4 text-xs font-bold shadow-sm'
                                    : 'border-border text-foreground hover:bg-muted h-10 min-w-30 rounded-lg border bg-white px-4 text-xs font-semibold transition-colors'
                            }
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
