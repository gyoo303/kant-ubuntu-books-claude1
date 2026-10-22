import { EmptyState } from '@/components/EmptyState';

export default function NotFound() {
    return (
        <EmptyState
            title="찾는 페이지가 없어요"
            href="/"
            linkLabel="메인으로"
        />
    );
}
