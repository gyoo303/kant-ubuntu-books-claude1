import Image from 'next/image';
import Link from 'next/link';
import { ExampleBadge } from '@/components/ExampleBadge';
import { ThemeIcon } from '@/components/ThemeIcon';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ABOUT,
    ABOUT_GALLERY,
    ABOUT_THEMES,
    BRAND_STORY,
} from '@/lib/content/policies';

// SCR-02 책방 소개. 브랜드 스토리·사진·서가 소개는 이전 작업(project_ubuntu_books)의 자료, 운영 안내는 임시 원고 (Q-015)
export default function AboutPage() {
    return (
        <article className="flex flex-col gap-16">
            <header className="flex flex-col items-center gap-4 pt-6 text-center">
                <p className="typo-eyebrow text-olive">BRAND STORY</p>
                <h1 className="typo-h1">
                    {BRAND_STORY.title[0]}
                    <br />
                    {BRAND_STORY.title[1]}
                </h1>
                <p className="text-muted-foreground text-xs tracking-wide">
                    {BRAND_STORY.origin}
                </p>
                <p className="text-ink-2 max-w-xl leading-relaxed">
                    {BRAND_STORY.body}
                </p>
            </header>

            {/* 4장을 4×2 칸에 빈칸 없이: 큰 사진 2×2, 넓은 사진 2×1, 작은 사진 1×1 두 장 */}
            <section
                aria-label="책방 사진"
                className="grid grid-cols-2 gap-3 md:aspect-2/1 md:grid-cols-4 md:grid-rows-2"
            >
                {ABOUT_GALLERY.map((photo, index) => (
                    <div
                        key={photo.src}
                        className={cn(
                            'bg-muted relative overflow-hidden rounded-xl',
                            index === 0 &&
                                'col-span-2 aspect-4/3 md:row-span-2 md:aspect-auto',
                            index === 1 &&
                                'col-span-2 aspect-2/1 md:aspect-auto',
                            index > 1 && 'aspect-square md:aspect-auto',
                        )}
                    >
                        <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes={
                                index === 0
                                    ? '(min-width: 768px) 50vw, 100vw'
                                    : '(min-width: 768px) 25vw, 50vw'
                            }
                            className="object-cover"
                            priority={index === 0}
                        />
                    </div>
                ))}
            </section>

            {/* 왼쪽 소개 문단(줄 길이 40em 이하) + 오른쪽 방문 안내 카드 */}
            <section className="grid gap-8 lg:grid-cols-5">
                <div className="flex flex-col gap-4 leading-relaxed lg:col-span-3">
                    <h2 className="typo-h2">
                        {ABOUT.tagline} <ExampleBadge />
                    </h2>
                    {ABOUT.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
                <aside className="bg-card flex flex-col gap-4 self-start rounded-xl border p-6 lg:col-span-2">
                    <h3 className="typo-h3">책방에 들르려면</h3>
                    <dl className="flex flex-col gap-2 text-sm">
                        <div className="flex gap-4">
                            <dt className="text-muted-foreground w-16 shrink-0">
                                주소
                            </dt>
                            <dd>{ABOUT.address}</dd>
                        </div>
                        <div className="flex gap-4">
                            <dt className="text-muted-foreground w-16 shrink-0">
                                여는 시간
                            </dt>
                            <dd>{ABOUT.hours}</dd>
                        </div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/products"
                            className={buttonVariants({ variant: 'outline' })}
                        >
                            테마 서가 둘러보기
                        </Link>
                        <Link href="/subscribe" className={buttonVariants()}>
                            손편지 구독
                        </Link>
                    </div>
                </aside>
            </section>

            <section
                aria-labelledby="about-themes"
                className="flex flex-col gap-4"
            >
                <h2 id="about-themes" className="typo-h2">
                    네 개의 서가
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {ABOUT_THEMES.map((theme) => (
                        <Link
                            key={theme.tag}
                            href={`/products?theme=${theme.theme}`}
                            className="bg-card hover:bg-muted flex flex-col gap-2 rounded-xl border p-5 transition-colors"
                        >
                            <ThemeIcon
                                theme={theme.theme}
                                className="text-olive size-6"
                            />
                            <span className="typo-eyebrow text-olive">
                                {theme.tag}
                            </span>
                            <h3 className="typo-h3">{theme.title}</h3>
                            <p className="text-ink-2 text-sm">{theme.desc}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="bg-paper-2 flex flex-col items-center gap-6 rounded-2xl px-6 py-16 text-center">
                <blockquote className="typo-h3 max-w-xl">
                    {BRAND_STORY.quote}
                </blockquote>
                <p className="text-muted-foreground text-xs">
                    {BRAND_STORY.quoteBy}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Link
                        href="/subscribe"
                        className={buttonVariants({ size: 'lg' })}
                    >
                        편지로 구독 시작하기
                    </Link>
                    <Link
                        href="/products"
                        className={buttonVariants({
                            variant: 'outline',
                            size: 'lg',
                        })}
                    >
                        테마 서가 둘러보기
                    </Link>
                </div>
            </section>
        </article>
    );
}
