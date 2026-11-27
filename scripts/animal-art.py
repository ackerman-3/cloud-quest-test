#!/usr/bin/env python3
"""프로필 사진용 동물 픽셀 아바타 생성기 → src/data/animalArt.ts (+ 미리보기 /tmp/animals.png)

실행: python3 scripts/animal-art.py
각 동물은 20x20 격자. 머리·귀·무늬를 도형으로 칠한 뒤 바깥 테두리를 자동으로 그린다.
"""
import json
import math
import os

N = 20


def blank():
    return [['.'] * N for _ in range(N)]


def ellipse(g, cx, cy, rx, ry, c):
    for y in range(N):
        for x in range(N):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1.0:
                g[y][x] = c


def tri(g, pts, c):
    (x1, y1), (x2, y2), (x3, y3) = pts

    def sign(ax, ay, bx, by, cx, cy):
        return (ax - cx) * (by - cy) - (bx - cx) * (ay - cy)

    for y in range(N):
        for x in range(N):
            px, py = x + 0.5, y + 0.5
            d1 = sign(px, py, x1, y1, x2, y2)
            d2 = sign(px, py, x2, y2, x3, y3)
            d3 = sign(px, py, x3, y3, x1, y1)
            neg = d1 < 0 or d2 < 0 or d3 < 0
            pos = d1 > 0 or d2 > 0 or d3 > 0
            if not (neg and pos):
                g[y][x] = c


def px(g, pts, c):
    for x, y in pts:
        if 0 <= x < N and 0 <= y < N:
            g[y][x] = c


def outline(g):
    out = [row[:] for row in g]
    for y in range(N):
        for x in range(N):
            if g[y][x] != '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < N and 0 <= ny < N and g[ny][nx] not in '.k':
                    out[y][x] = 'k'
                    break
    return out


def face(g, ey=11, ex=(6, 13), blush=True, nose='n', mouth=True, nx=None):
    # 눈: 2x2 검정 + 하이라이트
    for x0 in ex:
        px(g, [(x0, ey), (x0 + 1, ey), (x0, ey + 1), (x0 + 1, ey + 1)], 'e')
        px(g, [(x0, ey)], 'w')
    if blush:
        px(g, [(ex[0] - 2, ey + 2), (ex[0] - 1, ey + 2)], 'p')
        px(g, [(ex[1] + 2, ey + 2), (ex[1] + 3, ey + 2)], 'p')
    cx = nx if nx is not None else (ex[0] + ex[1] + 1) // 2
    if nose:
        px(g, [(cx, ey + 2), (cx + 1, ey + 2)], nose)
    if mouth:
        px(g, [(cx - 1, ey + 3), (cx + 2, ey + 3)], 'm')


ANIMALS = {}


def add(name, label, pal, build):
    g = blank()
    build(g)
    g = outline(g)
    pal = {'k': pal.get('k', '#3b2f2a'), 'e': '#2b2233', 'w': '#ffffff', 'p': '#f6a5b5', 'm': pal.get('m', '#7a4b3a'), **pal}
    ANIMALS[name] = {'label': label, 'pal': pal, 'rows': [''.join(r) for r in g]}


# 고양이
def cat(g):
    tri(g, [(2.5, 9), (4.5, 1.5), (9, 6)], 'a')
    tri(g, [(17.5, 9), (15.5, 1.5), (11, 6)], 'a')
    tri(g, [(3.8, 7), (4.7, 3.5), (7.5, 6)], 'p')
    tri(g, [(16.2, 7), (15.3, 3.5), (12.5, 6)], 'p')
    ellipse(g, 10, 11.5, 8, 6.8, 'a')
    px(g, [(9, 5), (10, 5), (9, 6), (10, 6), (6, 6), (13, 6)], 'b')
    ellipse(g, 10, 15, 3.2, 2, 'c')
    face(g, nose='p')


add('a_cat', '고양이', {'a': '#f4a25a', 'b': '#d9772f', 'c': '#fff3e4', 'k': '#6b3a1c'}, cat)


# 강아지(처진 귀)
def dog(g):
    ellipse(g, 10, 11.5, 7.6, 7, 'a')
    ellipse(g, 3.2, 10, 2.4, 5, 'b')
    ellipse(g, 16.8, 10, 2.4, 5, 'b')
    ellipse(g, 10, 15, 3.6, 2.4, 'c')
    ellipse(g, 13.5, 8.5, 1.8, 1.6, 'b')
    face(g, nose='e')


add('a_dog', '강아지', {'a': '#e8c48c', 'b': '#a5683a', 'c': '#fff6e8', 'k': '#5a3a20'}, dog)


# 토끼
def rabbit(g):
    ellipse(g, 6.5, 5.5, 2.7, 5.3, 'a')
    ellipse(g, 13.5, 5.5, 2.7, 5.3, 'a')
    ellipse(g, 6.5, 5.5, 1.1, 3.6, 'p')
    ellipse(g, 13.5, 5.5, 1.1, 3.6, 'p')
    ellipse(g, 10, 12.5, 7.5, 6.5, 'a')
    face(g, ey=12, nose='p')


add('a_rabbit', '토끼', {'a': '#fbf8f4', 'k': '#8c7b78'}, rabbit)


# 곰
def bear(g):
    ellipse(g, 4, 5, 2.8, 2.8, 'a')
    ellipse(g, 16, 5, 2.8, 2.8, 'a')
    ellipse(g, 4, 5, 1.4, 1.4, 'b')
    ellipse(g, 16, 5, 1.4, 1.4, 'b')
    ellipse(g, 10, 11.5, 8, 7, 'a')
    ellipse(g, 10, 14.5, 3.6, 2.6, 'c')
    face(g, nose='e')


add('a_bear', '곰', {'a': '#a8744a', 'b': '#7a4f2e', 'c': '#e8c9a4', 'k': '#4a2c18'}, bear)


# 판다
def panda(g):
    ellipse(g, 4, 5, 2.8, 2.8, 'b')
    ellipse(g, 16, 5, 2.8, 2.8, 'b')
    ellipse(g, 10, 11.5, 8, 7, 'a')
    ellipse(g, 6.5, 11.5, 2.4, 2.2, 'b')
    ellipse(g, 13.5, 11.5, 2.4, 2.2, 'b')
    face(g, nose='e')


add('a_panda', '판다', {'a': '#ffffff', 'b': '#2f2f3a', 'k': '#2f2f3a', 'e': '#ffffff', 'w': '#2b2233'}, panda)


# 여우
def fox(g):
    tri(g, [(2, 10), (3.5, 1), (9, 6)], 'a')
    tri(g, [(18, 10), (16.5, 1), (11, 6)], 'a')
    tri(g, [(3.6, 7), (3.8, 3.5), (6.8, 6)], 'c')
    tri(g, [(16.4, 7), (16.2, 3.5), (13.2, 6)], 'c')
    ellipse(g, 10, 11.5, 8, 6.6, 'a')
    tri(g, [(2.5, 12), (10, 18.5), (10, 13)], 'c')
    tri(g, [(17.5, 12), (10, 18.5), (10, 13)], 'c')
    face(g, nose='e', blush=False)


add('a_fox', '여우', {'a': '#f08a3c', 'c': '#fff4ea', 'k': '#6e3412'}, fox)


# 개구리
def frog(g):
    ellipse(g, 5.5, 6, 3.2, 3, 'a')
    ellipse(g, 14.5, 6, 3.2, 3, 'a')
    ellipse(g, 10, 12.5, 8.4, 6, 'a')
    ellipse(g, 10, 16, 5, 1.6, 'c')
    for x0 in (5, 14):
        ellipse(g, x0 + 0.5, 6, 1.9, 1.9, 'w')
        px(g, [(x0, 6), (x0 + 1, 6), (x0, 7), (x0 + 1, 7)], 'e')
    px(g, [(3, 12), (4, 12), (15, 12), (16, 12)], 'p')
    px(g, [(8, 13), (9, 14), (10, 14), (11, 13)], 'm')


add('a_frog', '개구리', {'a': '#8fd16a', 'c': '#d9f2b8', 'k': '#2f6b2a', 'm': '#2f6b2a'}, frog)


# 펭귄
def penguin(g):
    ellipse(g, 10, 11, 8.2, 7.6, 'b')
    ellipse(g, 7.2, 12, 3.4, 4.4, 'a')
    ellipse(g, 12.8, 12, 3.4, 4.4, 'a')
    ellipse(g, 10, 14, 4.6, 3.4, 'a')
    face(g, nose=None, mouth=False)
    px(g, [(9, 13), (10, 13), (9, 14), (10, 14)], 'c')


add('a_penguin', '펭귄', {'a': '#ffffff', 'b': '#33415c', 'c': '#ffb02e', 'k': '#1d2638'}, penguin)


# 햄스터
def hamster(g):
    ellipse(g, 4.5, 5.5, 2.2, 2.2, 'a')
    ellipse(g, 15.5, 5.5, 2.2, 2.2, 'a')
    ellipse(g, 4.5, 5.5, 1.1, 1.1, 'p')
    ellipse(g, 15.5, 5.5, 1.1, 1.1, 'p')
    ellipse(g, 10, 12, 8.4, 7, 'a')
    ellipse(g, 4.6, 14, 2.8, 2.6, 'c')
    ellipse(g, 15.4, 14, 2.8, 2.6, 'c')
    ellipse(g, 10, 15.5, 3, 2.2, 'c')
    face(g, nose='p', blush=False)


add('a_hamster', '햄스터', {'a': '#f2c27a', 'c': '#fff7ea', 'k': '#7a5022'}, hamster)


# 병아리
def chick(g):
    ellipse(g, 10, 11.5, 8, 7.4, 'a')
    px(g, [(9, 3), (10, 2), (10, 3), (11, 3)], 'a')
    face(g, nose=None, mouth=False)
    px(g, [(9, 13), (10, 13), (11, 13), (10, 14)], 'c')


add('a_chick', '병아리', {'a': '#ffe066', 'c': '#ff9a3c', 'k': '#a57a12'}, chick)


# 코알라
def koala(g):
    ellipse(g, 3.6, 7, 3.4, 3.6, 'a')
    ellipse(g, 16.4, 7, 3.4, 3.6, 'a')
    ellipse(g, 3.6, 7, 1.8, 2, 'c')
    ellipse(g, 16.4, 7, 1.8, 2, 'c')
    ellipse(g, 10, 12, 7.4, 6.8, 'a')
    ellipse(g, 10, 13.5, 1.8, 2.4, 'b')
    face(g, nose=None, mouth=False)


add('a_koala', '코알라', {'a': '#b8c0cc', 'b': '#3b3f4a', 'c': '#f2d8de', 'k': '#4a5060'}, koala)


# 돼지
def pig(g):
    tri(g, [(3, 7), (4, 2.5), (8, 5)], 'b')
    tri(g, [(17, 7), (16, 2.5), (12, 5)], 'b')
    ellipse(g, 10, 11.5, 8, 7, 'a')
    ellipse(g, 10, 14.5, 3, 2, 'b')
    face(g, nose=None, mouth=False)
    px(g, [(9, 14), (11, 14)], 'm')


add('a_pig', '돼지', {'a': '#ffc2cf', 'b': '#f59ab0', 'k': '#a8536a', 'm': '#a8536a'}, pig)


def write_ts():
    out = ['// scripts/animal-art.py가 생성한 파일입니다. 직접 고치지 말고 스크립트를 고쳐 다시 실행하세요.',
           'export interface AnimalArt { label: string; pal: Record<string, string>; rows: string[] }',
           'export const ANIMALS: Record<string, AnimalArt> = ' + json.dumps(ANIMALS, ensure_ascii=False, indent=1) + '',
           'export const ANIMAL_IDS = Object.keys(ANIMALS)', '']
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'animalArt.ts')
    open(path, 'w', encoding='utf-8').write('\n'.join(out))


def preview():
    try:
        from PIL import Image
    except ImportError:
        return
    S = 8
    names = list(ANIMALS)
    img = Image.new('RGB', (len(names) * (N * S + 8) + 8, N * S + 16), '#eef1f6')
    for i, n in enumerate(names):
        a = ANIMALS[n]
        for y, row in enumerate(a['rows']):
            for x, ch in enumerate(row):
                if ch == '.':
                    continue
                c = a['pal'][ch]
                for dy in range(S):
                    for dx in range(S):
                        img.putpixel((8 + i * (N * S + 8) + x * S + dx, 8 + y * S + dy), tuple(int(c[j:j + 2], 16) for j in (1, 3, 5)))
    img.save('/tmp/animals.png')


write_ts()
preview()
print('animals:', ', '.join(ANIMALS))
