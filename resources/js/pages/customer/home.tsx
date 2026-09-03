import { Head } from '@inertiajs/react';
import { EditorialBanner } from '@/components/customer/home/editorial-banner';
import { FeaturedBooksSection } from '@/components/customer/home/featured-books-section';
import { HeroSection } from '@/components/customer/home/hero-section';
import { HighlightSection } from '@/components/customer/home/highlight-section';
import type {
    CustomerBook,
    CustomerCategory,
    CustomerStoreSettings,
} from '@/types';

interface HomeProps {
    categories: CustomerCategory[];
    featuredBooks: CustomerBook[];
    latestBooks: CustomerBook[];
    storeSettings: CustomerStoreSettings;
}

export default function Home({
    categories,
    featuredBooks,
    storeSettings,
}: HomeProps) {
    return (
        <>
            <Head title={storeSettings.store_name} />
            <HeroSection />
            <HighlightSection />
            <FeaturedBooksSection
                books={featuredBooks}
                categories={categories}
            />
            <EditorialBanner />
        </>
    );
}
