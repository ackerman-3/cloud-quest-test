// 랜덤 닉네임: "꾸밈말 + 이름" 조합(최대 12자). 단어를 바꾸려면 아래 목록만 고치면 된다.
const ADJ = ['졸린', '용감한', '반짝이는', '느긋한', '부지런한', '수줍은', '배고픈', '신나는', '꼼꼼한', '말랑한', '씩씩한', '다정한', '야근하는', '출근한', '커피 든', '행복한', '든든한', '재빠른', '조용한', '엉뚱한']
const NOUN = ['판다', '고양이', '펭귄', '햄스터', '여우', '코알라', '토끼', '곰돌이', '병아리', '개구리', '람다', '서브넷', '버킷', '라우터', '클라우드', '컨테이너', '캐시', '게이트웨이', '아키텍트', '구름']

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/** 12자 이하 랜덤 닉네임. avoid와 같은 값은 피한다 */
export function randomNickname(avoid?: string) {
  for (let i = 0; i < 30; i++) {
    const n = `${pick(ADJ)} ${pick(NOUN)}`
    if ([...n].length <= 12 && n !== avoid) return n
  }
  return `${pick(ADJ)} ${pick(NOUN.filter((x) => x.length <= 3))}`
}
