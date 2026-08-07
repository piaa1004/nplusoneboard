// data.sql 시드 데이터 생성기.
// 실행: node scripts/generate-data-sql.js > src/main/resources/data.sql
//
// 게시글 200건 + 댓글 약 1,000건을 만든다. 댓글 수를 게시글마다 0~9건으로 들쭉날쭉하게 두는 이유는
// (1) 댓글 0건인 게시글도 N+1 쿼리를 유발한다는 점(빈 컬렉션도 초기화가 필요하다)과
// (2) fetch join 시 결과 행이 몇 배로 뻥튀기되는지를 눈으로 보이게 하기 위해서다.
'use strict';

const AUTHORS = ['이영희', '박민수', '최지우', '정해인', '한소희', '오세훈', '윤아름', '강도현', '서지민', '김철수'];

const COMMENTERS = ['개발조아', '주니어개발자', 'JPA초보', '백엔드지망생', '커피중독', '야근요정',
  '리팩토링러버', '쿼리사냥꾼', '인덱스덕후', '테스트작성가', '문서화장인', '로그탐정'];

const CATEGORIES = [
  {
    tag: '질문',
    titles: [
      'N+1 문제가 계속 나는데 원인을 못 찾겠어요', '댓글 수를 목록에 같이 보여주려면',
      'fetch join 걸었는데 페이징이 이상해요', '@BatchSize 는 어디에 거는 게 맞나요',
      '양방향 연관관계 꼭 필요한가요', 'EntityGraph 와 fetch join 차이 문의',
      'open-in-view 끄면 뭐가 달라지나요', 'DTO 투영이 항상 더 빠른가요',
    ],
    paragraphs: (n, author) => [
      `안녕하세요, ${author}입니다. 게시판 목록 화면에 "댓글 ${(n % 9)}개" 를 함께 보여주려고 하는데 응답이 너무 느립니다.`,
      `Post 와 Comment 를 양방향으로 매핑하고 목록에서 post.getComments().size() 를 호출하고 있는데, 로그를 보니 게시글 한 건마다 select 가 하나씩 더 나가더군요. 한 페이지에 ${((n % 4) + 1) * 10}건을 뿌리니 쿼리가 그만큼 늘어납니다.`,
      `fetch join, @EntityGraph, @BatchSize 중 어떤 걸 써야 할지 헷갈립니다. 페이징까지 같이 쓰고 있어서 더 조심스러운데 조언 부탁드립니다!`,
    ],
  },
  {
    tag: '정리',
    titles: [
      'N+1 문제 완전 정리', 'fetch join 과 페이징이 함께 쓰이면 안 되는 이유',
      '@BatchSize 동작 원리 뜯어보기', 'DTO 투영 vs 엔티티 조회 비교',
      '지연 로딩과 프록시 초기화 시점', '영속성 컨텍스트 1차 캐시 정리',
      'Hibernate 6 에서 달라진 distinct 동작', 'default_batch_fetch_size 설정 가이드',
    ],
    paragraphs: (n, author) => [
      `${author}입니다. JPA N+1 문제를 정리해 공유합니다.`,
      `N+1 은 "부모 N건을 조회한 뒤 각 부모의 연관 데이터를 건드리면 추가 쿼리가 N번 나가는" 현상입니다. 핵심은 부모가 여러 건일 때만 나타난다는 점입니다. 단건 조회는 부모 1건 + 자식 1번이라 총 2쿼리로 끝나고, 이건 N+1 이 아닙니다.`,
      `해결책은 크게 세 갈래입니다. (1) join fetch / @EntityGraph 로 한 방에 읽기 — 다만 1:N 컬렉션은 페이징과 상극입니다. (2) @BatchSize 로 IN 절 묶어 읽기 — 페이징이 정상 동작해 실무 표준입니다. (3) 애초에 DTO 로 투영해 필요한 값만 집계하기. 상황 #${n} 에 맞춰 고르시면 됩니다.`,
    ],
  },
  {
    tag: '후기',
    titles: [
      '쿼리 1200번을 3번으로 줄인 후기', '목록 API 응답 8초 → 200ms 개선기',
      '@BatchSize 하나로 장애를 막은 이야기', 'fetch join 잘못 써서 OOM 낸 후기',
      '슬로우 쿼리 로그 켜본 후기', 'p6spy 도입 후기',
      '커넥션 풀 고갈 원인을 찾은 후기', 'JPA 성능 튜닝 한 달 회고',
    ],
    paragraphs: (n, author) => [
      `${author}입니다. 지난 ${(n % 4) + 2}주간 목록 API 성능 개선 작업을 했고, 그 후기를 남깁니다.`,
      `문제는 단순했습니다. 게시글 목록에 댓글 수를 붙이면서 지연 로딩이 그대로 노출됐고, 한 페이지에 ${((n % 5) + 2) * 10}건이니 쿼리가 그만큼 더 나갔습니다. APM 에서 보니 한 요청에 SQL 이 ${100 + (n % 9) * 130}번 찍히더군요.`,
      `@BatchSize 를 100 으로 걸었더니 쿼리 수가 3번으로 떨어졌고 응답 시간도 눈에 띄게 좋아졌습니다. 코드는 거의 손대지 않았는데 효과가 커서, 비슷한 증상 있으시면 먼저 확인해보시길 권합니다.`,
    ],
  },
  {
    tag: '정보',
    titles: [
      '단방향 vs 양방향 연관관계 선택 기준', '연관관계의 주인이란 무엇인가',
      'mappedBy 를 붙이는 쪽 정하기', 'orphanRemoval 과 cascade 정리',
      '지연 로딩 기본값 정리(ManyToOne 은 EAGER)', 'Open Session In View 의 함정',
      '쿼리 카운터 붙이는 방법', '테스트에서 N+1 잡아내기',
    ],
    paragraphs: (n, author) => [
      `연관관계 설계 기준을 정리했습니다. 작성자: ${author}.`,
      `단방향(N:1)만 두면 부모에서 자식 컬렉션을 건드릴 방법이 없어 N+1 이 구조적으로 발생하지 않습니다. 대신 "게시글마다 댓글 수" 같은 요구가 생기면 매번 별도 쿼리를 짜야 하죠. 양방향으로 바꾸면 코드가 편해지는 대신 지연 로딩 폭탄을 스스로 관리해야 합니다.`,
      `정리하면, 컬렉션을 정말 자주 쓰는지 먼저 따져보고 필요할 때만 양방향으로 여는 것이 좋습니다. 열었다면 반드시 @BatchSize 나 fetch 전략을 함께 정해두세요(#${n}).`,
    ],
  },
  {
    tag: '공지',
    titles: [
      '쿼리 카운터 기능 추가 안내', '데모 데이터 갱신 안내',
      '전략 비교 탭 오픈 안내', 'API 응답 포맷 변경 안내',
      '서버 점검 안내', '학습 가이드 문서 공개',
      '샘플 데이터 규모 확대 안내', '피드백 채널 안내',
    ],
    paragraphs: (n, author) => [
      `[공지] 안녕하세요, 운영자 ${author}입니다.`,
      `이번 업데이트로 모든 조회 API 응답에 실제 실행된 SQL 목록과 쿼리 개수가 함께 내려갑니다. 화면 우측 리포트 패널에서 전략을 바꿔가며 쿼리 수가 어떻게 변하는지 바로 확인하실 수 있습니다.`,
      `개선 의견은 언제든 댓글로 남겨주세요. 감사합니다. (공지 #${n})`,
    ],
  },
  {
    tag: '자유',
    titles: [
      '오늘의 개발 일기', '사이드 프로젝트 근황',
      '주말 코딩 계획', '이번 주 회고',
      '개발자로 산다는 것', '재택 근무 루틴 공유',
      '올해 읽은 기술서 정리', '모니터 추천 부탁드려요',
    ],
    paragraphs: (n, author) => [
      `${author}의 개발 일기 ${n}번째 기록입니다.`,
      `오늘은 게시판에 댓글 기능을 붙이면서 연관관계 매핑을 다시 손봤습니다. 단방향이던 걸 양방향으로 바꾸니 코드는 훨씬 읽기 좋아졌는데, 대신 로그에 select 가 우수수 찍히는 걸 보고 정신이 번쩍 들었네요.`,
      `내일은 쿼리 수를 화면에 띄워주는 계측기를 붙여볼 생각입니다. 눈에 보여야 고치게 되더라고요.`,
    ],
  },
];

const COMMENT_TEMPLATES = [
  (n) => `좋은 글 감사합니다. 저도 비슷한 상황이라 많이 배웠어요.`,
  (n) => `혹시 페이지 크기를 ${((n % 4) + 1) * 10} 으로 늘려도 쿼리 수가 그대로인가요?`,
  (n) => `@BatchSize 값은 보통 얼마로 두시나요? 저는 100 으로 쓰고 있습니다.`,
  (n) => `fetch join 쓰다가 메모리 페이징 경고 보고 놀란 적 있습니다 ㅎㅎ`,
  (n) => `DTO 투영으로 바꾸니 응답이 확실히 가벼워지더라고요.`,
  (n) => `저는 반대로 단방향으로 되돌렸습니다. 컬렉션을 쓸 일이 거의 없어서요.`,
  (n) => `로그만 보면 놓치기 쉬운데 쿼리 카운터 붙이니 바로 보이네요.`,
  (n) => `이 부분(#${n}) 좀 더 자세히 설명해주실 수 있을까요?`,
  (n) => `실무에 바로 적용해봤는데 효과 있었습니다. 공유 감사합니다!`,
  (n) => `open-in-view 를 끄는 게 먼저인 것 같아요. 컨트롤러에서 터지면 원인 찾기가 훨씬 어렵습니다.`,
  (n) => `그래서 결론은 상황에 따라 골라 쓰라는 거군요. 잘 정리해주셔서 감사합니다.`,
  (n) => `저희 팀도 목록 API 에서 같은 문제로 고생했는데, 덕분에 방향을 잡았습니다.`,
];

const POST_COUNT = 200;
const POST_START = new Date('2026-05-01T09:00:00');
const POST_STEP_MINUTES = 91;

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

function formatDateTime(date) {
  const p = (v) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

/**
 * 게시글마다 0~11건. Knuth 승수로 흩뜨린 뒤 12구간으로 나눠 고르게 퍼뜨린다.
 * 난수를 쓰지 않으므로 실행할 때마다 항상 같은 데이터가 나온다(결정적).
 */
function commentCountFor(n) {
  return Math.floor((((n * 2654435761) % 97) / 97) * 12);
}

const postRows = [];
const commentRows = [];

for (let n = 1; n <= POST_COUNT; n++) {
  const category = CATEGORIES[(n - 1) % CATEGORIES.length];
  const titleBase = category.titles[(n - 1) % category.titles.length];
  const author = AUTHORS[(n - 1) % AUTHORS.length];
  const title = `[${category.tag}] ${titleBase} #${pad3(n)}`;
  const content = category.paragraphs(n, author).join('\n\n');
  const createdAt = new Date(POST_START.getTime() + (n - 1) * POST_STEP_MINUTES * 60 * 1000);

  postRows.push(
    `('${escapeSql(title)}', '${author}', '${escapeSql(content)}', '${formatDateTime(createdAt)}')`
  );

  const count = commentCountFor(n);
  for (let c = 0; c < count; c++) {
    const commenter = COMMENTERS[(n + c * 3) % COMMENTERS.length];
    const body = COMMENT_TEMPLATES[(n + c * 5) % COMMENT_TEMPLATES.length](n);
    // 댓글은 게시글 작성 시각 이후에 순차적으로 달린 것으로 둔다.
    const commentAt = new Date(createdAt.getTime() + (c + 1) * 37 * 60 * 1000);
    commentRows.push(
      `(${n}, '${commenter}', '${escapeSql(body)}', '${formatDateTime(commentAt)}')`
    );
  }
}

const sql = [
  '-- N+1 데모 시드 데이터 (Spring Boot 가 스키마 생성 후 자동 실행)',
  '-- ddl-auto: create-drop 이라 재실행 시 테이블이 새로 만들어지므로 중복 걱정이 없다.',
  '-- 생성: node scripts/generate-data-sql.js > src/main/resources/data.sql',
  `-- 게시글 ${postRows.length}건 / 댓글 ${commentRows.length}건`,
  '',
  'INSERT INTO post (title, author, content, created_at) VALUES',
  postRows.join(',\n') + ';',
  '',
  '-- post_id 는 AUTO_INCREMENT 로 1부터 순서대로 채번된다는 전제(create-drop 이라 항상 성립).',
  'INSERT INTO comment (post_id, author, content, created_at) VALUES',
  commentRows.join(',\n') + ';',
  '',
].join('\n');

process.stdout.write(sql);
