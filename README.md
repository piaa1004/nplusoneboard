# 게시판 · JPA N+1 문제 데모

**Post ↔ Comment 양방향 연관관계에서 N+1 문제를 재현하고 해결**하는 풀스택 예제입니다.

- **백엔드**: Spring Boot 3.5 + Spring Data JPA + MySQL 8
- **프론트엔드**: React 19 (Vite, JavaScript) + Redux Toolkit + Tailwind v4 / daisyUI
- **핵심**: 실행된 SQL 을 **응답 JSON 에 실어 화면에 그대로 보여줍니다.** 로그를 뒤지지 않아도 N+1 이 눈에 보입니다.

---

## 왜 단방향에서는 N+1 이 없었나

출발점이 된 게시판의 매핑은 **ManyToOne 단방향**이었습니다.

```java
// Before — 단방향
@Entity
public class Post {
    private Long id;
    private String title;
    // 댓글로 가는 길이 없다
}

@Entity
public class Comment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;      // Comment → Post 한 방향뿐
}
```

`Post` 에 댓글 컬렉션이 아예 없으니 **게시글을 조회하면서 댓글을 건드리는 코드를 작성할 수가 없고**, 따라서 N+1 도 구조적으로 발생하지 않습니다.

이 프로젝트는 반대 방향을 열어 **양방향**으로 만들었습니다.



```java
// After — 양방향 (이 프로젝트)
@Entity
public class Post {
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @OrderBy("createdAt asc, id asc")
    private List<Comment> comments = new ArrayList<>();   // ← 추가된 방향

    public void addComment(Comment c) {   // 연관관계 편의 메서드
        comments.add(c);
        c.assignPost(this);
    }
}
```

이제 "게시글 목록에 댓글 수를 함께 보여달라" 는 흔한 요구를 구현하면
`post.getComments().size()` 한 줄이 게시글마다 SELECT 를 하나씩 유발합니다 → **N+1**.

> **N+1 은 부모를 여러 건 조회할 때만 생깁니다.** 단건 상세 조회는 부모 1건 + 댓글 1번 = 2쿼리로 끝나며 N+1 이 아닙니다.
> 상세 화면을 대조군으로 함께 두었습니다.

---

## 설계 원칙 — 변수는 둘뿐

이 데모에서 결과를 바꿀 수 있는 조작은 **전략**과 **페이지 크기** 둘로 제한했습니다.
검색어·컬럼 정렬·조회수·좋아요처럼 게시판에 흔히 붙는 기능은 **일부러 넣지 않았습니다.**
쿼리 수가 달라졌을 때 "전략 때문"이라고 단정할 수 있어야 비교가 성립하기 때문입니다.

같은 이유로 `PostSummary` 에는 화면에 쓰는 5개 필드만 있습니다.
그중 **`commentCount` 하나만이 연관 컬렉션을 필요로 하고, 바로 그 한 필드가 N+1 의 원인**입니다.

| 남긴 것 | 근거 |
| --- | --- |
| 전략 선택 | 비교의 축 그 자체 |
| 페이지 크기 | N+1 의 N 이 페이지 크기에 비례해 커지는 것을 보여줌 |
| 댓글 목록의 정렬 | 한 페이지에 담기는 게시글 수를 바꿔 1차 캐시 효과를 드러냄 |

---

## 무엇을 보여주는가

### 1. 게시글 목록 — 1:N (`Post.comments`) 방향

**다섯 전략 모두 화면에 보이는 표는 완전히 동일합니다.** 달라지는 것은 SQL 개수뿐입니다.

| 전략 | 쿼리 수 (size=10) | 쿼리 수 (size=50) | 페이징 | 평가 |
| --- | --- | --- | --- | --- |
| ① 지연 로딩 그대로 `naive` | **12** | **52** | 정확 | ❌ N+1 |
| ② JPQL `join fetch` | 2 | 2 | ⚠️ **메모리** | 조건부 |
| ③ `@EntityGraph` | 2 | 2 | ⚠️ **메모리** | 조건부 |
| ④ `@BatchSize` (IN 절) | 3 | 3 | 정확 | ✅ 권장 |
| ⑤ DTO 직접 투영 (`group by`) | 2 | 2 | 정확 | ✅ 권장 |

②③ 은 쿼리 수만 보면 가장 좋아 보이지만, Hibernate 가
`HHH90003004: firstResult/maxResults specified with collection fetch; applying in memory`
경고를 남깁니다. **조건에 맞는 행을 전부 읽어와 애플리케이션 메모리에서 페이징**했다는 뜻이라,
데이터가 커지면 그대로 OOM 으로 이어집니다. 실제로 `size=50` 에서는 쿼리가 2번뿐인 fetch join 이
쿼리 3번인 `@BatchSize` 보다 **더 느립니다.** 이 데모는 그 경고까지 응답에 실어 화면에 띄웁니다.

### 2. 최근 댓글 — N:1 (`Comment.post`) 방향

같은 양방향 관계지만 **반대 방향은 성질이 다릅니다.**

- `comment.getPost().getTitle()` 도 N+1 을 일으키지만, 같은 게시글의 댓글은 **1차 캐시에서 재사용**되므로
  추가 쿼리는 "댓글 수" 가 아니라 **서로 다른 게시글 수** 만큼입니다.
  → 정렬을 바꿔 한 페이지에 담기는 게시글이 흩어지게 하면 쿼리가 4 → 9 → 12 로 늘어나는 것을 볼 수 있습니다.
- N:1 은 조인해도 결과 행이 늘지 않으므로 **`join fetch` + 페이징을 함께 써도 안전**합니다(메모리 페이징 경고 없음).

### 3. 게시글 상세 — 대조군

부모가 1건이면 지연 로딩이어도 2쿼리, `join fetch` 를 켜면 1쿼리입니다. 토글로 직접 비교할 수 있습니다.

---

## 실행 방법

### 사전 준비

- JDK 17+ (개발/검증은 21 로 진행)
- Node.js 18+ (권장 20+)
- MySQL 8 (localhost:3306, root / 1234)

> `nplusone_board` 스키마는 JDBC URL 의 `createDatabaseIfNotExist=true` 덕분에 **자동으로 생성**됩니다.
> root 비밀번호가 다르면 `backend/src/main/resources/application.yml` 의 `password` 만 수정하세요.

### 1) 백엔드

```bash
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

- 부팅 시 `data.sql` 이 **게시글 200건 / 댓글 1,083건**을 INSERT 합니다
  (`ddl-auto: create-drop` + `defer-datasource-initialization`).
- 시드는 `backend/scripts/generate-data-sql.js` 로 생성합니다
  (`node scripts/generate-data-sql.js > src/main/resources/data.sql`).
- 서버: <http://localhost:8080>

```bash
# 동작 확인 — 같은 결과, 다른 쿼리 수
curl "http://localhost:8080/api/posts?strategy=naive&size=10"        # queryCount: 12
curl "http://localhost:8080/api/posts?strategy=batch-size&size=10"   # queryCount: 3
curl "http://localhost:8080/api/posts?strategy=naive&size=50"        # queryCount: 52
curl "http://localhost:8080/api/posts/compare?size=50"               # 전략 일괄 비교
```

### 2) 프론트엔드

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Vite dev 서버가 `/api` 요청을 백엔드(8080)로 **프록시**합니다.

---

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/strategies` | 전략 카탈로그(탭 이름·설명·코드 스니펫). 화면 문구는 전부 백엔드 enum 에서 내려옵니다 |
| GET | `/api/posts?strategy=&page=&size=` | 게시글 목록 + 쿼리 리포트 |
| GET | `/api/posts/compare?page=&size=` | 다섯 전략을 같은 조건으로 실행해 비교 |
| GET | `/api/posts/{id}?fetchJoin=` | 상세 + 댓글 (대조군) |
| GET | `/api/comments?strategy=&page=&size=&sort=` | 최근 댓글 목록 + 쿼리 리포트 |
| GET | `/api/comments/compare?...` | 두 전략 비교 |
| GET/POST/DELETE | `/api/posts/{postId}/comments[/{commentId}]` | 댓글 조회·작성·삭제 |

조회 응답은 모두 `QueryReport` 봉투에 담깁니다.

```json
{
  "strategy": "naive",
  "label": "① 지연 로딩 그대로",
  "queryCount": 12,
  "elapsedMs": 38,
  "queries": [
    "select p1_0.id, ... from post p1_0 where ... limit ?,?",
    "select count(p1_0.id) from post p1_0 where ...",
    "select c1_0.post_id, ... from comment c1_0 where c1_0.post_id=?",
    "... × 10"
  ],
  "warnings": [],
  "content": [ { "id": 200, "title": "...", "author": "...", "createdAt": "...", "commentCount": 8 } ],
  "page": { "size": 10, "number": 0, "totalElements": 200, "totalPages": 20 }
}
```

---

## SQL 은 어떻게 세는가

Hibernate 의 `StatementInspector` 로 실행 직전의 SQL 을 가로채고, 스레드 로컬에 쌓습니다.
`SqlProbe` 가 측정 구간(= `@Transactional` 서비스 호출 전체)의 시작/끝에서 이를 켜고 끄므로,
**트랜잭션 안에서 발생한 지연 로딩 쿼리까지 빠짐없이 포함**됩니다.

```java
SqlProbe.Result<Page<PostSummary>> probed =
        sqlProbe.measure(() -> postQueryService.list(strategy, pageable));
probed.queryCount();   // 12
probed.warnings();     // ["HHH90003004: ... applying in memory"]
```

Hibernate 경고는 로그로만 나오기 때문에, `org.hibernate` 로거에 붙인 logback appender
(`HibernateWarningAppender`)로 같은 방식으로 수집합니다.

---

## 구조

```
nplusoneboard
├── backend/                                    # Spring Boot + MySQL
│   ├── pom.xml
│   ├── scripts/generate-data-sql.js            # 시드 생성기 (게시글 200 / 댓글 1,083)
│   └── src/main/java/com/example/nplusone
│       ├── domain/
│       │   ├── Post.java                       # ★ @OneToMany 추가 → 양방향
│       │   └── Comment.java                    # @ManyToOne (연관관계의 주인)
│       ├── repository/
│       │   ├── PostRepository.java             # 전략별 쿼리 (①·④는 findAll 그대로라 메서드가 없음)
│       │   └── CommentRepository.java          # N:1 방향 fetch join
│       ├── dto/
│       │   ├── PostStrategy.java               # 전략 + 설명 + 코드 스니펫 (화면 문구의 출처)
│       │   ├── CommentStrategy.java
│       │   └── QueryReport.java                # 결과 + 실행된 SQL 봉투
│       ├── sql/
│       │   ├── SqlCaptureInspector.java        # Hibernate SQL 가로채기
│       │   ├── HibernateWarningAppender.java   # 경고 로그 가로채기
│       │   └── SqlProbe.java                   # 측정 구간 계측기
│       ├── service/                            # PostQueryService, CommentService
│       ├── web/                                # PostController, CommentController, StrategyController
│       └── config/                             # WebConfig(CORS·VIA_DTO), HibernateInspectorConfig
└── frontend/                                   # React (Vite, JS)
    ├── vite.config.js                          # /api → :8080 프록시
    └── src
        ├── pages/                              # BoardHome, PostDetailPage
        ├── components/
        │   ├── PostBoard.jsx                   # 1:N 데모 화면 (조작은 전략·페이지 크기뿐)
        │   ├── CommentBoard.jsx                # N:1 데모 화면
        │   ├── QueryReport.jsx                 # ★ 쿼리 수 / 반복 SQL / 경고 패널
        │   ├── ComparisonPanel.jsx             # 전략 비교 막대
        │   └── ConceptPanel.jsx                # 단방향 vs 양방향 정리
        └── store/                              # Redux Toolkit 슬라이스
```

---

## 데모에만 있는 장치

한 애플리케이션 안에서 "설정 없음(N+1 발생)" 과 "`@BatchSize` 적용" 을 나란히 비교하기 위해,
`Post` 에 **같은 연관관계를 두 벌** 매핑했습니다.

```java
@OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
private List<Comment> comments;        // 배치 설정 없음 → naive 전략에서 N+1 재현

@BatchSize(size = 100)
@OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
private List<Comment> batchComments;   // batch-size 전략 전용 (읽기 전용)
```

**실무에서는 이렇게 하지 마세요.** 컬렉션은 하나만 두고
`application.yml` 에 전역 설정 한 줄을 켜는 것이 정석입니다.

```yaml
spring.jpa.properties.hibernate.default_batch_fetch_size: 100
```

이 설정을 켜면 `naive` 전략에서도 N+1 이 사라져 데모가 성립하지 않으므로,
`application.yml` 에는 주석 처리해 두었습니다.

---

## 학습 관점 요약

- **양방향은 공짜가 아니다.** 컬렉션이 생기는 순간 지연 로딩을 직접 관리할 책임도 함께 생깁니다.
  정말 컬렉션이 필요한지 먼저 따져보고, 열었다면 fetch 전략을 반드시 같이 정하세요.
- **쿼리 수가 적다고 항상 좋은 것은 아니다.** 컬렉션 `fetch join` 은 쿼리 2번이지만 페이징을 메모리에서 합니다.
- **목록 + 페이징의 기본 해법은 `@BatchSize`** (또는 `default_batch_fetch_size`)입니다.
- **조회 전용 화면이라면 DTO 투영**이 가장 가볍습니다. 대신 더티 체킹은 되지 않습니다.
- **1:N 과 N:1 은 다르게 대응**해야 합니다. N:1 은 `fetch join` + 페이징이 안전합니다.
- **`open-in-view: false`** 로 두면 지연 로딩이 서비스 트랜잭션 밖으로 새는 것을 막아, 문제를 조기에 드러냅니다.
