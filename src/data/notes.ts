// 개념 노트 (학습 탭) — 참고서 『그림으로 배우는 AWS 구조』의 기본 개념 + SAA-C03 보강
// 책 문장·그림·쪽수는 옮기지 않고 새로 정리. 구성도는 게임 프로젝트의 정답 구성 또는 이 파일의 참고 구성을 사용.
import type { Box, Design, DesignSpec, Scope } from '../types'

export interface NoteStep {
  text: string
  /** 누르면 구성도에서 강조할 노드 id */
  node?: string
}

export interface Note {
  id: string
  emoji: string
  title: string
  sub: string
  /** svc: 개념 카드에 보여 줄 서비스 아이콘 id */
  concepts: { term: string; desc: string; svc?: string }[]
  /** 개념 목록 대신 책처럼 읽는 설명글 (소제목 + 문단) */
  prose?: { h: string; p: string[] }[]
  compare?: { title: string; head: string[]; rows: string[][] }
  diagram: {
    /** 정답 구성을 불러올 프로젝트 id */
    project?: string
    spec?: DesignSpec
    design?: Design
    caption: string
    steps: NoteStep[]
  }
  keywords: { when: string; then: string }[]
  projects: string[]
}

// ── 참고 구성도 (구성도 읽는 법) ─────────────────────
const B = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: 'row' | 'col' = 'col'): Box => ({ id, kind, label, children, dir })
const Z = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 3): Box => ({ id, kind, label, zone: { scope, max } })

const refSpec: DesignSpec = {
  brief: [],
  layout: B('root', 'plain', '', [
    B('out', 'outside', '인터넷'),
    B('cloud', 'cloud', 'AWS 클라우드', [
      B('globalRow', 'plain', '', [Z('glob', 'edge', '글로벌 (DNS)', 'global', 1), Z('edge', 'edge', '엣지 로케이션', 'edge', 2)], 'row'),
      B('region', 'region', '리전 · 서울', [
        B('vpc', 'vpc', 'VPC · 10.0.0.0/16', [
          Z('vpcEdge', 'gate', 'VPC 경계', 'vpcEdge', 2),
          Z('albZone', 'public', '퍼블릭 서브넷 A·B', 'subnet', 1),
          Z('asgZone', 'group', 'Auto Scaling 그룹', 'group', 1),
          B(
            'azRow',
            'plain',
            '',
            [
              B('azA', 'az', '가용 영역 A', [Z('pubA', 'public', '퍼블릭', 'subnet', 1), Z('appA', 'private', '프라이빗 (앱)', 'subnet', 1), Z('dbA', 'private', '프라이빗 (DB)', 'subnet', 1)]),
              B('azB', 'az', '가용 영역 B', [Z('pubB', 'public', '퍼블릭', 'subnet', 1), Z('appB', 'private', '프라이빗 (앱)', 'subnet', 1), Z('dbB', 'private', '프라이빗 (DB)', 'subnet', 1)]),
            ],
            'row',
          ),
        ]),
        Z('svc', 'plain', '리전 서비스', 'region', 1),
      ]),
    ]),
  ]),
  fixed: [{ id: 'users', service: 'users', zone: 'out', label: '사용자' }],
  palette: [],
  answer: { nodes: [], edges: [] },
  answerNote: [],
}

const refDesign: Design = {
  nodes: [
    { id: 'r53', service: 'route53', zone: 'glob' },
    { id: 'cf', service: 'cloudfront', zone: 'edge' },
    { id: 'waf', service: 'waf', zone: 'edge' },
    { id: 'igw', service: 'igw', zone: 'vpcEdge', label: '인터넷 게이트웨이' },
    { id: 'vpce', service: 'vpce', zone: 'vpcEdge', label: 'S3 게이트웨이 엔드포인트' },
    { id: 'alb', service: 'alb', zone: 'albZone' },
    { id: 'asg', service: 'asg', zone: 'asgZone' },
    { id: 'natA', service: 'natgw', zone: 'pubA', label: 'NAT 게이트웨이' },
    { id: 'natB', service: 'natgw', zone: 'pubB', label: 'NAT 게이트웨이' },
    { id: 'ec2A', service: 'ec2', zone: 'appA', label: '앱 서버' },
    { id: 'ec2B', service: 'ec2', zone: 'appB', label: '앱 서버' },
    { id: 'rds', service: 'rds', zone: 'dbA', label: 'RDS 기본' },
    { id: 'stby', service: 'rdsStandby', zone: 'dbB', label: 'RDS 대기' },
    { id: 's3', service: 's3', zone: 'svc' },
  ],
  edges: [
    ['users', 'r53'],
    ['users', 'cf'],
    ['waf', 'cf'],
    ['cf', 'igw'],
    ['igw', 'alb'],
    ['alb', 'ec2A'],
    ['alb', 'ec2B'],
    ['ec2A', 'rds'],
    ['ec2B', 'rds'],
    ['rds', 'stby'],
    ['ec2A', 'natA'],
    ['ec2B', 'natB'],
    ['ec2A', 'vpce'],
    ['ec2B', 'vpce'],
    ['vpce', 's3'],
  ],
}

export const NOTES: Note[] = [
  {
    id: 'guide',
    emoji: '🧭',
    title: '구성도 읽는 법',
    sub: '상자·아이콘·선이 뜻하는 것과 읽는 순서를 알려 줘요',
    concepts: [
      { term: '상자는 서비스가 만들어진 위치', svc: 'vpcB', desc: '바깥부터 AWS 클라우드 → 리전 → VPC → 가용 영역(점선) → 서브넷 순서로 안쪽에 들어가요. 예를 들어 EC2가 "가용 영역 A" 점선 안의 "프라이빗 서브넷"에 있으면 서울 리전, 내 VPC, A 데이터센터, 인터넷과 닿지 않는 구역에 있는 서버예요. 그래서 AZ A가 멈추면 이 서버도 함께 멈춰요.' },
      { term: '초록 상자 = 퍼블릭 서브넷', svc: 'igw', desc: '인터넷 게이트웨이로 가는 길이 있어 인터넷과 직접 주고받는 구역이에요. ALB, NAT 게이트웨이처럼 바깥과 맞닿아야 하는 것을 여기에 둬요.' },
      { term: '파란 상자 = 프라이빗 서브넷', svc: 'rds', desc: '인터넷에서 바로 들어올 수 없는 구역이에요. 앱 서버와 데이터베이스처럼 숨겨 둬야 하는 것을 여기에 둬요. 문제에 "DB를 인터넷에 노출하지 않게"가 나오면 DB가 파란 상자 안에 있어야 정답이에요.' },
      { term: 'VPC 밖에 그린 서비스', svc: 's3', desc: 'S3, DynamoDB, SQS, Lambda는 VPC 밖, 리전 상자 안에 그려요. 내 네트워크 안이 아니라 AWS가 리전 단위로 운영하는 서비스라서예요. Route 53은 리전 밖, CloudFront와 WAF는 엣지에 그려요. VPC 안 서버가 이 서비스에 가려면 NAT 게이트웨이나 VPC 엔드포인트가 필요해요.' },
      { term: '아이콘 색 = 서비스 종류', svc: 'ec2', desc: '색만 봐도 무슨 일을 하는 서비스인지 알 수 있어요. 주황은 컴퓨팅(EC2, Lambda), 보라는 네트워크(ALB, Route 53), 초록은 스토리지(S3, EFS)예요. 자주색은 데이터베이스(RDS, DynamoDB), 빨강은 보안(IAM, WAF), 분홍은 애플리케이션 통합(SQS, SNS)이에요.' },
      { term: '선과 화살표 = 요청이 가는 길', svc: 'alb', desc: '흰 원이 출발점, 화살표가 도착점이에요. 응답은 같은 길로 돌아온다고 보면 돼요. 두 아이콘 사이에 선이 없으면 서로 통신하지 않는 구성이에요.' },
      { term: '읽는 순서: 사용자에서 장애까지', desc: '사용자 → 진입점 → 처리 → 저장 → 나가는 길 → 장애 상상 순서로 읽어요. 진입점은 Route 53, CloudFront, 인터넷 게이트웨이예요. 처리는 로드 밸런서와 서버, 저장은 DB와 S3, 나가는 길은 NAT 게이트웨이와 VPC 엔드포인트예요. 마지막으로 AZ A가 꺼졌을 때 반대쪽 AZ에 같은 구성이 남으면 고가용성 구성이에요.' },
    ],
    diagram: {
      spec: refSpec,
      design: refDesign,
      caption: '시험에 가장 자주 나오는 "웹 3계층 + 고가용성" 기본형이에요. 이 그림을 읽을 수 있으면 대부분의 문제 그림이 이 그림의 변형이에요.',
      steps: [
        { text: '사용자는 먼저 Route 53에서 도메인 주소를 찾아요(DNS).', node: 'r53' },
        { text: 'CloudFront가 가까운 엣지에서 정적 콘텐츠를 캐시해 응답해요. WAF가 그 앞에서 SQL 인젝션 같은 웹 공격을 걸러요.', node: 'cf' },
        { text: '인터넷 게이트웨이(IGW)는 VPC의 정문이에요. 이게 없으면 인터넷과 통신할 수 없어요.', node: 'igw' },
        { text: 'ALB는 두 AZ의 퍼블릭 서브넷에 걸쳐 있고, 상태 확인을 통과한 서버로만 요청을 나눠요.', node: 'alb' },
        { text: '앱 서버는 프라이빗 서브넷에 있어요. Auto Scaling 그룹이 부하에 따라 수를 늘리고 줄여요.', node: 'ec2A' },
        { text: 'RDS 기본 DB(AZ A)와 대기 DB(AZ B)는 Multi-AZ 동기 복제예요. 장애 시 자동으로 대기 쪽이 기본이 돼요.', node: 'rds' },
        { text: '프라이빗 서버가 인터넷으로 "나갈" 때는 같은 AZ의 NAT 게이트웨이를 거쳐요. 밖에서 먼저 들어올 수는 없어요.', node: 'natA' },
        { text: 'S3는 VPC 밖 리전 서비스예요. 게이트웨이 엔드포인트를 쓰면 인터넷·NAT 없이 AWS 내부로 가요.', node: 'vpce' },
        { text: '마지막으로 "AZ A가 통째로 꺼지면?"을 상상해 보세요. AZ B에 ALB·서버·DB·NAT가 다 남아 있으면 고가용성 구성이에요.' },
      ],
    },
    keywords: [
      { when: '"가장 비용 효율적"이라고 하면', then: '쓰는 만큼만 내는 방식(서버리스, 스팟, 수명 주기)을 고르고 필요 없는 리소스는 빼요' },
      { when: '"운영 오버헤드 최소"라고 하면', then: '관리형·서버리스 서비스(RDS, DynamoDB, Lambda, Fargate)를 골라요. 직접 스크립트를 만드는 보기는 대개 오답이에요' },
      { when: '"고가용성", "AZ 장애"가 나오면', then: '여러 AZ에 나눠 둬요(Multi-AZ, ALB + Auto Scaling)' },
      { when: '"리전 장애", "재해 복구"가 나오면', then: '다른 리전에 복제해요(리전 간 복제, Route 53 장애 조치)' },
      { when: '"디커플링", "메시지 유실 없이"가 나오면', then: 'SQS를 써요. 여러 곳에 보내야 하면 SNS 팬아웃을 더해요' },
      { when: '"인터넷을 거치지 않고"가 나오면', then: 'VPC 엔드포인트, PrivateLink, Direct Connect 중에서 골라요' },
    ],
    projects: [],
  },
  {
    id: 'basics',
    emoji: '🌏',
    title: '클라우드 기본',
    sub: '리전과 가용 영역, 공동 책임 모델, 요금 방식을 다뤄요',
    concepts: [
      { term: '리전', desc: '데이터센터가 모여 있는 지역(서울, 도쿄 등)이에요. 사용자와 가까운 곳, 법·규정(데이터 위치), 서비스 제공 여부로 골라요.' },
      { term: '가용 영역(AZ)', desc: '한 리전 안의 서로 떨어진 데이터센터 묶음이에요. 전원·네트워크가 분리돼 있어 AZ 하나가 멈춰도 다른 AZ는 살아 있어요. 서울 리전은 AZ가 4개예요.' },
      { term: '엣지 로케이션', svc: 'cloudfront', desc: '전 세계 도시에 있는 접속 지점이에요. CloudFront 캐시, Route 53, Global Accelerator 입구로 쓰여요.' },
      { term: '공동 책임 모델', desc: 'AWS는 "클라우드 자체"(데이터센터, 하드웨어, 기반 소프트웨어), 고객은 "클라우드 안"(데이터, IAM, 보안 그룹, OS 패치, 암호화 설정)을 책임져요.' },
      { term: '온디맨드', svc: 'ec2', desc: '약정 없이 쓴 만큼(초·시간 단위) 내요. 가장 유연하지만 가장 비싸요.' },
      { term: 'Savings Plans·예약 인스턴스', svc: 'ec2', desc: '1년·3년 약정으로 크게 할인받아요. 꾸준히 켜 두는 서버에 맞아요.' },
      { term: '스팟 인스턴스', svc: 'ec2Spot', desc: '남는 용량을 최대 90% 싸게 써요. 2분 알림 후 회수될 수 있어 중단돼도 되는 배치 작업에만 써요.' },
      { term: '전용 호스트', svc: 'ec2', desc: '물리 서버를 혼자 써요. 소켓·코어 단위 소프트웨어 라이선스를 가져올 때(BYOL) 골라요.' },
    ],
    compare: {
      title: '구매 옵션 고르기',
      head: ['상황', '정답'],
      rows: [
        ['1년 내내 24시간', 'Savings Plans / 예약 인스턴스'],
        ['중단돼도 되는 배치', '스팟'],
        ['짧고 예측 불가, 중단 불가', '온디맨드'],
        ['기존 라이선스(코어 단위)', '전용 호스트'],
        ['기본 사용량 + 들쭉날쭉한 추가분', '기본은 예약, 추가는 온디맨드'],
      ],
    },
    diagram: {
      project: 'fashion-ha',
      caption: '리전 하나에 가용 영역 두 개를 썼어요. "같은 것을 두 AZ에 하나씩" 두는 게 고가용성의 기본이에요.',
      steps: [
        { text: '사용자 → 인터넷 게이트웨이로 VPC에 들어와요.', node: 'igw' },
        { text: 'ALB 하나가 두 AZ에 걸쳐 있어요. 한쪽 AZ가 죽으면 남은 쪽으로만 보내요.', node: 'a1' },
        { text: 'AZ A, AZ B에 앱 서버가 하나씩 있어요.', node: 'a2' },
        { text: 'DB는 AZ A에 기본, AZ B에 대기를 둬요(Multi-AZ).', node: 'a4' },
      ],
    },
    keywords: [
      { when: '데이터를 특정 국가 안에 둬야 하면', then: '그 나라에 있는 리전을 골라요' },
      { when: '물리 서버 단위 라이선스를 가져오면', then: '전용 호스트를 써요' },
      { when: '중단돼도 되고 가장 싸야 하면', then: '스팟 인스턴스를 써요' },
    ],
    projects: ['fashion-ha'],
  },
  {
    id: 'vpc',
    emoji: '🏗️',
    title: 'VPC 네트워크',
    sub: '서브넷, 라우팅, 인터넷 게이트웨이, NAT, CIDR 설계를 다뤄요',
    concepts: [
      { term: 'VPC', svc: 'vpcB', desc: 'AWS 안에 만드는 나만의 논리적 네트워크예요. 리전 단위이고, 만드는 비용은 없어요. 처음부터 리전마다 기본 VPC(172.31.0.0/16)가 하나 있어요.' },
      { term: 'CIDR', svc: 'vpcB', desc: 'IP 범위 표기예요. /16은 65,536개, /24는 256개의 주소를 뜻해요. VPC는 /16~/28 사이로 만들고, 연결할 네트워크와 겹치면 안 돼요. 모자라면 보조 CIDR을 추가해요.' },
      { term: '서브넷', svc: 'vpcB', desc: 'VPC를 나눈 작은 네트워크로, 한 AZ에 속해요. AWS가 서브넷마다 IP 5개를 예약해서 /24 서브넷은 251개를 쓸 수 있어요.' },
      { term: '라우팅 테이블', svc: 'vpcB', desc: '서브넷의 "길 안내판"이에요. 0.0.0.0/0이 IGW로 가면 퍼블릭 서브넷, 아니면 프라이빗 서브넷이에요.' },
      { term: '인터넷 게이트웨이', svc: 'igw', desc: 'VPC와 인터넷 사이 정문이에요. 퍼블릭 IP를 가진 인스턴스의 퍼블릭 IP ↔ 프라이빗 IP 변환도 해 줘요.' },
      { term: 'NAT 게이트웨이', svc: 'natgw', desc: '프라이빗 서브넷 서버가 밖으로만 나가게 해 줘요. 퍼블릭 서브넷에 두고, AZ 단위 리소스라 AZ마다 하나씩 두는 게 권장이에요. 시간당 요금이 있어요.' },
      { term: '송신 전용 인터넷 게이트웨이', svc: 'igw', desc: 'IPv6용 "나가기만 가능한" 게이트웨이예요. IPv6에서 NAT 게이트웨이 역할을 해요.' },
    ],
    diagram: {
      project: 'firstvpc-cidr',
      caption: '퍼블릭 서브넷(초록)에는 ALB와 NAT를, 프라이빗 서브넷(파랑)에는 서버를 뒀어요. 들어오는 길과 나가는 길이 달라요.',
      steps: [
        { text: '들어오는 길은 고객 → 인터넷 게이트웨이 → 퍼블릭 서브넷의 ALB예요.', node: 'a1' },
        { text: 'ALB는 프라이빗 서브넷의 서버(AZ A, AZ B)로 요청을 나눠요.', node: 'a2' },
        { text: '나가는 길은 서버 → 같은 AZ의 NAT 게이트웨이 → 인터넷 게이트웨이예요.', node: 'a4' },
        { text: 'AZ B 서버는 AZ B의 NAT를 써요. 그래야 AZ A가 멈춰도 계속 나갈 수 있어요.', node: 'a5' },
      ],
    },
    keywords: [
      { when: '프라이빗 서브넷에서 인터넷으로 나가기만 해야 하면', then: '퍼블릭 서브넷에 NAT 게이트웨이를 둬요' },
      { when: 'NAT를 고가용성으로 하려면', then: 'AZ마다 NAT 게이트웨이를 하나씩 둬요' },
      { when: 'IPv6로 나가기만 해야 하면', then: '송신 전용 인터넷 게이트웨이를 써요' },
      { when: 'VPC의 IP가 모자라면', then: '보조 CIDR 블록을 추가해요' },
      { when: '피어링·VPN으로 연결할 VPC라면', then: '기존 대역과 겹치지 않는 CIDR을 골라요' },
    ],
    projects: ['flower-shop', 'settlement-nat', 'firstvpc-cidr', 'settle-s3-endpoint'],
  },
  {
    id: 'security',
    emoji: '🛡️',
    title: '보안 계층',
    sub: 'IAM, 보안 그룹과 네트워크 ACL, WAF와 Shield, 암호화를 다뤄요',
    concepts: [
      { term: 'IAM 사용자·그룹·정책', svc: 'iamrole', desc: '사람마다 사용자를 하나씩, 같은 업무끼리 그룹으로 묶고, 권한은 정책(JSON)으로 정의해 그룹에 붙여요. 권한은 필요한 만큼만 줘요(최소 권한).' },
      { term: 'IAM 역할', svc: 'iamrole', desc: 'EC2·Lambda 같은 서비스나 다른 계정에 임시 자격 증명으로 권한을 줘요. 액세스 키를 코드에 넣지 않아도 돼요.' },
      { term: '루트 사용자·MFA', svc: 'iamrole', desc: '루트는 계정의 모든 권한이에요. MFA를 걸고 일상 작업에 쓰지 않아요.' },
      { term: '보안 그룹', desc: '인스턴스(ENI) 단위 방화벽이에요. 허용 규칙만 있고, 상태 저장이라 응답은 자동으로 허용돼요. 다른 보안 그룹 ID를 소스로 지정할 수 있어요.' },
      { term: '네트워크 ACL', svc: 'nacl', desc: '서브넷 단위 방화벽이에요. 허용과 거부를 모두 쓸 수 있고, 번호가 작은 규칙부터 평가해요. 상태 비저장이라 응답이 나가는 임시 포트도 열어야 해요.' },
      { term: 'WAF', svc: 'waf', desc: 'HTTP 요청 내용을 보고 SQL 인젝션, XSS, 특정 국가, IP 목록을 차단해요. CloudFront·ALB·API Gateway 등에 붙여요.' },
      { term: 'Shield', svc: 'shield', desc: 'DDoS 공격을 막아 줘요. Standard는 기본으로 무료 적용돼요. Advanced는 유료이고, 대규모 공격 대응과 비용 보호, 전문 팀 지원을 받아요.' },
      { term: 'KMS', svc: 'kms', desc: '암호화 키를 관리해요. SSE-KMS는 키 권한을 나누고 사용 기록이 CloudTrail에 남아요.' },
    ],
    compare: {
      title: '보안 그룹 vs 네트워크 ACL',
      head: ['', '보안 그룹', '네트워크 ACL'],
      rows: [
        ['붙는 곳', '인스턴스', '서브넷'],
        ['규칙', '허용만', '허용 + 거부'],
        ['상태', '저장(응답 자동 허용)', '비저장(응답도 규칙 필요)'],
        ['평가', '모든 규칙 종합', '번호 작은 것부터'],
        ['시험 단서', '"웹 계층에서만 DB 접근"', '"특정 IP 차단"'],
      ],
    },
    diagram: {
      project: 'bank-security',
      caption: '바깥에서 안쪽으로 보안이 겹겹이 있어요. 각 층이 무엇을 막는지 구분하는 게 핵심이에요.',
      steps: [
        { text: 'CloudFront + WAF: 웹 요청 내용(SQL 인젝션 등)을 엣지에서 검사해요.', node: 'a2' },
        { text: '인터넷 게이트웨이 → ALB: ALB 보안 그룹은 443만, CloudFront에서 온 것만 허용할 수 있어요.', node: 'a3' },
        { text: '앱 서버 보안 그룹은 ALB 보안 그룹에서 오는 요청만 허용해요.', node: 'a4' },
        { text: 'DB 보안 그룹은 앱 서버 보안 그룹에서 오는 DB 포트만 허용해요.', node: 'a6' },
        { text: 'S3는 VPC 엔드포인트로 인터넷 없이 접근해요.', node: 'a8' },
      ],
    },
    keywords: [
      { when: '특정 IP를 바로 막아야 하면', then: '웹 서브넷의 네트워크 ACL에 거부 규칙을 넣어요' },
      { when: '특정 국가 차단이나 SQL 인젝션이 나오면', then: 'AWS WAF를 써요' },
      { when: '대규모 DDoS가 나오면', then: 'AWS Shield Advanced를 써요' },
      { when: 'EC2가 S3에 접근해야 하면', then: 'IAM 역할을 인스턴스 프로파일로 붙여요' },
      { when: '다른 계정에 접근 권한을 줘야 하면', then: '그 계정에 IAM 역할을 만들고 신뢰 정책으로 허용해요' },
      { when: '포트를 열지 않고 서버에 접속하고 기록도 남기려면', then: 'Systems Manager Session Manager를 써요' },
    ],
    projects: ['gym-session', 'bakery-nacl', 'mall-iam-role', 'app-login', 'clinic-presigned', 'bank-security'],
  },
  {
    id: 'compute',
    emoji: '🖥️',
    title: 'EC2와 확장',
    sub: 'EC2와 디스크, 로드 밸런서, Auto Scaling, 컨테이너를 다뤄요',
    concepts: [
      { term: 'EC2', svc: 'ec2', desc: '가상 서버예요. 인스턴스 유형(CPU·메모리 조합)을 고르고, AMI(서버 이미지)로 같은 서버를 찍어 낼 수 있어요.' },
      { term: 'EBS', svc: 'ebs', desc: 'EC2에 붙는 블록 디스크로 한 AZ에 속해요. 스냅샷은 S3에 저장되고 다른 AZ·리전에서 복원할 수 있어요.' },
      { term: '인스턴스 스토어', desc: '서버에 물리적으로 붙은 임시 디스크예요. 매우 빠르지만 중지·종료하면 사라져요.' },
      { term: 'ALB', svc: 'alb', desc: 'HTTP/HTTPS(7계층) 로드 밸런서예요. 경로나 호스트 이름으로 나눠 보낼 수 있고, WAF를 붙일 수 있어요.' },
      { term: 'NLB', svc: 'nlb', desc: 'TCP/UDP(4계층) 로드 밸런서예요. 지연이 매우 짧고, AZ마다 고정 IP를 쓸 수 있어요.' },
      { term: 'Auto Scaling 그룹', svc: 'asg', desc: '최소·희망·최대 개수 안에서 서버 수를 조절하고, 비정상 서버는 교체해요. 대상 추적(예: CPU 50%), 예약(정해진 시각), 단계 조정이 있어요.' },
      { term: 'ECS·Fargate', svc: 'fargate', desc: '컨테이너를 실행하는 서비스예요. Fargate는 서버 관리 없이 작업 단위로 실행해요. 이미지는 ECR에 저장해요.' },
    ],
    compare: {
      title: 'ALB vs NLB vs GWLB',
      head: ['', 'ALB', 'NLB', 'GWLB'],
      rows: [
        ['계층', '7 (HTTP)', '4 (TCP/UDP)', '3 (IP)'],
        ['쓰임', '웹·API', '게임·초저지연·고정 IP', '방화벽 장비'],
        ['시험 단서', '경로 라우팅, WAF', 'UDP, 수백만 RPS', '서드파티 보안 장비'],
      ],
    },
    diagram: {
      project: 'ticket-rush',
      caption: '트래픽 폭주에 대응하는 기본 구성이에요. ALB, Auto Scaling, 캐시, Multi-AZ DB를 함께 써요.',
      steps: [
        { text: 'ALB가 두 AZ 서버로 요청을 나눠요.', node: 'a1' },
        { text: 'Auto Scaling 그룹이 두 AZ의 앱 서브넷을 묶어 서버 수를 조절해요. 오픈 시각을 알면 예약 조정으로 미리 늘려요.', node: 'a2' },
        { text: '앱 서버는 먼저 ElastiCache에서 공연 정보를 찾아요. DB까지 가는 요청이 크게 줄어요.', node: 'a5' },
        { text: '캐시에 없을 때만 RDS를 읽어요. DB는 Multi-AZ예요.', node: 'a6' },
      ],
    },
    keywords: [
      { when: '정해진 시각에 트래픽이 늘면', then: '예약된 조정(Scheduled scaling)을 써요' },
      { when: 'CPU를 일정하게 유지하려면', then: '대상 추적 조정을 써요' },
      { when: '큐에 쌓인 작업량에 맞춰 늘리려면', then: 'SQS 대기 메시지 수를 기준으로 조정해요' },
      { when: 'UDP나 고정 IP 로드 밸런서가 필요하면', then: 'NLB를 써요' },
      { when: '서버 관리 없이 컨테이너를 돌리려면', then: 'ECS on Fargate를 써요' },
    ],
    projects: ['ticket-rush', 'codelab-schedule', 'studio-spot', 'delivery-container', 'delivery-private-ecr'],
  },
  {
    id: 'storage',
    emoji: '🗄️',
    title: '스토리지',
    sub: 'S3 클래스와 수명 주기, 파일 스토리지, Storage Gateway를 다뤄요',
    concepts: [
      { term: 'S3', svc: 's3', desc: '객체 스토리지예요. 버킷에 파일(객체)을 제한 없이 저장하고, 내구성은 99.999999999%예요. VPC 밖의 리전 서비스예요.' },
      { term: '스토리지 클래스', svc: 'glacier', desc: '자주 쓰면 Standard, 패턴을 모르면 Intelligent-Tiering을 써요. 가끔 쓰면 Standard-IA(여러 AZ)나 One Zone-IA(다시 만들 수 있는 데이터)를 써요. 보관용은 Glacier Instant·Flexible Retrieval, 가장 싼 Deep Archive 순서예요. Deep Archive는 복원에 수 시간이 걸려요.' },
      { term: '수명 주기 규칙', svc: 'glacier', desc: '"30일 후 IA로, 1년 후 Deep Archive로, 7년 후 삭제"처럼 클래스를 자동으로 옮기거나 지워요. 이전 버전, 미완료 멀티파트 업로드 정리도 할 수 있어요.' },
      { term: '버전 관리·Object Lock', svc: 's3', desc: '버전 관리는 덮어쓰기·삭제를 되돌리게 해요. Object Lock 규정 준수 모드를 쓰면 보관 기간 동안 루트 사용자도 지울 수 없어요(WORM).' },
      { term: '복제(CRR/SRR)', svc: 's3', desc: '다른 리전이나 같은 리전의 버킷으로 자동 복제해요. 버전 관리가 켜져 있어야 해요.' },
      { term: 'EBS / EFS / FSx', svc: 'efs', desc: 'EBS는 서버 한 대에 붙는 디스크로 AZ 단위예요. EFS는 여러 리눅스 서버가 함께 쓰는 NFS로 여러 AZ에 저장돼요. FSx for Windows는 SMB 파일 공유, FSx for Lustre는 고성능 계산용이에요.' },
      { term: 'Storage Gateway', svc: 'storagegw', desc: '사내에서 S3를 파일 공유(파일 게이트웨이), 디스크(볼륨), 테이프처럼 쓰게 해 주는 하이브리드 서비스예요.' },
    ],
    compare: {
      title: 'S3 클래스 고르기',
      head: ['데이터 성격', '클래스'],
      rows: [
        ['자주 읽음', 'Standard'],
        ['접근 패턴 예측 불가', 'Intelligent-Tiering'],
        ['가끔 읽지만 즉시 필요, 중요', 'Standard-IA (최소 30일, 검색 요금)'],
        ['가끔 읽음, 다시 만들 수 있음', 'One Zone-IA'],
        ['분기에 한 번, 밀리초 조회', 'Glacier Instant Retrieval'],
        ['수년 보관, 복원 12시간 OK', 'Glacier Deep Archive'],
      ],
    },
    diagram: {
      project: 'wedding-storage-class',
      caption: '같은 회사 데이터라도 성격에 따라 클래스를 나눠요. S3 사이 선은 수명 주기 규칙이에요.',
      steps: [
        { text: '원본은 처음 30일 동안 S3 Standard에서 자주 봐요.', node: 'a1' },
        { text: '30일 뒤 패턴을 모르니 Intelligent-Tiering으로 옮겨요.', node: 'a2' },
        { text: '업로드 이벤트가 Lambda를 불러 미리보기를 만들어요.', node: 'thumb' },
        { text: '다시 만들 수 있는 미리보기는 One Zone-IA에 넣어요.', node: 'a3' },
        { text: '5년 보관할 계약서는 Deep Archive에 넣어요.', node: 'a4' },
      ],
    },
    keywords: [
      { when: '액세스 패턴을 예측할 수 없으면', then: 'S3 Intelligent-Tiering을 써요' },
      { when: '루트를 포함해 누구도 삭제하면 안 되면', then: 'S3 Object Lock 규정 준수 모드를 써요' },
      { when: '여러 리눅스 서버가 파일을 공유해야 하면(POSIX)', then: 'EFS를 써요' },
      { when: 'Windows 파일 공유(SMB)가 나오면', then: 'FSx for Windows File Server를 써요' },
      { when: '사내 NAS처럼 쓰면서 S3에 저장하려면', then: 'Storage Gateway 파일 게이트웨이를 써요' },
      { when: '임시 다운로드 링크가 필요하면', then: 'S3 미리 서명된 URL을 발급해요' },
    ],
    projects: ['book-launch', 'wedding-storage-class', 'studio-backup', 'webzine-efs', 'publisher-versioning'],
  },
  {
    id: 'database',
    emoji: '🗃️',
    title: '데이터베이스',
    sub: 'RDS Multi-AZ와 읽기 복제본, Aurora, DynamoDB, 캐시를 다뤄요',
    concepts: [
      { term: 'RDS', svc: 'rds', desc: '관리형 관계형 DB예요(MySQL, PostgreSQL, MariaDB, Oracle, SQL Server). 설치·패치·백업을 AWS가 해요. 자동 백업은 최대 35일까지 보관해요.' },
      { term: 'Multi-AZ', svc: 'rdsStandby', desc: '다른 AZ에 대기 DB를 두고 동기 복제해요. 장애가 나면 같은 엔드포인트로 자동 전환돼요. 목적은 "멈추지 않게"(고가용성)예요. 인스턴스 배포에서 대기 DB는 읽기를 받지 않아요.' },
      { term: '읽기 전용 복제본', svc: 'rdsRead', desc: '비동기로 복제되는 읽기 전용 DB예요. 목적은 "빠르게"(읽기 분산)예요. 다른 리전에도 만들 수 있고, 필요하면 승격해 쓰기 DB로 바꿔요.' },
      { term: 'Aurora', svc: 'aurora', desc: 'AWS가 만든 MySQL·PostgreSQL 호환 DB예요. 스토리지를 3개 AZ에 6벌 복제하고, 리더 최대 15개, Global Database로 리전 간 복제가 빨라요. Serverless 버전은 쓴 만큼 확장해요.' },
      { term: 'DynamoDB', svc: 'dynamodb', desc: '서버리스 키-값 NoSQL이에요. 밀리초로 응답하고 자동으로 확장되며, 온디맨드와 프로비저닝 용량 모드가 있어요. DAX를 붙이면 마이크로초 캐시가 되고, 글로벌 테이블로 여러 리전에서 쓸 수 있어요.' },
      { term: 'ElastiCache', svc: 'elasticache', desc: '인메모리 캐시예요(Redis/Memcached). 반복 조회, 세션 저장에 써요.' },
      { term: 'RDS Proxy', svc: 'rdsproxy', desc: 'DB 연결을 모아 재사용해요. Lambda처럼 연결이 폭주하는 앱에 써요.' },
    ],
    compare: {
      title: 'Multi-AZ vs 읽기 전용 복제본',
      head: ['', 'Multi-AZ', '읽기 전용 복제본'],
      rows: [
        ['목적', '고가용성', '읽기 성능'],
        ['복제', '동기', '비동기'],
        ['읽기 가능', '아니요', '예'],
        ['장애 시', '자동 전환', '직접 승격'],
        ['리전', '같은 리전', '같은·다른 리전'],
      ],
    },
    diagram: {
      project: 'estate-replica',
      caption: 'Multi-AZ와 읽기 복제본을 함께 쓰는 구성이에요. 선이 어디로 이어지는지 보면 각각의 역할이 보여요.',
      steps: [
        { text: '앱 서버는 기본 DB(AZ A)에 읽고 써요.', node: 'a4' },
        { text: '대기 DB(AZ B)는 동기 복제로 따라오다 장애 시 기본이 돼요. 평소엔 아무 요청도 받지 않아요.', node: 'a5' },
        { text: '읽기 복제본은 비동기로 따라와요. 무거운 리포트 쿼리는 여기로 보내요.', node: 'a6' },
        { text: '리포트 서버는 복제본에만 연결돼 운영 DB에 부담을 주지 않아요.', node: 'report' },
      ],
    },
    keywords: [
      { when: '읽기 부하를 나누거나 리포트를 돌리려면', then: '읽기 전용 복제본을 써요' },
      { when: 'DB 자동 장애 조치가 필요하면', then: 'RDS Multi-AZ를 써요' },
      { when: '같은 데이터를 반복해서 조회하면', then: 'ElastiCache를 써요. DynamoDB라면 DAX를 써요' },
      { when: '서버리스, 밀리초 응답, 자동 확장이 함께 나오면', then: 'DynamoDB를 골라요' },
      { when: 'Lambda 때문에 DB 연결이 고갈되면', then: 'RDS Proxy를 둬요' },
      { when: 'DB 백업을 35일보다 오래 보관해야 하면', then: 'AWS Backup이나 수동 스냅샷을 써요' },
    ],
    projects: ['estate-replica', 'insure-migration', 'coupon-proxy', 'ticket-seat-lock', 'insure-aurora-failover'],
  },
  {
    id: 'serverless',
    emoji: '⚡',
    title: '서버리스와 메시징',
    sub: 'Lambda와 API Gateway, 메시징 서비스(SQS·SNS·EventBridge·Kinesis)를 다뤄요',
    concepts: [
      { term: 'Lambda', svc: 'lambda', desc: '이벤트가 오면 코드를 실행하는 서버리스 컴퓨팅이에요. 실행한 시간만큼 내고, 한 번에 최대 15분까지 실행해요.' },
      { term: 'API Gateway', svc: 'apigw', desc: 'HTTPS API의 입구예요. 인증(Cognito·Lambda 권한 부여자), 요청 제한(스로틀링), 캐시를 제공해요.' },
      { term: 'SQS', svc: 'sqs', desc: '메시지를 보관하는 큐예요(기본 4일, 최대 14일). 보내는 쪽과 처리하는 쪽을 떼어 놓아요(디커플링). 표준 큐는 처리량에 제한이 없지만 순서를 보장하지 않고, FIFO 큐는 순서를 지키고 중복을 걸러요.' },
      { term: 'SNS', svc: 'sns', desc: '구독자 모두에게 메시지를 즉시 보내요(발행·구독). SQS 여러 개를 구독시키면 팬아웃이 돼요.' },
      { term: 'EventBridge', svc: 'eventbridge', desc: '이벤트 버스와 일정(cron) 기능이 있어요. AWS 서비스 이벤트나 정해진 시간에 대상(Lambda 등)을 호출해요.' },
      { term: 'Kinesis Data Streams', svc: 'kinesis', desc: '실시간 스트림 서비스예요. 샤드별 순서 보장, 여러 소비자가 다시 읽을 수 있어요. Data Firehose는 스트림을 S3·Redshift 등에 자동 적재해요.' },
    ],
    compare: {
      title: '메시징 서비스 고르기',
      head: ['요구', '서비스'],
      rows: [
        ['쌓아 두고 천천히 처리', 'SQS'],
        ['순서 + 중복 금지', 'SQS FIFO'],
        ['여러 곳에 동시에 전달', 'SNS (+ SQS 팬아웃)'],
        ['정해진 시간에 실행', 'EventBridge 일정'],
        ['실시간 스트림, 다시 읽기', 'Kinesis Data Streams'],
        ['스트림을 S3에 적재', 'Data Firehose'],
      ],
    },
    diagram: {
      project: 'order-fanout',
      caption: '주문 1건이 세 서비스로 퍼지는 팬아웃 구성이에요. 큐가 서비스마다 있어서 하나가 멈춰도 다른 곳은 영향이 없어요.',
      steps: [
        { text: '고객의 요청은 API Gateway를 거쳐 주문 접수 Lambda로 가요.', node: 'a1' },
        { text: 'Lambda가 SNS 토픽에 "주문 생성" 메시지를 한 번 발행해요.', node: 'a3' },
        { text: 'SNS가 서비스별 SQS 큐 3개에 복사해 넣어요.', node: 'q2' },
        { text: '각 처리 Lambda가 자기 큐에서 꺼내 처리해요. 포인트 서비스가 멈춰도 메시지는 큐에 남아요.', node: 'point' },
      ],
    },
    keywords: [
      { when: '디커플링이나 트래픽 버퍼가 필요하면', then: 'SQS를 써요' },
      { when: '한 이벤트를 여러 소비자에게 보내야 하면', then: 'SNS에서 여러 SQS로 팬아웃해요' },
      { when: '순서 보장과 정확히 한 번 처리가 필요하면', then: 'SQS FIFO 큐를 써요' },
      { when: '수십만 곳에서 오는 실시간 데이터라면', then: 'Kinesis Data Streams를 써요' },
      { when: 'S3에 올라오면 자동으로 처리해야 하면', then: 'S3 이벤트 알림으로 Lambda를 호출해요' },
    ],
    projects: ['photo-thumbnail', 'survey-serverless', 'order-fanout', 'game-logs', 'scooter-stream', 'order-decouple', 'logistics-fifo', 'shop-returns-filter'],
  },
  {
    id: 'hybrid',
    emoji: '🔗',
    title: '네트워크 연결',
    sub: 'VPN과 Direct Connect, 피어링과 Transit Gateway, 엔드포인트를 다뤄요',
    concepts: [
      { term: 'Site-to-Site VPN', svc: 'vpn', desc: '인터넷 위에 IPsec 암호화 터널을 만들어요. 며칠 만에 싸게 만들 수 있어요. VPC 쪽에는 가상 프라이빗 게이트웨이(또는 TGW), 사내 쪽에는 고객 게이트웨이를 둬요.' },
      { term: 'Direct Connect', svc: 'dx', desc: 'AWS와 연결하는 전용 회선이에요. 안정적이고 대역폭이 크지만 개통에 수 주가 걸려요. 기본으로는 암호화가 없어서 필요하면 VPN을 위에 얹어요.' },
      { term: 'VPC 피어링', svc: 'peering', desc: 'VPC 두 개를 1:1로 연결해요(다른 계정·리전도 가능해요). 전이 라우팅이 안 되고 CIDR이 겹치면 안 돼요.' },
      { term: 'Transit Gateway', svc: 'tgw', desc: '여러 VPC와 VPN을 한 허브에 연결해요. VPC가 많아질 때 피어링 거미줄 대신 써요.' },
      { term: '게이트웨이 엔드포인트', svc: 'vpce', desc: 'S3와 DynamoDB 전용이에요. 라우팅 테이블에 경로를 추가하는 방식이고 무료예요.' },
      { term: '인터페이스 엔드포인트(PrivateLink)', svc: 'vpceIf', desc: '서브넷에 ENI(사설 IP)를 만들어 대부분의 AWS 서비스나 다른 계정의 서비스(NLB 뒤)에 사설로 접속해요. 시간당 요금이 있어요.' },
    ],
    compare: {
      title: '연결 방법 고르기',
      head: ['상황', '정답'],
      rows: [
        ['데이터센터 ↔ VPC, 빠르고 싸게', 'Site-to-Site VPN'],
        ['데이터센터 ↔ VPC, 안정·대용량', 'Direct Connect (+ 백업 VPN)'],
        ['VPC 2개', 'VPC 피어링'],
        ['VPC 수십~수백 개', 'Transit Gateway'],
        ['프라이빗 서버 → S3', 'S3 게이트웨이 엔드포인트'],
        ['서비스 하나만 다른 VPC에 제공', 'PrivateLink'],
      ],
    },
    diagram: {
      project: 'group-tgw',
      caption: '허브(Transit Gateway)에 VPC 3개와 본사 VPN이 모두 붙는 구조예요. 선이 전부 가운데로 모여요.',
      steps: [
        { text: '각 VPC는 Transit Gateway에 연결(attachment)만 하면 돼요.', node: 'vc' },
        { text: 'Transit Gateway가 라우팅 테이블로 누가 누구와 통신할지 정해요.', node: 'a1' },
        { text: '본사 VPN도 허브에 한 번만 붙이면 모든 VPC가 같이 써요.', node: 'a2' },
        { text: '사내 쪽 끝은 고객 게이트웨이 장비예요.', node: 'a3' },
      ],
    },
    keywords: [
      { when: '많은 VPC를 운영 효율적으로 연결하려면', then: 'Transit Gateway를 써요' },
      { when: '인터넷을 거치지 않고 S3에 가려면', then: 'S3 게이트웨이 엔드포인트를 써요' },
      { when: 'CIDR이 겹치고 서비스 하나만 공유하려면', then: 'PrivateLink를 써요' },
      { when: '일관된 네트워크 성능이 필요하면', then: 'Direct Connect를 써요' },
    ],
    projects: ['city-hybrid', 'group-tgw', 'paybridge-privatelink'],
  },
  {
    id: 'global',
    emoji: '🌐',
    title: '글로벌과 재해 복구',
    sub: 'Route 53 라우팅, CloudFront, Global Accelerator, 재해 복구 전략을 다뤄요',
    concepts: [
      { term: 'Route 53 라우팅 정책', svc: 'route53', desc: '단순, 가중치(비율), 지연 시간(가장 빠른 리전), 장애 조치(기본·보조), 지리 위치(나라별), 지리 근접, 다중 값 정책이 있어요. 상태 확인과 함께 써요.' },
      { term: 'CloudFront', svc: 'cloudfront', desc: '콘텐츠 전송 네트워크(CDN)예요. 엣지에서 캐시해 빠르게 전달해요. 원본은 S3(OAC로 보호)나 ALB를 써요. HTTPS 인증서는 us-east-1 리전의 ACM에서 받아요.' },
      { term: 'Global Accelerator', svc: 'ga', desc: '애니캐스트 고정 IP 2개를 주고, AWS 망으로 가까운 정상 엔드포인트에 연결해요. TCP와 UDP를 지원하고, DNS 캐시와 상관없이 빠르게 장애 조치해요.' },
      { term: 'RTO / RPO', desc: 'RTO는 "얼마 만에 복구하는가", RPO는 "데이터를 얼마만큼까지 잃어도 되는가"예요.' },
      { term: 'DR 4전략', desc: '백업·복원은 가장 싸지만 복구에 수 시간이 걸려요. 파일럿 라이트는 데이터만 복제하고 서버는 꺼 둬요. 웜 스탠바이는 축소 규모로 켜 둬서 분 단위로 복구해요. 멀티 사이트 액티브-액티브는 거의 바로 복구되지만 가장 비싸요.' },
    ],
    compare: {
      title: 'CloudFront vs Global Accelerator',
      head: ['', 'CloudFront', 'Global Accelerator'],
      rows: [
        ['대상', 'HTTP(S) 콘텐츠', 'TCP·UDP 앱'],
        ['캐시', '있음', '없음'],
        ['고정 IP', '없음', '애니캐스트 IP 2개'],
        ['시험 단서', '정적 파일, 지연 감소', '게임·VoIP, IP 화이트리스트'],
      ],
    },
    diagram: {
      project: 'edu-dr',
      caption: '서울(기본)과 도쿄(대기) 두 리전을 쓰는 웜 스탠바이예요. 리전 사이 선은 "복제"예요.',
      steps: [
        { text: 'Route 53 장애 조치 라우팅이 평소엔 서울로, 상태 확인에 실패하면 도쿄로 보내요.', node: 'a1' },
        { text: '서울 RDS → 도쿄 리전 간 읽기 복제본으로 계속 복제해요. 장애 시 승격해요.', node: 'a8' },
        { text: '강의 영상 S3도 도쿄 S3로 리전 간 복제(CRR)해요.', node: 'a9' },
        { text: '도쿄 앱 서버는 축소 규모로 켜 둬요(웜 스탠바이).', node: 'a7' },
      ],
    },
    keywords: [
      { when: '가장 빠른 리전으로 보내려면', then: 'Route 53 지연 시간 기반 라우팅을 써요' },
      { when: '기본 리전이 죽으면 보조로 보내려면', then: 'Route 53 장애 조치 라우팅을 써요' },
      { when: '나라별로 다른 콘텐츠를 보여 주려면', then: 'Route 53 지리 위치 라우팅을 써요' },
      { when: 'UDP, 고정 IP, 빠른 전환이 나오면', then: 'Global Accelerator를 써요' },
      { when: 'RTO는 분 단위, 비용은 적당히라면', then: '웜 스탠바이를 골라요' },
      { when: 'RTO·RPO 최소가 우선이고 비용은 상관없으면', then: '멀티 사이트 액티브-액티브를 골라요' },
    ],
    projects: ['cafe-domain', 'edu-dr', 'glowup-global', 'battle-accelerator', 'media-private-origins'],
  },
  {
    id: 'ops',
    emoji: '📋',
    title: '운영·감시·백업',
    sub: 'CloudWatch, CloudTrail, Config, Backup, Organizations를 다뤄요',
    concepts: [
      { term: 'CloudWatch', svc: 'cloudwatch', desc: '지표(CPU 등)와 로그를 모으고, 경보로 알림(SNS)이나 Auto Scaling·EC2 작업을 실행해요. "지금 상태"를 봐요. 메모리·디스크 지표는 CloudWatch 에이전트가 필요해요.' },
      { term: 'CloudTrail', svc: 'cloudtrail', desc: '"누가, 언제, 어떤 API를" 호출했는지 기록해요. 이벤트 기록은 90일, 그 이상은 추적을 만들어 S3에 보관해요.' },
      { term: 'AWS Config', svc: 'config', desc: '리소스 설정이 "어떻게 바뀌어 왔나" 기록하고, 규칙으로 위반(예: 0.0.0.0/0에 SSH)을 찾아내요.' },
      { term: 'AWS Backup', svc: 'backup', desc: 'EC2·EBS·RDS·EFS·DynamoDB 등의 백업을 계획으로 중앙 관리해요. 다른 리전·계정으로 복사하고, Vault Lock으로 삭제를 막을 수 있어요.' },
      { term: 'Organizations·SCP', svc: 'iamrole', desc: '여러 계정을 묶어 관리해요. SCP는 계정이 쓸 수 있는 권한의 상한을 정할 뿐, 권한을 주지는 않아요.' },
      { term: 'Budgets·Cost Explorer', desc: 'Budgets는 예산을 넘으면 알려 주고, Cost Explorer는 비용을 그래프로 분석해요.' },
    ],
    compare: {
      title: '헷갈리는 3총사',
      head: ['질문', '서비스'],
      rows: [
        ['누가 했나?', 'CloudTrail'],
        ['무엇이 어떻게 바뀌었나? 규칙 위반?', 'AWS Config'],
        ['지금 상태는? 임계값 넘으면 알림', 'CloudWatch'],
      ],
    },
    diagram: {
      project: 'academy-audit',
      caption: '하나의 서버를 세 서비스가 각자 다른 관점으로 지켜봐요.',
      steps: [
        { text: 'CloudTrail 추적이 모든 API 호출을 S3에 1년 보관해요.', node: 'a1' },
        { text: 'Config가 서버·보안 그룹 설정 변화를 기록하고 규칙 위반을 표시해요.', node: 'a2' },
        { text: 'CloudWatch 경보가 CPU를 보다가 기준을 넘으면 SNS로 알려요.', node: 'a3' },
        { text: 'SNS가 담당자에게 메일·문자를 보내요.', node: 'a5' },
      ],
    },
    keywords: [
      { when: 'API 호출을 감사해야 하면', then: 'CloudTrail을 써요' },
      { when: '구성 변경 추적이나 규정 준수 규칙이 나오면', then: 'AWS Config를 써요' },
      { when: '모든 계정에서 특정 작업을 막으려면', then: 'Organizations SCP를 써요' },
      { when: '계정별 비용이 기준을 넘으면 알림을 받으려면', then: 'AWS Budgets를 써요' },
      { when: '여러 서비스의 백업을 한곳에서 관리하려면', then: 'AWS Backup을 써요' },
    ],
    projects: ['academy-audit', 'precision-backup', 'academy-cpu-alarm'],
  },
]

export const noteForProject = (projectId: string) => NOTES.find((n) => n.projects.includes(projectId))
