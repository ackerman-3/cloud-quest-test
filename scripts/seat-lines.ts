// 자리(팀장·선배·동기)별 프로젝트 대사 목록: 교체 인물 말투(cast.ts의 voice)를 쓸 때 참고
// 사용: npx tsx scripts/seat-lines.ts lead > lead-lines.json
import { PROJECTS } from '../src/data/projects'
import { lineKey } from '../src/data/cast'
const seat = process.argv[2] ?? 'lead'
const out: Record<string, string> = {}
for (const p of PROJECTS)
  p.steps.forEach((st, i) => {
    if (st.t === 'talk') st.lines.forEach((l, j) => l.who === seat && (out[lineKey(p.id, i, j)] = l.text))
    if (st.t === 'quiz' && st.quiz.who === seat) out[lineKey(p.id, i, 'q')] = st.quiz.prompt
  })
console.log(JSON.stringify(out, null, 1))
