import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowRight, BookOpen, GraduationCap, Heart, Lightbulb, Palette, Sparkles, WandSparkles } from 'lucide-react';
import { BookDetailDialog } from '@/components/customer/books/book-detail-dialog';
import { BookOrderDialog } from '@/components/customer/books/book-order-dialog';
import { HeroSection } from '@/components/customer/home/hero-section';
import { StoreBenefits } from '@/components/customer/home/store-benefits';
import { SectionContainer } from '@/components/customer/shared/section-container';
import CustomerLayout from '@/layouts/customer-layout';
import { rupiah } from '@/lib/format';
import type { CustomerBook, CustomerCategory, CustomerStoreSettings } from '@/types';

interface HomeProps {
    categories: CustomerCategory[];
    featuredBooks: CustomerBook[];
    latestBooks: CustomerBook[];
    storeSettings: CustomerStoreSettings;
}

const interests = [
    { label: 'Cerita Anak', icon: BookOpen, tint: 'bg-secondary' },
    { label: 'Pendidikan', icon: GraduationCap, tint: 'bg-accent' },
    { label: 'Self Improvement', icon: Lightbulb, tint: 'bg-warning/10' },
    { label: 'Novel', icon: WandSparkles, tint: 'bg-destructive/10' },
    { label: 'Sains', icon: Sparkles, tint: 'bg-secondary' },
    { label: 'Aktivitas & Kreativitas', icon: Palette, tint: 'bg-warning/10' },
];

function BookTile({ book, onView }: { book: CustomerBook; onView: (book: CustomerBook) => void }) {
    return (
        <article className="border-border bg-card flex min-w-0 flex-col rounded-lg border p-2 shadow-sm transition hover:border-primary/50 hover:shadow-md sm:p-3">
            <button type="button" onClick={() => onView(book)} className="bg-secondary/30 relative flex aspect-[.82] items-center justify-center overflow-hidden rounded-md" aria-label={'Lihat detail ' + book.title}>
                {book.primary_image ? <img src={book.primary_image.url} alt={book.primary_image.alt_text ?? 'Sampul ' + book.title} className="h-full w-full object-contain" loading="lazy" /> : <BookOpen className="text-primary size-12" aria-hidden="true" />}
                <Heart className="text-primary absolute top-2 right-2 size-4" aria-hidden="true" />
            </button>
            <div className="flex flex-1 flex-col pt-2">
                <span className="bg-secondary text-primary w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold">{book.categories[0]?.name ?? 'Buku'}</span>
                <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-5 sm:text-sm">{book.title}</h3>
                <p className="text-muted-foreground line-clamp-1 text-[11px]">{book.author}</p>
                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                    <strong className="text-primary text-xs sm:text-sm">{rupiah(book.price)}</strong>
                    <button type="button" onClick={() => onView(book)} className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground rounded-md border px-2 py-1 text-[10px] font-bold transition sm:px-3">Lihat Detail</button>
                </div>
            </div>
        </article>
    );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
    return <div className="mb-5 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-heading text-foreground flex items-center gap-2 text-xl font-bold sm:text-2xl"><Sparkles className="text-warning size-5" aria-hidden="true" />{title}</h2>{subtitle && <p className="text-muted-foreground mt-1 pl-7 text-xs sm:text-sm">{subtitle}</p>}</div><Link href="/books" className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-bold">Lihat Semua <ArrowRight className="size-4" /></Link></div>;
}

export default function Home({ categories, featuredBooks, latestBooks, storeSettings }: HomeProps) {
    const [detailBook, setDetailBook] = useState<CustomerBook | null>(null);
    const [orderBook, setOrderBook] = useState<CustomerBook | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const visibleLatest = activeCategory ? latestBooks.filter((book) => book.categories.some((category) => category.slug === activeCategory)) : latestBooks;
    const latestFilters = [{ name: 'Semua', slug: null }, ...categories.slice(0, 3)];

    return (
       <>
            <Head title="WonderBookLibrary - Little Books, Big Dreams" />
            <HeroSection />
            <section id="koleksi" className="scroll-mt-20 py-8"><SectionContainer>
                <Heading title="Koleksi untuk Setiap Cerita" subtitle="Temukan kategori buku sesuai minat dan imajinasi mereka." />
                <div className="grid gap-3 md:grid-cols-3">{[
                    { title: 'Cerita & Imajinasi', desc: 'Petualangan dan cerita yang menghidupkan imajinasi.', image: '/dashboard/pesanan.png', tone: 'bg-secondary/70' },
                    { title: 'Belajar & Bertumbuh', desc: 'Buku terbaik untuk pengetahuan dan masa depan cerah.', image: '/dashboard/footer-sidebar.png', tone: 'bg-accent/40' },
                    { title: 'Pilihan Keluarga', desc: 'Bacaan untuk momen hangat bersama keluarga.', image: '/dashboard/header-sidebar.png', tone: 'bg-warning/10' },
                ].map((item, index) => <Link key={item.title} href={categories[index] ? '/books?category=' + categories[index].slug : '/books'} className={item.tone + ' relative flex min-h-40 overflow-hidden rounded-xl p-5 transition hover:shadow-md'}><span className="relative z-10 flex max-w-[65%] flex-col"><b className="font-heading text-foreground text-lg">{item.title}</b><span className="text-muted-foreground mt-2 text-[11px] leading-5">{item.desc}</span><span className="text-primary mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-bold">Lihat Koleksi <ArrowRight className="size-3" /></span></span><img src={item.image} alt="" className="absolute right-[-16%] bottom-0 h-36 w-3/5 object-contain" loading="lazy" /></Link>)}</div>
            </SectionContainer></section>
            <section className="pb-8"><SectionContainer><Heading title="Buku Pilihan Minggu Ini" subtitle="Bacaan yang sedang disukai para pembaca WonderBookLibrary." /><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">{featuredBooks.slice(0, 6).map((book) => <BookTile key={book.id} book={book} onView={setDetailBook} />)}</div>{featuredBooks.length === 0 && <p className="text-muted-foreground py-8 text-center">Buku pilihan segera hadir.</p>}</SectionContainer></section>
            <SectionContainer id="tentang-kami" className="scroll-mt-24 pb-9"><div className="bg-secondary/55 grid min-h-56 items-center overflow-hidden rounded-xl md:grid-cols-2"><img src="/dashboard/pesanan.png" alt="Anak membaca buku dengan gembira" className="order-2 max-h-56 w-full object-contain md:order-1" loading="lazy" /><div className="order-1 px-6 pt-7 md:order-2 md:p-8"><span className="text-primary text-[10px] font-extrabold tracking-[.25em] uppercase">Reading Journey</span><h2 className="font-heading text-foreground mt-2 text-2xl font-bold leading-tight sm:text-3xl">Setiap Buku Membuka Petualangan Baru</h2><p className="text-muted-foreground mt-2 text-xs leading-5">Membaca menumbuhkan imajinasi, memperluas cara pandang, dan membuat hari-hari terasa bermakna.</p><Link href="/books" className="bg-primary text-primary-foreground mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold">Temukan Bacaanmu <ArrowRight className="size-4" /></Link></div></div></SectionContainer>
            <section className="pb-9"><SectionContainer><Heading title="Temukan Buku Berdasarkan Minat" /><div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{interests.map(({ label, icon: Icon, tint }) => { const category = categories.find((item) => item.name.toLowerCase() === label.toLowerCase()); return <Link key={label} href={category ? '/books?category=' + category.slug : '/books'} className="group flex flex-col items-center gap-2 text-center"><span className={tint + ' text-primary group-hover:scale-105 grid size-16 place-items-center rounded-full transition sm:size-20'}><Icon className="size-8 sm:size-10" strokeWidth={1.5} /></span><span className="text-foreground text-[11px] font-bold sm:text-xs">{label}</span></Link>; })}</div></SectionContainer></section>
            <section className="pb-7"><SectionContainer><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-heading text-foreground flex items-center gap-2 text-xl font-bold sm:text-2xl"><Sparkles className="text-warning size-5" aria-hidden="true" />Buku Terbaru</h2><p className="text-muted-foreground mt-1 pl-7 text-xs">Temukan buku terbaru untuk menemani petualanganmu.</p></div><div className="bg-secondary/50 flex flex-wrap gap-1 rounded-lg p-1" role="group" aria-label="Filter buku terbaru">{latestFilters.map((filter) => <button type="button" key={filter.slug ?? 'semua'} onClick={() => setActiveCategory(filter.slug)} className={'rounded-md px-3 py-1.5 text-[11px] font-semibold transition ' + (activeCategory === filter.slug ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-background')}>{filter.name}</button>)}</div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">{visibleLatest.slice(0, 5).map((book) => <BookTile key={book.id} book={book} onView={setDetailBook} />)}</div>{visibleLatest.length === 0 && <p className="text-muted-foreground py-8 text-center">Belum ada buku terbaru di kategori ini.</p>}</SectionContainer></section>
            <StoreBenefits />
            <SectionContainer className="pb-9"><div className="bg-secondary/55 relative flex min-h-40 items-center overflow-hidden rounded-xl px-6 py-8 sm:px-12"><div className="relative z-10 max-w-md"><h2 className="font-heading text-foreground text-2xl font-bold leading-tight sm:text-3xl">Temukan Buku untuk Petualangan Berikutnya</h2><p className="text-muted-foreground mt-2 text-xs">Karena setiap halaman membawa kemungkinan baru.</p><Link href="/books" className="bg-primary text-primary-foreground mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold">Jelajahi Semua Buku <ArrowRight className="size-4" /></Link></div><img src="/dashboard/pesanan.png" alt="" className="absolute right-[-12%] bottom-0 hidden h-44 w-1/2 object-contain sm:block" loading="lazy" /></div></SectionContainer>
            <BookDetailDialog book={detailBook} onClose={() => setDetailBook(null)} onBuy={(book) => { setDetailBook(null); setOrderBook(book); }} />
            <BookOrderDialog book={orderBook} onClose={() => setOrderBook(null)} />
        </>
    );
}
