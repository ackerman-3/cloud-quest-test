import type { Box, Project, Result, Scope } from '../types'
import { PROJECTS2 } from './projects2'
import { PROJECTS3 } from './projects3'
import { PROJECTS4 } from './projects4'
import { PROJECTS5 } from './projects5'

// ── 작은 도우미 ─────────────────────────────────────────────
const B = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: 'row' | 'col' = 'col'): Box => ({
  id,
  kind,
  label,
  children,
  dir,
})
const Z = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 3): Box => ({
  id,
  kind,
  label,
  zone: { scope, max },
})
const ok = (msg: string): Result => ({ ok: true, msg })
const bad = (msg: string): Result => ({ ok: false, msg })

const USERS = { id: 'users', service: 'users', zone: 'out', label: '사용자' }

// ── 신입: 쉬움 ─────────────────────────────────────────────

const p1: Project = {
  id: 'flower-shop',
  level: 1,
  title: '꽃집 온라인 주문 페이지',
  client: 'flower',
  org: '플로라 꽃방',
  summary: '작은 꽃집의 첫 온라인 주문 사이트\n퍼블릭·프라이빗 서브넷을 나누는 기본 구성',
  topics: ['VPC', '퍼블릭/프라이빗 서브넷', '인터넷 게이트웨이'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '첫 프로젝트 배정이에요. 동네 꽃집 "플로라 꽃방"이 전화 주문만 받다가 온라인 주문을 시작하고 싶대요.' },
        { who: 'lead', text: '규모는 작지만 고객 정보를 다루니까 기본기가 중요해요. 변의주 선배가 같이 봐 줄 거예요.' },
        { who: 'senior', text: '반가워요. 시작 전에 하나만 정리하죠. 오늘 설계할 VPC는 "프라이빗 클라우드"와 다른 개념이에요.' },
        { who: 'senior', text: 'VPC는 AWS 퍼블릭 클라우드 안에서 우리 계정만 쓰는 논리적으로 격리된 네트워크예요. 물리 장비는 AWS가 운영하죠.' },
        { who: 'senior', text: '프라이빗 클라우드는 한 조직 전용 인프라(사내 데이터센터 등)에 가상화·셀프서비스 같은 클라우드 방식을 구축한 거고요. 이름에 "프라이빗"이 있다고 같은 게 아니에요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'flower', text: '안녕하세요! 손님들이 휴대폰으로 꽃다발을 고르고 주문할 수 있으면 좋겠어요.' },
        { who: 'flower', text: '주문자 이름이랑 연락처가 들어가니까 그건 밖에서 함부로 못 보게 해 주세요.' },
        { who: 'flower', text: '아, 그리고 처음이라 비용은 최대한 아끼고 싶어요. 하루 주문은 많아야 수십 건이에요.' },
        { who: 'me', text: '웹 서버는 인터넷에서 접속되게, 주문 DB는 외부에서 직접 닿지 않게 나누겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '웹 서버는 인터넷에서 접속되어야 하고, 주문 DB는 인터넷에서 직접 접근되면 안 돼요. 서브넷을 어떻게 나눌까요?',
        options: [
          { id: 'a', text: '웹 서버와 DB 모두 퍼블릭 서브넷에 두고 보안 그룹으로만 막는다', why: '보안 그룹으로 막을 수는 있지만, 설정 실수 하나로 DB가 인터넷에 노출될 수 있어요. DB는 처음부터 인터넷 경로가 없는 곳에 두는 게 기본이에요.' },
          { id: 'b', text: '웹 서버는 퍼블릭 서브넷, DB는 프라이빗 서브넷에 둔다', why: '' },
          { id: 'c', text: '웹 서버와 DB 모두 프라이빗 서브넷에 둔다', why: '로드 밸런서 같은 진입점 없이 웹 서버까지 프라이빗에 두면 손님이 접속할 길이 없어요.' },
          { id: 'd', text: '웹 서버는 프라이빗 서브넷, DB는 퍼블릭 서브넷에 둔다', why: '정반대예요. 지켜야 할 DB가 인터넷 쪽에, 접속받아야 할 웹 서버가 안쪽에 놓여요.' },
        ],
        answer: 'b',
        explain:
          '퍼블릭 서브넷은 라우팅 테이블에 인터넷 게이트웨이(IGW)로 가는 경로가 있는 서브넷이에요. 웹 서버는 여기 두고, DB는 IGW 경로가 없는 프라이빗 서브넷에 둬서 웹 서버만 DB에 접근하게 합니다.',
        hint: '"퍼블릭"과 "프라이빗"을 가르는 건 인터넷 게이트웨이로 가는 경로가 있느냐예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'flower', text: '와, 테스트 주문이 바로 들어왔어요! 주문 정보는 안쪽에 따로 보관된다니 마음이 놓이네요.' },
        { who: 'flower', text: '어버이날에 주문이 몰리면 또 연락드릴게요. 정말 감사합니다!' },
        { who: 'lead', text: '첫 제안 깔끔했어요. 다음에는 서버가 하나 멈춰도 버티는 구성을 해 봅시다.' },
      ],
    },
  ],
  design: {
    brief: ['손님이 인터넷에서 주문 페이지에 접속', '주문 DB는 인터넷에서 직접 접근 불가', '비용 최소화 (하루 수십 건)'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울 (ap-northeast-2)', [
          B('vpc', 'vpc', 'VPC 10.0.0.0/16', [
            Z('vpcEdge', 'gate', 'VPC 경계 · 게이트웨이', 'vpcEdge', 2),
            B('azA', 'az', '가용 영역 A', [
              Z('pub', 'public', '퍼블릭 서브넷 10.0.1.0/24', 'subnet'),
              Z('priv', 'private', '프라이빗 서브넷 10.0.2.0/24', 'subnet'),
            ]),
          ]),
        ]),
      ]),
    ]),
    fixed: [USERS],
    palette: ['igw', 'ec2', 'rds', 'alb', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'igw', zone: 'vpcEdge' },
        { id: 'a2', service: 'ec2', zone: 'pub' },
        { id: 'a3', service: 'rds', zone: 'priv' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      '사용자 → 인터넷 게이트웨이 → 퍼블릭 서브넷의 EC2 → 프라이빗 서브넷의 RDS 순서로 연결합니다.',
      '퍼블릭 서브넷에 있어도 EC2에 퍼블릭 IP(또는 탄력적 IP)가 있어야 인터넷과 통신해요. 인터넷 게이트웨이가 퍼블릭 IP ↔ 프라이빗 IP 변환을 맡아요.',
      'ALB와 NAT 게이트웨이는 시간당 요금이 붙어요. 서버 한 대짜리 작은 사이트에는 아직 필요 없습니다.',
      '실제 구축 시 RDS는 단일 AZ 배포라도 DB 서브넷 그룹에 2개 이상 AZ의 서브넷을 등록해야 해요. 여기서는 그림을 단순화했습니다.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🛒',
      title: '손님 주문 접수',
      desc: '손님이 휴대폰으로 꽃다발을 주문합니다.',
      check: (c) => {
        if (!c.has('igw')) return bad('인터넷 게이트웨이가 없어 VPC가 인터넷과 연결되지 않았어요.')
        if (!c.has('ec2', 'pub')) return bad('인터넷에서 접속할 웹 서버(EC2)가 퍼블릭 서브넷에 없어요.')
        if (!c.path(['users', 'igw', 'ec2@pub'])) return bad('사용자 → 인터넷 게이트웨이 → 웹 서버로 이어지는 연결선을 확인해 주세요.')
        if (!c.path(['users', 'igw', 'ec2@pub', 'rds'])) return bad('웹 서버까지는 왔지만 주문을 저장할 DB와 연결되지 않았어요.')
        return ok('주문 페이지가 열리고 주문이 DB에 저장됐어요.')
      },
    },
    {
      id: 'security',
      icon: '🛡️',
      title: '외부에서 DB 직접 접속 시도',
      desc: '누군가 인터넷에서 주문 DB에 바로 접속을 시도합니다.',
      check: (c) => {
        if (c.has('rds', 'pub')) return bad('DB가 퍼블릭 서브넷에 있어 인터넷 경로가 열려 있어요. 프라이빗 서브넷으로 옮겨 주세요.')
        if (c.linked('igw', 'rds') || c.linked('users', 'rds')) return bad('인터넷 쪽에서 DB로 바로 이어진 연결선이 있어요. DB는 웹 서버하고만 연결합니다.')
        return ok('DB는 프라이빗 서브넷에 있어 인터넷에서 닿지 않았어요.')
      },
    },
    {
      id: 'cost',
      icon: '💰',
      title: '첫 달 청구서 확인',
      desc: '하루 수십 건 규모에 맞는 비용인지 봅니다.',
      check: (c) => {
        if (c.has('alb')) return bad('서버가 한 대뿐인데 ALB를 두면 분산할 대상 없이 시간당 요금만 나가요.')
        if (c.has('natgw')) return bad('NAT 게이트웨이는 프라이빗 서버가 밖으로 나갈 때 쓰는데, 이번 요구사항에는 없어요. 시간당 요금이 붙습니다.')
        return ok('필요한 리소스만 사용해 비용을 아꼈어요.')
      },
    },
  ],
}

const p2: Project = {
  id: 'book-launch',
  level: 1,
  title: '신간 홍보 페이지',
  client: 'publisher',
  org: '한빛나래출판',
  summary: '서버 없이 운영하는 정적 웹사이트\nS3와 CloudFront 조합',
  topics: ['S3', 'CloudFront', '정적 웹 호스팅'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '출판사에서 신간 홍보 페이지를 급하게 열어야 한대요. 해외 독자도 많다고 하고요.' },
        { who: 'peer', text: '저도 같이 들어갈게요! 홍보 페이지면 로그인이나 DB 같은 건 없을 것 같은데요?' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'publisher', text: '책 소개, 작가 인터뷰 영상 링크, 이미지 몇 장이 전부예요. HTML 파일은 디자이너가 이미 만들어 뒀습니다.' },
        { who: 'publisher', text: '유튜버가 소개해 주면 접속이 확 몰릴 수 있고, 일본·미국 독자도 많아요.' },
        { who: 'publisher', text: '그리고 저희 팀에는 서버를 관리할 사람이 없어요. 패치니 재부팅이니 그런 건 못 합니다.' },
        { who: 'peer', text: '정적인 파일만 있으니 서버 없이 가능하겠어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: 'HTML·이미지로만 된 페이지를 전 세계에 빠르게 제공하고, 서버 관리는 하지 않으려면?',
        options: [
          { id: 'a', text: 'EC2 두 대와 ALB로 웹 서버를 구성한다', why: '동작은 하지만 OS 패치와 서버 관리가 필요해 요구사항과 맞지 않고, 정적 파일만 제공하기엔 비용도 커요.' },
          { id: 'b', text: 'EC2 한 대에 웹 서버를 설치하고 탄력적 IP를 붙인다', why: '서버 관리 부담이 그대로이고, 접속이 몰리면 한 대가 감당하지 못할 수 있어요.' },
          { id: 'c', text: 'S3에 파일을 올리고 CloudFront로 배포한다', why: '' },
          { id: 'd', text: 'RDS에 HTML을 저장하고 Lambda로 읽어 준다', why: '정적 파일을 DB에 넣을 이유가 없어요. 구조가 복잡해지고 비용만 늘어요.' },
        ],
        answer: 'c',
        explain:
          'S3는 파일을 저장하고, CloudFront는 전 세계 엣지 로케이션에 캐시해 가까운 곳에서 전달해요. 둘 다 관리형이라 서버 패치가 필요 없고, 갑자기 몰리는 접속도 처리할 수 있어요.',
        hint: '"서버 관리 없음"과 "전 세계"라는 두 단어에 집중해 보세요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'publisher', text: '도쿄 지사에서도 페이지가 바로 뜬다고 연락 왔어요. 서버가 없으니 신경 쓸 게 없네요.' },
        { who: 'peer', text: '버킷은 CloudFront만 읽을 수 있게 막아 뒀어요. 주소가 새어 나가도 직접 접근은 안 됩니다.' },
        { who: 'lead', text: '고객이 원하는 걸 정확히 짚었어요. 요구사항에 없는 서버를 안 넣은 게 핵심이에요.' },
      ],
    },
  ],
  design: {
    brief: ['정적 파일(HTML·이미지)만 제공', '해외 독자도 빠르게 접속', '서버 관리 인력 없음', 'S3 버킷은 직접 공개하지 않기'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (전 세계 독자)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('edge', 'edge', '엣지 로케이션 (전 세계)', 'edge', 2),
        B('region', 'region', '리전 · 서울', [
          Z('svc', 'plain', '리전 서비스', 'region', 3),
          B('vpc', 'vpc', 'VPC', [Z('sub', 'public', '퍼블릭 서브넷', 'subnet')]),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '독자' }],
    palette: ['s3', 'cloudfront', 'ec2', 'alb', 'rds'],
    answer: {
      nodes: [
        { id: 'a1', service: 'cloudfront', zone: 'edge' },
        { id: 'a2', service: 's3', zone: 'svc' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
      ],
    },
    answerNote: [
      '독자 → CloudFront → S3(원본) 순서예요. VPC는 이번 구성에서 쓰지 않아요.',
      'S3는 퍼블릭 액세스 차단을 켜고, CloudFront의 OAC(원본 액세스 제어)로 CloudFront만 버킷을 읽게 합니다.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '📖',
      title: '국내 독자 접속',
      desc: '서울의 독자가 홍보 페이지를 엽니다.',
      check: (c) => {
        if (!c.has('s3')) return bad('HTML·이미지 파일을 보관할 곳이 없어요.')
        if (c.path(['users', 'cloudfront', 's3'])) return ok('페이지가 바로 열렸어요.')
        if (c.path(['users', 'ec2'])) return bad('EC2로도 동작은 하지만, 정적 파일 제공에 서버를 둘 필요가 없어요.')
        return bad('독자 → CloudFront → S3로 이어지는 연결을 확인해 주세요.')
      },
    },
    {
      id: 'global',
      icon: '🌏',
      title: '도쿄·뉴욕 독자 동시 접속',
      desc: '유튜버 소개 직후 해외 접속이 몰립니다.',
      load: 5,
      check: (c) =>
        c.path(['users', 'cloudfront@edge', 's3'])
          ? ok('가까운 엣지 로케이션의 캐시에서 응답해 해외에서도 빨랐어요.')
          : bad('CloudFront가 없으면 모든 요청이 서울 리전까지 왕복해 해외 독자에게 느려요.'),
    },
    {
      id: 'direct',
      icon: '🔒',
      title: '버킷 주소로 직접 접근',
      desc: '누군가 S3 버킷 주소를 알아내 직접 접근합니다.',
      check: (c) =>
        c.linked('users', 's3')
          ? bad('독자가 S3에 바로 연결돼 있어요. 버킷은 공개하지 않고 CloudFront를 통해서만 읽게 해요.')
          : ok('버킷은 CloudFront만 읽을 수 있어 직접 접근이 차단됐어요.'),
    },
    {
      id: 'ops',
      icon: '🧰',
      title: '보안 패치의 날',
      desc: '운영체제 보안 패치가 발표됐습니다.',
      check: (c) =>
        c.has('ec2') || c.has('rds') || c.has('alb')
          ? bad('EC2·RDS 같은 서버형 리소스가 있어 관리 부담이 생겼어요. 이번 고객에게는 필요 없어요.')
          : ok('관리할 서버가 없어 패치 작업이 필요 없었어요.'),
    },
  ],
}

const p3: Project = {
  id: 'fashion-ha',
  level: 1,
  title: '쇼핑몰 서버 장애 대비',
  client: 'fashion',
  org: '무드웨어',
  summary: '서버 한 대 장애에도 멈추지 않는 쇼핑몰\nALB + 2개 AZ + RDS Multi-AZ',
  topics: ['가용 영역', 'ALB', 'RDS Multi-AZ'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '의류 쇼핑몰 "무드웨어"가 지난주 서버 장애로 반나절 동안 주문을 못 받았대요.' },
        { who: 'senior', text: '전형적인 단일 장애점이네요. 서버 한 대, DB 한 대가 한 곳에만 있으면 그게 멈추는 순간 끝이에요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'fashion', text: '지금은 EC2 한 대에 웹이랑 DB를 다 올려 두고 있어요. 그게 멈추니까 아무것도 못 하더라고요.' },
        { who: 'fashion', text: '데이터센터 하나에 문제가 생겨도 쇼핑몰은 계속 열려 있었으면 해요. DB도요.' },
        { who: 'me', text: '서울 리전의 서로 다른 가용 영역 두 곳에 나눠 배치하겠습니다.' },
        { who: 'fashion', text: '가용 영역이요? 리전이랑 뭐가 달라요?' },
        { who: 'senior', text: '리전은 서울 같은 지역이고, 가용 영역(AZ)은 그 안에서 전력·네트워크가 분리된 데이터센터 묶음이에요. 한 AZ가 멈춰도 다른 AZ는 살아 있도록 설계돼 있어요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '한 AZ에 장애가 나도 DB가 자동으로 다른 AZ에서 이어서 동작해야 해요. 어떤 RDS 기능을 쓸까요?',
        options: [
          { id: 'a', text: '읽기 전용 복제본(Read Replica)을 다른 AZ에 만든다', why: '읽기 복제본은 읽기 부하 분산이 주목적이고 비동기 복제예요. 장애 시 자동으로 쓰기 DB가 되지 않아 승격 작업이 필요해요.' },
          { id: 'b', text: '매일 자동 스냅샷을 찍어 둔다', why: '백업은 되지만 장애 시 스냅샷에서 새 DB를 만들어야 해서 복구에 시간이 걸리고, 마지막 백업 이후 데이터가 없을 수 있어요.' },
          { id: 'c', text: '더 큰 인스턴스 유형으로 바꾼다', why: '성능은 늘지만 여전히 한 곳에만 있어서 AZ 장애에는 그대로 멈춰요.' },
          { id: 'd', text: 'Multi-AZ 배포로 다른 AZ에 대기 DB를 둔다', why: '' },
        ],
        answer: 'd',
        explain:
          'Multi-AZ 배포는 다른 AZ에 대기(Standby) DB를 두고 동기 복제해요. 기본 DB에 문제가 생기면 같은 엔드포인트로 자동 장애 조치되므로 애플리케이션 설정을 바꿀 필요가 없어요.',
        hint: '"자동으로"와 "이어서 동작"이 핵심이에요. 백업이나 성능 향상과는 목적이 달라요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'fashion', text: '장애 훈련에서 한쪽 AZ를 끊어 봤는데 정말 주문이 계속 들어오네요!' },
        { who: 'fashion', text: 'DB가 넘어가는 동안 잠깐 끊김이 있었지만, 반나절 멈췄던 것에 비하면 천지 차이예요.' },
        { who: 'senior', text: 'Multi-AZ 장애 조치는 보통 1~2분 정도 걸려요. 그 정도는 앱에서 재시도로 받아 주면 됩니다.' },
        { who: 'lead', text: '좋아요. 고가용성의 기본을 익혔네요.' },
      ],
    },
  ],
  design: {
    brief: ['서버 한 대가 멈춰도 주문 가능', '가용 영역 하나가 멈춰도 운영', 'DB도 자동 장애 조치', 'DB와 앱 서버는 인터넷에 직접 노출하지 않기'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B (로드 밸런서는 두 AZ에 걸쳐 배치)', 'subnet', 2),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [
                  Z('appA', 'private', '프라이빗 서브넷 · 앱', 'subnet', 2),
                  Z('dbA', 'private', '프라이빗 서브넷 · DB', 'subnet', 2),
                ]),
                B('azB', 'az', '가용 영역 B', [
                  Z('appB', 'private', '프라이빗 서브넷 · 앱', 'subnet', 2),
                  Z('dbB', 'private', '프라이빗 서브넷 · DB', 'subnet', 2),
                ]),
              ],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [USERS, { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'rds', 'rdsStandby', 'natgw', 'cloudfront'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'ec2', zone: 'appA' },
        { id: 'a3', service: 'ec2', zone: 'appB' },
        { id: 'a4', service: 'rds', zone: 'dbA' },
        { id: 'a5', service: 'rdsStandby', zone: 'dbB' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a4'],
        ['a3', 'a4'],
      ],
    },
    answerNote: [
      'ALB가 두 AZ의 EC2로 요청을 나누고, 상태 확인에 실패한 서버로는 보내지 않아요.',
      '앱 서버는 기본 DB 엔드포인트에 연결해요. 대기 DB는 그 엔드포인트 뒤에서 자동 전환되므로 따로 연결선을 긋지 않아도 됩니다.',
      '앱 서버가 프라이빗 서브넷에 있어도 ALB를 통해 요청을 받을 수 있어요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🛍️',
      title: '평소 주문',
      desc: '손님이 옷을 장바구니에 담고 결제합니다.',
      check: (c) => {
        if (!c.path(['users', 'igw', 'alb@albZone'])) return bad('인터넷 게이트웨이 → 퍼블릭 서브넷의 ALB로 이어지는 진입점이 없어요.')
        if (!c.path(['users', 'igw', 'alb', 'ec2'])) return bad('ALB가 앱 서버(EC2)로 요청을 넘기지 못해요. 연결선을 확인해 주세요.')
        if (!c.path(['users', 'igw', 'alb', 'ec2', 'rds'])) return bad('앱 서버가 기본 DB(RDS)와 연결되지 않았어요.')
        return ok('주문이 정상 처리됐어요.')
      },
    },
    {
      id: 'azA',
      icon: '⚡',
      title: '가용 영역 A 정전',
      desc: 'AZ A 전체가 응답하지 않습니다.',
      fail: ['azA'],
      check: (c) => {
        if (!c.path(['users', 'igw', 'alb', 'ec2'], ['azA'])) return bad('AZ A가 멈추자 살아 있는 앱 서버가 없어요. AZ B에도 EC2를 두고 ALB와 연결하세요.')
        if (!c.path(['users', 'igw', 'alb', 'ec2', 'rds|rdsStandby'], ['azA']))
          return bad('앱 서버는 살았지만 DB가 AZ A에만 있어 주문을 저장할 수 없어요. 다른 AZ에 대기 DB를 두세요.')
        return ok('AZ B의 서버와 대기 DB로 자동 전환돼 주문이 이어졌어요.')
      },
    },
    {
      id: 'azB',
      icon: '⚡',
      title: '가용 영역 B 정전',
      desc: '이번에는 AZ B가 멈춥니다.',
      fail: ['azB'],
      check: (c) =>
        c.path(['users', 'igw', 'alb', 'ec2', 'rds|rdsStandby'], ['azB'])
          ? ok('AZ A만으로 서비스가 계속됐어요.')
          : bad('AZ B가 멈추면 서비스가 끊겨요. 앱 서버와 DB를 두 AZ에 나눠 두었는지 확인하세요.'),
    },
    {
      id: 'security',
      icon: '🛡️',
      title: '보안 점검',
      desc: '외부에서 앱 서버·DB로 직접 접근할 수 있는지 봅니다.',
      check: (c) => {
        if (c.has('rds|rdsStandby', 'albZone')) return bad('DB가 퍼블릭 서브넷에 있어요. 프라이빗 DB 서브넷으로 옮겨 주세요.')
        if (c.has('ec2', 'albZone')) return bad('앱 서버가 퍼블릭 서브넷에 있어요. ALB 뒤 프라이빗 서브넷에 두면 노출 면이 줄어요.')
        if (c.linked('igw', 'ec2') || c.linked('igw', 'rds')) return bad('인터넷 게이트웨이가 서버나 DB로 바로 연결돼 있어요. 진입점은 ALB 하나로 둡니다.')
        return ok('외부 진입점은 ALB 하나뿐이에요.')
      },
    },
  ],
}

const p4: Project = {
  id: 'settlement-nat',
  level: 1,
  title: '정산 서버 보안 업데이트',
  client: 'settle',
  org: '대성물산',
  summary: '외부 접속은 막고 업데이트만 내려받기\nNAT 게이트웨이의 위치와 역할',
  topics: ['NAT 게이트웨이', '아웃바운드 통신', '퍼블릭/프라이빗 서브넷'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '대성물산 전산팀에서 문의가 왔어요. 정산 서버가 외부 백신 업데이트를 못 받고 있대요.' },
        { who: 'senior', text: '서버를 프라이빗 서브넷에 잘 숨겨 뒀는데, 반대로 밖으로 나가는 길이 없는 경우겠네요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'settle', text: '정산 서버는 회계 데이터가 있어서 외부에서 절대 접속되면 안 됩니다. 감사에서도 지적받았어요.' },
        { who: 'settle', text: '그런데 보안 업체 백신 업데이트 서버가 인터넷에 있어서, 서버가 거기서 매일 패턴 파일을 받아야 해요.' },
        { who: 'me', text: '들어오는 연결은 막고, 서버에서 시작한 나가는 연결만 허용하면 되겠네요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '프라이빗 서브넷 서버의 아웃바운드 인터넷 통신을 위해 NAT 게이트웨이(퍼블릭 NAT)를 만들 때, 어디에 둘까요?',
        options: [
          { id: 'a', text: '퍼블릭 서브넷에 두고, 프라이빗 서브넷 라우팅을 NAT 게이트웨이로 향하게 한다', why: '' },
          { id: 'b', text: '정산 서버와 같은 프라이빗 서브넷에 둔다', why: 'NAT 게이트웨이 자신이 인터넷 게이트웨이로 나갈 수 있어야 해요. 프라이빗 서브넷에는 그 경로가 없어요.' },
          { id: 'c', text: 'VPC 바깥 인터넷 구간에 둔다', why: 'NAT 게이트웨이는 VPC 안의 서브넷에 만드는 리소스예요.' },
          { id: 'd', text: '정산 서버 운영체제 안에 설치한다', why: 'NAT 게이트웨이는 AWS 관리형 서비스라 서버에 설치하는 소프트웨어가 아니에요.' },
        ],
        answer: 'a',
        explain:
          '퍼블릭 NAT 게이트웨이는 퍼블릭 서브넷에 만들고 탄력적 IP를 붙여요. 프라이빗 서브넷의 라우팅 테이블에서 0.0.0.0/0을 NAT 게이트웨이로 보내면, 서버가 시작한 통신만 나갔다가 응답이 돌아와요. 외부에서 먼저 시작한 연결은 들어오지 못합니다.',
        hint: 'NAT 게이트웨이도 결국 인터넷 게이트웨이를 통해 밖으로 나가야 해요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'settle', text: '오늘 아침 패턴 업데이트가 정상으로 떴습니다. 외부 접속 점검에서도 막혀 있는 걸 확인했어요.' },
        { who: 'settle', text: '감사 보고서에 구성도를 그대로 첨부하겠습니다. 감사합니다.' },
        { who: 'lead', text: '들어오는 길과 나가는 길을 구분해서 설명한 게 좋았어요. 이제 주니어 과제도 해 볼 만하겠네요.' },
      ],
    },
  ],
  design: {
    brief: ['정산 서버는 외부에서 접속 불가', '정산 서버가 인터넷의 백신 업데이트 서버에 접속', '불필요한 비용은 피하기'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            B('azA', 'az', '가용 영역 A', [
              Z('pub', 'public', '퍼블릭 서브넷', 'subnet', 2),
              Z('priv', 'private', '프라이빗 서브넷', 'subnet', 2),
            ]),
          ]),
        ]),
      ]),
    ]),
    fixed: [
      { id: 'repo', service: 'internet', zone: 'out', label: '백신 업데이트 서버' },
      { id: 'attacker', service: 'users', zone: 'out', label: '외부 접속자' },
      { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' },
    ],
    fixedEdges: [
      ['repo', 'igw'],
      ['attacker', 'igw'],
    ],
    palette: ['ec2', 'natgw', 'alb', 'vpce', 'rds'],
    answer: {
      nodes: [
        { id: 'a1', service: 'ec2', zone: 'priv', label: '정산 서버' },
        { id: 'a2', service: 'natgw', zone: 'pub' },
      ],
      edges: [
        ['a1', 'a2'],
        ['a2', 'igw'],
      ],
    },
    answerNote: [
      '정산 서버(프라이빗) → NAT 게이트웨이(퍼블릭) → 인터넷 게이트웨이 → 업데이트 서버로 나갑니다.',
      'S3 게이트웨이형 VPC 엔드포인트는 S3로 가는 경로라서, 인터넷에 있는 외부 업체 서버에는 쓸 수 없어요.',
      'NAT 게이트웨이는 AZ 단위 리소스예요. 운영 환경에서 여러 AZ를 쓰면 AZ마다 하나씩 두는 것이 권장됩니다.',
    ],
  },
  scenarios: [
    {
      id: 'update',
      icon: '🔄',
      title: '백신 패턴 업데이트',
      desc: '정산 서버가 외부 업데이트 서버에 접속합니다.',
      check: (c) => {
        if (!c.has('ec2')) return bad('정산 서버(EC2)를 배치해 주세요.')
        if (c.path(['ec2@priv', 'natgw@pub', 'igw', 'repo'])) return ok('NAT 게이트웨이를 거쳐 업데이트를 받았어요.')
        if (c.has('natgw', 'priv')) return bad('NAT 게이트웨이가 프라이빗 서브넷에 있어 자신도 인터넷으로 나갈 수 없어요.')
        if (c.path(['ec2', 'igw', 'repo'])) return bad('업데이트는 받지만 서버가 인터넷 게이트웨이에 바로 붙어 있어요. 아래 보안 점검에서 문제가 됩니다.')
        if (c.path(['ec2', 'vpce'])) return bad('VPC 엔드포인트(S3)로는 인터넷의 외부 업체 서버에 갈 수 없어요.')
        return bad('정산 서버에서 업데이트 서버까지 나가는 경로가 없어요.')
      },
    },
    {
      id: 'attack',
      icon: '🚫',
      title: '외부에서 정산 서버 접속 시도',
      desc: '인터넷의 누군가가 정산 서버에 접속을 시도합니다.',
      check: (c) => {
        if (c.has('ec2', 'pub')) return bad('정산 서버가 퍼블릭 서브넷에 있어 인터넷에서 닿을 수 있어요.')
        if (c.linked('igw', 'ec2')) return bad('인터넷 게이트웨이와 정산 서버가 바로 연결돼 있어요.')
        if (c.has('alb')) return bad('ALB가 있으면 외부 요청을 서버로 넘겨주는 입구가 생겨요. 이번 서버는 외부 요청을 받을 필요가 없어요.')
        return ok('NAT는 안에서 시작한 연결만 통과시켜 외부 접속이 차단됐어요.')
      },
    },
    {
      id: 'cost',
      icon: '💰',
      title: '비용 점검',
      desc: '필요 없는 리소스가 있는지 봅니다.',
      check: (c) =>
        c.has('rds') || c.count('natgw') > 1
          ? bad('이번 요구사항과 상관없는 리소스가 있어요. 필요한 것만 남겨 주세요.')
          : ok('필요한 리소스만 사용했어요.'),
    },
  ],
}

// ── 주니어: 보통 ─────────────────────────────────────────────

const p5: Project = {
  id: 'ticket-rush',
  level: 2,
  title: '콘서트 예매 트래픽 폭주',
  client: 'ticket',
  org: '스테이지원',
  summary: '예매 오픈 순간의 폭주를 버티는 구성\nAuto Scaling과 캐시',
  topics: ['Auto Scaling', 'ElastiCache', 'ALB', 'Multi-AZ'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '주니어 첫 과제예요. 예매 사이트 "스테이지원"이 인기 공연 오픈 때마다 사이트가 멈춘대요.' },
        { who: 'senior', text: '평소엔 한가하다가 특정 시각에만 수십 배가 몰리는 패턴이죠. 항상 큰 서버를 켜 두면 돈이 아깝고요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'ticket', text: '오픈 10분 전부터 접속이 평소의 열 배 넘게 몰려요. 그 시각은 미리 공지하니까 알 수 있어요.' },
        { who: 'ticket', text: '대부분은 같은 공연 정보·좌석 배치도를 계속 새로고침하는 요청이에요. 그것 때문에 DB가 먼저 뻗어요.' },
        { who: 'ticket', text: '물론 AZ 장애에도 버텨야 하고요. 작년에 한 번 당했거든요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '오픈 시각을 미리 알고 있어요. 접속이 몰리기 전에 서버를 늘려 두려면 Auto Scaling에서 무엇을 쓸까요?',
        options: [
          { id: 'a', text: 'CPU 사용률 기반 대상 추적 조정만 쓴다', why: '쓸 수는 있지만 부하가 오른 뒤에 반응해요. 새 인스턴스가 준비되는 동안 순간 폭주를 놓칠 수 있어요.' },
          { id: 'b', text: '예약된 조정(Scheduled scaling)으로 오픈 전에 용량을 늘린다', why: '' },
          { id: 'c', text: '인스턴스 유형을 가장 큰 것으로 바꿔 항상 켜 둔다', why: '평소엔 한가한데 큰 서버 비용을 계속 내요. 한 대라 AZ 장애에도 약해요.' },
          { id: 'd', text: 'RDS 스토리지를 늘린다', why: '병목은 디스크 용량이 아니라 요청 처리량이에요.' },
        ],
        answer: 'b',
        explain:
          '예약된 조정은 정해진 시각에 최소·희망 용량을 바꿔요. 오픈 전에 미리 늘려 두고, 실제 부하는 대상 추적 조정으로 추가 대응하는 조합이 많이 쓰여요.',
        hint: '"시각을 미리 안다"는 조건을 활용하는 기능이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '같은 공연 정보를 수만 명이 반복 조회해 DB가 먼저 뻗어요. DB 부하를 가장 직접적으로 줄이는 방법은?',
        options: [
          { id: 'a', text: 'RDS Multi-AZ를 켠다', why: 'Multi-AZ 대기 DB는 장애 대비용이라 평소에 읽기 요청을 처리하지 않아요.' },
          { id: 'b', text: 'EC2를 더 많이 늘린다', why: '앱 서버가 늘면 DB로 가는 조회도 같이 늘어요. 병목은 DB예요.' },
          { id: 'c', text: 'ElastiCache에 자주 읽는 데이터를 캐시한다', why: '' },
          { id: 'd', text: 'S3로 DB를 옮긴다', why: 'S3는 객체 저장소라 좌석·예매 같은 트랜잭션 데이터 저장에 맞지 않아요.' },
        ],
        answer: 'c',
        explain:
          '자주 읽고 잘 바뀌지 않는 데이터는 ElastiCache(Redis 등) 같은 인메모리 캐시에 두면 DB까지 가지 않고 빠르게 응답해요. 읽기 복제본도 방법이지만, 반복 조회에는 캐시가 더 직접적이에요.',
        hint: '같은 데이터를 계속 읽는다면, 매번 DB에 물어볼 필요가 있을까요?',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'ticket', text: '어제 오픈에서 처음으로 사이트가 안 멈췄어요! 운영팀이 박수 쳤습니다.' },
        { who: 'ticket', text: '공연 끝나고 서버가 알아서 줄어든 것도 확인했어요. 비용도 생각보다 적게 나왔고요.' },
        { who: 'lead', text: '확장, 캐시, 가용성을 한 그림에 묶었네요. 주니어답게 잘했어요.' },
      ],
    },
  ],
  design: {
    brief: ['오픈 시각 트래픽 10배 이상', '반복 조회로 인한 DB 과부하 해소', 'AZ 하나 장애에도 운영', '평소 비용은 낮게'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 2),
            Z('asgZone', 'group', 'Auto Scaling 그룹 영역 (앱 서브넷 A·B를 묶음)', 'group', 1),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [
                  Z('appA', 'private', '앱 서브넷', 'subnet', 2),
                  Z('dbA', 'private', 'DB·캐시 서브넷', 'subnet', 3),
                ]),
                B('azB', 'az', '가용 영역 B', [
                  Z('appB', 'private', '앱 서브넷', 'subnet', 2),
                  Z('dbB', 'private', 'DB·캐시 서브넷', 'subnet', 3),
                ]),
              ],
              'row',
            ),
          ]),
        ]),
      ]),
    ]),
    fixed: [USERS, { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'asg', 'elasticache', 'rds', 'rdsStandby', 'dx', 'storagegw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'asg', zone: 'asgZone' },
        { id: 'a3', service: 'ec2', zone: 'appA' },
        { id: 'a4', service: 'ec2', zone: 'appB' },
        { id: 'a5', service: 'elasticache', zone: 'dbA' },
        { id: 'a6', service: 'rds', zone: 'dbA' },
        { id: 'a7', service: 'rdsStandby', zone: 'dbB' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a3'],
        ['a1', 'a4'],
        ['a3', 'a5'],
        ['a4', 'a5'],
        ['a3', 'a6'],
        ['a4', 'a6'],
      ],
    },
    answerNote: [
      'Auto Scaling 그룹은 두 AZ의 앱 서브넷에 걸쳐 EC2 수를 조절해요. 그림에서는 그룹 영역에 하나만 둡니다.',
      '앱 서버는 먼저 캐시를 조회하고, 없을 때만 DB를 읽어요.',
      'ElastiCache도 운영 환경에서는 다른 AZ에 복제본을 두는 Multi-AZ 구성을 권장해요.',
      'Direct Connect와 Storage Gateway는 데이터센터 연결용이라 이번 요구사항과 관계없어요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🎫',
      title: '평소 예매',
      desc: '평일 오후, 한산한 상태에서 예매합니다.',
      check: (c) => {
        if (!c.path(['users', 'igw', 'alb@albZone', 'ec2'])) return bad('인터넷 → ALB → 앱 서버로 이어지는 경로를 확인해 주세요.')
        if (!c.path(['users', 'igw', 'alb', 'ec2', 'rds'])) return bad('앱 서버가 예매 DB(RDS)와 연결되지 않았어요.')
        return ok('예매가 정상 처리됐어요.')
      },
    },
    {
      id: 'spike',
      icon: '🚀',
      title: '오픈 순간 트래픽 10배',
      desc: '오후 8시 정각, 접속이 폭주합니다.',
      load: 10,
      check: (c) => {
        if (!c.has('asg')) return bad('서버 수가 고정이라 폭주를 감당하지 못했어요. Auto Scaling 그룹이 필요해요.')
        if (c.nodes('ec2').filter((n) => c.linked('alb', n.id)).length < 2 && !c.path(['alb', 'ec2@azB']))
          return bad('ALB에 연결된 앱 서버가 부족해요. 두 AZ의 EC2를 ALB에 연결해 Auto Scaling이 양쪽으로 늘어나게 하세요.')
        return ok('예약된 조정으로 미리 늘린 서버가 폭주를 받아냈어요.')
      },
    },
    {
      id: 'cache',
      icon: '🔁',
      title: '좌석 배치도 새로고침 폭탄',
      desc: '같은 공연 정보 조회가 초당 수만 건 들어옵니다.',
      load: 8,
      check: (c) => {
        if (!c.has('elasticache')) return bad('모든 조회가 DB로 가서 DB CPU가 100%가 됐어요. 반복 조회는 캐시로 받아 주세요.')
        if (c.has('elasticache', 'albZone')) return bad('캐시가 퍼블릭 서브넷에 있어요. DB처럼 안쪽 서브넷에 둡니다.')
        if (!c.path(['ec2', 'elasticache'])) return bad('캐시는 있지만 앱 서버와 연결되지 않았어요.')
        return ok('조회 대부분을 캐시가 응답해 DB가 여유로웠어요.')
      },
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: '오픈 직후 AZ A가 멈춥니다.',
      fail: ['azA'],
      check: (c) =>
        c.path(['users', 'igw', 'alb', 'ec2', 'rds|rdsStandby'], ['azA'])
          ? ok('AZ B의 서버와 대기 DB로 예매가 이어졌어요.')
          : bad('AZ A가 멈추자 예매가 중단됐어요. 앱 서버와 대기 DB를 AZ B에도 두세요.'),
    },
    {
      id: 'cost',
      icon: '💰',
      title: '비용 점검',
      desc: '요구사항과 관계없는 리소스를 찾습니다.',
      check: (c) =>
        c.has('dx') || c.has('storagegw')
          ? bad('데이터센터 연결용 서비스가 들어가 있어요. 이번 고객은 온프레미스 연결이 없어요.')
          : ok('필요한 리소스만 사용했어요.'),
    },
  ],
}

const p6: Project = {
  id: 'city-hybrid',
  level: 2,
  title: '시청 민원 서비스 하이브리드 연결',
  client: 'city',
  org: '해솔시청',
  summary: '민감 데이터는 기관 프라이빗 클라우드에, 대국민 서비스는 AWS에\nSite-to-Site VPN',
  topics: ['하이브리드', 'VPC vs 프라이빗 클라우드', 'Site-to-Site VPN', 'Direct Connect'],
  env: '하이브리드',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '공공 프로젝트예요. 해솔시청이 온라인 민원 접수 서비스를 새로 연대요.' },
        { who: 'senior', text: '공공은 데이터 위치 요건이 중요해요. 무엇을 클라우드에 두고 무엇을 남길지부터 확인해야 해요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'city', text: '주민 개인정보 DB는 내부 지침상 시청 데이터센터의 프라이빗 클라우드에 그대로 둬야 합니다.' },
        { who: 'city', text: '대신 민원 접수 화면은 트래픽 변동이 커서 AWS에 올리고 싶어요. 접수 서버가 내부 DB를 조회해야 하고요.' },
        { who: 'city', text: '오픈까지 2주밖에 없고, 예산도 넉넉하지 않습니다.' },
        { who: 'me', text: '두 환경을 암호화된 연결로 잇겠습니다. 회선 개통 기간도 고려하겠습니다.' },
        { who: 'senior', text: '참고로 시청의 프라이빗 클라우드와 AWS의 VPC는 둘 다 "격리된 네트워크"처럼 보이지만, 앞의 것은 시청 소유 인프라고 뒤의 것은 AWS 퍼블릭 클라우드 안의 논리 네트워크예요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '고객에게 설명할 내용으로 옳은 것은?',
        options: [
          { id: 'a', text: 'AWS VPC는 시청 전용 물리 서버로 구성되므로 프라이빗 클라우드와 같다', why: 'VPC는 AWS 공유 인프라 위의 논리적 격리 네트워크예요. 전용 하드웨어 옵션이 따로 있지만 VPC 자체가 전용 물리 서버를 뜻하지는 않아요.' },
          { id: 'b', text: '프라이빗 클라우드는 반드시 AWS 안에 만들어야 한다', why: '프라이빗 클라우드는 보통 조직이 소유·운영하는 데이터센터에 구축해요.' },
          { id: 'c', text: 'VPC는 AWS 퍼블릭 클라우드 안의 논리적으로 격리된 네트워크이고, 프라이빗 클라우드는 한 조직 전용 인프라에 클라우드 방식을 구현한 것이다', why: '' },
          { id: 'd', text: 'VPC에 있는 리소스는 모두 인터넷에 공개된다', why: 'VPC 안에서도 프라이빗 서브넷을 두면 인터넷에서 접근할 수 없어요.' },
        ],
        answer: 'c',
        explain:
          '둘을 연결한 구성이 하이브리드 클라우드예요. 이번 설계에서는 시청 프라이빗 클라우드(주민 DB)와 AWS VPC(민원 접수)를 Site-to-Site VPN으로 연결해요.',
        hint: '누가 인프라를 소유·운영하는지를 기준으로 생각해 보세요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '2주 안에 개통해야 하고 예산이 적어요. 데이터센터와 VPC를 암호화해 연결하려면?',
        options: [
          { id: 'a', text: 'AWS Direct Connect 전용 회선을 신청한다', why: '안정적이지만 회선 개통에 보통 수 주 이상 걸리고, 비용도 더 들어요. 기본적으로 암호화가 되지 않아 필요하면 별도 구성이 필요해요.' },
          { id: 'b', text: 'AWS Site-to-Site VPN을 구성한다', why: '' },
          { id: 'c', text: '주민 DB를 인터넷에 공개하고 IP로 접근을 제한한다', why: '개인정보 DB를 인터넷에 노출하는 건 지침 위반이고 위험해요.' },
          { id: 'd', text: 'VPC 피어링으로 데이터센터와 연결한다', why: 'VPC 피어링은 VPC끼리 연결하는 기능이라 온프레미스와는 연결할 수 없어요.' },
        ],
        answer: 'b',
        explain:
          'Site-to-Site VPN은 기존 인터넷 회선 위에 IPsec 암호화 터널을 만들어 빠르게 구성할 수 있어요. VPC 쪽에는 가상 프라이빗 게이트웨이(또는 Transit Gateway), 데이터센터 쪽에는 고객 게이트웨이 장비가 필요해요.',
        hint: '"빠르게"와 "암호화"를 동시에 만족하는 쪽이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'city', text: '민원 접수가 AWS에서 열렸고, 주민 정보는 그대로 내부에 있다는 점을 보안성 검토에서 인정받았습니다.' },
        { who: 'city', text: '사용량이 늘면 내년에 전용 회선도 검토해 보겠습니다. 고생 많으셨습니다.' },
        { who: 'lead', text: '고객의 정책 제약을 설계에 반영한 게 핵심이었어요. 공공 프로젝트에서 자주 만날 패턴이에요.' },
      ],
    },
  ],
  design: {
    brief: ['민원 접수 화면은 AWS에서 운영', '주민 개인정보 DB는 시청 프라이빗 클라우드에 유지', 'AWS 접수 서버가 내부 DB를 암호화된 연결로 조회', '2주 안에 개통, 저예산'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (주민)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC (민원 접수)', [
            Z('vpcEdge', 'gate', 'VPC 경계 · 게이트웨이', 'vpcEdge', 3),
            B('azA', 'az', '가용 영역 A', [
              Z('pub', 'public', '퍼블릭 서브넷', 'subnet', 2),
              Z('app', 'private', '프라이빗 서브넷 · 앱', 'subnet', 2),
            ]),
          ]),
        ]),
      ]),
      Z('link', 'link', '연결 회선', 'link', 2),
      B('dc', 'onprem', '해솔시청 데이터센터 · 프라이빗 클라우드', [Z('dcEdge', 'plain', '데이터센터 경계 장비', 'onprem', 2), B('dcIn', 'plain', '내부망')]),
    ]),
    fixed: [
      { ...USERS, label: '주민' },
      { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' },
      { id: 'pcDb', service: 'onpremDb', zone: 'dcIn', label: '주민정보 DB' },
    ],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2', 'vgw', 'vpn', 'cgw', 'dx', 'rds', 'natgw'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'pub' },
        { id: 'a2', service: 'ec2', zone: 'app' },
        { id: 'a3', service: 'vgw', zone: 'vpcEdge' },
        { id: 'a4', service: 'vpn', zone: 'link' },
        { id: 'a5', service: 'cgw', zone: 'dcEdge' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
        ['a3', 'a4'],
        ['a4', 'a5'],
        ['a5', 'pcDb'],
      ],
    },
    answerNote: [
      '주민 → IGW → ALB → 접수 서버(EC2), 그리고 접수 서버 → 가상 프라이빗 게이트웨이 → VPN 터널 → 고객 게이트웨이 → 주민 DB.',
      '실제로는 VPN 연결마다 터널이 2개 제공돼요. 운영 환경에서는 둘 다 구성해 이중화합니다.',
      'VPC가 여러 개로 늘면 가상 프라이빗 게이트웨이 대신 Transit Gateway에 VPN을 붙이는 구성도 많이 써요.',
      '이번 그림은 단일 AZ로 단순화했어요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '📝',
      title: '주민 민원 접수',
      desc: '주민이 집에서 민원을 신청합니다.',
      check: (c) => {
        if (!c.path(['users', 'igw', 'alb@pub', 'ec2@app'])) return bad('주민 → IGW → ALB(퍼블릭) → 접수 서버(프라이빗) 경로를 확인해 주세요.')
        return ok('민원 접수 화면이 열렸어요.')
      },
    },
    {
      id: 'lookup',
      icon: '🔐',
      title: '주민 정보 조회',
      desc: '접수 서버가 내부 주민 DB에서 신청자 정보를 확인합니다.',
      check: (c) => {
        if (c.path(['ec2', 'vgw@vpcEdge', 'vpn', 'cgw@dcEdge', 'pcDb'])) return ok('VPN 터널로 암호화된 조회에 성공했어요.')
        if (c.path(['ec2', 'vgw', 'dx', 'cgw', 'pcDb'])) return ok('전용 회선으로 조회에 성공했어요. 다만 일정 점검을 보세요.')
        if (c.has('vpn') && !c.has('vgw')) return bad('VPN 터널의 AWS 쪽 끝점(가상 프라이빗 게이트웨이)이 없어요.')
        if (c.has('vpn') && !c.has('cgw')) return bad('VPN 터널의 데이터센터 쪽 끝점(고객 게이트웨이)이 없어요.')
        return bad('접수 서버 → VGW → VPN → CGW → 주민 DB로 이어지는 경로가 없어요.')
      },
    },
    {
      id: 'policy',
      icon: '📜',
      title: '보안성 검토',
      desc: '개인정보 위치 지침을 지켰는지 확인합니다.',
      check: (c) =>
        c.has('rds')
          ? bad('AWS에 RDS가 있어요. 주민 DB를 AWS로 옮기거나 복제하는 건 이번 지침 위반이에요.')
          : c.linked('igw', 'cgw') || c.linked('users', 'pcDb')
            ? bad('주민 DB 쪽이 인터넷과 직접 이어져 있어요.')
            : ok('주민 정보는 시청 프라이빗 클라우드에만 있어요.'),
    },
    {
      id: 'schedule',
      icon: '📅',
      title: '2주 뒤 오픈',
      desc: '개통 일정과 예산을 맞췄는지 봅니다.',
      check: (c) =>
        c.has('dx')
          ? bad('Direct Connect는 회선 개통에 보통 수 주 이상 걸리고 비용도 커서 2주 일정·저예산 조건에 맞지 않아요.')
          : c.has('vpn')
            ? ok('기존 인터넷 회선 위에 VPN을 올려 바로 개통했어요.')
            : bad('연결 회선이 정해지지 않았어요.'),
    },
  ],
}

const p7: Project = {
  id: 'survey-serverless',
  level: 2,
  title: '설문 API 서버리스 전환',
  client: 'survey',
  org: '폼잇',
  summary: '들쭉날쭉한 사용량에 맞춰 쓴 만큼만 내는 구성\nAPI Gateway + Lambda + DynamoDB',
  topics: ['서버리스', 'Lambda', 'API Gateway', 'DynamoDB'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '스타트업 "폼잇"이 설문 응답 API의 비용과 운영 부담을 줄이고 싶대요.' },
        { who: 'peer', text: '스타트업이면 인프라 담당자가 따로 없을 가능성이 크겠네요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'survey', text: '지금은 EC2 두 대에 RDS를 쓰는데, 새벽엔 요청이 거의 0이에요. 그래도 요금은 똑같이 나가요.' },
        { who: 'survey', text: '반대로 기업 고객이 캠페인을 하면 몇 분 만에 응답 수만 건이 몰려요.' },
        { who: 'survey', text: '개발자 둘이서 서비스까지 만들어야 해서, 서버 패치나 용량 계획은 하고 싶지 않아요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '응답 데이터는 설문ID·응답ID로 저장하고 조회해요. 사용량을 예측할 수 없을 때 DynamoDB 용량 모드는?',
        options: [
          { id: 'a', text: '프로비저닝 모드로 최대치에 맞춰 설정한다', why: '캠페인 때는 버티지만 평소에도 최대치 비용을 내요.' },
          { id: 'b', text: '프로비저닝 모드로 최소치에 맞춰 설정한다', why: '평소엔 싸지만 캠페인 폭주 때 처리량을 넘는 요청이 제한(스로틀)될 수 있어요.' },
          { id: 'c', text: '온디맨드 모드를 쓴다', why: '' },
          { id: 'd', text: 'DynamoDB 대신 EC2에 DB를 직접 설치한다', why: '서버 관리를 하지 않겠다는 요구사항과 정반대예요.' },
        ],
        answer: 'c',
        explain:
          '온디맨드 모드는 용량을 미리 정하지 않고 요청 수에 따라 과금돼요. 트래픽 예측이 어렵거나 들쭉날쭉한 워크로드에 맞아요. 사용량이 안정적이면 프로비저닝 모드가 더 저렴할 수 있어요.',
        hint: '"예측할 수 없다"가 핵심 조건이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'survey', text: '이번 달 청구서가 절반 이하로 줄었어요! 캠페인 날에도 문제없었고요.' },
        { who: 'survey', text: '서버 패치 알림을 더 이상 안 받는 게 제일 좋네요.' },
        { who: 'lead', text: '요구사항이 "운영 부담 최소"일 때 서버리스가 왜 강한지 잘 보여 줬어요.' },
      ],
    },
  ],
  design: {
    brief: ['요청 없는 시간에는 비용이 거의 없게', '캠페인 폭주에도 자동 대응', '서버 패치·용량 계획 없음'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (설문 참여자)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          Z('svc', 'plain', '리전 서비스', 'region', 4),
          B('vpc', 'vpc', 'VPC', [Z('sub', 'public', '퍼블릭 서브넷', 'subnet', 3)]),
        ]),
      ]),
    ]),
    fixed: [{ ...USERS, label: '설문 참여자' }],
    palette: ['apigw', 'lambda', 'dynamodb', 'ec2', 'alb', 'rds', 'sqs'],
    answer: {
      nodes: [
        { id: 'a1', service: 'apigw', zone: 'svc' },
        { id: 'a2', service: 'lambda', zone: 'svc' },
        { id: 'a3', service: 'dynamodb', zone: 'svc' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      '참여자 → API Gateway → Lambda → DynamoDB(온디맨드). 세 서비스 모두 요청 수 기준으로 과금돼요.',
      'Lambda는 계정·리전별 동시 실행 할당량이 있어요. 큰 캠페인 전에는 할당량을 확인하고 필요하면 증가를 요청합니다.',
      'SQS는 처리를 비동기로 미룰 때 유용하지만, 이번 요구사항에서는 필수가 아니에요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '✅',
      title: '설문 응답 제출',
      desc: '참여자가 응답을 제출합니다.',
      check: (c) => {
        if (c.path(['users', 'apigw', 'lambda', 'dynamodb'])) return ok('응답이 저장됐어요.')
        if (c.path(['users', 'alb', 'ec2']) || c.path(['users', 'ec2'])) return bad('동작은 하지만 지금과 같은 서버형 구조예요. 아래 점검들을 확인해 보세요.')
        return bad('참여자 → API Gateway → Lambda → DynamoDB로 이어지는 경로를 만들어 주세요.')
      },
    },
    {
      id: 'night',
      icon: '🌙',
      title: '새벽 3시, 요청 0건',
      desc: '아무도 설문에 응답하지 않는 시간입니다.',
      load: 0,
      check: (c) =>
        c.has('ec2') || c.has('alb') || c.has('rds')
          ? bad('EC2·ALB·RDS는 요청이 없어도 켜져 있는 동안 시간당 요금이 나와요.')
          : ok('요청이 없으니 컴퓨팅 비용도 거의 없었어요.'),
    },
    {
      id: 'campaign',
      icon: '📣',
      title: '기업 캠페인 폭주',
      desc: '5분 동안 응답 수만 건이 몰립니다.',
      load: 10,
      check: (c) =>
        c.path(['users', 'apigw', 'lambda', 'dynamodb'])
          ? ok('Lambda 실행 수와 DynamoDB 처리량이 요청에 맞춰 늘어났어요.')
          : bad('요청이 늘어도 자동으로 따라가는 경로가 없어요.'),
    },
    {
      id: 'ops',
      icon: '🧰',
      title: '보안 패치 공지',
      desc: '운영체제 취약점이 발표됐습니다.',
      check: (c) =>
        c.has('ec2') ? bad('EC2가 있어 개발자가 직접 패치해야 해요.') : ok('관리형 서비스라 패치는 AWS가 처리했어요.'),
    },
  ],
}

const p8: Project = {
  id: 'studio-backup',
  level: 2,
  title: '디자인 스튜디오 파일 백업',
  client: 'design',
  org: '스튜디오 오르',
  summary: '사내 파일 서버를 S3로 백업하고 장기 보관 비용을 낮추기\nStorage Gateway와 수명 주기',
  topics: ['Storage Gateway', 'S3 수명 주기', 'Glacier Deep Archive', '하이브리드'],
  env: '하이브리드',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '디자인 스튜디오 "오르"가 랜섬웨어 소식에 놀라서 백업 체계를 문의했어요.' },
        { who: 'senior', text: '온프레미스 파일 서버를 그대로 두고 클라우드를 백업 저장소로 쓰는 하이브리드 패턴이에요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'design', text: '사무실 NAS에 작업 파일이 다 있어요. 직원들은 지금처럼 공유 폴더로 쓰고 싶어해요.' },
        { who: 'design', text: '사무실에 불이라도 나면 끝이라서 바깥에도 복사본이 있어야 해요.' },
        { who: 'design', text: '그리고 계약상 프로젝트 원본을 7년 보관해야 하는데, 오래된 건 거의 다시 안 열어요.' },
        { who: 'design', text: '인터넷 회선은 지금 쓰는 걸로 충분할 것 같아요. 전용선까지는 부담돼요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '7년 보관하지만 거의 열지 않고, 복원에 반나절 정도 걸려도 괜찮아요. 가장 저렴한 보관 방법은?',
        options: [
          { id: 'a', text: 'S3 Standard에 계속 둔다', why: '자주 읽는 데이터용이라 장기 보관에는 비싸요.' },
          { id: 'b', text: 'EBS 볼륨을 크게 만들어 보관한다', why: 'EBS는 EC2에 붙는 블록 스토리지라 장기 보관용으로 비싸고 관리도 필요해요.' },
          { id: 'c', text: 'S3 수명 주기 규칙으로 일정 기간 후 S3 Glacier Deep Archive로 옮긴다', why: '' },
          { id: 'd', text: 'DynamoDB에 파일을 저장한다', why: 'DynamoDB 항목은 크기 제한(400KB)이 있어 디자인 원본 파일 저장에 맞지 않아요.' },
        ],
        answer: 'c',
        explain:
          'S3 Glacier Deep Archive는 S3에서 가장 저렴한 스토리지 클래스로, 1년에 한두 번 접근하는 장기 보관 데이터용이에요. 표준 검색은 12시간 이내에 복원돼요. 수명 주기 규칙으로 자동 이동시키면 관리가 쉬워요.',
        hint: '"거의 안 열고", "복원이 느려도 됨"은 가장 저렴한 아카이브 등급의 조건이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'design', text: '직원들은 바뀐 걸 거의 못 느낀대요. 공유 폴더 그대로 쓰는데 뒤에서 S3에 쌓이고 있다니 신기해요.' },
        { who: 'design', text: '보관 비용 견적도 예상보다 훨씬 낮았어요. 고맙습니다!' },
        { who: 'lead', text: '고객의 업무 습관을 바꾸지 않은 게 좋은 제안이었어요.' },
      ],
    },
  ],
  design: {
    brief: ['직원은 지금처럼 공유 폴더로 사용', '사무실 밖(AWS)에 복사본 보관', '7년 장기 보관 비용 최소화', '기존 인터넷 회선 사용'],
    layout: B('root', 'plain', '', [
      B('cloud', 'cloud', 'AWS 클라우드', [B('region', 'region', '리전 · 서울', [Z('svc', 'plain', '리전 서비스', 'region', 4)])]),
      B('linkBox', 'link', '연결', [Z('link', 'plain', '회선', 'link', 2)]),
      B('dc', 'onprem', '스튜디오 사무실', [Z('dcEdge', 'plain', '사내 설치 장비', 'onprem', 2), B('dcIn', 'plain', '사내망')]),
    ]),
    fixed: [
      { id: 'nas', service: 'nas', zone: 'dcIn', label: '파일 서버(NAS)' },
      { id: 'net', service: 'line', zone: 'link', label: '기존 인터넷 회선' },
    ],
    palette: ['storagegw', 's3', 'glacier', 'dx', 'cgw', 'dynamodb'],
    answer: {
      nodes: [
        { id: 'a1', service: 'storagegw', zone: 'dcEdge' },
        { id: 'a2', service: 's3', zone: 'svc' },
        { id: 'a3', service: 'glacier', zone: 'svc' },
      ],
      edges: [
        ['nas', 'a1'],
        ['a1', 'net'],
        ['net', 'a2'],
        ['a2', 'a3'],
      ],
    },
    answerNote: [
      'NAS → S3 파일 게이트웨이(사내 VM) → 인터넷 회선 → S3. 게이트웨이는 SMB/NFS 공유를 제공하고 파일을 S3 객체로 저장해요.',
      'S3 → Glacier Deep Archive 연결선은 수명 주기 규칙(예: 90일 후 이동)을 뜻해요.',
      '랜섬웨어 대비로 S3 버전 관리와 Object Lock을 함께 쓰는 것이 좋아요.',
    ],
  },
  scenarios: [
    {
      id: 'backup',
      icon: '💾',
      title: '야간 백업',
      desc: '오늘 작업한 파일이 AWS로 올라갑니다.',
      check: (c) => {
        if (c.path(['nas', 'storagegw@dcEdge', 'net', 's3'])) return ok('파일이 S3에 저장됐어요.')
        if (c.path(['nas', 'storagegw', 'dx', 's3'])) return ok('파일이 S3에 저장됐어요. 회선 점검을 확인하세요.')
        if (!c.has('storagegw')) return bad('NAS와 S3를 이어 줄 게이트웨이가 없어요.')
        return bad('NAS → 게이트웨이 → 회선 → S3로 이어지는 경로를 확인해 주세요.')
      },
    },
    {
      id: 'fire',
      icon: '🔥',
      title: '사무실 화재',
      desc: '사무실 장비가 모두 사용 불가가 됐습니다.',
      fail: ['dc'],
      check: (c) =>
        c.has('s3') && c.path(['storagegw', 'net|dx', 's3'])
          ? ok('AWS에 있는 복사본으로 파일을 복구할 수 있어요.')
          : bad('사무실 밖에 복사본이 없어 복구할 수 없어요.'),
    },
    {
      id: 'archive',
      icon: '🗄️',
      title: '7년 보관 비용',
      desc: '오래된 프로젝트 원본이 쌓입니다.',
      check: (c) => {
        if (c.has('dynamodb')) return bad('DynamoDB는 큰 파일 보관용이 아니에요.')
        if (!c.has('glacier')) return bad('모든 파일이 S3 Standard에 남아 장기 보관 비용이 커요.')
        if (!c.linked('s3', 'glacier')) return bad('Glacier Deep Archive는 S3의 스토리지 클래스예요. S3와 연결해 수명 주기 이동을 표시하세요.')
        return ok('오래된 파일은 Deep Archive로 옮겨져 보관 비용이 크게 줄었어요.')
      },
    },
    {
      id: 'line',
      icon: '📶',
      title: '회선 비용',
      desc: '연결 비용을 점검합니다.',
      check: (c) =>
        c.has('dx')
          ? bad('백업 용량에 비해 Direct Connect는 과해요. 고객은 기존 회선을 쓰길 원했어요.')
          : c.has('cgw')
            ? bad('고객 게이트웨이는 VPN 장비라 이번 구성에는 필요 없어요.')
            : ok('기존 인터넷 회선을 그대로 썼어요.'),
    },
  ],
}

// ── 시니어: 어려움 ─────────────────────────────────────────────

const p9: Project = {
  id: 'order-decouple',
  level: 3,
  title: '주문 처리 디커플링',
  client: 'commerce',
  org: '바로마켓',
  summary: '접수와 처리를 큐로 분리해 폭주와 장애에도 주문을 잃지 않기\nSQS와 워커',
  topics: ['SQS', '디커플링', '비동기 처리', 'Multi-AZ'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '시니어 과제예요. 바로마켓이 할인 행사 때 주문이 사라지는 문제를 겪고 있어요.' },
        { who: 'senior', text: '로그를 보니 주문 접수 서버가 결제 처리 서버를 직접 호출해요. 처리 쪽이 느려지면 접수까지 같이 멈추는 구조죠.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'commerce', text: '결제·재고 처리는 건당 몇 초씩 걸려요. 행사 때는 접수가 처리 속도를 한참 앞질러요.' },
        { who: 'commerce', text: '처리 서버를 배포하다 실수로 다 내려간 적도 있는데, 그때 들어온 주문이 다 날아갔어요.' },
        { who: 'commerce', text: '같은 주문이 두 번 결제되면 정말 큰일 나고, 주문 순서도 지켜져야 해요.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: '접수 서버와 처리 서버 사이에 무엇을 둬야, 처리 쪽이 느리거나 멈춰도 주문을 잃지 않을까요?',
        options: [
          { id: 'a', text: 'SNS 토픽으로 처리 서버에 바로 푸시한다', why: 'SNS는 구독자에게 즉시 전달하는 발행·구독 서비스예요. 처리 서버가 꺼져 있는 동안 메시지를 쌓아 두는 용도는 아니에요(보존하려면 SQS를 구독시켜요).' },
          { id: 'b', text: 'ALB를 하나 더 두어 처리 서버로 분산한다', why: '여전히 동기 호출이에요. 처리 서버가 모두 멈추면 요청이 실패해요.' },
          { id: 'c', text: 'SQS 대기열에 주문을 넣고 처리 서버가 꺼내 가게 한다', why: '' },
          { id: 'd', text: '접수 서버의 메모리에 주문을 임시 저장한다', why: '접수 서버가 재시작되거나 교체되면 메모리 내용이 사라져요.' },
        ],
        answer: 'c',
        explain:
          'SQS는 메시지를 저장해 두는 대기열이라 처리 서버가 느리거나 멈춰도 메시지가 보존돼요(기본 4일, 최대 14일). 처리 서버는 자기 속도대로 꺼내 처리하면 되고, 이렇게 서로 기다리지 않게 하는 걸 디커플링이라고 해요.',
        hint: '"보관해 뒀다가 나중에 꺼내 간다"는 성질이 필요해요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '같은 주문이 두 번 처리되면 안 되고, 순서도 지켜야 해요. 어떤 SQS 큐가 맞을까요?',
        options: [
          { id: 'a', text: '표준 큐', why: '처리량이 거의 무제한이지만 최소 1회 전달이라 중복될 수 있고, 순서도 최선 노력(best-effort)이에요.' },
          { id: 'b', text: 'FIFO 큐', why: '' },
          { id: 'c', text: '지연 큐(Delay queue)만 설정한 표준 큐', why: '지연 큐는 전달 시점을 미루는 기능일 뿐, 중복이나 순서를 보장하지 않아요.' },
          { id: 'd', text: '배달 못 한 편지 큐(DLQ)만 사용', why: 'DLQ는 반복 실패한 메시지를 따로 모으는 보조 큐예요.' },
        ],
        answer: 'b',
        explain:
          'FIFO 큐는 메시지 그룹 안에서 순서를 지키고, 중복 제거 ID로 정해진 기간(5분) 내 중복 전송을 막아요. 처리량은 표준 큐보다 제한되니 규모에 맞는지 확인해야 해요. 앱에서도 결제 처리를 멱등(idempotent)하게 만드는 것이 안전해요.',
        hint: '이름 그대로 "먼저 들어온 것이 먼저 나가는" 큐예요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'commerce', text: '이번 행사 때 처리 서버 하나가 죽었는데, 큐에 쌓였다가 복구 후 전부 처리됐어요. 유실 0건입니다.' },
        { who: 'commerce', text: '고객 입장에선 "주문 접수 완료"가 바로 떠서 체감 속도도 좋아졌다고 해요.' },
        { who: 'senior', text: '큐 길이를 보고 워커 Auto Scaling을 걸면 처리 속도도 자동으로 따라가요. 다음 단계로 추천드려요.' },
        { who: 'lead', text: '구조적인 문제를 짚어 낸 제안이었어요. 시니어다웠어요.' },
      ],
    },
  ],
  design: {
    brief: ['행사 때 접수량이 처리 속도를 크게 앞지름', '처리 서버가 모두 멈춰도 주문 보존', '가용 영역 하나 장애에도 운영', '주문 결과는 DynamoDB에 저장'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            B('vpcEdge', 'gate', 'VPC 경계'),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 2),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [Z('appA', 'private', '프라이빗 서브넷 · 앱', 'subnet', 3)]),
                B('azB', 'az', '가용 영역 B', [Z('appB', 'private', '프라이빗 서브넷 · 앱', 'subnet', 3)]),
              ],
              'row',
            ),
          ]),
          Z('svc', 'plain', '리전 서비스', 'region', 4),
        ]),
      ]),
    ]),
    fixed: [USERS, { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }],
    fixedEdges: [['users', 'igw']],
    palette: ['alb', 'ec2Web', 'ec2Worker', 'sqs', 'sns', 'dynamodb', 'elasticache'],
    answer: {
      nodes: [
        { id: 'a1', service: 'alb', zone: 'albZone' },
        { id: 'a2', service: 'ec2Web', zone: 'appA' },
        { id: 'a3', service: 'ec2Web', zone: 'appB' },
        { id: 'a4', service: 'ec2Worker', zone: 'appA' },
        { id: 'a5', service: 'ec2Worker', zone: 'appB' },
        { id: 'a6', service: 'sqs', zone: 'svc' },
        { id: 'a7', service: 'dynamodb', zone: 'svc' },
      ],
      edges: [
        ['igw', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a3'],
        ['a2', 'a6'],
        ['a3', 'a6'],
        ['a6', 'a4'],
        ['a6', 'a5'],
        ['a4', 'a7'],
        ['a5', 'a7'],
      ],
    },
    answerNote: [
      '접수 서버는 주문을 SQS에 넣고 바로 "접수 완료"를 응답해요. 워커는 큐에서 꺼내 처리한 뒤 DynamoDB에 저장합니다.',
      '프라이빗 서브넷의 EC2가 SQS·DynamoDB에 접근하려면 NAT 게이트웨이나 VPC 엔드포인트가 필요해요. 이번 그림에서는 생략했어요.',
      '워커는 큐 길이(ApproximateNumberOfMessagesVisible) 지표로 Auto Scaling하는 구성이 일반적이에요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '📦',
      title: '평소 주문',
      desc: '주문이 접수되고 처리됩니다.',
      check: (c) => {
        if (!c.path(['users', 'igw', 'alb@albZone', 'ec2Web'])) return bad('인터넷 → ALB → 접수 서버 경로를 확인해 주세요.')
        if (c.path(['users', 'igw', 'alb', 'ec2Web', 'sqs', 'ec2Worker', 'dynamodb'])) return ok('접수 → 큐 → 처리 → 저장이 정상 동작했어요.')
        if (c.path(['ec2Web', 'sns'])) return bad('SNS는 메시지를 쌓아 두지 않고 즉시 전달해요. 워커가 꺼내 가는 대기열이 필요해요.')
        if (c.path(['ec2Web', 'ec2Worker'])) return bad('접수 서버가 처리 서버를 직접 호출하고 있어요. 지금의 문제 구조 그대로예요.')
        return bad('접수 서버 → SQS → 워커 → DynamoDB로 이어지는 경로를 만들어 주세요.')
      },
    },
    {
      id: 'sale',
      icon: '🔥',
      title: '할인 행사 폭주',
      desc: '접수량이 처리 속도의 5배로 들어옵니다.',
      load: 6,
      check: (c) => {
        if (c.linked('ec2Web', 'ec2Worker')) return bad('접수 서버와 워커가 직접 연결돼 있어 처리가 밀리면 접수도 같이 멈춰요.')
        if (!c.path(['ec2Web', 'sqs'])) return bad('접수 서버가 주문을 넣어 둘 대기열이 없어요.')
        return ok('밀린 주문은 큐에 쌓이고, 접수는 계속 빠르게 응답했어요.')
      },
    },
    {
      id: 'workers',
      icon: '💥',
      title: '워커 전체 다운',
      desc: '배포 실수로 처리 서버가 모두 내려갔습니다.',
      fail: ['svc:ec2Worker'],
      check: (c) =>
        c.path(['users', 'igw', 'alb', 'ec2Web', 'sqs'], ['svc:ec2Worker'])
          ? ok('주문은 SQS에 보존됐다가 워커 복구 후 모두 처리됐어요.')
          : bad('워커가 멈춘 동안 들어온 주문을 보관할 곳이 없어 유실됐어요.'),
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: 'AZ A의 서버가 모두 멈춥니다.',
      fail: ['azA'],
      check: (c) =>
        c.path(['users', 'igw', 'alb', 'ec2Web', 'sqs', 'ec2Worker', 'dynamodb'], ['azA'])
          ? ok('AZ B의 접수 서버와 워커로 계속 처리됐어요. SQS·DynamoDB는 리전 서비스라 AZ 장애에 영향받지 않아요.')
          : bad('AZ A가 멈추자 접수나 처리가 중단됐어요. 두 종류 서버를 모두 AZ B에도 두세요.'),
    },
  ],
}

const p10: Project = {
  id: 'bank-security',
  level: 3,
  title: '금융 이벤트 페이지 보안 강화',
  client: 'bank',
  org: '새빛저축은행',
  summary: '웹 공격 차단, DB 격리, 인터넷을 거치지 않는 S3 저장\nWAF·CloudFront·VPC 엔드포인트',
  topics: ['AWS WAF', 'CloudFront', 'VPC 엔드포인트', '보안 설계'],
  env: 'AWS',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '저축은행 이벤트 페이지예요. 오픈 전 모의해킹에서 SQL 인젝션 취약점이 나왔대요.' },
        { who: 'senior', text: '코드 수정이 우선이지만, 인프라에서도 여러 겹으로 막아야 해요. 금융권은 경로 하나하나를 물어봐요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'bank', text: '웹 공격 요청은 서버에 닿기 전에 걸러 주세요. 접속은 전국에서 몰릴 거고요.' },
        { who: 'bank', text: '앱 서버가 매일 응모 내역 보고서를 S3에 올리는데, 이 트래픽이 인터넷을 거치지 않았으면 해요. 감사 요구사항이에요.' },
        { who: 'bank', text: '물론 DB는 외부와 완전히 분리하고, AZ 장애에도 버텨야 합니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'HTTP 요청 본문에 담긴 SQL 인젝션 패턴을 탐지해 차단하려면?',
        options: [
          { id: 'a', text: '보안 그룹에서 해당 IP를 차단한다', why: '보안 그룹은 IP·포트 수준 허용 규칙이라 요청 내용을 검사하지 못해요. 차단(deny) 규칙도 없어요.' },
          { id: 'b', text: 'AWS Shield Standard를 켠다', why: 'Shield Standard는 주로 네트워크·전송 계층(L3/L4) DDoS 보호예요. SQL 인젝션 같은 애플리케이션 공격 탐지는 아니에요.' },
          { id: 'c', text: '네트워크 ACL로 80/443 포트를 막는다', why: '정상 사용자까지 모두 막혀요. 요청 내용을 구분하지 못해요.' },
          { id: 'd', text: 'AWS WAF를 CloudFront(또는 ALB)에 연결하고 SQL 인젝션 규칙을 적용한다', why: '' },
        ],
        answer: 'd',
        explain:
          'AWS WAF는 HTTP(S) 요청 내용을 보고 규칙에 따라 차단해요. AWS 관리형 규칙의 SQL 데이터베이스 규칙 그룹 등을 쓸 수 있고, CloudFront·ALB·API Gateway 등에 연결합니다.',
        hint: '요청의 "내용"을 볼 수 있는 계층(7계층)의 서비스예요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '프라이빗 서브넷 EC2가 S3에 파일을 올릴 때 인터넷을 거치지 않게 하려면?',
        options: [
          { id: 'a', text: 'NAT 게이트웨이를 둔다', why: 'NAT를 거치면 공용 S3 엔드포인트로 나가요. 데이터 처리 요금도 붙어요.' },
          { id: 'b', text: 'S3용 게이트웨이 VPC 엔드포인트를 만들고 라우팅 테이블에 연결한다', why: '' },
          { id: 'c', text: 'EC2를 퍼블릭 서브넷으로 옮긴다', why: '인터넷 노출이 늘고, 여전히 인터넷 경로로 S3에 가요.' },
          { id: 'd', text: 'S3 버킷을 퍼블릭으로 연다', why: '보안상 정반대예요.' },
        ],
        answer: 'b',
        explain:
          'S3·DynamoDB용 게이트웨이 엔드포인트는 라우팅 테이블에 경로를 추가해 AWS 네트워크 안에서 바로 접근하게 해요. 추가 요금이 없고, 엔드포인트 정책으로 접근할 버킷을 제한할 수 있어요.',
        hint: '"VPC 안에서 AWS 서비스로 바로 가는 문"을 떠올려 보세요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'bank', text: '재점검에서 인젝션 시도가 WAF에서 차단되는 로그를 확인했습니다. 보고서 업로드 경로도 감사팀이 만족했어요.' },
        { who: 'bank', text: '구성도에 경로별 설명을 달아 주신 덕분에 내부 보고가 쉬웠습니다.' },
        { who: 'lead', text: '보안 요구를 "층층이" 풀어낸 좋은 설계였어요.' },
      ],
    },
  ],
  design: {
    brief: ['웹 공격(SQL 인젝션) 요청은 서버 도달 전 차단', '전국 접속 → 엣지에서 수용', '앱 서버 → S3 보고서 업로드는 인터넷을 거치지 않게', 'DB 외부 분리, AZ 장애 대비'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('edge', 'edge', '엣지 로케이션', 'edge', 2),
        B('region', 'region', '리전 · 서울', [
          B('vpc', 'vpc', 'VPC', [
            Z('vpcEdge', 'gate', 'VPC 경계 · 게이트웨이', 'vpcEdge', 3),
            Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 2),
            B(
              'azRow',
              'plain',
              '',
              [
                B('azA', 'az', '가용 영역 A', [Z('appA', 'private', '앱 서브넷', 'subnet', 2), Z('dbA', 'private', 'DB 서브넷', 'subnet', 2)]),
                B('azB', 'az', '가용 영역 B', [Z('appB', 'private', '앱 서브넷', 'subnet', 2), Z('dbB', 'private', 'DB 서브넷', 'subnet', 2)]),
              ],
              'row',
            ),
          ]),
          Z('svc', 'plain', '리전 서비스', 'region', 2),
        ]),
      ]),
    ]),
    fixed: [USERS, { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' }],
    palette: ['cloudfront', 'waf', 'alb', 'ec2', 'rds', 'rdsStandby', 'vpce', 'natgw', 's3'],
    answer: {
      nodes: [
        { id: 'a1', service: 'cloudfront', zone: 'edge' },
        { id: 'a2', service: 'waf', zone: 'edge' },
        { id: 'a3', service: 'alb', zone: 'albZone' },
        { id: 'a4', service: 'ec2', zone: 'appA' },
        { id: 'a5', service: 'ec2', zone: 'appB' },
        { id: 'a6', service: 'rds', zone: 'dbA' },
        { id: 'a7', service: 'rdsStandby', zone: 'dbB' },
        { id: 'a8', service: 'vpce', zone: 'vpcEdge' },
        { id: 'a9', service: 's3', zone: 'svc' },
      ],
      edges: [
        ['users', 'a1'],
        ['a2', 'a1'],
        ['a1', 'igw'],
        ['igw', 'a3'],
        ['a3', 'a4'],
        ['a3', 'a5'],
        ['a4', 'a6'],
        ['a5', 'a6'],
        ['a4', 'a8'],
        ['a5', 'a8'],
        ['a8', 'a9'],
      ],
    },
    answerNote: [
      '사용자 → CloudFront(WAF 연결) → IGW → ALB → EC2 → RDS. WAF–CloudFront 선은 웹 ACL 연결을 뜻해요.',
      'ALB 보안 그룹은 CloudFront 관리형 접두사 목록만 허용하도록 해 CloudFront를 우회한 직접 접속을 막을 수 있어요.',
      'EC2 → VPC 엔드포인트 → S3 경로는 인터넷과 NAT를 거치지 않아요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🎁',
      title: '이벤트 응모',
      desc: '고객이 이벤트에 응모합니다.',
      check: (c) => {
        if (!c.path(['users', 'cloudfront@edge'])) return bad('사용자가 엣지의 CloudFront로 들어오도록 연결해 주세요.')
        if (!c.path(['users', 'cloudfront', 'igw', 'alb@albZone', 'ec2'])) return bad('CloudFront → IGW → ALB → 앱 서버로 이어지는 경로를 확인해 주세요.')
        if (!c.path(['users', 'cloudfront', 'igw', 'alb', 'ec2', 'rds'])) return bad('앱 서버가 DB와 연결되지 않았어요.')
        return ok('응모가 저장됐어요.')
      },
    },
    {
      id: 'sqli',
      icon: '🧨',
      title: "SQL 인젝션 공격 ' OR 1=1 --",
      desc: '공격자가 응모 폼에 악성 쿼리를 넣습니다.',
      check: (c) =>
        c.linked('waf', 'cloudfront') || c.linked('waf', 'alb')
          ? ok('WAF가 요청 내용을 검사해 엣지에서 차단했어요.')
          : c.has('waf')
            ? bad('WAF가 있지만 어디에도 연결되지 않았어요. CloudFront나 ALB에 연결하세요.')
            : bad('공격 요청이 그대로 서버까지 도달했어요.'),
    },
    {
      id: 'report',
      icon: '📊',
      title: '일일 보고서 업로드',
      desc: '앱 서버가 S3에 응모 내역 보고서를 올립니다.',
      check: (c) => {
        if (c.path(['ec2', 'vpce@vpcEdge', 's3'])) {
          return c.has('natgw')
            ? bad('엔드포인트 경로는 있지만 NAT 게이트웨이도 있어요. 감사 기준상 필요 없는 인터넷 출구는 없애요.')
            : ok('VPC 엔드포인트로 AWS 네트워크 안에서 업로드됐어요.')
        }
        if (c.path(['ec2', 'natgw', 'igw'])) return bad('업로드가 NAT → 인터넷 게이트웨이를 거쳐 나갔어요.')
        return bad('앱 서버에서 S3로 가는 경로가 없어요.')
      },
    },
    {
      id: 'db',
      icon: '🗝️',
      title: 'DB 외부 분리 점검',
      desc: '인터넷 쪽에서 DB에 닿는 경로가 있는지 봅니다.',
      check: (c) =>
        c.has('rds|rdsStandby', 'albZone') || c.linked('igw', 'rds') || c.linked('cloudfront', 'rds')
          ? bad('DB가 퍼블릭 영역에 있거나 외부와 직접 연결돼 있어요.')
          : ok('DB는 앱 서버하고만 통신해요.'),
    },
    {
      id: 'az',
      icon: '⚡',
      title: '가용 영역 A 장애',
      desc: '오픈 첫날 AZ A가 멈춥니다.',
      fail: ['azA'],
      check: (c) =>
        c.path(['users', 'cloudfront', 'igw', 'alb', 'ec2', 'rds|rdsStandby'], ['azA'])
          ? ok('AZ B로 서비스가 이어졌어요.')
          : bad('AZ A가 멈추자 서비스가 중단됐어요.'),
    },
  ],
}

const p11: Project = {
  id: 'edu-dr',
  level: 3,
  title: '온라인 강의 플랫폼 재해 복구',
  client: 'edu',
  org: '런업에듀',
  summary: '서울 리전 전체 장애에도 도쿄 리전으로 전환\nRoute 53 장애 조치와 리전 간 복제',
  topics: ['재해 복구(DR)', 'Route 53 장애 조치', '리전 간 복제', 'RTO/RPO'],
  env: 'AWS 멀티 리전',
  steps: [
    {
      t: 'talk',
      scene: 'office',
      lines: [
        { who: 'lead', text: '시니어 마지막 과제예요. 런업에듀가 시험 기간 중 장애에 대비한 재해 복구 체계를 원해요.' },
        { who: 'senior', text: 'AZ 장애 대비는 이미 돼 있대요. 이번엔 리전 전체가 안 되는 상황까지 보는 거예요.' },
      ],
    },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'edu', text: '시험 기간에 서비스가 멈추면 환불 사태가 나요. 서울 리전이 통째로 안 돼도 15분 안에는 다시 열려야 해요.' },
        { who: 'edu', text: '데이터는 몇 분 치 이상 잃으면 안 됩니다. 성적 데이터거든요.' },
        { who: 'edu', text: '그렇다고 도쿄에 서울과 똑같은 규모를 항상 돌릴 예산은 없어요.' },
        { who: 'me', text: '목표 복구 시간(RTO) 15분, 목표 복구 시점(RPO) 수 분으로 정리하겠습니다.' },
      ],
    },
    {
      t: 'quiz',
      scene: 'office',
      quiz: {
        who: 'senior',
        prompt: 'RTO 15분, RPO 수 분, 대기 리전은 축소 규모로 운영하고 싶어요. 가장 알맞은 DR 전략은?',
        options: [
          { id: 'a', text: '백업 및 복원', why: '비용은 가장 낮지만 장애 후 인프라를 새로 만들고 데이터를 복원해야 해서 보통 수 시간 단위의 RTO가 나와요.' },
          { id: 'b', text: '파일럿 라이트', why: '데이터는 복제해 두지만 앱 서버는 꺼져 있어 장애 시 켜고 확장해야 해요. RTO가 수십 분 이상 걸릴 수 있어요.' },
          { id: 'c', text: '웜 스탠바이', why: '' },
          { id: 'd', text: '멀티 사이트 액티브-액티브', why: 'RTO는 거의 0이지만 두 리전을 같은 규모로 운영해 비용이 가장 커요.' },
        ],
        answer: 'c',
        explain:
          '웜 스탠바이는 대기 리전에 축소된 규모의 전체 환경을 항상 켜 두고 데이터를 계속 복제해요. 장애 시 트래픽을 넘기고 규모를 키우면 되므로 분 단위 RTO가 가능해요.',
        hint: '"축소 규모로 항상 켜 둔다"는 표현에 해당하는 전략이에요.',
      },
    },
    {
      t: 'quiz',
      scene: 'lounge',
      quiz: {
        who: 'peer',
        prompt: '서울 엔드포인트가 응답하지 않으면 사용자를 자동으로 도쿄로 보내려면 Route 53에서 무엇을 쓸까요?',
        options: [
          { id: 'a', text: '상태 확인을 연결한 장애 조치(Failover) 라우팅', why: '' },
          { id: 'b', text: '단순 라우팅에 IP 두 개 등록', why: '단순 라우팅은 상태 확인을 연결할 수 없어 장애 난 쪽으로도 계속 응답이 나갈 수 있어요.' },
          { id: 'c', text: '지리적 위치 라우팅', why: '사용자 위치에 따라 나누는 방식이에요. 장애 자동 전환이 목적이 아니에요.' },
          { id: 'd', text: 'TTL을 1일로 길게 설정', why: 'TTL이 길면 오히려 전환이 늦게 반영돼요.' },
        ],
        answer: 'a',
        explain:
          '장애 조치 라우팅은 기본(Primary) 레코드의 상태 확인이 실패하면 보조(Secondary) 레코드로 응답해요. DNS 캐시 때문에 TTL은 짧게(예: 60초) 두는 것이 좋아요.',
        hint: '이름 그대로 "장애 시 넘기는" 라우팅 정책이에요.',
      },
    },
    { t: 'design' },
    {
      t: 'talk',
      scene: 'meeting',
      lines: [
        { who: 'edu', text: 'DR 훈련에서 도쿄 전환까지 12분 걸렸어요. 목표 안에 들어왔습니다!' },
        { who: 'edu', text: '복제 지연도 몇 초 수준이라 성적 데이터 걱정이 줄었어요. 정말 든든하네요.' },
        { who: 'senior', text: '전환 절차는 런북으로 정리해 두고, 분기마다 훈련하시길 권해요. DR은 연습해야 진짜예요.' },
        { who: 'lead', text: '모든 등급을 마쳤네요. 이제 어떤 고객 앞에서도 설계를 설명할 수 있겠어요.' },
      ],
    },
  ],
  design: {
    brief: ['서울 리전 전체 장애 시 15분 내 복구 (RTO)', '데이터 손실은 수 분 이내 (RPO)', '도쿄 리전은 축소 규모로 상시 대기', '강의 영상(S3)도 복제'],
    layout: B('root', 'plain', '', [
      B('out', 'outside', '인터넷 (수강생)'),
      B('cloud', 'cloud', 'AWS 클라우드', [
        Z('global', 'edge', '글로벌 · DNS', 'global', 1),
        B(
          'regions',
          'plain',
          '',
          [
            B('seoul', 'region', '리전 · 서울 (기본)', [
              Z('seoulApp', 'private', 'VPC · 앱 계층', 'subnet', 2),
              Z('seoulDb', 'private', 'VPC · DB 계층', 'subnet', 2),
              Z('seoulSvc', 'plain', '리전 서비스', 'region', 1),
            ]),
            B('tokyo', 'region', '리전 · 도쿄 (대기)', [
              Z('tokyoApp', 'private', 'VPC · 앱 계층', 'subnet', 2),
              Z('tokyoDb', 'private', 'VPC · DB 계층', 'subnet', 2),
              Z('tokyoSvc', 'plain', '리전 서비스', 'region', 1),
            ]),
          ],
          'row',
        ),
      ]),
    ]),
    fixed: [{ ...USERS, label: '수강생' }],
    palette: ['route53', 'alb', 'ec2', 'rds', 'rdsReplica', 's3', 'dx'],
    answer: {
      nodes: [
        { id: 'a1', service: 'route53', zone: 'global' },
        { id: 'a2', service: 'alb', zone: 'seoulApp' },
        { id: 'a3', service: 'ec2', zone: 'seoulApp' },
        { id: 'a4', service: 'rds', zone: 'seoulDb' },
        { id: 'a5', service: 's3', zone: 'seoulSvc' },
        { id: 'a6', service: 'alb', zone: 'tokyoApp' },
        { id: 'a7', service: 'ec2', zone: 'tokyoApp' },
        { id: 'a8', service: 'rdsReplica', zone: 'tokyoDb' },
        { id: 'a9', service: 's3', zone: 'tokyoSvc' },
      ],
      edges: [
        ['users', 'a1'],
        ['a1', 'a2'],
        ['a1', 'a6'],
        ['a2', 'a3'],
        ['a6', 'a7'],
        ['a3', 'a4'],
        ['a7', 'a8'],
        ['a4', 'a8'],
        ['a5', 'a9'],
      ],
    },
    answerNote: [
      'Route 53 장애 조치 라우팅: 서울 ALB가 기본, 도쿄 ALB가 보조예요.',
      'RDS 리전 간 읽기 복제본은 비동기 복제라 보통 지연이 짧아요. 장애 시 복제본을 승격(promote)해 쓰기 가능한 DB로 바꿉니다. Aurora Global Database를 쓰면 전환이 더 빨라요.',
      'S3–S3 연결은 리전 간 복제(CRR) 규칙이에요. 버전 관리가 켜져 있어야 해요.',
      '각 리전 안의 Multi-AZ 구성은 그림에서 생략했어요.',
    ],
  },
  scenarios: [
    {
      id: 'normal',
      icon: '🎓',
      title: '평소 수강',
      desc: '수강생이 서울 리전에서 강의를 듣습니다.',
      check: (c) => {
        if (!c.path(['users', 'route53'])) return bad('수강생이 Route 53(DNS)을 거쳐 들어오도록 연결해 주세요.')
        if (!c.path(['users', 'route53', 'alb@seoul', 'ec2@seoul', 'rds@seoul'])) return bad('서울 리전의 ALB → EC2 → RDS 경로를 확인해 주세요.')
        return ok('서울 리전에서 정상 서비스 중이에요.')
      },
    },
    {
      id: 'region',
      icon: '🌋',
      title: '서울 리전 전체 장애',
      desc: '서울 리전의 서비스들이 응답하지 않습니다.',
      fail: ['seoul'],
      check: (c) => {
        if (!c.path(['users', 'route53', 'alb@tokyo'], ['seoul'])) return bad('Route 53이 도쿄 ALB로 넘길 경로가 없어요.')
        if (!c.path(['users', 'route53', 'alb@tokyo', 'ec2@tokyo'], ['seoul'])) return bad('도쿄에 앱 서버가 없거나 연결되지 않았어요. 웜 스탠바이는 축소 규모라도 켜 둬요.')
        if (!c.path(['users', 'route53', 'alb@tokyo', 'ec2@tokyo', 'rdsReplica|rds@tokyo'], ['seoul'])) return bad('도쿄 앱 서버가 쓸 DB가 없어요.')
        return ok('상태 확인 실패 → 도쿄로 자동 전환, 복제본을 승격해 서비스가 재개됐어요.')
      },
    },
    {
      id: 'rpo',
      icon: '🧮',
      title: '데이터 손실 점검 (RPO)',
      desc: '장애 직전 성적 데이터가 도쿄에 있는지 봅니다.',
      check: (c) => {
        if (c.has('rds', 'tokyo') && !c.has('rdsReplica')) return bad('도쿄 DB가 서울과 복제로 연결돼 있지 않으면 데이터가 비어 있어요. 리전 간 읽기 복제본을 쓰세요.')
        if (!c.linked('rds', 'rdsReplica')) return bad('서울 RDS와 도쿄 복제본이 연결되지 않아 데이터가 복제되지 않아요.')
        if (c.count('s3') < 2 || !c.path(['s3@seoul', 's3@tokyo'])) return bad('강의 영상이 서울 S3에만 있어요. 도쿄 S3로 리전 간 복제를 설정하세요.')
        return ok('DB와 강의 영상이 계속 복제돼 손실이 수 초~수 분 이내였어요.')
      },
    },
    {
      id: 'cost',
      icon: '💰',
      title: '평상시 비용',
      desc: '대기 리전이 과하지 않은지 봅니다.',
      check: (c) =>
        c.has('dx')
          ? bad('Direct Connect는 데이터센터 연결용이에요. 리전 간 복제에는 필요 없어요.')
          : c.count('ec2', 'tokyo') > c.count('ec2', 'seoul')
            ? bad('도쿄가 서울보다 커요. 웜 스탠바이는 축소 규모로 운영해요.')
            : ok('도쿄는 축소 규모로 대기해 비용을 아꼈어요.'),
    },
  ],
}

export const PROJECTS: Project[] = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, ...PROJECTS2, ...PROJECTS3, ...PROJECTS4, ...PROJECTS5]

export const LEVELS = [
  { level: 1 as const, name: '신입 아키텍트', diff: '쉬움', need: 0 },
  { level: 2 as const, name: '주니어 아키텍트', diff: '보통', need: 5 },
  { level: 3 as const, name: '시니어 아키텍트', diff: '어려움', need: 5 },
]
