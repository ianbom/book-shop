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
            <div className="bg-muted text-muted-foreground grid aspect-[3/4] place-items-center">
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
        <div className="flex w-full flex-col items-center">
            <div
                className="bg-card relative grid aspect-[3/4] max-h-[220px] w-full max-w-[180px] place-items-center overflow-hidden border border-border shadow-xs sm:max-h-[300px] sm:max-w-[240px] md:max-h-[380px] md:max-w-none md:shadow-sm"
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
                    className="size-full object-contain p-2 sm:p-4 drop-shadow-md"
                />
                {images.length > 1 && (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="bg-card/90 hover:bg-card absolute top-1/2 left-1.5 size-7 -translate-y-1/2 rounded-none shadow-sm sm:left-2 sm:size-8"
                            onClick={() => move(-1)}
                            aria-label="Gambar sebelumnya"
                        >
                            <ChevronLeft className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="bg-card/90 hover:bg-card absolute top-1/2 right-1.5 size-7 -translate-y-1/2 rounded-none shadow-sm sm:right-2 sm:size-8"
                            onClick={() => move(1)}
                            aria-label="Gambar berikutnya"
                        >
                            <ChevronRight className="size-3.5 sm:size-4" />
                        </Button>
                        <span className="bg-foreground/90 text-primary-foreground absolute bottom-1.5 rounded-none px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase sm:bottom-2 sm:px-2 sm:text-[10px]">
                            {activeIndex + 1} / {images.length}
                        </span>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="mt-2.5 flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:mt-3 sm:gap-2">
                    {images.map((thumbnail, index) => (
                        <button
                            type="button"
                            key={thumbnail.id}
                            onClick={() => setActiveIndex(index)}
                            className={`h-12 w-9 shrink-0 overflow-hidden border sm:h-16 sm:w-12 ${
                                index === activeIndex
                                    ? 'border-primary ring-1 ring-primary'
                                    : 'border-border opacity-70 hover:opacity-100'
                            }`}
                            aria-label={`Pilih gambar ${index + 1}`}
                        >
                            <img
                                src={thumbnail.url}
                                alt=""
                                className="bg-card size-full object-contain p-0.5 sm:p-1"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
