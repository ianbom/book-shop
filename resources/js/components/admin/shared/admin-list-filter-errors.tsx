import { usePage } from '@inertiajs/react';

export function AdminListFilterErrors() {
    const { errors } = usePage<{ errors?: Record<string, string> }>().props;
    const messages = Object.values(errors ?? {});

    if (messages.length === 0) return null;

    return (
        <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm"
        >
            {messages.map((message, index) => (
                <p key={`${index}-${message}`}>{message}</p>
            ))}
        </div>
    );
}
