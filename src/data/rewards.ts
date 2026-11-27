// 보상(골드)·간식·팀워크·동료 에피소드 데이터
// 저장 데이터 호환: 간식 기록은 Progress.gifts, 팀워크 점수 기준은 예전 호감도 수치를 그대로 이어서 쓴다.
import type { Line, SceneName, TalkItem } from '../types'
import { NEW_FRIENDS } from './friends2'
import { DEFAULT_FRIENDS } from './friends-default'

/** 화폐 단위 */
export const GOLD = 'G'

/** 프로젝트 완료 보상: 직급(난이도)별 기본 골드 */
export const LEVEL_GOLD: Record<1 | 2 | 3, number> = { 1: 100, 2: 200, 3: 300 }
/** 별 1개당 추가 골드(별 2개 → +20, 별 3개 → +40) */
export const STAR_BONUS = 20
/** 다른 날 다시 푼 "복습"은 기본 골드의 절반 */
export const REVIEW_RATE = 0.5
/** 클리어한 프로젝트의 퀴즈·구성도만 다시 하기: 기본 골드에 곱하는 비율(전체 수행보다 작게) */
export const PRACTICE_RATE = { quiz: 0.2, design: 0.3 } as const
/** 다시 하기 중 해설·정답을 보면 보상 절반 */
export const PRACTICE_PEEK_RATE = 0.5
/** 하루 첫 접속 출석 보상 */
export const ATTEND_GOLD = 10

export interface GiftItem {
  id: string
  emoji: string
  name: string
  price: number
  /** 기본 팀워크 */
  points: number
  /** 예전 '선물' 시절 품목. 기록 계산에만 쓰고 간식 목록에는 내지 않음 */
  legacy?: boolean
}

export const GIFTS: GiftItem[] = [
  { id: 'americano', emoji: '☕', name: '아이스 아메리카노', price: 50, points: 5 },
  { id: 'sports', emoji: '🥤', name: '스포츠음료', price: 70, points: 7 },
  { id: 'snack', emoji: '🍪', name: '편의점 간식 꾸러미', price: 80, points: 8 },
  { id: 'energy', emoji: '⚡', name: '에너지 드링크', price: 120, points: 12 },
  { id: 'tea', emoji: '🍵', name: '따뜻한 허브티', price: 100, points: 10 },
  { id: 'tangerine', emoji: '🍊', name: '제주 감귤', price: 150, points: 15 },
  { id: 'dessert', emoji: '🍰', name: '카페 디저트 세트', price: 180, points: 18 },
  { id: 'plant', emoji: '🪴', name: '미니 다육이 화분', price: 200, points: 20, legacy: true },
  { id: 'chicken', emoji: '🍗', name: '치킨 기프티콘', price: 250, points: 25 },
  { id: 'book', emoji: '📘', name: '클라우드 기술 서적', price: 300, points: 30, legacy: true },
  { id: 'beans', emoji: '🫘', name: '스페셜티 원두', price: 450, points: 45 },
  { id: 'pen', emoji: '🖋️', name: '만년필', price: 700, points: 70, legacy: true },
  { id: 'ticket', emoji: '🎫', name: '공연 티켓 두 장', price: 900, points: 90, legacy: true },
]

/** 사무실에서 나눌 수 있는 간식 */
export const SNACKS = GIFTS.filter((g) => !g.legacy)

/** 팀워크: 이야기하기(동료별 하루 1번), 함께한 프로젝트 완료(완료 수에 반영된 1회마다) */
export const TALK_POINTS = 3
export const PROJECT_POINTS = 3

/** 좋아하는 간식은 팀워크 2배, 싫어하는 간식은 절반 */
export const LIKE_RATE = 2
export const DISLIKE_RATE = 0.5

/** 팀워크 단계(예전 호감도 구간 0·50·150·300을 그대로 대응) */
export const BONDS = [
  { min: 0, name: '첫 인사' },
  { min: 50, name: '익숙한 동료' },
  { min: 150, name: '믿음직한 동료' },
  { min: 300, name: '최고의 파트너' },
]

export interface Episode {
  id: string
  need: number // 열리는 팀워크(BONDS 단계 구간과 같음)
  title: string
  /** 신입 시절·프로젝트 경험·실수담·회사 일상·동료의 취미·팀의 성장 */
  topic: string
  scene: SceneName
  /** 대사와 선택지. 어느 선택지를 골라도 끝까지 볼 수 있다 */
  lines: TalkItem[]
  /** 끝까지 보면 받는 사무실 소품·사진·액자(선반에 전시) */
  reward: { id: string; name: string; art: string; kind: '사진' | '소품' | '액자' }
}

export interface Friend {
  id: string // characters.ts의 캐릭터 id
  /** 전문 분야(프로필 표시) */
  specialty: string
  /** 허당 면모·개성(프로필 표시) */
  quirk: string
  hint: string // 취향 힌트
  likes: string[]
  dislikes: string[]
  greet: string[] // 팀워크 단계별 인사(BONDS 순서)
  /** 이야기하기: 업무·협업·회사 일상 대화. 할 때마다 다음 대화로 넘어간다 */
  talks: Line[][]
  react: { like: string[]; normal: string[]; dislike: string[] }
  /** 선물별 전용 반응(있으면 우선) */
  special?: Record<string, string>
  episodes: Episode[]
}

export const FRIENDS: Friend[] = [
  {
    id: 'lead',
    quirk: '핸드드립 커피에 지나치게 진심이에요. 저울과 온도계를 들고 다니고, 원두 이야기를 시작하면 길어져요. 설계 노트에 원두 기록이 섞여 있어요.',
    specialty: '아키텍처 설계 · 고객 제안',
    hint: '회의 때마다 직접 내린 커피를 들고 와요. 커피엔 꼭 달달한 디저트를 곁들인대요.',
    likes: ['americano', 'beans', 'dessert'],
    dislikes: ['energy'],
    greet: [
      '무슨 일이에요? 프로젝트 질문이면 언제든 와요.',
      '왔어요? 오늘 진행은 어때요?',
      '마침 커피 내리던 참이에요. 한 잔 할래요?',
      '오늘도 같이 잘해 봅시다. 요즘 우리 팀에서 제일 든든한 사람이 누군지 알죠?',
    ],
    talks: [
      [
        { who: 'lead', text: '이번 주 고객 미팅, 요구사항 정리 잘 됐어요. 비용 얘기가 나왔을 때 바로 예약 인스턴스를 꺼낸 거 좋았어요.' },
        { who: 'me', text: '팀장님이 지난번에 비용부터 물어보라고 하셔서요.' },
        { who: 'lead', text: '그 습관이면 어느 프로젝트에서도 통해요.' },
      ],
      [
        { who: 'lead', text: '제안서 쓸 때 구성도부터 그려요, 글부터 써요?' },
        { who: 'me', text: '구성도부터요. 그려 봐야 빠진 게 보여서요.' },
        { who: 'lead', text: '저도요. 잘 그린 구성도 한 장이 슬라이드 열 장보다 설득력 있어요.' },
      ],
      [
        { who: 'lead', text: '아침에 원두를 새로 갈았어요. 이번 건 산미가 좀 있어요.' },
        { who: 'me', text: '회의실까지 향이 나던데요.' },
        { who: 'lead', text: '회의 전에 한 잔씩 돌릴게요. 다들 표정이 한결 부드러워지거든요.' },
      ],
      [
        { who: 'lead', text: '장애 보고서는 누구 탓을 쓰는 문서가 아니에요. 같은 일이 다시 안 생기게 하는 문서예요.' },
        { who: 'me', text: '원인, 영향, 재발 방지 순서로 쓰면 될까요?' },
        { who: 'lead', text: '좋아요. 타임라인은 분 단위로 적어 둬요.' },
      ],
      [
        { who: 'lead', text: '다음 달 팀 워크숍 장소 투표 올렸어요. 꼭 눌러 줘요.' },
        { who: 'me', text: '바다 쪽에 한 표 할게요.' },
        { who: 'lead', text: '니콜라스는 벌써 바다에 세 번 눌렀더라고요. 한 번만 반영돼요.' },
      ],
      [
        { who: 'lead', text: '고객이 "무조건 가장 안전하게"라고 하면 뭐부터 물어봐요?' },
        { who: 'me', text: '예산이랑, 서비스가 멈춰도 괜찮은 시간이요.' },
        { who: 'lead', text: '정답. 안전에도 가격이 있다는 걸 고객과 같이 정해야 해요.' },
      ],
    ],
    react: {
      like: ['…이거 어떻게 알았어요? 진짜 좋아하는 거예요. 고마워요.', '취향을 정확히 짚었네요. 고객 요구사항만 잘 파악하는 게 아니었군요.'],
      normal: ['고마워요. 잘 먹을게요.', '신경 써 줘서 고마워요. 덕분에 오후도 힘내겠네요.'],
      dislike: ['고마워요. 그런데 카페인은 커피로 충분해서요… 팀원들이랑 나눌게요.', '마음은 고마워요. 그런데 이건 니콜라스가 더 좋아하겠는데요.'],
    },
    special: {
      americano: '딱 한 잔 생각나던 참이었어요. 제 커피 취향까지 챙기다니, 고마워요.',
      beans: '향 좋다… 내일 아침에 이걸로 팀 전체 커피 내릴게요. 첫 잔은 당신 거예요.',
      dessert: '디저트까지요? 커피랑 먹으면 딱이겠네요. 오후 회의 전에 같이 먹어요. 커피는 제가 내릴게요.',
    },
    episodes: [
      {
        id: 'lead-1',
        need: 50,
        title: '마감 전날의 커피',
        topic: '회사 일상',
        scene: 'office',
        reward: { id: 'ep_lead1', name: '마감 전날 밤의 커피 사진', art: 'ep_lead1', kind: '사진' },
        lines: [
          { who: 'narr', text: '제안서 마감 전날 밤 9시. 탕비실에서 "삑" 하는 전자저울 소리가 났다.' },
          { who: 'lead', text: '아직 있었어요? 잠깐 쉬어요. 커피 내려 줄게요.' },
          { who: 'narr', text: '케이 팀장은 저울과 온도계, 타이머를 일렬로 세워 두었다.' },
          { who: 'lead', text: '원두 15그램, 물 92도, 뜸 30초. 이 레시피는 제안서보다 오래 걸려서 만들었어요.' },
          {
            choice: [
              {
                label: '저울까지 쓰세요?',
                lines: [
                  { who: 'lead', text: '매일 같은 맛이 나야 하니까요. 다시 해서 같은 결과가 안 나오면 그건 운이지 실력이 아니에요. 장애 대응도 똑같고요.' },
                ],
              },
              {
                label: '그냥 믹스커피도 좋은데요',
                lines: [
                  { who: 'narr', text: '팀장님의 손이 잠시 멈췄다.' },
                  { who: 'lead', text: '…못 들은 걸로 할게요. 오늘 한 잔 마셔 보면 생각이 바뀔 거예요.' },
                ],
              },
            ],
          },
          { who: 'lead', text: '자, 마셔 봐요. 마감 전날이라 조금 진하게 내렸어요.' },
          { who: 'me', text: '…맛있어요. 쓴데 끝이 달아요.' },
          { who: 'lead', text: '좋은 원두는 그래요. 좋은 설계도 처음엔 비싸 보여도 나중에 덜 아프고요.' },
          { who: 'narr', text: '그때 니콜라스가 탕비실 문을 열었다.' },
          { who: 'peer', text: '팀장님, 저도 한 잔이요! 시럽 세 번이요!' },
          { who: 'lead', text: '…니콜라스는 내일 아침 회의 때 원두 산지 설명 20분 듣는 걸로 해요.' },
          { who: 'peer', text: '그건 벌칙이잖아요!' },
          {
            choice: [
              {
                label: '내일 발표 같이 준비해요',
                lines: [
                  { who: 'lead', text: '좋아요. 앞부분은 당신이 맡아 봐요. 충분히 할 수 있어요.' },
                ],
              },
              {
                label: '원두 설명, 저는 궁금해요',
                lines: [
                  { who: 'lead', text: '역시 우리 팀에 사람이 있었네요. 20분 말고 40분으로 늘릴게요.' },
                  { who: 'peer', text: '동기야, 왜 그래…' },
                ],
              },
            ],
          },
          { who: 'narr', text: '그날 밤, 커피잔 세 개가 나란히 놓인 사진이 팀 채팅방에 올라왔다.' },
        ],
      },
      {
        id: 'lead-2',
        need: 150,
        title: '새벽 3시의 장애',
        topic: '신입 시절 실수담',
        scene: 'office',
        reward: { id: 'ep_lead2', name: '장애 회고 체크리스트 액자', art: 'ep_lead2', kind: '액자' },
        lines: [
          { who: 'me', text: '팀장님은 신입 때 실수한 적 있어요?' },
          { who: 'lead', text: '많죠. 제일 유명한 건 "새벽 3시의 결제 장애"예요.' },
          { who: 'lead', text: '입사 2년 차였어요. 쇼핑몰 DB 서버 디스크가 꽉 차서 결제가 전부 멈췄어요.' },
          { who: 'lead', text: '경고 메일은 와 있었어요. 그런데 그때는 경고가 하루에 수백 통이라, 다들 읽지 않고 넘겼죠.' },
          {
            choice: [
              {
                label: '그래서 어떻게 살리셨어요?',
                lines: [
                  { who: 'lead', text: '오래된 로그를 지우고 백업에서 복구하는 데 네 시간 걸렸어요. 복구 절차를 연습해 본 적이 없었거든요.' },
                  { who: 'lead', text: '우리 팀이 분기마다 복구 연습을 하는 이유예요.' },
                ],
              },
              {
                label: '고객사에 많이 혼나셨겠어요',
                lines: [
                  { who: 'lead', text: '아침 9시에 대표님 앞에서 고개를 못 들었죠. 그런데 그날 회고에서 당시 팀장님이 이렇게 말했어요.' },
                  { who: 'lead', text: '"누가 실수했는지 말고, 구조가 왜 그걸 막지 못했는지 찾자."' },
                ],
              },
            ],
          },
          { who: 'lead', text: '그 뒤로 설계할 때마다 세 가지를 물어요. 이게 멈추면 무엇이 같이 멈추지? 몇 분 안에 되살릴 수 있지? 경고는 사람이 정말 보게 되나?' },
          { who: 'lead', text: '당신이라면 그 DB를 지금 어떻게 바꾸겠어요?' },
          {
            choice: [
              {
                label: 'Multi-AZ로 대기 DB를 둬요',
                lines: [
                  { who: 'lead', text: '맞아요. 한쪽이 멈추면 다른 가용 영역의 대기 DB가 자동으로 이어받아요.' },
                ],
              },
              {
                label: '서버를 더 큰 걸로 바꿔요',
                lines: [
                  { who: 'lead', text: '여유는 생기죠. 그런데 한 대뿐이면 그 한 대가 멈출 때 똑같이 멈춰요. 그래서 저는 먼저 둘로 나눠요. 다른 가용 영역에 대기 DB를 두는 식으로요.' },
                ],
              },
            ],
          },
          { who: 'lead', text: '경고도 줄였어요. 꼭 필요한 것만 남기고, 그건 CloudWatch 경보로 문자까지 오게요. 경고가 많으면 아무도 안 봐요.' },
          { who: 'narr', text: '그 주 금요일, 팀 위키의 "장애 회고 체크리스트"가 액자에 담겨 사무실 벽에 걸렸다.' },
          { who: 'lead', text: '진짜 장애가 나면 혼자 끙끙대지 말고 바로 연락해요. 새벽이어도요. 팀장은 그러라고 있는 거예요.' },
        ],
      },
      {
        id: 'lead-3',
        need: 300,
        title: '팀장의 설계 노트',
        topic: '팀의 성장',
        scene: 'meeting',
        reward: { id: 'ep_lead3', name: '케이의 설계 노트', art: 'ep_lead3', kind: '소품' },
        lines: [
          { who: 'narr', text: '분기 회고가 끝난 회의실. 케이 팀장이 낡은 노트 한 권을 꺼냈다.' },
          { who: 'lead', text: '신입 때부터 쓴 설계 노트예요. 프로젝트마다 구성도랑 실패한 이유를 적어 뒀어요.' },
          { who: 'me', text: '여기 "NAT 게이트웨이 AZ마다!!!"는요?' },
          { who: 'lead', text: '하나만 뒀다가 그 AZ가 멈춰서, 다른 AZ 서버들까지 업데이트를 못 받은 날이에요. 느낌표 세 개는 그날의 분노예요.' },
          { who: 'narr', text: '몇 장을 넘기자 원두 산지별 맛 비교표가 나왔다.' },
          { who: 'lead', text: '아, 그건 원두 기록이에요. 커피 얘기만 나오면 노트 정리가 안 되더라고요.' },
          {
            choice: [
              {
                label: '원두 기록도 궁금한데요',
                lines: [
                  { who: 'lead', text: '다음 회식 때 강의해 줄게요. 두 시간짜리예요.' },
                  { who: 'narr', text: '옆자리 니콜라스가 조용히 고개를 저었다.' },
                ],
              },
              {
                label: '실패 기록이 교과서보다 좋네요',
                lines: [
                  { who: 'lead', text: '성공한 구성은 금방 잊어요. 실패한 이유가 다음 설계를 지켜 주고요.' },
                ],
              },
            ],
          },
          { who: 'lead', text: '이 노트, 이제 당신이 이어서 써 줬으면 해요. 다음 분기 공공 프로젝트 PM으로 당신을 올렸어요.' },
          { who: 'lead', text: '처음엔 퍼블릭과 프라이빗 서브넷도 헷갈리던 사람이 이제 장애 시나리오부터 물어요. 변의주 선배도, 니콜라스도 같이 커 왔고요.' },
          {
            choice: [
              {
                label: '솔직히 아직 자신이 없어요',
                lines: [
                  { who: 'lead', text: '자신은 일을 하면서 생겨요. 처음부터 있는 사람은 없어요. 막히면 우리 셋이 있잖아요.' },
                ],
              },
              {
                label: '맡겨 주세요, 열심히 할게요!',
                lines: [
                  { who: 'lead', text: '좋아요. 대신 하나만 약속해요. 무리할 땐 무리한다고 말하기.' },
                ],
              },
            ],
          },
          { who: 'lead', text: '저는 옆에서 커피 내리고 있을게요. 막히면 언제든 와요. 원두 설명은 짧게 할게요.' },
          { who: 'narr', text: '노트 첫 장에 새 글씨가 한 줄 적혀 있었다. "다음 아키텍트에게. 구조를 믿고, 사람을 아껴요."' },
        ],
      },
    ],
  },
  {
    id: 'senior',
    quirk: '패킷 경로는 다 아는데 정작 본인은 길치예요. 매운 음식을 못 먹고, 창가 다육이에게 서비스 이름을 붙여 줘요.',
    specialty: '네트워크 · 보안',
    hint: '말수는 적지만 늘 옆에서 챙겨 줘요. 따뜻한 차와 귤, 커피에 곁들이는 디저트를 좋아해요.',
    likes: ['tea', 'tangerine', 'dessert'],
    dislikes: ['energy'],
    greet: [
      '아, 왔어요? 천천히 말해 줘요. 같이 보면 금방 풀릴 거예요.',
      '어제 그 구성도 다시 봤어요. 많이 늘었더라고요.',
      '오늘 하나 같이 공부해 볼래요? 저도 아직 헷갈리는 부분이 있어서요.',
      '요즘은 당신이랑 같이 설계하는 시간이 제일 든든해요. 우리 둘 다 많이 컸죠.',
    ],
    talks: [
      [
        { who: 'senior', text: '보안 그룹에 0.0.0.0/0으로 열어 둔 규칙 있으면 같이 봐요.' },
        { who: 'me', text: 'SSH 하나 열어 둔 게 있어요…' },
        { who: 'senior', text: 'Session Manager로 접속하면 22번은 닫아도 돼요. 오늘 같이 바꿔요.' },
      ],
      [
        { who: 'senior', text: '서브넷 IP 계산은 이제 익숙해졌어요?' },
        { who: 'me', text: '/24면 256개, AWS가 5개를 예약해서 251개요.' },
        { who: 'senior', text: '완벽해요. 처음엔 저도 손가락으로 셌어요.' },
      ],
      [
        { who: 'senior', text: '점심 먹고 잠깐 걸을래요? 오늘 하늘이 맑아요.' },
        { who: 'me', text: '좋아요. 남산 타워 보이는 쪽으로요.' },
        { who: 'senior', text: '걸으면서 VPC 피어링이랑 Transit Gateway 차이 얘기해 줄게요. 생각보다 재밌어요.' },
      ],
      [
        { who: 'senior', text: '고객사 방화벽 담당자가 우리 출발지 IP 목록을 달래요. NAT 게이트웨이 IP 확인해 줄래요?' },
        { who: 'me', text: 'AZ마다 하나씩이라 탄력적 IP가 두 개예요.' },
        { who: 'senior', text: '고마워요. 이렇게 꼼꼼하게 챙겨 주는 게 제일 큰 도움이에요.' },
      ],
      [
        { who: 'senior', text: '요즘 공부하는 거 있어요?' },
        { who: 'me', text: 'S3 스토리지 클래스 외우고 있어요.' },
        { who: 'senior', text: '외우기보다 "얼마나 자주 꺼내 보나"로 정리해 봐요. 그러면 안 헷갈려요.' },
      ],
      [
        { who: 'senior', text: '창가 다육이 "오로라"가 새잎을 냈어요.' },
        { who: 'me', text: '축하해요! 이름처럼 복제본이 생긴 건가요?' },
        { who: 'senior', text: '…그런 셈이죠. 옆에 작은 잎이 하나 더 났거든요.' },
      ],
    ],
    react: {
      like: ['…고마워요. 이런 거 받으면 저도 더 잘하고 싶어져요.', '기억해 줬네요. 조용히, 오래 아끼면서 쓸게요.'],
      normal: ['고마워요. 같이 먹어요.', '이런 거 안 챙겨도 괜찮은데… 그래도 기분 좋네요. 고마워요.'],
      dislike: ['고마워요. 그런데 카페인이 많으면 밤에 잠을 잘 못 자서요… 마음만 감사히 받을게요.', '고마워요. 이건 니콜라스가 보면 엄청 좋아하겠다. 같이 나눠 줘도 될까요?'],
    },
    special: {
      plant: '다육이네요. 천천히 자라는 게 꼭 우리 같아요. 창가에 두고, 같이 크는 거 지켜볼게요.',
      book: '이 책, 읽고 싶었어요. 다 읽으면 빌려줄게요. 그다음에 같이 이야기해요.',
      tangerine: '귤… 고마워요. 겨울엔 이게 제일 좋아요. 하나 까 줄게요, 같이 먹어요.',
      tea: '허브티네요. 오후에 이거 한 잔이면 머리가 맑아져요. 같이 한 잔 해요.',
      dessert: '디저트까지요? 회의 끝나고 다 같이 나눠 먹어요. 팀장님 커피랑 잘 어울리겠다.',
    },
    episodes: [
      {
        id: 'senior-1',
        need: 50,
        title: '라우팅 전문가의 점심 산책',
        topic: '동료의 취미',
        scene: 'lounge',
        reward: { id: 'ep_senior1', name: '점심 산책길 사진', art: 'ep_senior1', kind: '사진' },
        lines: [
          { who: 'narr', text: '점심시간. 변의주 선배가 산책을 가자고 했다.' },
          { who: 'senior', text: '전 점심엔 꼭 걸어요. 오전 내내 모니터링 알림을 보다 보면 머리가 시끄러워서요.' },
          { who: 'senior', text: '새로 생긴 샐러드 가게에 가 볼래요? 지름길을 알아요.' },
          { who: 'narr', text: '20분 뒤. 둘은 처음 보는 골목 앞에 서 있었다.' },
          { who: 'me', text: '선배… 여기 아까 지나온 곳 같은데요.' },
          { who: 'senior', text: '…고백할게요. 저 길치예요. 패킷이 어디로 가는지는 다 아는데, 제가 어디로 가는지는 몰라요.' },
          {
            choice: [
              {
                label: '지도 앱을 켜 볼게요',
                lines: [
                  { who: 'narr', text: '지도 앱을 켜 보니, 정반대 방향이었다.' },
                  { who: 'senior', text: '역시 경로는 눈으로 확인해야 하네요. 감으로 가면 블랙홀로 빠져요.' },
                ],
              },
              {
                label: '오늘은 감으로 가 봐요',
                lines: [
                  { who: 'narr', text: '10분을 더 헤맨 끝에, 둘은 회사 정문 앞으로 돌아왔다.' },
                  { who: 'senior', text: '…루프가 생겼네요. 그래도 점심시간이 끝나기 전에 돌아왔으니 다행이에요.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '결국 둘은 회사 1층 편의점에서 샌드위치를 샀다.' },
          { who: 'senior', text: '미안해요. 대신 좋은 거 보여 줄게요.' },
          { who: 'narr', text: '선배의 휴대폰 사진첩은 창가 다육이 사진으로 가득했다.' },
          { who: 'senior', text: '이건 "람다", 이건 "S3", 제일 큰 애는 "오로라"예요. 물을 자주 주면 오히려 죽어요.' },
          { who: 'senior', text: '알림도 똑같아요. 많이 울린다고 안전한 게 아니라, 꼭 필요할 때만 울려야 사람들이 봐요.' },
          {
            choice: [
              {
                label: '저도 하나 키울래요. 이름은 "NAT"!',
                lines: [
                  { who: 'senior', text: '좋네요. 밖으로는 잘 나가는데 안으로는 아무도 못 들어오는 애로 키워요.' },
                ],
              },
              {
                label: '이름 짓는 규칙이 확실하네요',
                lines: [
                  { who: 'senior', text: '일관성은 운영의 기본이에요. 다음 애는 "CloudFront"로 할 거예요. 창문에서 제일 가까운 자리에 둘 거라서요.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '다음 날, 선배 책상에 "회사에서 샐러드 가게까지" 손그림 지도가 붙어 있었다. 화살표가 세 번 꺾여 있었다.' },
        ],
      },
      {
        id: 'senior-2',
        need: 150,
        title: '선배의 오답 노트',
        topic: '신입 시절',
        scene: 'office',
        reward: { id: 'ep_senior2', name: '선배의 오답 노트', art: 'ep_senior2', kind: '소품' },
        lines: [
          { who: 'me', text: '선배, AWS 자격증 문제를 자꾸 비슷하게 틀려요.' },
          { who: 'senior', text: '혹시 "가장 비용 효율적인" 같은 문제요? 보기가 다 맞는 말 같은데 답은 하나뿐인.' },
          { who: 'senior', text: '…잠깐만요. 이거 보여 줄게요. 제 오답 노트예요.' },
          { who: 'narr', text: '빛바랜 노트에 틀린 문제와 이유가 빼곡했다. 표지에는 다육이 스티커가 붙어 있었다.' },
          { who: 'senior', text: '사실 전 솔루션스 아키텍트 시험에 한 번 떨어졌어요. 다들 한 번에 붙은 줄 알지만요.' },
          { who: 'senior', text: '시험 전날 긴장을 풀려고 매운 떡볶이를 먹었거든요. 전 매운 걸 못 먹어요. 시험 내내 물만 마셨어요.' },
          {
            choice: [
              {
                label: '떡볶이 때문에 떨어지신 거예요?',
                lines: [
                  { who: 'senior', text: '근본 원인은 아니에요. 진짜 원인은 문제를 끝까지 안 읽은 거예요. 떡볶이는 기여 요인 정도였고요.' },
                ],
              },
              {
                label: '두 번째엔 어떻게 붙으셨어요?',
                lines: [
                  { who: 'senior', text: '순한 김밥을 먹었어요. 그리고 문제를 읽는 방법을 바꿨어요.' },
                ],
              },
            ],
          },
          { who: 'senior', text: '문제는 기술보다 "조건"을 물어요. 비용, 운영 부담, 가용성 중에 무엇을 제일 중요하게 보는지요.' },
          { who: 'senior', text: '그래서 조건에 밑줄부터 그어요. 하나 같이 해 볼래요? "운영 부담을 최소로, 트래픽이 들쭉날쭉한 API." 뭐가 떠올라요?' },
          {
            choice: [
              {
                label: 'Lambda와 API Gateway',
                lines: [
                  { who: 'senior', text: '정답. "운영 부담 최소"에 밑줄을 그으면, 서버를 직접 돌보는 보기부터 지울 수 있어요.' },
                ],
              },
              {
                label: 'EC2를 넉넉하게 여러 대',
                lines: [
                  { who: 'senior', text: '안전하긴 해요. 그런데 밑줄 친 조건이 "운영 부담 최소"였죠. 서버를 직접 돌보는 보기는 빠지고, Lambda와 API Gateway가 남아요.' },
                ],
              },
            ],
          },
          { who: 'senior', text: '고객 요구사항을 읽을 때도 똑같아요. 이 노트 빌려줄게요. 대신 합격하면 축하 간식은 당신이 사요.' },
          { who: 'senior', text: '…안 매운 걸로요.' },
        ],
      },
      {
        id: 'senior-3',
        need: 300,
        title: '화이트보드 앞에서',
        topic: '프로젝트 경험',
        scene: 'meeting',
        reward: { id: 'ep_senior3', name: '첫 공동 발표 기념 액자', art: 'ep_senior3', kind: '액자' },
        lines: [
          { who: 'narr', text: '고객 발표 전날 밤. 둘은 회의실 화이트보드에 구성도를 다시 그리고 있었다.' },
          { who: 'senior', text: '여기 SQS를 넣을지 말지, 아까부터 계속 고민이에요.' },
          {
            choice: [
              {
                label: '넣어요. 주문이 몰려도 큐가 받아 둬요',
                lines: [
                  { who: 'senior', text: '…그 한 문장이면 고객이 바로 이해하겠네요. 처리 서버가 못 따라가도 요청이 사라지지 않으니까요.' },
                ],
              },
              {
                label: '주문을 잃는 비용이 더 커요',
                lines: [
                  { who: 'senior', text: '좋아요. 큐 요금은 요청 수만큼이라 크지 않죠. 기술보다 숫자로 설득하는 게 고객사엔 더 잘 통해요.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '그때 회의실 불이 꺼졌다. 밤 10시, 절전 모드였다.' },
          { who: 'senior', text: '…센서가 우리를 못 봤나 봐요. 손을 흔들어요.' },
          { who: 'narr', text: '둘은 어둠 속에서 열심히 팔을 흔들었다. 불이 켜지자, 문 앞에 니콜라스가 서 있었다.' },
          { who: 'peer', text: '뭐 해요? 둘이 댄스 연습?' },
          { who: 'senior', text: '…절전 센서와 협상 중이었어요.' },
          { who: 'peer', text: '야식 사 왔어요! 떡볶이랑… 선배는 매운 거 못 드시니까 김밥도요.' },
          { who: 'senior', text: '처음 왔을 때 당신은 서비스 이름 외우느라 바빴어요. 지금은 왜 필요한지부터 말해요. 그게 제일 어려운 건데.' },
          { who: 'senior', text: '내일 발표는 같이 해요. 배경 설명은 제가, 설계는 당신이.' },
          {
            choice: [
              {
                label: '떨리는데요…',
                lines: [
                  { who: 'senior', text: '떨리면 화이트보드를 봐요. 우리가 같이 그린 거니까요.' },
                ],
              },
              {
                label: '맡겨 주세요. 큐는 번호표로 설명할게요',
                lines: [
                  { who: 'peer', text: '그거 내 비유인데! 출처 표기 부탁해.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '다음 날, 고객은 첫 질문으로 "이 구성은 누가 설계했나요?"라고 물었다. 선배가 웃으며 당신을 가리켰다.' },
          { who: 'narr', text: '발표가 끝나고 팀장님이 사진 한 장을 액자에 넣어 선물했다. 화이트보드 앞에 선 두 사람의 모습이었다.' },
        ],
      },
    ],
  },
  {
    id: 'peer',
    quirk: '뭐든 자동화하지만 자기 알람은 못 맞춰요. 고기라면 부위별로 줄줄 꿰는 고기 마니아인데, 직접 한 요리는 종종 장애 상황이에요.',
    specialty: '서버리스 · 자동화',
    hint: '고기라면 뭐든 좋아하고, 회식 장소는 늘 니콜라스가 골라요. 쓴 커피는 질색이래요.',
    likes: ['snack', 'sports', 'chicken'],
    dislikes: ['americano'],
    greet: [
      '어, 동기! 뭐 필요한 거 있어?',
      '왔어? 나 방금 퀴즈 하나 맞혔다. 칭찬해 줘.',
      '오늘 점심 뭐 먹을래? 네가 골라.',
      '내 최고의 동기 왔다! 오늘도 같이 달리자.',
    ],
    talks: [
      [
        { who: 'peer', text: '동기야, Lambda 콜드 스타트 줄이는 법 알아?' },
        { who: 'me', text: '프로비저닝된 동시성 쓰면 되잖아.' },
        { who: 'peer', text: '오, 바로 나오네. 오늘 음료는 내가 산다. 스포츠음료로.' },
      ],
      [
        { who: 'peer', text: '배포 스크립트 하나 만들었는데 봐 줄래? 버튼 하나면 다 올라가.' },
        { who: 'me', text: '롤백은 돼?' },
        { who: 'peer', text: '…롤백. 지금 바로 추가할게.' },
      ],
      [
        { who: 'peer', text: '점심에 헬스장 갔다가 EventBridge 스케줄 아이디어가 떠올랐어.' },
        { who: 'me', text: '운동하다가?' },
        { who: 'peer', text: '응. 스쿼트 세면서 cron 식을 세니까 머리에 쏙 들어오더라.' },
      ],
      [
        { who: 'peer', text: '어제 고객 미팅에서 내가 SQS 설명했는데 다들 고개 끄덕였어!' },
        { who: 'me', text: '어떻게 설명했는데?' },
        { who: 'peer', text: '대기 번호표라고 했지. 번호표를 뽑아 두면 손님이 몰려도 순서대로 처리되잖아.' },
      ],
      [
        { who: 'peer', text: '이번 주 수요일 스터디 주제 정했어. "장애 났을 때 제일 먼저 볼 지표".' },
        { who: 'me', text: '난 ALB 5xx 오류부터 볼래.' },
        { who: 'peer', text: '좋아, 나는 Lambda 오류율. 지는 사람이 간식 쏘기!' },
      ],
      [
        { who: 'peer', text: '워크숍 바다로 가면 서핑 배울 거야.' },
        { who: 'me', text: '넘어지면?' },
        { who: 'peer', text: '재시도하면 되지. 지수 백오프로 천천히 일어나기.' },
      ],
    ],
    react: {
      like: ['헐, 대박! 이거 완전 내 취향이잖아. 너 나 너무 잘 알아.', '진짜? 이걸 나한테? 오늘 운동 두 배로 한다!'],
      normal: ['오, 고마워! 잘 먹을게!', '와, 나 이거 먹어도 돼? 고맙다 동기야.'],
      dislike: ['아… 고마워. 근데 나 쓴 커피 못 마시는 거 알지? 시럽 세 번 넣어서 마실게!', '하하, 마음은 너무 고마운데 아메리카노는 팀장님 취향 아니야?'],
    },
    special: {
      snack: '간식 꾸러미다! 오후 3시 당 충전 완료. 너 먼저 하나 골라.',
      sports: '운동 끝나고 이거 하나면 완벽하지. 내일 아침 러닝 같이 갈래? 내가 페이스 맞춰 줄게!',
      chicken: '치킨?! 오늘 저녁은 이거다. 혼자는 못 먹어, 같이 가자. 운동은… 내일 두 배로!',
    },
    episodes: [
      {
        id: 'peer-1',
        need: 50,
        title: '점심 메뉴 봇',
        topic: '회사 일상',
        scene: 'office',
        reward: { id: 'ep_peer1', name: '점심 봇의 첫 국밥 사진', art: 'ep_peer1', kind: '사진' },
        lines: [
          { who: 'narr', text: '오전 11시 50분. 팀 채팅방에 새 봇이 들어왔다. 이름은 "오늘 뭐 먹지".' },
          { who: 'peer', text: '점심 메뉴 고르는 데 매일 10분씩 쓰잖아. 그래서 만들었어. 버튼만 누르면 메뉴를 골라 줘.' },
          { who: 'lead', text: '좋네요. 의사결정 자동화. 제가 먼저 눌러 볼게요.' },
          { who: 'narr', text: '봇의 답: "삼겹살".' },
          { who: 'senior', text: '저도 눌러 볼게요.' },
          { who: 'narr', text: '봇의 답: "삼겹살". 세 번째는 "갈비", 네 번째는 다시 "삼겹살"이었다.' },
          {
            choice: [
              {
                label: '설정값 좀 보여 줘',
                lines: [
                  { who: 'peer', text: '…고기 90, 나머지 10. 테스트하다가 그대로 배포했어.' },
                  { who: 'lead', text: '테스트 값이 그대로 운영에 들어가는 거, 실무에서 제일 흔한 사고죠.' },
                ],
              },
              {
                label: '오늘은 봇 말대로 가 보자',
                lines: [
                  { who: 'narr', text: '팀 전원이 점심부터 삼겹살을 구웠다. 니콜라스만 신이 났다.' },
                  { who: 'senior', text: '…오후 회의 때 옷에서 고기 냄새 나겠어요. 내일은 제가 고를게요.' },
                ],
              },
            ],
          },
          { who: 'peer', text: '알겠어요, 공평하게 고칠게요. 대신 기능 하나만 추가할게요.' },
          { who: 'peer', text: '매운 음식은 선배한테 안 나오게, 핸드드립 카페는 팀장님한테 먼저 나오게.' },
          { who: 'senior', text: '그건… 좀 고마운데요.' },
          { who: 'lead', text: '개인화 추천이네요. 다음 프로젝트 추천 기능은 니콜라스한테 맡겨야겠어요.' },
          {
            choice: [
              {
                label: '나는 완전 랜덤으로 해 줘',
                lines: [
                  { who: 'peer', text: '진짜 랜덤으로 할게. 약속해. …고기 확률은 20%까지만 남겨 두고.' },
                ],
              },
              {
                label: '봇 이름부터 바꾸자',
                lines: [
                  { who: 'peer', text: '후보 받을게. "람다 밥상"? "점심 오토스케일링"?' },
                  { who: 'senior', text: '두 번째요. 배고픈 사람이 늘면 메뉴도 늘어나야죠.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '다음 날 점심, 봇은 처음으로 "국밥"을 골랐다. 국밥집 앞에서 찍은 팀 사진이 채팅방에 올라왔다.' },
        ],
      },
      {
        id: 'peer-2',
        need: 150,
        title: '자동화의 함정',
        topic: '실수담',
        scene: 'office',
        reward: { id: 'ep_peer2', name: '"수요일의 장애 조치" 스터디 배지', art: 'ep_peer2', kind: '소품' },
        lines: [
          { who: 'narr', text: '월요일 아침. 개발 서버가 전부 꺼져 있었다.' },
          { who: 'lead', text: '어? 개발 서버가 왜 다 멈췄죠?' },
          { who: 'peer', text: '…제가 그랬어요. 비용 아끼려고 "밤 10시에 개발 서버 끄기" 자동화를 만들었거든요.' },
          { who: 'peer', text: '그런데 시간을 UTC로 넣어서… 한국 시간으로 아침 7시에 꺼지게 됐어요.' },
          { who: 'lead', text: '비용 절감 아이디어는 좋아요. 시간대만 빼고요.' },
          { who: 'narr', text: '서버는 금방 다시 켜졌지만, 니콜라스는 퇴근 시간이 지나도록 자리에 앉아 있었다.' },
          { who: 'peer', text: '요즘 나만 제자리인 것 같아. 너는 설계로 칭찬받는데, 나는 서버나 끄고.' },
          {
            choice: [
              {
                label: '나도 NAT 문제 세 번 연속 틀렸어',
                lines: [
                  { who: 'peer', text: '진짜? 너는 원래 잘하는 줄 알았는데.' },
                ],
              },
              {
                label: '배포 버튼이랑 비용 보고서, 다 네 덕분이야',
                lines: [
                  { who: 'peer', text: '…그건 그렇지. 그 비용 보고서 팀장님이 제일 좋아하셔.' },
                ],
              },
            ],
          },
          { who: 'me', text: '그리고 넌 고객 응대를 정말 잘하잖아. 매주 수요일에 같이 장애 시나리오 풀고, 나한테 응대 비법 알려 줘.' },
          { who: 'peer', text: '스터디? 좋아. 이름은 "수요일의 장애 조치".' },
          {
            choice: [
              {
                label: '첫 주제는 시간대 설정이야',
                lines: [
                  { who: 'peer', text: '너무하네. …근데 맞는 말이라 반박을 못 하겠다. "EventBridge 스케줄은 시간대를 꼭 지정하기." 메모했어.' },
                ],
              },
              {
                label: '스터디 배지도 만들자',
                lines: [
                  { who: 'peer', text: '좋아, 디자인은 내가 할게. 핑크랑 파랑 반반으로.' },
                ],
              },
            ],
          },
          { who: 'peer', text: '고마워, 동기야. 너 없었으면 오늘 혼자 에너지 드링크 세 캔 마셨을 거야.' },
        ],
      },
      {
        id: 'peer-3',
        need: 300,
        title: '둘만의 해커톤',
        topic: '팀의 성장',
        scene: 'office',
        reward: { id: 'ep_peer3', name: '해커톤 배포 인증서', art: 'ep_peer3', kind: '액자' },
        lines: [
          { who: 'narr', text: '주말 오전, 텅 빈 사무실. 니콜라스가 노트북 두 대를 펼쳐 놓았다.' },
          { who: 'peer', text: '왔다! 오늘 우리끼리 해커톤 하자. 주제는… 신입들이 클라우드를 게임처럼 배우는 앱!' },
          { who: 'peer', text: '고객 프로젝트를 받아서 구성도를 그리고, 장애 시뮬레이션을 돌리는 거야. 통과하면 골드도 주고!' },
          { who: 'me', text: '…어디서 많이 본 것 같은데.' },
          { who: 'peer', text: '모은 골드로 동료들이랑 간식도 나누는 거지. 에너지 드링크라든가.' },
          {
            choice: [
              {
                label: '에너지 드링크는 너만 좋아하잖아',
                lines: [
                  { who: 'peer', text: '그러니까 넣어야지! 개발자 특권이야.' },
                ],
              },
              {
                label: '팀장님 원두도 넣자',
                lines: [
                  { who: 'peer', text: '오, 센스 있다. 안 넣으면 원두 설명 40분 들어야 할 거야. 제일 비싸게 해 두자.' },
                ],
              },
            ],
          },
          { who: 'narr', text: '점심때가 되자 니콜라스가 직접 만든 도시락을 꺼냈다.' },
          { who: 'peer', text: '내가 만든 스테이크 덮밥이야. 먹어 봐.' },
          { who: 'me', text: '…이거 왜 파란색이야?' },
          { who: 'peer', text: '블루베리 소스야. 고기엔 과일 소스랬어! 맛은 장애 상황이지만 고기는 고가용성이야.' },
          { who: 'narr', text: '둘은 결국 배달 앱을 열었다. 오후 내내 화면을 설계하고, 정적 파일을 S3에 올리고, CloudFront를 붙였다.' },
          { who: 'peer', text: '배포 완료! 봐, 휴대폰에서도 열린다. 우리가 만든 거야.' },
          {
            choice: [
              {
                label: '"VPC가 뭐야?" 하던 게 엊그제 같은데',
                lines: [
                  { who: 'peer', text: '너도 그때 "IGW가 무슨 약자야?" 했거든. 우리 진짜 많이 컸다.' },
                ],
              },
              {
                label: '월요일에 팀에 보여 드리자',
                lines: [
                  { who: 'peer', text: '좋아. 선배 다육이도 게임에 넣어야겠다. 마지막 보스는 "오로라"!' },
                ],
              },
            ],
          },
          { who: 'peer', text: '앞으로도 계속 같이 하자. 팀장이 돼도, 선배가 돼도. 동기는 영원한 이중화니까.' },
          { who: 'narr', text: '월요일 아침, "해커톤 배포 인증서"가 액자에 담겨 사무실 벽에 걸렸다. 서명 칸에는 팀 네 명의 이름이 있었다.' },
        ],
      },
    ],
  },
]

/** 케이·변의주·니콜라스의 기존 팀 사진 액자 조건. 신규 시작 팀과는 별개다. */
export const ORIGINAL_TEAM = ['lead', 'senior', 'peer']
FRIENDS.unshift(...DEFAULT_FRIENDS)
// 자리 교체 인물의 동료 정보·에피소드(friends2.ts, 자리는 cast.ts)
FRIENDS.push(...NEW_FRIENDS)

export const friend = (id: string) => FRIENDS.find((f) => f.id === id)!

export function bondOf(points: number) {
  let idx = 0
  BONDS.forEach((b, i) => {
    if (points >= b.min) idx = i
  })
  return { idx, ...BONDS[idx], next: BONDS[idx + 1]?.min ?? null }
}

export function giftPoints(f: Friend, item: GiftItem) {
  if (f.likes.includes(item.id)) return Math.round(item.points * LIKE_RATE)
  if (f.dislikes.includes(item.id)) return Math.max(1, Math.round(item.points * DISLIKE_RATE))
  return item.points
}
