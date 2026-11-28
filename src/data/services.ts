import type { Category, Service } from '../types'

export const SERVICES: Record<string, Service> = Object.fromEntries(
  (
    [
      // 고정 요소
      { id: 'users', name: '사용자', short: '👥', cat: 'actor', scope: 'fixed', desc: '인터넷에서 접속하는 고객', cost: 0 },
      { id: 'internet', name: '인터넷', short: '🌐', cat: 'actor', scope: 'fixed', desc: '외부 인터넷', cost: 0 },
      { id: 'onpremDb', name: '온프레미스 DB', short: 'DB', cat: 'onprem', scope: 'fixed', desc: '고객 데이터센터의 데이터베이스', cost: 0 },
      { id: 'nas', name: '파일 서버', short: 'NAS', cat: 'onprem', scope: 'fixed', desc: '사무실 파일 서버', cost: 0 },
      { id: 'line', name: '인터넷 회선', short: '〰', cat: 'onprem', scope: 'fixed', desc: '이미 사용 중인 인터넷 회선', cost: 0 },
      { id: 's3Versioned', name: 'S3 (버전 관리 활성화)', short: 'S3·V', cat: 'storage', scope: 'region', desc: '같은 키의 여러 객체 버전을 보존', cost: 1 },
      { id: 'sqsFifo', name: 'SQS FIFO 큐', short: 'FIFO', cat: 'integration', scope: 'region', desc: '메시지 그룹별 순서 보장과 전송 중복 제거', cost: 0 },

      // 네트워크
      { id: 'igw', name: '인터넷 게이트웨이', short: 'IGW', cat: 'network', scope: 'vpcEdge', desc: 'VPC와 인터넷을 연결하는 관문', cost: 0 },
      { id: 'natgw', name: 'NAT 게이트웨이', short: 'NAT', cat: 'network', scope: 'subnet', desc: '프라이빗 서브넷의 나가는 인터넷 통신만 허용', cost: 2 },
      { id: 'alb', name: 'ALB (Application Load Balancer)', short: 'ALB', cat: 'network', scope: 'subnet', desc: 'HTTP 요청을 여러 서버로 분산', cost: 2 },
      { id: 'cloudfront', name: 'CloudFront', short: 'CF', cat: 'network', scope: 'edge', desc: '전 세계 엣지에서 콘텐츠를 캐시해 전송(CDN)', cost: 1 },
      { id: 'route53', name: 'Route 53', short: 'R53', cat: 'network', scope: 'global', desc: 'DNS. 상태 확인 기반 장애 조치 라우팅', cost: 1 },
      { id: 'vgw', name: '가상 프라이빗 게이트웨이', short: 'VGW', cat: 'network', scope: 'vpcEdge', desc: 'VPC 쪽 VPN·Direct Connect 연결 지점', cost: 0 },
      { id: 'cgw', name: '고객 게이트웨이', short: 'CGW', cat: 'network', scope: 'onprem', desc: '데이터센터 쪽 VPN 장비(라우터·방화벽)', cost: 0 },
      { id: 'vpn', name: 'Site-to-Site VPN', short: 'VPN', cat: 'network', scope: 'link', desc: '인터넷 위에 암호화(IPsec) 터널 구성', cost: 1 },
      { id: 'dx', name: 'Direct Connect', short: 'DX', cat: 'network', scope: 'link', desc: 'AWS와 전용 회선으로 연결', cost: 3 },
      { id: 'vpce', name: 'S3 게이트웨이 엔드포인트 (VPC 엔드포인트)', short: 'VPCE', cat: 'network', scope: 'vpcEdge', desc: '인터넷을 거치지 않고 S3에 접근', cost: 0 },

      // 컴퓨팅
      { id: 'ec2', name: 'EC2 (웹·앱 서버)', short: 'EC2', cat: 'compute', scope: 'subnet', desc: '가상 서버', cost: 2 },
      { id: 'ec2Web', name: 'EC2 (주문 접수 서버)', short: 'WEB', cat: 'compute', scope: 'subnet', desc: '주문을 받는 웹 서버', cost: 2 },
      { id: 'ec2Worker', name: 'EC2 (주문 처리 워커)', short: 'WRK', cat: 'compute', scope: 'subnet', desc: '결제·재고 처리를 하는 서버', cost: 2 },
      { id: 'asg', name: 'Auto Scaling 그룹', short: 'ASG', cat: 'compute', scope: 'group', desc: '부하에 따라 EC2 수를 자동 조절', cost: 0 },
      { id: 'lambda', name: 'Lambda', short: 'λ', cat: 'compute', scope: 'region', desc: '요청이 올 때만 코드 실행(서버리스)', cost: 0 },

      // 데이터베이스
      { id: 'rds', name: 'RDS (기본 DB)', short: 'RDS', cat: 'database', scope: 'subnet', desc: '관리형 관계형 DB', cost: 2 },
      { id: 'rdsStandby', name: 'RDS 대기 DB (Multi-AZ)', short: 'RDS·S', cat: 'database', scope: 'subnet', desc: '다른 AZ에 동기 복제, 장애 시 자동 전환', cost: 2 },
      { id: 'rdsReplica', name: 'RDS 리전 간 읽기 복제본', short: 'RDS·R', cat: 'database', scope: 'subnet', desc: '다른 리전에 비동기 복제, 필요 시 승격', cost: 2 },
      { id: 'dynamodb', name: 'DynamoDB', short: 'DDB', cat: 'database', scope: 'region', desc: '서버리스 NoSQL DB', cost: 1 },
      { id: 'elasticache', name: 'ElastiCache', short: 'CACHE', cat: 'database', scope: 'subnet', desc: '인메모리 캐시(Redis 등)', cost: 2 },

      // 스토리지
      { id: 's3', name: 'S3', short: 'S3', cat: 'storage', scope: 'region', desc: '객체 스토리지', cost: 1 },
      { id: 'glacier', name: 'S3 Glacier Deep Archive', short: 'GLC', cat: 'storage', scope: 'region', desc: '장기 보관용 최저가 스토리지 클래스', cost: 0 },
      { id: 'storagegw', name: 'Storage Gateway (S3 파일 게이트웨이)', short: 'SGW', cat: 'storage', scope: 'onprem', desc: '사내에서 S3를 파일 공유처럼 사용', cost: 1 },

      // 보안
      { id: 'waf', name: 'AWS WAF', short: 'WAF', cat: 'security', scope: 'edge', desc: 'SQL 인젝션 등 웹 공격 요청 차단', cost: 1 },

      // 애플리케이션 통합
      { id: 'apigw', name: 'API Gateway', short: 'API', cat: 'integration', scope: 'region', desc: 'API 요청을 받아 백엔드로 전달', cost: 0 },
      { id: 'sqs', name: 'SQS', short: 'SQS', cat: 'integration', scope: 'region', desc: '메시지를 저장해 두는 대기열(큐)', cost: 0 },
      { id: 'sns', name: 'SNS', short: 'SNS', cat: 'integration', scope: 'region', desc: '메시지를 구독자에게 즉시 발행(푸시)', cost: 0 },
      // 추가 서비스
      { id: 'acm', name: 'ACM 인증서', short: 'ACM', cat: 'security', scope: 'edge', desc: 'HTTPS용 SSL/TLS 인증서 발급·자동 갱신', cost: 0 },
      { id: 'ssm', name: 'Systems Manager (Session Manager)', short: 'SSM', cat: 'integration', scope: 'region', desc: '포트를 열지 않고 서버에 접속, 접속 기록 남김', cost: 0 },
      { id: 'firehose', name: 'Amazon Data Firehose', short: 'FH', cat: 'integration', scope: 'region', desc: '스트리밍 데이터를 S3 등에 자동 적재', cost: 1 },
      { id: 'athena', name: 'Athena', short: 'ATH', cat: 'database', scope: 'region', desc: 'S3의 파일을 SQL로 바로 조회(서버리스)', cost: 0 },
      { id: 'glue', name: 'Glue 데이터 카탈로그', short: 'GLUE', cat: 'database', scope: 'region', desc: '데이터 위치·형식(테이블 정의) 관리', cost: 0 },
      { id: 'efs', name: 'EFS', short: 'EFS', cat: 'storage', scope: 'region', desc: '여러 서버가 함께 쓰는 공유 파일 시스템(NFS)', cost: 1 },
      { id: 'ebs', name: 'EBS 볼륨', short: 'EBS', cat: 'storage', scope: 'subnet', desc: 'EC2 한 대에 붙는 블록 디스크(AZ 단위)', cost: 1 },
      { id: 'cognito', name: 'Cognito 사용자 풀', short: 'COG', cat: 'security', scope: 'region', desc: '회원가입·로그인·토큰 발급', cost: 0 },
      { id: 'dms', name: 'DMS 복제 인스턴스', short: 'DMS', cat: 'database', scope: 'subnet', desc: 'DB를 옮기며 변경분을 계속 복제(CDC)', cost: 2 },
      { id: 'aurora', name: 'Aurora PostgreSQL', short: 'AUR', cat: 'database', scope: 'subnet', desc: 'AWS 관리형 고성능 관계형 DB', cost: 2 },
      { id: 'tgw', name: 'Transit Gateway', short: 'TGW', cat: 'network', scope: 'link', desc: '여러 VPC·VPN을 한 곳에서 연결하는 허브', cost: 2 },
      { id: 'peering', name: 'VPC 피어링', short: 'PCX', cat: 'network', scope: 'link', desc: 'VPC 두 개를 1:1로 연결', cost: 0 },
      { id: 'fargate', name: 'ECS 서비스 (Fargate)', short: 'ECS', cat: 'compute', scope: 'subnet', desc: '서버 관리 없이 컨테이너 실행', cost: 2 },
      { id: 'ecr', name: 'ECR', short: 'ECR', cat: 'compute', scope: 'region', desc: '컨테이너 이미지 저장소', cost: 0 },
      { id: 'secrets', name: 'Secrets Manager', short: 'SEC', cat: 'security', scope: 'region', desc: 'DB 비밀번호 등을 암호화 보관·자동 교체', cost: 0 },
      // SAA 확장 (프로젝트 22~31)
      { id: 'rdsRead', name: 'RDS 읽기 전용 복제본 (같은 리전)', short: 'RDS·RO', cat: 'database', scope: 'subnet', desc: '비동기 복제되는 읽기 전용 DB, 조회·리포트 분산', cost: 2 },
      { id: 'rdsproxy', name: 'RDS Proxy', short: 'PRX', cat: 'database', scope: 'subnet', desc: 'DB 연결을 모아 재사용(연결 풀링), 장애 조치 시간 단축', cost: 1 },
      { id: 'kinesis', name: 'Kinesis Data Streams', short: 'KDS', cat: 'integration', scope: 'region', desc: '실시간 스트림. 샤드별 순서 보장, 여러 소비자·다시 읽기', cost: 1 },
      { id: 'eventbridge', name: 'EventBridge (예약 규칙)', short: 'EB', cat: 'integration', scope: 'region', desc: '정해진 시간(cron)이나 이벤트로 대상 호출', cost: 0 },
      { id: 'cloudwatch', name: 'CloudWatch 경보', short: 'CW', cat: 'integration', scope: 'region', desc: '지표가 기준을 넘으면 알림·EC2 중지 등 작업 실행', cost: 0 },
      { id: 'kms', name: 'KMS 고객 관리형 키', short: 'KMS', cat: 'security', scope: 'region', desc: '암호화 키 관리, 키 사용 권한·기록(CloudTrail)', cost: 0 },
      { id: 'ec2Spot', name: 'EC2 스팟 인스턴스 (배치 워커)', short: 'SPOT', cat: 'compute', scope: 'subnet', desc: '남는 용량을 최대 90% 싸게. 2분 알림 후 회수될 수 있음', cost: 1 },
      { id: 'ga', name: 'Global Accelerator', short: 'GA', cat: 'network', scope: 'global', desc: '애니캐스트 고정 IP 2개, AWS 망으로 가까운 정상 리전에 연결(TCP·UDP)', cost: 2 },
      { id: 'nlb', name: 'NLB (Network Load Balancer)', short: 'NLB', cat: 'network', scope: 'subnet', desc: '4계층(TCP·UDP·TLS) 부하 분산, 초저지연', cost: 2 },
      { id: 'epsvc', name: 'VPC 엔드포인트 서비스 (PrivateLink)', short: 'EPS', cat: 'network', scope: 'vpcEdge', desc: 'NLB 뒤의 서비스를 다른 VPC·계정에 사설 제공', cost: 1 },
      { id: 'vpceIf', name: '인터페이스 VPC 엔드포인트', short: 'VPCE·I', cat: 'network', scope: 'subnet', desc: '내 서브넷의 사설 IP(ENI)로 다른 서비스 호출', cost: 1 },
      { id: 'backup', name: 'AWS Backup', short: 'BAK', cat: 'storage', scope: 'region', desc: '여러 서비스 백업을 계획·볼트로 중앙 관리, 교차 리전·계정 복사', cost: 1 },
      // 신입 보강 (프로젝트 32~36)
      { id: 'nacl', name: '네트워크 ACL', short: 'NACL', cat: 'security', scope: 'subnet', desc: '서브넷 단위 방화벽. 허용·거부 규칙, 상태 비저장', cost: 0 },
      { id: 's3it', name: 'S3 Intelligent-Tiering', short: 'S3·IT', cat: 'storage', scope: 'region', desc: '접근 빈도에 따라 계층 자동 이동, 검색 요금 없음', cost: 1 },
      { id: 's3ia', name: 'S3 Standard-IA', short: 'S3·IA', cat: 'storage', scope: 'region', desc: '가끔 읽는 데이터, 여러 AZ 저장, 검색 요금·최소 30일', cost: 1 },
      { id: 's3onezone', name: 'S3 One Zone-IA', short: 'S3·1Z', cat: 'storage', scope: 'region', desc: '한 AZ에만 저장해 더 저렴, 다시 만들 수 있는 데이터용', cost: 0 },
      { id: 'iamrole', name: 'IAM 역할', short: 'ROLE', cat: 'security', scope: 'global', desc: 'AWS 서비스·사용자에게 임시 자격 증명으로 권한 부여', cost: 0 },
      { id: 'accesskey', name: 'IAM 사용자 액세스 키', short: 'KEY', cat: 'security', scope: 'global', desc: '장기 자격 증명. 코드·파일에 넣으면 유출 위험', cost: 0 },
      { id: 'cloudtrail', name: 'CloudTrail', short: 'CT', cat: 'integration', scope: 'region', desc: '누가 언제 어떤 API를 호출했는지 기록', cost: 0 },
      { id: 'config', name: 'AWS Config', short: 'CFG', cat: 'integration', scope: 'region', desc: '리소스 구성 변경 이력 기록, 규칙 위반 감지', cost: 0 },
      { id: 'vpcB', name: 'VPC (다른 부서)', short: 'VPC', cat: 'network', scope: 'fixed', desc: '다른 부서 VPC', cost: 0 },
    ] as Service[]
  ).map((s) => [s.id, s]),
)

export const CAT_COLOR: Record<Category, string> = {
  compute: '#ED7100',
  database: '#C925D1',
  network: '#8C4FFF',
  storage: '#3F8624',
  security: '#DD344C',
  integration: '#E7157B',
  onprem: '#5A6B7B',
  actor: '#232F3E',
}

export const SCOPE_HINT: Record<string, string> = {
  subnet: 'VPC 서브넷 안에 두는 리소스예요.',
  vpcEdge: 'VPC 경계(게이트웨이 영역)에 붙는 리소스예요.',
  region: '서브넷이 아니라 리전 수준에서 동작하는 서비스예요.',
  edge: '리전이 아니라 전 세계 엣지 로케이션에서 동작해요.',
  global: '특정 리전에 속하지 않는 글로벌 서비스예요.',
  group: '서버 묶음에 대한 설정이라 Auto Scaling 그룹 영역에 둬요.',
  onprem: '고객 데이터센터 쪽에 설치하는 장비예요.',
  link: '데이터센터와 AWS 사이의 연결 회선 영역에 둬요.',
}

export const svc = (id: string): Service =>
  SERVICES[id] ?? { id, name: id, short: id, cat: 'actor', scope: 'fixed', desc: '', cost: 0 }
