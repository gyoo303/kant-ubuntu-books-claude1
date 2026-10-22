// KANT-R3, C6: Mock 상품 데이터.
// 역할(ADR-001): Supabase seed의 원천(scripts/gen-seed.ts)이자 단위 테스트 픽스처. 화면 코드에서는 import하지 않는다.
// 모든 책·노트는 임시 예시 데이터다. 공개 전 의뢰인 자료로 교체한다.
import type { Product } from '@/types/product';

const image = (photoId: string) =>
    `https://images.unsplash.com/photo-${photoId}?w=900&q=80`;

export const products: Product[] = [
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000001',
        name: '숲의 시간을 걷다 (예시)',
        price: 16800,
        imageUrl: image('1441974231531-c6227db76b6e'),
        description:
            '사계절 동안 한 숲을 오가며 기록한 산책 에세이. 나무와 새와 바람의 속도에 맞춰 걷는 법을 이야기한다.',
        author: '한서린',
        publisher: '푸른잎 (예시)',
        theme: 'nature',
        bookkeeperNote:
            '퇴근길에 한 장씩 아껴 읽었어요. 빨리 읽으면 손해 보는 책이라, 천천히 걸을 때처럼 읽어 주셨으면 합니다.',
        stockQuantity: 5,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000002',
        name: '산 아래 작은 기록 (예시)',
        price: 15000,
        imageUrl: image('1519681393784-d120267933ba'),
        description:
            '산골 마을로 이사한 작가가 계절마다 남긴 짧은 글과 스케치를 엮었다.',
        author: '오윤재',
        publisher: '바람길 (예시)',
        theme: 'nature',
        bookkeeperNote:
            '창문을 열어 둔 채 읽고 싶은 책이에요. 첫눈 오는 장면에서 오래 멈춰 있었습니다.',
        stockQuantity: 3,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000003',
        name: '제철 밥상 일기 (예시)',
        price: 18500,
        imageUrl: image('1504754524776-8f4f37790ca0'),
        description:
            '열두 달 제철 재료로 차린 소박한 밥상과 그 재료를 길러 낸 사람들의 이야기.',
        author: '김다온',
        publisher: '밥과글 (예시)',
        theme: 'food',
        bookkeeperNote:
            '이 책을 읽고 나서 장 보는 순서가 바뀌었어요. 무엇을 먹을지보다 지금 무엇이 나는지를 먼저 봅니다.',
        stockQuantity: 4,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000004',
        name: '느린 부엌 (예시)',
        price: 17000,
        imageUrl: image('1466637574441-749b8f19452f'),
        description:
            '발효와 저장, 오래 끓이는 요리로 하루의 속도를 늦추는 부엌 살림 안내서.',
        author: '이소담',
        publisher: '밥과글 (예시)',
        theme: 'food',
        bookkeeperNote:
            '된장 담그는 장면을 읽으며 할머니 부엌 냄새가 났어요. 레시피보다 기다리는 마음을 배우는 책입니다.',
        stockQuantity: 0,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000005',
        name: '들판의 이웃들 (예시)',
        price: 19800,
        imageUrl: image('1500382017468-9049fed747ef'),
        description:
            '논과 밭 사이에 사는 작은 생물들을 관찰한 생태 기록. 세밀화 60여 점 수록.',
        author: '정하늘',
        publisher: '숨결 (예시)',
        theme: 'ecology',
        bookkeeperNote:
            '아이와 함께 읽다가 결국 둘이서 논두렁을 걸으러 나갔어요. 이름을 알게 되면 더 자주 보이게 됩니다.',
        stockQuantity: 6,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000006',
        name: '쓰레기 없는 일주일 (예시)',
        price: 14500,
        imageUrl: image('1490818387583-1baba5e638af'),
        description:
            '한 가족이 일주일 동안 쓰레기를 만들지 않기로 하고 겪은 시행착오의 기록.',
        author: '문채원',
        publisher: '숨결 (예시)',
        theme: 'ecology',
        bookkeeperNote:
            '완벽하지 않아도 괜찮다고 말해 주는 책이라 좋았어요. 실패담이 많아서 오히려 용기가 납니다.',
        stockQuantity: 2,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000007',
        name: '어은동 골목 산책 (예시)',
        price: 13000,
        imageUrl: image('1481627834876-b7833e8f5570'),
        description: '대전 어은동 골목의 가게와 사람들을 찾아다닌 동네 산책기.',
        author: '박이음',
        publisher: '골목책방 (예시)',
        theme: 'local',
        bookkeeperNote:
            '저희 책방 앞 골목도 나와요. 읽고 나서 이 동네를 걸으면 같은 길이 조금 다르게 보일 거예요.',
        stockQuantity: 7,
    },
    {
        id: '0b1f3c4e-1a2b-4c3d-8e9f-000000000008',
        name: '작은 서점의 사계 (예시)',
        price: 16000,
        imageUrl: image('1507842217343-583bb7270b66'),
        description:
            '지역의 작은 서점들이 한 해를 어떻게 꾸려 가는지 담은 인터뷰집.',
        author: '최봄',
        publisher: '골목책방 (예시)',
        theme: 'local',
        bookkeeperNote:
            '같은 일을 하는 동료들의 이야기라 밑줄을 가장 많이 그었어요. 책방을 좋아하는 분께 먼저 권합니다.',
        stockQuantity: 4,
    },
];
