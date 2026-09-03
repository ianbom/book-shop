import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CustomerBook } from '@/types';

export function BookImageGallery({ book }: { book: CustomerBook }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStart = useRef<number | null>(null);
    const images = book.images;

    useEffect(() => setActiveIndex(0), [book.id]);

    if (images.length === 0) {
        return (
            <div className="grid aspect-[3/4] place-items-center bg-slate-50 text-slate-400">
                <ImageOff className="size-10" />
                <span className="sr-only">Cover belum tersedia</span>
            </div>
        );
    }

    const move = (delta: number) =>
        setActiveIndex(
            (index) => (index + delta + images.length) % images.length,
        );
    const image = images[activeIndex];

    return (
        <div>
            <div
                className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-slate-50"
                onTouchStart={(event) => {
                    touchStart.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                    const start = touchStart.current;
                    const end = event.changedTouches[0]?.clientX;
                    if (
                        start !== null &&
                        end !== undefined &&
                        Math.abs(end - start) > 40
                    )
                        move(end < start ? 1 : -1);
                    touchStart.current = null;
                }}
            >
                <img
                    src={image.url}
                    alt={image.alt_text ?? `Cover buku ${book.title}`}
                    className="size-full object-contain p-4"
                />
                {images.length > 1 && (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90"
                            onClick={() => move(-1)}
                            aria-label="Gambar sebelumnya"
                        >
                            <ChevronLeft />
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90"
                            onClick={() => move(1)}
                            aria-label="Gambar berikutnya"
                        >
                            <ChevronRight />
                        </Button>
                        <span className="absolute bottom-3 rounded-full bg-[#071426]/80 px-2.5 py-1 text-xs text-white">
                            {activeIndex + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {images.map((thumbnail, index) => (
                        <button
                            type="button"
                            key={thumbnail.id}
                            onClick={() => setActiveIndex(index)}
                            className={`h-16 w-12 shrink-0 overflow-hidden border ${index === activeIndex ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-slate-200'}`}
                            aria-label={`Pilih gambar ${index + 1}`}
                        >
                            <img
                                src={thumbnail.url}
                                alt=""
                                className="size-full bg-slate-50 object-contain p-1"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
