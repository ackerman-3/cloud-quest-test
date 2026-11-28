import type { Box, Line, Project, Scenario, Scope, Step } from '../types'

const box = (id: string, kind: Box['kind'], label: string, children: Box[] = [], dir: Box['dir'] = 'col'): Box =>
  ({ id, kind, label, children, dir })
const zone = (id: string, kind: Box['kind'], label: string, scope: Scope, max = 1): Box =>
  ({ id, kind, label, zone: { scope, max } })
const layout = (...areas: Box[]) =>
  box('root', 'plain', '', [box('out', 'outside', '외부'), box('cloud', 'cloud', 'AWS 클라우드', areas)])
const region = (...areas: Box[]) => box('region', 'region', '리전 · 서울', areas)
const regional = (id: string, label: string, max = 1) => zone(id, 'plain', label, 'region', max)
const subnet = (id: string, label: string, max = 1) => zone(id, 'private', label, 'subnet', max)
const vpc = (...areas: Box[]) => box('vpc', 'vpc', 'VPC', areas, 'row')
const actor = (label: string) => ({ id: 'actor', service: 'users', zone: 'out', label })

const talk = (scene: 'office' | 'meeting', ...lines: [string, string][]): Step =>
  ({ t: 'talk', scene, lines: lines.map(([who, text]): Line => ({ who, text })) })
type Choice = [text: string, why: string]
function quiz(who: 'senior' | 'peer', prompt: string, answer: 'a' | 'b' | 'c' | 'd', choices: [Choice, Choice, Choice, Choice], explain: string, hint: string): Step {
  return {
    t: 'quiz',
    scene: who === 'senior' ? 'office' : 'lounge',
    quiz: { who, prompt, answer, explain, hint, options: choices.map(([text, why], i) => ({ id: 'abcd'[i], text, why })) },
  }
}

const path = (id: string, icon: string, title: string, desc: string, chain: string[], msg: string, retry: string, fail?: string[]): Scenario =>
  ({ id, icon, title, desc, fail, check: (c) => c.path(chain, fail) ? { ok: true, msg } : { ok: false, msg: retry } })

export const PROJECTS5: Project[] = [
  {
    id: 'publisher-versioning',
    level: 1,
    title: '덮어쓴 표지 파일 되살리기',
    client: 'publisher',
    org: '한빛나래출판',
    summary: '같은 이름으로 덮어쓰거나 실수로 삭제한 표지 복구\nS3 버전 관리와 삭제 마커',
    topics: ['S3 버전 관리', '삭제 마커'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '인쇄 직전에 표지 시안이 바뀌었대요. 출판팀에서 같은 파일 이름을 계속 쓴다고 하네요.']),
      talk('meeting', ['publisher', '덮어쓰거나 삭제해도 이전 시안을 되찾고 싶어요. 앞으로 올리는 파일부터 보호해 주세요.'], ['me', '파일 이름을 바꾸지 않고도 이전 시안을 찾아볼 수 있게 하겠습니다.']),
      quiz('senior', 'S3에서 같은 키에 올린 표지 파일의 이전 내용까지 보관하려면 어떤 기능을 켜야 할까요?', 'b', [
        ['S3 퍼블릭 액세스 차단', '공개 접근을 제한하지만 이전 내용을 보관하지는 않아요.'],
        ['S3 버전 관리', ''],
        ['S3 기본 암호화', '저장된 데이터를 암호화해요. 덮어쓰기 취소 기능은 없어요.'],
        ['S3 Intelligent-Tiering', '접근 빈도에 따라 스토리지 계층을 바꾸는 기능이에요.'],
      ], '버전 관리를 켜면 같은 키에 새 파일을 올려도 기존 버전이 남아요. 버전 ID로 원하는 시안을 찾아 읽을 수 있어요.', '파일 이름 하나에 여러 버전을 보관하는 기능을 찾아보세요.'),
      quiz('peer', '버전 관리가 켜진 버킷에서 버전 ID를 지정하지 않고 표지를 지웠어요. 직전 시안을 다시 현재 버전으로 보이게 하려면?', 'd', [
        ['버전 관리를 일시 중지한다', '현재 삭제 마커가 사라지지는 않아요.'],
        ['직전 시안의 버전 ID를 지정해 삭제한다', '복구할 시안 자체가 영구 삭제돼요.'],
        ['S3 수명 주기로 이전 버전을 만료시킨다', '이전 버전을 정리하는 설정이에요.'],
        ['현재 삭제 마커의 버전 ID를 지정해 그 마커를 삭제한다', ''],
      ], '버전 ID 없이 삭제하면 삭제 마커가 현재 버전이 돼요. 마커만 삭제하면 그 아래 버전이 다시 현재 버전으로 보입니다.', '파일 본문과 삭제 마커는 서로 다른 버전이에요.'),
      { t: 'design' },
      talk('meeting', ['publisher', '이제 편집팀에서 지난 시안도 바로 찾아볼 수 있겠어요.']),
    ],
    design: {
      brief: ['표지 업로드를 버전 관리가 설정된 버킷에 연결', '버킷은 기존 편집팀만 사용'],
      layout: layout(region(regional('storage', '표지 보관 버킷'))),
      fixed: [actor('편집팀')],
      palette: ['s3Versioned', 's3', 's3it'],
      answer: { nodes: [{ id: 'bucket', service: 's3Versioned', zone: 'storage' }], edges: [['actor', 'bucket']] },
      answerNote: ['편집팀의 인증된 S3 요청을 버전 관리가 활성화된 버킷에 연결해요.', '새 업로드의 이전 버전이 남아요. 일반 삭제를 되돌릴 때는 현재 삭제 마커만 제거해요.'],
    },
    scenarios: [
      path('overwrite', '🖼️', '표지 새 시안 업로드', '같은 파일 이름으로 시안을 한 번 더 올립니다.', ['actor', 's3Versioned@storage'], '버전 관리 버킷에 이전 시안이 남아요.', '편집팀을 버전 관리가 켜진 S3 버킷에 연결해 주세요.'),
      path('restore', '↩️', '삭제한 표지 복구', '일반 삭제 후 직전 파일을 확인합니다.', ['actor', 's3Versioned@storage'], '삭제 마커를 제거해 직전 시안을 다시 볼 수 있어요.', '삭제 마커를 제거해 복구할 수 있도록 버전 관리 버킷을 사용해 주세요.'),
    ],
  },
  {
    id: 'settle-s3-endpoint',
    level: 1,
    title: '인터넷 없이 정산 파일 보내기',
    client: 'settle',
    org: '대성물산',
    summary: '프라이빗 EC2에서 같은 리전의 S3로 파일 전송\n게이트웨이 엔드포인트와 라우팅',
    topics: ['S3 게이트웨이 엔드포인트', '라우팅 테이블'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '정산팀에서 매일 파일을 S3로 올려야 한대요. 이번 서버에는 인터넷 경로가 없어요.']),
      talk('meeting', ['settle', '같은 리전의 S3 버킷만 쓰고 있어요. NAT를 새로 운영하는 비용도 아끼고 싶습니다.']),
      quiz('senior', '프라이빗 서브넷의 EC2에서 같은 리전의 S3로 인터넷 경로 없이 연결하는 데 추가 엔드포인트 요금이 없는 방법은?', 'c', [
        ['NAT 게이트웨이를 추가한다', '퍼블릭 NAT 게이트웨이에는 인터넷 경로와 별도 비용이 필요해요.'],
        ['EC2에 퍼블릭 IP를 붙인다', '인터넷 연결 없이 S3에 접근한다는 요구와 맞지 않아요.'],
        ['S3 게이트웨이 엔드포인트를 만든다', ''],
        ['S3 인터페이스 엔드포인트를 만든다', '사설 연결은 가능하지만 엔드포인트 비용이 발생해요.'],
      ], 'S3 게이트웨이 엔드포인트는 VPC에서 같은 리전의 S3로 가는 경로를 제공합니다. 인터넷 게이트웨이나 NAT 장치가 필요 없어요.', 'S3에 쓸 수 있는 두 엔드포인트 유형의 비용을 비교해 보세요.'),
      quiz('peer', '게이트웨이 엔드포인트를 만들었는데 프라이빗 서브넷의 라우팅 테이블을 선택하지 않았어요. 무엇을 바꿔야 할까요?', 'a', [
        ['정산 서버가 있는 서브넷의 라우팅 테이블을 엔드포인트에 연결한다', ''],
        ['엔드포인트에 Elastic IP를 붙인다', '게이트웨이 엔드포인트에 퍼블릭 IP를 붙이지 않아요.'],
        ['버킷의 퍼블릭 읽기를 허용한다', '권한과 네트워크 경로는 별개예요. 공개 접근도 필요 없어요.'],
        ['기본 경로(0.0.0.0/0)를 S3로 보낸다', '게이트웨이 엔드포인트의 경로는 S3 주소 범위에만 적용돼요.'],
      ], '서브넷의 라우팅 테이블을 연결하면 S3 관리형 접두사 목록을 대상으로 하는 엔드포인트 경로가 추가돼요. 서버의 S3 쓰기 권한도 별도로 필요합니다.', 'S3로 향하는 요청의 다음 목적지를 어디에서 결정할까요?'),
      { t: 'design' },
      talk('meeting', ['settle', '인터넷 경로를 열지 않고도 정산 파일이 들어왔어요.']),
    ],
    design: {
      brief: ['프라이빗 서버에서 S3로 게이트웨이 엔드포인트를 거쳐 전송', '인터넷이나 NAT 경유 금지'],
      layout: layout(region(vpc(box('app', 'private', '프라이빗 서브넷'), zone('gate', 'gate', 'VPC 경계', 'vpcEdge')), regional('storage', '정산 보관소'))),
      fixed: [{ id: 'server', service: 'ec2', zone: 'app', label: '정산 서버' }],
      palette: ['vpce', 'igw', 's3', 's3ia'],
      answer: {
        nodes: [{ id: 'endpoint', service: 'vpce', zone: 'gate' }, { id: 'bucket', service: 's3', zone: 'storage' }],
        edges: [['server', 'endpoint'], ['endpoint', 'bucket']],
      },
      answerNote: ['정산 서버 → S3 게이트웨이 엔드포인트 → 같은 리전의 S3 버킷을 연결해요.', '서버가 속한 서브넷의 라우팅 테이블을 엔드포인트에 연결하고, 서버 역할에는 필요한 S3 쓰기만 허용해요.'],
    },
    scenarios: [
      path('upload', '📁', '정산 자료 업로드', 'EC2가 S3로 오늘 정산 자료를 보냅니다.', ['server', 'vpce@gate', 's3@storage'], '게이트웨이 엔드포인트를 통해 파일이 도착했어요.', '서버 → 게이트웨이 엔드포인트 → S3를 연결해 주세요.'),
      {
        id: 'private', icon: '🔒', title: '인터넷 경로 점검', desc: '서버에서 인터넷 관문으로 가는 연결을 확인합니다.',
        check: (c) => c.has('igw') || c.linked('server', 's3')
          ? { ok: false, msg: '인터넷 게이트웨이와 서버에서 버킷으로 바로 가는 선을 없애 주세요.' }
          : c.path(['server', 'vpce@gate', 's3@storage'])
            ? { ok: true, msg: 'S3 게이트웨이 엔드포인트를 통해서만 연결돼요.' }
            : { ok: false, msg: '인터넷 없이 S3에 닿는 게이트웨이 엔드포인트 경로가 필요해요.' },
      },
    ],
  },
  {
    id: 'academy-cpu-alarm',
    level: 1,
    title: '수강 신청 서버가 뜨거워지면',
    client: 'academy',
    org: '한빛어학원',
    summary: 'EC2 CPU가 연속으로 높을 때 운영팀에 메일\nCloudWatch 경보와 SNS',
    topics: ['CloudWatch 경보', 'EC2 CPUUtilization', 'SNS 이메일 알림'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '수강 신청 날마다 담당자가 CPU 그래프를 직접 보고 있었대요.']),
      talk('meeting', ['academy', '1분 평균 CPU가 80%를 넘는 상태가 3분 연속이면 운영팀에 메일이 왔으면 해요.']),
      quiz('senior', 'EC2 상세 모니터링이 활성화돼 있어요. CPUUtilization의 1분 평균이 3회 연속 80%를 넘을 때 경보를 울리려면?', 'd', [
        ['5분 평균 데이터 포인트 한 개를 평가한다', '5분 평균으로는 1분씩 3회 연속 넘었는지 알 수 없어요.'],
        ['1분 주기로 최근 3개 중 1개 초과를 조건으로 둔다', '한 번의 순간 상승도 경보를 울려요.'],
        ['CloudTrail에서 EC2 API 호출을 센다', 'API 호출 기록에는 CPU 사용률이 없어요.'],
        ['CloudWatch 경보에서 1분 평균, 평가 기간 3개, 경보에 필요한 데이터 포인트 3개로 설정한다', ''],
      ], '1분 평균이 80%를 초과하는 데이터 포인트가 3개 모두 있어야 ALARM 상태로 전환되도록 구성해요.', '평가하는 개수와 임계값을 넘어야 하는 개수를 따로 보세요.'),
      quiz('peer', '경보가 ALARM으로 바뀔 때 운영팀 메일로 알리려면 어떤 구성이 좋을까요?', 'b', [
        ['CloudWatch 대시보드에 이메일 주소를 적는다', '대시보드는 지표를 보여주고 메일을 보내지는 않아요.'],
        ['CloudWatch의 ALARM 작업으로 SNS 주제를 지정하고 이메일 구독을 확인한다', ''],
        ['CloudTrail을 메일에 연결한다', 'API 호출 감사와 경보 상태 알림은 다른 기능이에요.'],
        ['S3 수명 주기 규칙을 만든다', '객체 보관 규칙은 CPU 사용률을 평가하지 않아요.'],
      ], 'CloudWatch가 ALARM으로 전환되면 설정한 SNS 주제에 메시지를 보내요. 운영팀은 SNS가 보낸 이메일 구독 확인을 완료해야 합니다.', '경보를 평가하는 서비스와 메시지를 전달하는 서비스를 이어 보세요.'),
      { t: 'design' },
      talk('meeting', ['academy', '이번에는 그래프를 보고 있지 않아도 대응할 수 있겠어요.']),
    ],
    design: {
      brief: ['EC2 CPU 지표를 CloudWatch 경보로 평가', 'ALARM 상태 전환을 SNS로 운영팀에 전달'],
      layout: layout(region(vpc(box('app', 'private', '수강 신청 서브넷')), regional('ops', '모니터링·알림', 2))),
      fixed: [actor('운영팀'), { id: 'server', service: 'ec2', zone: 'app' }],
      palette: ['cloudwatch', 'sns', 'cloudtrail', 'config'],
      answer: {
        nodes: [{ id: 'alarm', service: 'cloudwatch', zone: 'ops' }, { id: 'topic', service: 'sns', zone: 'ops' }],
        edges: [['server', 'alarm'], ['alarm', 'topic'], ['topic', 'actor']],
      },
      answerNote: ['EC2의 1분 CPU 평균을 CloudWatch 경보가 평가해요. 80% 초과가 3회 연속일 때 ALARM 상태가 됩니다.', 'ALARM 작업에 SNS 주제를 지정하고 운영팀 이메일 구독을 확인해요.'],
    },
    scenarios: [
      path('metric', '📈', 'CPU 지표 평가', '신청자가 몰려 CPU 평균이 3분 연속 80%를 넘습니다.', ['server', 'cloudwatch@ops'], 'CloudWatch 경보가 지표를 평가해요.', 'EC2를 CloudWatch 경보에 연결해 주세요.'),
      path('email', '✉️', '운영팀 이메일 알림', '경보가 ALARM으로 전환됩니다.', ['server', 'cloudwatch@ops', 'sns@ops', 'actor'], 'CloudWatch 경보를 SNS가 운영팀에 전달해요.', 'EC2 → CloudWatch → SNS → 운영팀 경로를 연결해 주세요.'),
    ],
  },
  {
    id: 'logistics-fifo',
    level: 2,
    title: '배송 완료 뒤에 도착한 출발 알림',
    client: 'logistics',
    org: '한결물류',
    summary: '운송장 안에서는 순서대로, 운송장끼리는 병렬 처리\nSQS FIFO와 중복 제거',
    topics: ['SQS FIFO', 'MessageGroupId', 'MessageDeduplicationId'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '배송 완료로 표시된 짐이 몇 초 뒤 다시 배송 중으로 바뀌었대요.']),
      talk('meeting', ['logistics', '같은 운송장의 상태 변경은 발행 순서대로 처리하고 싶어요. 서로 다른 운송장은 밀리지 않으면 좋겠습니다.']),
      quiz('senior', '운송장별 순서를 유지하면서 서로 다른 운송장의 메시지는 동시에 처리하려면?', 'c', [
        ['SQS 표준 큐 하나를 사용한다', '표준 큐는 메시지 순서가 보장되지 않아요.'],
        ['FIFO 큐에서 모든 메시지에 같은 그룹 ID를 지정한다', '다른 운송장도 하나의 그룹에 묶여 그룹 단위 병렬성을 잃어요.'],
        ['FIFO 큐에서 운송장 번호를 MessageGroupId로 사용한다', ''],
        ['FIFO 큐에서 모든 이벤트마다 새 그룹 ID를 사용한다', '한 운송장의 메시지도 다른 그룹으로 흩어져요.'],
      ], 'FIFO 큐는 같은 메시지 그룹 안에서 순서를 보장해요. 발행자가 운송장별 순서에 맞춰 보내고, 운송장 번호를 그룹 ID로 사용하면 서로 다른 그룹은 병렬 처리할 수 있어요.', '순서를 지켜야 하는 단위가 배송 전체인지 운송장 한 건인지 보세요.'),
      quiz('peer', '전송 응답을 잃어 같은 배송 이벤트를 1분 뒤 재전송합니다. FIFO 큐에서 재전송을 중복으로 인식하게 하려면?', 'a', [
        ['같은 이벤트 ID를 MessageDeduplicationId로 재사용한다', ''],
        ['재시도마다 새 MessageDeduplicationId를 만든다', '큐가 별개의 메시지로 받아들여요.'],
        ['모든 이벤트의 MessageDeduplicationId를 운송장 번호로 둔다', '같은 운송장의 서로 다른 이벤트까지 중복으로 처리될 수 있어요.'],
        ['가시성 제한 시간을 늘린다', '워커가 받은 메시지를 숨기는 시간으로, 발행 재시도의 중복 제거와는 별개예요.'],
      ], '동일한 중복 제거 ID로 5분 안에 재전송하면 큐가 중복을 제거해요. 처리 후 삭제 전에 워커가 실패할 수 있으므로 소비자 쪽도 멱등하게 설계해요.', '그룹 ID는 운송장 단위, 중복 제거 ID는 이벤트 단위예요.'),
      { t: 'design' },
      talk('meeting', ['logistics', '이제 같은 운송장의 진행 상태가 순서대로 보여요.']),
    ],
    design: {
      brief: ['배송 이벤트를 처리가 끝날 때까지 큐에 보관', '운송장 안에서는 순서 유지, 서로 다른 운송장은 병렬 처리'],
      layout: layout(region(regional('queue', '배송 이벤트 큐'), regional('worker', '상태 반영 작업'))),
      fixed: [actor('배송 상태 발행 시스템')],
      palette: ['sqsFifo', 'sqs', 'sns', 'lambda'],
      answer: {
        nodes: [{ id: 'fifo', service: 'sqsFifo', zone: 'queue' }, { id: 'handler', service: 'lambda', zone: 'worker' }],
        edges: [['actor', 'fifo'], ['fifo', 'handler']],
      },
      answerNote: ['발행 시스템 → SQS FIFO → Lambda를 연결해요.', '운송장 번호를 메시지 그룹 ID로, 상태 변경 이벤트 ID를 중복 제거 ID로 사용해요. Lambda에서도 같은 이벤트를 여러 번 적용하지 않게 처리해요.'],
    },
    scenarios: [
      path('order', '📦', '운송장별 변경 순서', '한 운송장에 출발과 도착 이벤트를 차례로 보냅니다.', ['actor', 'sqsFifo@queue', 'lambda@worker'], 'FIFO 큐가 운송장별 순서를 유지해 워커에 전달해요.', '발행 시스템에서 SQS FIFO 큐를 거쳐 Lambda로 연결해 주세요.'),
      path('parallel', '🚚', '여러 운송장 동시 처리', '여러 운송장의 변경이 함께 들어옵니다.', ['actor', 'sqsFifo@queue', 'lambda@worker'], '운송장별 메시지 그룹을 여러 개 처리할 수 있어요.', '메시지 그룹을 사용하는 FIFO 큐를 워커에 연결해 주세요.'),
    ],
  },
  {
    id: 'shop-returns-filter',
    level: 2,
    title: '반품 알림이 다른 팀에도 쌓여요',
    client: 'shop2',
    org: '데일리박스',
    summary: '이벤트 종류별로 다른 작업 큐에 전달하고 감사팀은 전체 수신\nSNS 구독 필터와 SQS',
    topics: ['SNS 구독 필터 정책', '메시지 속성', 'SQS'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '반품 담당자가 반품보다 배송 이벤트를 더 많이 지우고 있대요.']),
      talk('meeting', ['shop2', '발행 시스템은 한 곳에 계속 보내고 싶어요. 배송팀과 반품팀은 자기 업무만, 감사팀은 전부 받아야 합니다.']),
      quiz('senior', 'SNS 주제 하나에 모든 이벤트를 발행하고 있어요. 큐에 쌓이기 전에 팀별로 나누려면?', 'b', [
        ['모든 큐가 받은 뒤 워커가 종류를 확인한다', '불필요한 이벤트가 이미 각 큐에 들어온 뒤예요.'],
        ['배송·반품 SQS 구독에 각각 종류별 SNS 필터를 적용하고 감사 구독에는 필터를 두지 않는다', ''],
        ['SNS 주제 전체에 반품 필터 하나를 적용한다', '필터는 구독마다 설정해요. 감사팀은 전체 이벤트를 받아야 해요.'],
        ['큐 하나에 세 팀을 소비자로 연결한다', '소비자끼리 메시지를 나눠 가져 감사팀이 전체를 받지 못해요.'],
      ], 'SNS는 각 구독의 필터를 평가해 일치하는 구독에만 복사본을 전달해요. 필터가 없는 감사 구독은 전부 받아요.', '같은 주제 안에서도 구독마다 받을 메시지를 정할 수 있어요.'),
      quiz('peer', '이벤트 종류가 SNS 메시지의 type 속성에 들어 있어요. 본문은 변경할 수 없을 때 필터 범위는 무엇으로 설정할까요?', 'd', [
        ['MessageBody로 설정한다', '본문에는 필요한 type 값이 없어요.'],
        ['큐의 가시성 제한 시간으로 종류를 구분한다', '일시적으로 메시지를 숨기는 설정이에요.'],
        ['메시지 보존 기간에 종류를 적는다', '보존 기간은 큐에 메시지를 얼마나 보관할지 정해요.'],
        ['MessageAttributes로 설정하고 type 값을 필터링한다', ''],
      ], 'MessageAttributes 범위의 필터는 메시지 속성을 평가해요. 배송 구독에 shipment, 반품 구독에 return을 설정합니다.', '발행자가 type을 담는 위치와 필터가 보는 위치를 맞춰 보세요.'),
      { t: 'design' },
      talk('meeting', ['shop2', '반품 큐에는 반품만 들어오고 감사팀 기록에도 빠진 게 없어요.']),
    ],
    design: {
      brief: ['SNS 주제 하나로 이벤트를 발행', '배송·반품·감사 팀별 SQS 큐를 구독에 연결'],
      layout: layout(region(regional('topic', '주제'), box('queues', 'plain', '', [regional('shipping', '배송 필터'), regional('returns', '반품 필터'), regional('audit', '감사 · 필터 없음')], 'row'))),
      fixed: [actor('주문 이벤트 발행 시스템')],
      palette: ['sns', 'sqs', 'lambda', 'eventbridge'],
      answer: {
        nodes: [{ id: 'sns', service: 'sns', zone: 'topic' }, { id: 'ship', service: 'sqs', zone: 'shipping' }, { id: 'ret', service: 'sqs', zone: 'returns' }, { id: 'auditQueue', service: 'sqs', zone: 'audit' }],
        edges: [['actor', 'sns'], ['sns', 'ship'], ['sns', 'ret'], ['sns', 'auditQueue']],
      },
      answerNote: ['같은 SNS 주제에 SQS 큐 세 개를 구독시켜요. 각 큐의 정책은 해당 SNS 주제의 메시지 전달을 허용해요.', '배송·반품 구독에는 메시지 속성 필터를 두고 감사 구독에는 필터를 두지 않아요. 구성도의 각 영역은 해당 구독 설정을 나타내요.'],
    },
    scenarios: [
      path('shipment', '📦', '배송 이벤트', 'type=shipment 이벤트를 발행합니다.', ['actor', 'sns@topic', 'sqs@shipping'], '배송 구독의 필터가 일치해요.', 'SNS에서 배송 필터를 적용할 SQS 큐로 연결해 주세요.'),
      path('return', '↩️', '반품 이벤트', 'type=return 이벤트를 발행합니다.', ['actor', 'sns@topic', 'sqs@returns'], '반품 구독의 필터가 일치해요.', 'SNS에서 반품 필터를 적용할 SQS 큐로 연결해 주세요.'),
      path('audit', '📋', '감사 기록', '감사용 구독에서 두 종류 모두 확인합니다.', ['actor', 'sns@topic', 'sqs@audit'], '필터 없는 감사 구독이 모든 이벤트를 받아요.', 'SNS에서 감사 SQS 큐로도 연결해 주세요.'),
    ],
  },
  {
    id: 'ticket-seat-lock',
    level: 2,
    title: '마지막 한 자리에 두 장이 팔렸어요',
    client: 'ticket',
    org: '스테이지원',
    summary: '동일 좌석의 동시 요청 중 하나만 성공\nDynamoDB 조건부 쓰기',
    topics: ['DynamoDB', '조건부 쓰기', 'attribute_not_exists'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '예매 사이트가 두 관객에게 같은 좌석을 배정했대요.']),
      talk('meeting', ['ticket', '좌석별 최초 예약만 성공해야 해요. 좌석 하나를 항목 하나로 저장하는 DynamoDB는 그대로 쓰고 싶습니다.']),
      quiz('senior', '예약 테이블의 파티션 키는 공연 ID와 좌석 번호를 조합한 seatKey입니다. 같은 좌석을 동시에 요청할 때 첫 쓰기만 성공시키려면?', 'c', [
        ['GetItem으로 빈 좌석인지 읽은 뒤 조건 없이 PutItem한다', '두 요청이 쓰기 전에 모두 빈 좌석이라고 읽을 수 있어요.'],
        ['PutItem 요청마다 파티션 키에 랜덤 값을 붙인다', '같은 좌석이 서로 다른 항목으로 저장돼요.'],
        ['PutItem에 attribute_not_exists(seatKey) 조건을 지정한다', ''],
        ['DynamoDB 읽기에 DAX 캐시를 붙인다', '읽기 속도 개선으로는 중복 쓰기를 막을 수 없어요.'],
      ], 'DynamoDB가 항목 존재 여부를 쓰기 조건으로 함께 평가해요. 동일한 seatKey에 이미 예약이 있으면 다음 PutItem은 실패합니다.', '조회와 쓰기 사이에 다른 요청이 들어오는 상황을 생각해 보세요.'),
      quiz('peer', '동일 좌석의 두 번째 요청이 ConditionalCheckFailedException을 받았어요. 예매 API는 어떻게 처리할까요?', 'b', [
        ['조건 없이 다시 써서 예약을 완료한다', '첫 예약을 덮어써요.'],
        ['해당 좌석이 이미 예약됐다는 충돌 응답을 반환한다', ''],
        ['같은 공연의 모든 요청을 실패시킨다', '다른 좌석은 예약할 수 있어야 해요.'],
        ['DynamoDB의 쓰기 용량을 높이고 같은 예약을 확정한다', '용량 부족이 아니라 쓰기 조건이 거절된 상황이에요.'],
      ], '조건 실패는 해당 좌석에 이미 항목이 있다는 뜻이에요. API는 예약 실패를 반환하고 관객이 다른 좌석을 선택할 수 있게 해요.', '오류가 요청 과다 때문인지, 이미 있는 항목 때문인지 보세요.'),
      { t: 'design' },
      talk('meeting', ['ticket', '한 좌석에 한 명만 예약되고 옆 좌석은 따로 살 수 있어요.']),
    ],
    design: {
      brief: ['API에서 Lambda를 호출해 좌석별 조건부 쓰기', 'DynamoDB에 같은 좌석의 중복 예약 금지'],
      layout: layout(region(regional('api', '예매 API'), regional('worker', '조건부 쓰기 처리'), regional('table', '좌석 예약 테이블'))),
      fixed: [actor('예매 고객')],
      palette: ['apigw', 'lambda', 'dynamodb', 's3', 'sns'],
      answer: {
        nodes: [{ id: 'apiNode', service: 'apigw', zone: 'api' }, { id: 'handler', service: 'lambda', zone: 'worker' }, { id: 'db', service: 'dynamodb', zone: 'table' }],
        edges: [['actor', 'apiNode'], ['apiNode', 'handler'], ['handler', 'db']],
      },
      answerNote: ['API Gateway → Lambda → DynamoDB 순서로 연결해요.', 'Lambda에서 좌석마다 고유한 seatKey로 조건부 PutItem을 실행하고 기존 항목이 있으면 충돌로 응답해요.'],
    },
    scenarios: [
      path('book', '🎟️', '빈 좌석 예약', '관객이 아직 예약되지 않은 좌석을 선택합니다.', ['actor', 'apigw@api', 'lambda@worker', 'dynamodb@table'], '예약 함수에서 좌석 항목을 처음으로 저장해요.', '관객 → API Gateway → 예약 Lambda → DynamoDB를 연결해 주세요.'),
      path('collision', '🪑', '같은 좌석 동시 예약', '관객 두 명이 같은 좌석을 선택합니다.', ['actor', 'apigw@api', 'lambda@worker', 'dynamodb@table'], '구성도에서 조건부 쓰기를 맡은 함수가 같은 좌석의 두 번째 저장을 거부해요.', '조건부 쓰기를 맡는 Lambda를 API와 DynamoDB 사이에 배치해 주세요.'),
    ],
  },
  {
    id: 'media-private-origins',
    level: 3,
    title: '웹진 이미지와 내 서재를 한 주소로',
    client: 'media',
    org: '웹진 플랫',
    summary: '정적 이미지와 개인 API를 같은 도메인에서 분리\nCloudFront 경로 동작, OAC, 캐시 정책',
    topics: ['CloudFront 캐시 동작', 'OAC', 'S3 퍼블릭 액세스 차단'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '웹진 팀이 이미지 전송은 빨라지고 로그인 API는 지금처럼 안전하길 원해요.']),
      talk('meeting', ['media', '한 도메인에서 /images/*는 비공개 S3 버킷으로, /api/*는 기존 ALB로 보내 주세요. API 응답에는 개인별 읽기 목록이 들어갑니다.']),
      quiz('senior', 'S3 버킷을 공개하지 않고 지정한 CloudFront 배포만 이미지에 접근하려면?', 'b', [
        ['S3 웹 사이트 엔드포인트에 OAC를 적용한다', '웹 사이트 엔드포인트는 사용자 지정 오리진으로 취급되어 OAC를 쓸 수 없어요.'],
        ['S3 버킷 오리진에 OAC를 적용하고 버킷 정책에서 해당 배포만 읽도록 허용한다', ''],
        ['CloudFront 인증서만 발급한다', '뷰어와 CloudFront 간 HTTPS가 S3 읽기 권한을 주지는 않아요.'],
        ['버킷을 공개하고 주소를 숨긴다', '버킷 주소를 알면 CloudFront를 우회할 수 있어요.'],
      ], 'OAC는 CloudFront의 S3 오리진 요청에 서명해요. 버킷 정책에서 CloudFront 서비스 보안 주체에 해당 배포 ARN을 조건으로 읽기를 허용하고 공개 접근 차단을 유지해요.', 'S3 웹 사이트 엔드포인트와 일반 버킷 오리진을 구분해 보세요.'),
      quiz('peer', '기존 ALB 뒤 API는 Authorization 헤더로 사용자를 확인합니다. 이미지 캐시는 살리고 개인별 API 응답의 공유는 막으려면?', 'c', [
        ['이미지와 API를 모두 이미지용 캐시 정책으로 처리한다', '인증 정보에 따라 달라지는 응답이 공유될 수 있어요.'],
        ['/api/*도 S3 오리진으로 보낸다', 'S3에는 개인 읽기 목록을 만드는 API가 없어요.'],
        ['경로별 오리진을 나누고 /api/*는 캐시를 끄며 인증 헤더를 전달한다', ''],
        ['API 캐시를 끄고 인증 헤더도 제거한다', '오리진이 사용자를 인증할 수 없어요.'],
      ], '/images/*는 S3로 보내 캐시해요. /api/*는 ALB로 보내고 캐싱을 끈 다음, Authorization을 포함한 뷰어 헤더를 전달하는 오리진 요청 정책을 사용해요.', '캐시 여부와 오리진에 전달해야 할 요청 정보는 서로 다른 설정이에요.'),
      { t: 'design' },
      talk('meeting', ['media', '표지는 빨리 뜨고 로그인하면 각자 자기 읽기 목록이 보여요.']),
    ],
    design: {
      brief: ['CloudFront 배포 하나로 두 경로를 제공', '/images/* → 비공개 S3 오리진', '/api/* → 기존 ALB로 전달하고 캐시 미사용'],
      layout: layout(zone('edge', 'edge', '엣지', 'edge'), region(regional('images', '/images/* · OAC 적용'), vpc(box('api', 'public', '/api/* · 기존 ALB')))),
      fixed: [actor('웹진 독자'), { id: 'apiAlb', service: 'alb', zone: 'api' }],
      palette: ['cloudfront', 's3', 'waf', 's3it'],
      answer: {
        nodes: [{ id: 'cdn', service: 'cloudfront', zone: 'edge' }, { id: 'bucket', service: 's3', zone: 'images' }],
        edges: [['actor', 'cdn'], ['cdn', 'bucket'], ['cdn', 'apiAlb']],
      },
      answerNote: ['CloudFront의 /images/* 동작은 비공개 S3 버킷을 사용해요. OAC와 배포 ARN으로 제한한 버킷 정책을 적용해요.', '/api/* 동작은 ALB를 대상으로 하고 캐시를 끈 뒤 Authorization 헤더를 전달해요.'],
    },
    scenarios: [
      {
        id: 'image', icon: '🖼️', title: '표지 이미지 요청', desc: '독자가 /images/cover.jpg를 조회합니다.',
        check: (c) => c.linked('actor', 's3') || c.linked('apiAlb', 's3')
          ? { ok: false, msg: '이미지 버킷은 CloudFront 오리진으로만 연결해 주세요.' }
          : c.path(['actor', 'cloudfront@edge', 's3@images'])
            ? { ok: true, msg: '표지는 CloudFront를 거쳐 비공개 S3에서 제공돼요.' }
            : { ok: false, msg: '독자 → CloudFront → 이미지 S3 오리진 경로가 필요해요.' },
      },
      path('api', '🔑', '개인 읽기 목록', '로그인한 독자가 /api/reading-list를 요청합니다.', ['actor', 'cloudfront@edge', 'apiAlb'], 'API 경로는 ALB로 전달돼요. 이 동작에서는 응답 캐시를 끕니다.', 'CloudFront를 API의 기존 ALB에도 연결해 주세요.'),
    ],
  },
  {
    id: 'delivery-private-ecr',
    level: 3,
    title: '사설 서브넷에서 새 컨테이너가 안 떠요',
    client: 'delivery',
    org: '빠른식탁',
    summary: '인터넷 경로 없이 Fargate 태스크의 ECR 이미지 시작\nECR API·레지스트리, S3 이미지 레이어',
    topics: ['ECS Fargate', 'ECR VPC 엔드포인트', 'S3 게이트웨이 엔드포인트'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '배달 팀이 인터넷 경로를 뺀 뒤부터 새 버전 태스크를 못 띄운대요.']),
      talk('meeting', ['delivery', 'Linux Fargate 1.4.0 이상을 사용해요. 같은 리전의 프라이빗 ECR에 이미지가 있고 기존 로깅 경로는 별도로 준비되어 있습니다. NAT 없이 이미지를 받아야 해요.']),
      quiz('senior', 'Fargate 태스크가 ECR 프라이빗 저장소에서 이미지를 받기 위해 필요한 엔드포인트 조합은?', 'd', [
        ['ECR API 인터페이스 엔드포인트 하나', '레지스트리와 S3 이미지 레이어에도 접근해야 해요.'],
        ['ECR 레지스트리 인터페이스 엔드포인트와 S3 게이트웨이 엔드포인트', 'Linux Fargate 1.4.0 이상에는 ECR API 엔드포인트도 필요해요.'],
        ['ECR API와 ECR 레지스트리 인터페이스 엔드포인트만', '이미지 레이어를 내려받는 S3 경로도 필요해요.'],
        ['ECR API·레지스트리 인터페이스 엔드포인트와 S3 게이트웨이 엔드포인트', ''],
      ], 'ecr.api와 ecr.dkr은 ECR API와 레지스트리에 사설 접근하게 해요. 이미지 레이어는 S3에 있으므로 태스크 서브넷에서 S3로 가는 경로도 필요해요.', '이미지 요청을 받는 서비스와 레이어 파일을 저장하는 서비스가 달라요.'),
      quiz('peer', '엔드포인트는 모두 있고 실행 역할 권한도 정상입니다. 기본 ECR 호스트 이름을 사용할 때 필요한 DNS·보안 그룹 설정은?', 'a', [
        ['ECR 인터페이스 엔드포인트의 프라이빗 DNS를 켜고 엔드포인트에 태스크 보안 그룹에서 오는 TCP 443을 허용한다', ''],
        ['태스크의 인바운드 TCP 443만 인터넷 전체에 연다', '태스크가 엔드포인트에 나가는 연결을 만드는 상황이에요.'],
        ['S3 게이트웨이 엔드포인트의 ENI 보안 그룹을 수정한다', '게이트웨이 엔드포인트는 라우팅 테이블에 연결해요.'],
        ['ECR 프라이빗 DNS를 끄고 기본 이름은 그대로 쓴다', '기본 이름을 엔드포인트의 사설 IP로 해석해야 해요.'],
      ], '프라이빗 DNS는 기본 ECR 이름을 인터페이스 엔드포인트의 사설 IP로 해석하게 해요. 엔드포인트 보안 그룹은 태스크에서 오는 HTTPS를 허용해야 합니다.', 'TCP 연결을 받는 쪽은 태스크가 아니라 엔드포인트예요.'),
      { t: 'design' },
      talk('meeting', ['delivery', '새 태스크가 외부 인터넷 경로 없이 이미지를 내려받았어요.']),
    ],
    design: {
      brief: ['Fargate에서 ECR API·레지스트리로 각각 사설 연결', '이미지 레이어는 S3 게이트웨이 엔드포인트를 사용'],
      layout: layout(region(
        box('vpc', 'vpc', 'VPC', [
          box('tasks', 'private', '태스크 서브넷'),
          box('endpoints', 'plain', '', [subnet('ecrApi', 'ecr.api'), subnet('ecrDkr', 'ecr.dkr'), zone('gate', 'gate', 'S3 경로', 'vpcEdge')], 'row'),
        ]),
        box('aws', 'plain', 'ECR · S3'),
      )),
      fixed: [{ id: 'task', service: 'fargate', zone: 'tasks' }, { id: 'registry', service: 'ecr', zone: 'aws' }, { id: 'layers', service: 's3', zone: 'aws', label: 'ECR 이미지 레이어' }],
      palette: ['vpceIf', 'vpce', 'igw', 'natgw'],
      answer: {
        nodes: [{ id: 'apiEndpoint', service: 'vpceIf', zone: 'ecrApi' }, { id: 'dkrEndpoint', service: 'vpceIf', zone: 'ecrDkr' }, { id: 's3Endpoint', service: 'vpce', zone: 'gate' }],
        edges: [['task', 'apiEndpoint'], ['apiEndpoint', 'registry'], ['task', 'dkrEndpoint'], ['dkrEndpoint', 'registry'], ['task', 's3Endpoint'], ['s3Endpoint', 'layers']],
      },
      answerNote: ['태스크 → ecr.api 및 ecr.dkr 인터페이스 엔드포인트 → ECR을 연결해요. 두 ECR 칸은 엔드포인트의 종류를 나타내며 별도 서브넷 사용을 요구하지 않아요.', '이미지 레이어는 태스크 서브넷의 라우팅 테이블에 연결된 S3 게이트웨이 엔드포인트로 받아요.'],
    },
    scenarios: [
      path('auth', '🔑', 'ECR API 인증', '태스크가 ECR 인증 정보를 요청합니다.', ['task', 'vpceIf@ecrApi', 'registry'], '사설 ECR API 경로가 준비됐어요.', 'ecr.api 인터페이스 엔드포인트를 태스크와 ECR에 연결해 주세요.'),
      path('manifest', '📦', '이미지 매니페스트 요청', '태스크가 레지스트리에서 매니페스트를 요청합니다.', ['task', 'vpceIf@ecrDkr', 'registry'], '사설 레지스트리 경로가 준비됐어요.', 'ecr.dkr 인터페이스 엔드포인트를 태스크와 ECR에 연결해 주세요.'),
      {
        id: 'layers', icon: '📥', title: '사설 이미지 레이어 다운로드', desc: '인터넷 없이 S3의 이미지 레이어를 내려받습니다.',
        check: (c) => c.has('igw') || c.has('natgw') || c.linked('task', 'layers')
          ? { ok: false, msg: '인터넷 관문·NAT·직접 연결을 제거하고 S3 게이트웨이 엔드포인트만 사용해 주세요.' }
          : c.path(['task', 'vpce@gate', 'layers'])
            ? { ok: true, msg: 'S3 게이트웨이 엔드포인트를 통해 레이어를 내려받아요.' }
            : { ok: false, msg: '태스크에서 S3 게이트웨이 엔드포인트를 거쳐 레이어 저장소로 연결해 주세요.' },
      },
    ],
  },
  {
    id: 'insure-aurora-failover',
    level: 3,
    title: '청구 접수는 살리고 보고서는 분리하기',
    client: 'insure',
    org: '한결손해보험',
    summary: 'AZ 장애 뒤 쓰기 재연결, 평소에는 보고서 읽기 분리\nAurora 리더와 클러스터 엔드포인트',
    topics: ['Aurora Replica', 'Aurora 클러스터 엔드포인트', '리더 엔드포인트', 'AZ 장애 조치'],
    env: 'AWS',
    steps: [
      talk('office', ['lead', '청구 집중 기간에 보고서가 접수 DB까지 느리게 만든대요.']),
      talk('meeting', ['insure', 'Aurora PostgreSQL을 쓰고 있어요. 평소에는 보고서 조회를 쓰기 인스턴스에서 덜어 내고, DB가 있는 AZ에 장애가 나도 접수가 다시 이어져야 합니다.']),
      quiz('senior', '다른 AZ에 Aurora Replica를 준비했어요. 접수 앱이 승격된 쓰기 인스턴스에 재연결하려면 어떤 주소를 사용해야 할까요?', 'c', [
        ['기존 쓰기 인스턴스의 인스턴스 엔드포인트', '기존 인스턴스에 묶인 주소라 승격된 인스턴스를 따라가지 않아요.'],
        ['Aurora 리더 엔드포인트', '읽기 인스턴스로 연결을 나누는 용도예요.'],
        ['Aurora 클러스터(라이터) 엔드포인트', ''],
        ['기존 쓰기 인스턴스의 사설 IP', '승격 시 그 인스턴스의 주소로 자동 변경되지 않아요.'],
      ], '클러스터 엔드포인트는 현재 라이터를 가리켜요. 장애 조치 후에는 기존 연결을 다시 맺고 DNS가 새 라이터 주소를 가리키도록 해야 해요.', '인스턴스 하나의 주소와 역할을 따라가는 주소를 구분해 보세요.'),
      quiz('peer', '리더가 두 대 있을 때 보고서 연결을 여러 리더에 나누면서 추가·삭제를 따라가려면?', 'b', [
        ['보고서도 라이터 엔드포인트로만 연결한다', '평소에 쓰기 인스턴스 부하를 덜어 낼 수 없어요.'],
        ['Aurora 리더 엔드포인트에 연결한다', ''],
        ['보고서 전체를 리더 한 대의 인스턴스 엔드포인트에 고정한다', '다른 리더로 연결을 나누지 못해요.'],
        ['쿼리마다 접수 앱의 DB 연결을 공유한다', '같은 라이터의 연결을 공유하면 읽기 부하 분리가 되지 않아요.'],
      ], '리더 엔드포인트는 새 연결을 사용 가능한 Aurora Replica에 나눠요. 기존 연결의 각 쿼리를 리더마다 분산시키는 방식은 아니에요.', '리더가 늘고 줄어도 앱에서 주소를 바꾸지 않는 방법을 찾아보세요.'),
      { t: 'design' },
      talk('meeting', ['insure', '보고서가 돌아가는 중에도 접수가 버텼고, 장애 훈련 뒤에는 앱이 새 라이터로 재연결됐어요.']),
    ],
    design: {
      brief: ['Aurora 라이터와 리더를 서로 다른 AZ에 배치', '접수 서버는 라이터로, 보고서 서버는 리더로 연결', '라이터 AZ 장애 시 다른 AZ에서 쓰기 재개'],
      layout: layout(region(box('vpc', 'vpc', 'VPC', [
        box('clients', 'private', '접수·보고서 앱 서브넷'),
        box('database', 'plain', '', [
          box('azA', 'az', '가용 영역 A', [subnet('writer', '라이터 서브넷')]),
          box('azB', 'az', '가용 영역 B', [subnet('readerB', '리더 서브넷')]),
          box('azC', 'az', '가용 영역 C', [subnet('readerC', '리더 서브넷')]),
        ], 'row'),
      ]))),
      fixed: [{ id: 'claims', service: 'ec2', zone: 'clients', label: '청구 접수' }, { id: 'reports', service: 'ec2', zone: 'clients', label: '보고서' }],
      palette: ['aurora', 'rds', 'rdsRead', 'rdsproxy'],
      answer: {
        nodes: [{ id: 'primary', service: 'aurora', zone: 'writer', label: 'Aurora 라이터' }, { id: 'replicaB', service: 'aurora', zone: 'readerB', label: 'Aurora 리더 B' }, { id: 'replicaC', service: 'aurora', zone: 'readerC', label: 'Aurora 리더 C' }],
        edges: [['claims', 'primary'], ['primary', 'replicaB'], ['primary', 'replicaC'], ['reports', 'replicaB'], ['reports', 'replicaC']],
      },
      answerNote: ['Aurora 인스턴스 사이의 선은 동일 클러스터 소속을 나타내요. 앱 서브넷은 DB 장애의 영향 범위 밖으로 단순화해 표시했어요.', '청구 앱은 클러스터 엔드포인트, 보고서 앱은 리더 엔드포인트를 사용해요. 쓰기 인스턴스 장애 시 Aurora가 리더를 승격하고 접수 앱은 재연결해요.'],
    },
    scenarios: [
      path('write', '📝', '청구 접수', '평상시 청구 내역을 저장합니다.', ['claims', 'aurora@writer'], '청구 앱이 라이터를 사용해요.', '청구 앱을 라이터 서브넷의 Aurora에 연결해 주세요.'),
      {
        id: 'report', icon: '📊', title: '두 리더로 보고서 분산', desc: '보고서 앱의 새 DB 연결을 리더에 분산합니다.',
        check: (c) => c.path(['reports', 'aurora@readerB', 'aurora@writer', 'aurora@readerC', 'reports'])
          ? { ok: true, msg: '같은 클러스터의 두 리더에 보고서 연결을 나눠요.' }
          : { ok: false, msg: 'B·C 리더를 라이터와 같은 클러스터에 연결하고 보고서 앱에서 두 리더를 연결해 주세요.' },
      },
      {
        id: 'failover', icon: '⚡', title: '라이터 AZ 장애', desc: '가용 영역 A가 중단되고 접수 앱이 재연결합니다.', fail: ['azA'],
        check: (c) => ['readerB', 'readerC'].some((reader) =>
          c.path(['claims', 'aurora@writer', `aurora@${reader}`]) && c.path(['claims', `aurora@${reader}`], ['azA']))
          ? { ok: true, msg: '다른 AZ의 리더가 승격되면 청구 앱이 클러스터 엔드포인트로 다시 연결돼요.' }
          : { ok: false, msg: '라이터와 다른 AZ의 리더를 같은 Aurora 클러스터로 연결하고 청구 앱에서 라이터에 연결해 주세요.' },
      },
    ],
  },
]
