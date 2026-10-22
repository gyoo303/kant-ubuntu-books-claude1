// 임시 문구 (Q-013, Q-015). 화면에 "예시" 배지와 함께 보여 주고, 공개 전 의뢰인 원고로 교체한다.
export const ABOUT = {
    tagline:
        '대전 어은동 골목 안쪽, 자연과 생태와 건강한 식문화를 다루는 작은 책방',
    paragraphs: [
        '우분투북스는 빠르게 사고파는 곳이 아니라, 천천히 고르고 오래 머무는 책방이고 싶습니다.',
        '자연, 식문화, 생태, 로컬. 네 개의 서가에 책방지기가 직접 읽고 마음을 적은 책을 꽂아 둡니다.',
        '손편지를 보내 주시면 그 마음에 맞는 한 권을 골라, 답장과 함께 매달 한 권씩 보내 드립니다.',
    ],
    address: '대전광역시 유성구 어은동 (예시 주소)',
    hours: '화–일 12:00–20:00, 월요일 쉼 (예시)',
    imageUrl:
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
};

// 책방 사진 (출처: project_ubuntu_books/shopping-mall public/images/about)
export const ABOUT_GALLERY = [
    {
        src: '/images/about/storefront.webp',
        alt: '초록 간판의 우분투북스 서점 외관과 활짝 열린 문',
    },
    {
        src: '/images/about/bookshelf.webp',
        alt: '나무 서가 앞에서 책을 읽는 책방지기',
    },
    {
        src: '/images/about/readers.webp',
        alt: '‘네가 있어 내가 있다’ 책으로 얼굴을 가린 독자들',
    },
    {
        src: '/images/about/table.webp',
        alt: '나무 테이블 위에 놓인 ‘네가 있어 내가 있다’ 책과 소품들',
    },
] as const;

// 네 개의 서가 소개 (출처: project_ubuntu_books/shopping-mall app/about/_data.ts)
export const ABOUT_THEMES = [
    {
        theme: 'nature',
        tag: '자연',
        title: '자연과 함께 머물기',
        desc: '숲과 바다, 계절의 변화를 천천히 바라보는 책. 바쁜 하루 사이에 숨 쉴 틈을 내어주는 문장들.',
    },
    {
        theme: 'ecology',
        tag: '생태',
        title: '도심 속 텃밭과 흙',
        desc: '베란다 화분 하나에서 시작하는 생태 이야기. 흙을 만지는 삶과 지구를 돌보는 일.',
    },
    {
        theme: 'food',
        tag: '식문화',
        title: '치유의 식탁',
        desc: '제철 재료, 느린 요리, 함께 먹는 밥. 몸과 마음을 함께 돌보는 식탁에 관한 책.',
    },
    {
        theme: 'local',
        tag: '로컬',
        title: '지역과 연대',
        desc: '대전과 작은 동네들, 로컬 생산자와 이웃의 이야기. 곁에 있는 사람들을 다시 보게 하는 책.',
    },
] as const;

// 브랜드 스토리 (출처: project_ubuntu_books/shopping-mall AboutHero·AboutQuote)
export const BRAND_STORY = {
    title: ['네가 있어', '내가 있다'],
    origin: 'UBUNTU · Umuntu ngumuntu ngabantu',
    body: '남아프리카의 오래된 말, 우분투. 사람은 다른 사람을 통해 비로소 사람이 된다는 뜻이에요. 책 한 권이 한 사람에게 닿는 일도 그렇다고 믿어서, 이 이름을 골랐습니다.',
    quote: '“빠른 배송 대신, 한 사람을 위해 고르는 시간을 보내드리고 싶었어요.”',
    quoteBy: '— 우분투북스 책방지기',
};

export const BUSINESS_INFO =
    '상호 우분투북스 · 대표 책방지기 · 사업자등록번호 000-00-00000 · 통신판매업 신고 0000-대전유성-0000 (예시)';
export const REFUND_POLICY =
    '발송 전 주문은 마이페이지에서 바로 취소할 수 있고 전액 환불됩니다. 발송 후에는 받으신 날부터 7일 안에 책방으로 연락해 주세요. (예시)';
export const PRIVACY_NOTICE =
    '책을 보내 드리기 위해 이름·연락처·주소를 받습니다. 구독을 마무리하거나 탈퇴하면 관련 법령이 정한 기간이 지난 뒤 지웁니다. (예시)';
export const SUBSCRIPTION_NOTE =
    '매달 신청한 날짜에 자동으로 결제되고, 편지를 읽은 책방지기가 고른 책 한 권이 상자에 담겨 갑니다. 결제는 테스트 모드입니다. (예시)';
