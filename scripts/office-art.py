# 사무실 가구·기념품 픽셀 아트 생성기
# 실행: python3 scripts/office-art.py  → src/data/officeArt.ts 와 미리보기(/tmp/office-art.png) 생성
import json, math, sys

PAL = {
 'k':'#262c3a','K':'#151a24','w':'#f6f8fb','W':'#e3e8ef','g':'#c5ccd8','G':'#8f99aa','q':'#5d6779',
 'n':'#1f3358','N':'#2c4775','b':'#3b6fd8','B':'#8fb4ff','j':'#c9dcff',
 'm':'#3fc8a9','M':'#a8eedd','t':'#21907c',
 'o':'#dcaa6e','O':'#b9834b','d':'#86592f','D':'#5c3c20',
 'l':'#8ad05c','L':'#55a640','v':'#2f7434','V':'#1f4f24','a':'#9fb98a','A':'#6f8f62',
 'y':'#f5c84c','Y':'#c9921f','z':'#fff3b0','r':'#e25b52','R':'#a83a35','p':'#f4a3bd','P':'#d06d8f',
 'c':'#5b3a26','C':'#f1e1c4','e':'#202738','E':'#34405a','s':'#e7ebf0','S':'#a9b2bf',
 'x':'#d0774f','X':'#94492d','u':'#8f7fe0','U':'#5e50b0','h':'#e0b456','H':'#9e7426','i':'#ffffff',
}

class Cv:
    def __init__(s,w,h): s.w,s.h=w,h; s.p={}
    def set(s,x,y,c):
        if 0<=x<s.w and 0<=y<s.h: s.p[(x,y)]=c
    def rect(s,x,y,w,h,c):
        for i in range(x,x+w):
            for j in range(y,y+h): s.set(i,j,c)
    def hline(s,x,y,w,c): s.rect(x,y,w,1,c)
    def vline(s,x,y,h,c): s.rect(x,y,1,h,c)
    def ell(s,cx,cy,rx,ry,c,shade=None,light=None):
        for j in range(int(cy-ry)-1,int(cy+ry)+2):
            for i in range(int(cx-rx)-1,int(cx+rx)+2):
                dx=(i+.5-cx)/rx; dy=(j+.5-cy)/ry
                if dx*dx+dy*dy<=1:
                    col=c
                    if shade and (dx+dy)>0.55: col=shade
                    if light and (dx+dy)<-0.75: col=light
                    s.set(i,j,col)
    def line(s,x0,y0,x1,y1,c):
        n=max(abs(x1-x0),abs(y1-y0))+1
        for t in range(n):
            f=t/(n-1) if n>1 else 0
            s.set(round(x0+(x1-x0)*f),round(y0+(y1-y0)*f),c)
    def outline(s,c='k'):
        add=[]
        for j in range(s.h):
            for i in range(s.w):
                if (i,j) in s.p: continue
                if any((i+dx,j+dy) in s.p and s.p[(i+dx,j+dy)]!=c for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): add.append((i,j))
        for q in add: s.p[q]=c
    def rows(s): return [''.join(s.p.get((i,j),'.') for i in range(s.w)) for j in range(s.h)]

def leaf(cv,x,y,dx,dy,length,c1,c2):
    # 끝으로 갈수록 가늘어지는 잎
    for t in range(length):
        f=t/length; w=max(0,round(1.6*math.sin(math.pi*(f*0.95+0.05))))
        cx=x+dx*t; cy=y+dy*t+0.15*t*t*(1 if dy>=0 else 0.3)
        for o in range(-w,w+1):
            px,py=(round(cx-dy*o*0.7),round(cy+dx*o*0.7))
            cv.set(px,py,c1 if o<=0 else c2)

ART={}
def save(name,cv): ART[name]=cv.rows()

# ── 화분 ──
def pot(cv,x,y,w,h,c,sh,rim):
    cv.rect(x,y,w,h,c); cv.vline(x+w-2,y,h,sh); cv.vline(x+w-1,y,h,sh); cv.hline(x-1,y,w+2,rim); cv.hline(x-1,y+1,w+2,rim)
    cv.hline(x+1,y+h,w-2,sh)

def plant_basic():
    cv=Cv(16,22)
    for cx,cy,r in ((8,8,5),(5,10,3.5),(11,10,3.5),(8,5,3.5)):
        cv.ell(cx,cy,r,r*0.9,'L','v','l')
    for (x,y) in ((6,6),(9,4),(10,9),(5,11),(8,9)): cv.set(x,y,'l')
    pot(cv,4,14,8,6,'w','g','W'); cv.hline(5,17,6,'W')
    cv.outline(); save('plant_basic',cv)

def monstera():
    cv=Cv(22,30)
    cv.vline(10,10,10,'v'); cv.vline(11,12,8,'v')
    for (x,y,dx,dy,n) in ((10,11,-1,-0.6,9),(11,10,1,-0.7,9),(10,8,-0.3,-1,8),(11,13,1.1,-0.1,9),(10,14,-1.1,0,9),(11,6,0.4,-1,6)):
        leaf(cv,x,y,dx,dy,n,'L','v')
    # 잎 구멍(몬스테라 특징)
    for (x,y) in ((5,8),(15,7),(7,4),(16,13),(5,14)): cv.set(x,y,'V')
    for (x,y) in ((4,10),(17,9),(9,3),(18,14),(3,13)): cv.set(x,y,'l')
    # 라탄 바구니
    cv.rect(5,21,12,7,'o'); cv.vline(15,21,7,'O'); cv.vline(16,21,7,'O')
    for i in range(5,17,2): cv.vline(i,23,4,'O')
    cv.hline(4,21,14,'d'); cv.hline(6,28,10,'d')
    cv.outline(); save('monstera',cv)

def olive():
    cv=Cv(18,32)
    cv.line(9,24,9,12,'d'); cv.line(9,16,6,12,'d'); cv.line(9,15,12,11,'D')
    for cx,cy,r in ((9,8,5.5),(5,11,3.5),(13,10,3.5),(9,4,3.5),(6,6,3),(12,5,3)):
        cv.ell(cx,cy,r,r*0.85,'a','A','M')
    for (x,y) in ((6,5),(11,3),(13,9),(4,10),(9,9),(8,6),(14,6)): cv.set(x,y,'A')
    for (x,y) in ((7,8),(10,6),(12,11)): cv.set(x,y,'n')  # 올리브 열매
    pot(cv,5,24,8,7,'x','X','X'); cv.hline(6,27,6,'X')
    cv.outline(); save('olive',cv)

def palm():
    cv=Cv(22,34)
    for (x0,tx,ty) in ((10,3,6),(11,19,5),(10,6,1),(11,15,1),(10,1,13),(11,21,12),(10,10,0)):
        cv.line(x0,24,tx,ty,'v')
        steps=max(abs(tx-x0),24-ty)
        for t in range(2,steps,2):
            f=t/steps; px=round(x0+(tx-x0)*f); py=round(24+(ty-24)*f)
            cv.set(px-1,py,'L'); cv.set(px+1,py,'l'); cv.set(px-2,py+1,'L'); cv.set(px+2,py+1,'L')
    pot(cv,6,25,10,8,'n','e','N'); cv.hline(7,28,8,'N')
    cv.outline(); save('palm',cv)

# ── 책상 조명 ──
def lamp_basic():
    cv=Cv(12,16)
    cv.rect(3,14,6,2,'g'); cv.hline(3,14,6,'w')
    cv.vline(5,6,8,'G'); cv.line(5,6,7,4,'G')
    cv.rect(6,1,5,4,'w'); cv.hline(6,4,5,'g'); cv.vline(10,1,4,'g')
    cv.outline(); save('lamp_basic',cv)

def lamp_brass():
    cv=Cv(16,20)
    cv.rect(3,17,8,3,'H'); cv.hline(3,17,8,'h')
    cv.line(7,17,4,9,'h'); cv.line(4,9,9,3,'h')
    cv.set(4,9,'H')
    cv.rect(8,1,6,4,'e'); cv.rect(9,0,4,1,'e'); cv.hline(8,4,6,'E')
    cv.rect(9,5,4,1,'z')
    cv.outline()
    for (x,y) in ((9,6),(10,6),(11,6),(12,6),(10,7),(11,7)): cv.set(x,y,'z')
    save('lamp_brass',cv)

def lamp_mint():
    cv=Cv(12,15)
    cv.ell(6,6,4.5,5,'M','m','i'); cv.rect(2,10,8,1,'m')
    cv.rect(3,11,6,3,'o'); cv.vline(8,11,3,'O')
    cv.outline(); save('lamp_mint',cv)

# ── 커피 코너(원목 수납장 + 기계) ──
def cabinet(cv,y=14):
    cv.rect(0,y,26,12,'o'); cv.hline(0,y,26,'O'); cv.hline(0,y+11,26,'d')
    cv.vline(13,y+2,9,'d'); cv.set(11,y+6,'D'); cv.set(15,y+6,'D')
    cv.rect(1,y+12,2,2,'d'); cv.rect(23,y+12,2,2,'d')

def coffee_basic():
    cv=Cv(26,28); cabinet(cv)
    cv.rect(8,1,10,13,'w'); cv.vline(16,1,13,'g'); cv.vline(17,1,13,'g')
    cv.rect(9,2,6,4,'B'); cv.hline(9,2,6,'j')     # 물통
    cv.rect(10,8,4,3,'e'); cv.set(11,8,'r'); cv.set(12,8,'b')
    cv.outline(); save('coffee_basic',cv)

def coffee_capsule():
    cv=Cv(26,28); cabinet(cv)
    cv.rect(6,3,9,11,'r'); cv.vline(13,3,11,'R'); cv.vline(14,3,11,'R'); cv.rect(6,1,8,2,'e')
    cv.rect(8,7,4,4,'e'); cv.rect(9,10,2,2,'w')
    cv.rect(17,9,5,5,'n'); cv.hline(17,9,5,'N')   # 캡슐 통
    for i in (18,20): cv.set(i,11,'y')
    cv.outline(); save('coffee_capsule',cv)

def coffee_espresso():
    cv=Cv(26,28); cabinet(cv)
    cv.rect(3,4,13,10,'s'); cv.vline(14,4,10,'S'); cv.vline(15,4,10,'S'); cv.hline(3,4,13,'w')
    cv.rect(4,1,10,3,'e'); cv.rect(5,7,8,1,'e'); cv.set(6,8,'e'); cv.set(11,8,'e')
    cv.rect(6,11,3,3,'w'); cv.rect(10,11,3,3,'w')      # 컵 두 개
    cv.set(5,5,'r'); cv.set(13,5,'b')
    cv.rect(18,2,5,5,'j'); cv.rect(19,4,3,3,'c'); cv.rect(18,7,5,7,'e'); cv.set(20,9,'S')  # 그라인더
    cv.outline(); save('coffee_espresso',cv)

def coffee_tea():
    cv=Cv(26,28); cabinet(cv)
    cv.ell(9,9,4.5,4,'M','m','i'); cv.rect(7,4,4,1,'m'); cv.set(9,3,'t')
    cv.line(13,8,15,6,'m'); cv.line(4,7,4,11,'m')
    for x in (16,20): cv.rect(x,10,3,3,'w'); cv.hline(x,10,3,'W'); cv.set(x+1,11,'y')
    cv.rect(17,6,5,3,'C'); cv.hline(17,6,5,'o')   # 쿠키 접시
    cv.outline(); save('coffee_tea',cv)

# ── 러그(바닥에 깔림, 원근 타원) ──
def rug(name,fill,border,pattern=None):
    w,h=52,14; cv=Cv(w,h)
    cv.ell(w/2,h/2,w/2-0.3,h/2-0.3,border)
    cv.ell(w/2,h/2,w/2-2.5,h/2-1.6,fill)
    if pattern: pattern(cv,w,h)
    save(name,cv)
def stripes(cv,w,h):
    for (x,y),c in list(cv.p.items()):
        if c=='m' and (x//3)%2==0: cv.p[(x,y)]='M'
def checks(cv,w,h):
    for (x,y),c in list(cv.p.items()):
        if c=='B' and ((x//4)+(y//2))%2==0: cv.p[(x,y)]='j'
def navy_pat(cv,w,h):
    for (x,y),c in list(cv.p.items()):
        if c=='n' and y==h//2 and x%4==0: cv.p[(x,y)]='B'

# ── 전시 선반(윗면에 기념품을 올림) ──
def shelf_basic():
    cv=Cv(38,20)
    cv.rect(0,0,38,18,'w'); cv.hline(0,0,38,'i'); cv.hline(0,1,38,'W'); cv.hline(0,17,38,'g')
    cv.vline(19,3,13,'g'); cv.set(17,9,'G'); cv.set(21,9,'G')
    cv.rect(2,18,2,2,'G'); cv.rect(34,18,2,2,'G')
    cv.outline(); save('shelf_basic',cv)

def shelf_wood():
    cv=Cv(38,20)
    cv.rect(0,0,38,18,'O'); cv.hline(0,0,38,'o'); cv.hline(0,1,38,'o'); cv.hline(0,17,38,'d')
    cv.rect(2,3,34,6,'D'); cv.rect(2,10,34,6,'D'); cv.hline(1,9,36,'o')
    cols='bnmrytuNcB'; x=3
    for i,c in enumerate(cols*2):
        if x>34: break
        hgt=4+(i%3==0)
        cv.rect(x,3+(5-hgt)+1,2,hgt,c); x+=2+(i%4==3)
    x=3
    for i,c in enumerate('ymbrnuoBt'):
        if x>32: break
        cv.rect(x,11,3,5,c); cv.hline(x,12,3,'w' if i%2 else 'z'); x+=4
    cv.rect(2,18,2,2,'d'); cv.rect(34,18,2,2,'d')
    cv.outline(); save('shelf_wood',cv)

def shelf_glass():
    cv=Cv(38,20)
    cv.rect(0,0,38,18,'n'); cv.hline(0,0,38,'N')
    cv.rect(2,2,16,14,'j'); cv.rect(20,2,16,14,'j')
    for (x0) in (2,20):
        cv.line(x0+3,3,x0+9,9,'i'); cv.line(x0+5,3,x0+11,9,'i')
        cv.hline(x0,9,16,'B')
    cv.rect(5,5,3,4,'y'); cv.rect(25,6,4,3,'m'); cv.rect(9,11,4,4,'r'); cv.rect(28,11,3,4,'u')
    cv.rect(2,18,2,2,'e'); cv.rect(34,18,2,2,'e')
    cv.outline(); save('shelf_glass',cv)

# ── 오른쪽 바닥 소품 ──
def whiteboard():
    cv=Cv(28,34)
    cv.rect(1,1,26,18,'w'); cv.hline(1,18,26,'g')
    cv.rect(0,0,28,1,'S'); cv.rect(0,19,28,1,'S'); cv.vline(0,0,20,'S'); cv.vline(27,0,20,'S')
    # 구성도 낙서: 구름 → 상자 두 개
    cv.ell(8,6,3.5,2.5,'B'); cv.ell(6,7,2,1.6,'B'); cv.rect(7,9,2,1,'b')
    cv.line(11,6,15,6,'b'); cv.rect(16,4,4,4,'m'); cv.line(20,6,22,6,'b'); cv.rect(22,10,4,4,'r'); cv.line(18,8,23,10,'b')
    cv.hline(3,14,10,'G'); cv.hline(3,16,7,'G')
    cv.vline(5,20,12,'S'); cv.vline(22,20,12,'S'); cv.hline(2,32,7,'q'); cv.hline(19,32,7,'q')
    cv.rect(10,19,8,2,'S'); cv.set(11,19,'r'); cv.set(13,19,'b'); cv.set(15,19,'m')
    cv.outline(); save('whiteboard',cv)

def beanbag():
    cv=Cv(28,20)
    cv.ell(14,12,13,7.5,'m','t','M')
    cv.ell(12,6,7,5,'M','m','i')
    cv.line(6,14,12,16,'t'); cv.line(16,15,22,13,'t')
    cv.rect(17,3,6,4,'y'); cv.hline(17,3,6,'z')   # 쿠션 위 노트
    cv.outline(); save('beanbag',cv)

def arcade():
    cv=Cv(20,36)
    cv.rect(2,0,16,36,'n'); cv.vline(16,0,36,'e'); cv.vline(17,0,36,'e')
    cv.rect(3,1,13,4,'u'); cv.hline(4,2,11,'p'); cv.hline(5,3,9,'z')   # 간판
    cv.rect(4,7,11,9,'e'); cv.rect(5,8,9,7,'U')
    cv.rect(6,10,2,2,'y'); cv.rect(10,12,3,2,'m'); cv.set(11,9,'p')
    cv.rect(1,17,18,4,'N'); cv.hline(1,17,18,'B')
    cv.vline(5,15,3,'q'); cv.rect(4,15,3,1,'r'); cv.set(11,18,'y'); cv.set(13,18,'m'); cv.set(15,18,'p')
    cv.rect(5,24,9,6,'e'); cv.rect(8,26,3,2,'y')
    cv.outline(); save('arcade',cv)

# ── 기념품 ──
def m_mug():
    cv=Cv(12,12)
    cv.rect(1,2,8,9,'w'); cv.vline(8,2,9,'W'); cv.hline(1,2,8,'i'); cv.rect(2,1,6,1,'c')
    cv.rect(9,4,2,1,'w'); cv.rect(10,5,1,3,'w'); cv.rect(9,8,2,1,'w')
    cv.ell(5,6.5,2.5,1.6,'B'); cv.hline(3,8,4,'b')
    cv.outline(); save('m_mug',cv)

def m_star():
    cv=Cv(12,14)
    cv.rect(1,11,10,3,'d'); cv.hline(1,11,10,'o'); cv.hline(3,12,6,'y')
    pts=[(6,0),(7,3),(11,3),(8,6),(9,10),(6,8),(3,10),(4,6),(1,3),(5,3)]
    for j in range(0,11):
        for i in range(0,12):
            # 점이 다각형 안인지
            inside=False; n=len(pts)
            for a in range(n):
                x1,y1=pts[a]; x2,y2=pts[(a+1)%n]
                if (y1>j+.5)!=(y2>j+.5) and i+.5 < (x2-x1)*(j+.5-y1)/(y2-y1)+x1: inside=not inside
            if inside: cv.set(i,j,'y')
    cv.set(5,4,'z'); cv.set(6,3,'z'); cv.set(7,7,'Y'); cv.set(8,8,'Y')
    cv.outline(); save('m_star',cv)

def m_medal():
    cv=Cv(12,15)
    cv.line(2,0,5,6,'b'); cv.line(3,0,6,6,'b'); cv.line(9,0,6,6,'r'); cv.line(8,0,5,6,'r')
    cv.ell(6,10,4,4,'y','Y','z'); cv.set(6,9,'Y'); cv.set(5,10,'Y'); cv.set(6,10,'Y'); cv.set(7,10,'Y'); cv.set(6,11,'Y')
    cv.outline(); save('m_medal',cv)

def trophy(name,c,sh,li,base='d'):
    cv=Cv(14,16)
    cv.rect(3,1,8,6,c); cv.ell(7,6,4,3,c,sh,li); cv.vline(9,1,5,sh); cv.vline(10,1,5,sh); cv.hline(3,1,8,li)
    cv.rect(1,2,2,1,c); cv.rect(0,2,1,3,c); cv.rect(1,5,2,1,c)
    cv.rect(11,2,2,1,c); cv.rect(13,2,1,3,c); cv.rect(11,5,2,1,c)
    cv.rect(6,9,2,3,sh); cv.rect(4,12,6,1,c)
    cv.rect(3,13,8,3,base); cv.hline(3,13,8,'o'); cv.hline(5,14,4,'y')
    cv.outline(); save(name,cv)

def m_cloud():
    cv=Cv(16,16)
    cv.ell(8,6,4,3.5,'y','Y','z'); cv.ell(4.5,7.5,3,2.5,'y','Y','z'); cv.ell(11.5,7.5,3,2.5,'y','Y','z'); cv.rect(3,7,10,3,'y'); cv.hline(3,9,10,'Y')
    cv.rect(7,10,2,2,'Y'); cv.rect(3,12,10,4,'n'); cv.hline(3,12,10,'N'); cv.hline(5,14,6,'y')
    cv.outline(); save('m_cloud',cv)

def m_cal():
    cv=Cv(12,13)
    cv.rect(0,2,12,11,'w'); cv.rect(0,2,12,3,'r'); cv.set(3,1,'G'); cv.set(8,1,'G'); cv.set(3,2,'G'); cv.set(8,2,'G')
    for (x,y) in ((4,6),(5,6),(6,6),(7,6),(7,7),(6,8),(6,9),(5,10),(5,11)): cv.set(x,y,'n')
    cv.vline(11,5,8,'W')
    cv.outline(); save('m_cal',cv)

def r_lead():
    cv=Cv(16,13)
    cv.rect(1,5,7,7,'S'); cv.hline(1,5,7,'s'); cv.vline(7,5,7,'q'); cv.rect(3,4,3,1,'S')
    cv.line(8,7,12,3,'S'); cv.set(13,3,'S'); cv.line(0,6,0,10,'q')
    cv.rect(10,8,5,1,'w'); cv.rect(11,9,3,1,'w'); cv.rect(10,10,5,3,'C'); cv.hline(10,10,5,'c')
    cv.outline(); save('r_lead',cv)

def r_senior():
    cv=Cv(12,13)
    for (cx,cy,r) in ((6,5,3.2),(3.5,6.5,2),(8.5,6.5,2),(6,2.5,1.8)): cv.ell(cx,cy,r,r*0.9,'a','A','M')
    cv.set(6,1,'p'); cv.set(5,4,'A'); cv.set(7,6,'A')
    cv.rect(2,8,8,5,'x'); cv.hline(1,8,10,'X'); cv.vline(8,9,4,'X')
    cv.outline(); save('r_senior',cv)

def r_peer():
    cv=Cv(14,13)
    for (y,c,d) in ((1,'p','P'),(7,'B','b')):
        x=1 if y==1 else 2
        cv.rect(x,y,3,5,c); cv.vline(x+2,y,5,d); cv.rect(x+3,y+2,5,1,'S'); cv.rect(x+8,y,3,5,c); cv.vline(x+10,y,5,d)
    cv.outline(); save('r_peer',cv)

def team_photo():
    cv=Cv(16,14)
    cv.rect(0,0,16,13,'O'); cv.rect(1,1,14,11,'o'); cv.rect(2,2,12,9,'j'); cv.rect(2,8,12,3,'a')
    for (x,hair,top) in ((3,'K','B'),(7,'c','g'),(11,'p','e')):
        cv.rect(x,4,2,2,'C'); cv.hline(x,3,2,hair); cv.rect(x-0,6,2,3,top)
    cv.rect(6,13,4,1,'d')
    cv.outline(); save('team_photo',cv)

def icon_desk():
    cv=Cv(16,16)
    cv.rect(3,1,10,7,'n'); cv.rect(4,2,8,5,'B'); cv.hline(4,2,8,'j'); cv.rect(7,8,2,2,'q')
    cv.rect(0,10,16,2,'o'); cv.hline(0,10,16,'h'); cv.vline(1,12,4,'d'); cv.vline(14,12,4,'d'); cv.rect(10,12,3,3,'O')
    cv.rect(5,9,5,1,'g')
    save('icon_desk',cv)

for f in (plant_basic,monstera,olive,palm,lamp_basic,lamp_brass,lamp_mint,coffee_basic,coffee_capsule,coffee_espresso,coffee_tea,
          shelf_basic,shelf_wood,shelf_glass,whiteboard,beanbag,arcade,m_mug,m_star,m_medal,m_cloud,m_cal,r_lead,r_senior,r_peer,team_photo,icon_desk):
    f()
rug('rug_navy','n','B',navy_pat); rug('rug_mint','m','t',stripes); rug('rug_check','B','b',checks)
trophy('m_silver','s','S','i'); trophy('m_gold','y','Y','z')


# ── 앱 아이콘(하단 메뉴·화면 제목) ──
def icon(name, draw, w=16, h=16):
    cv=Cv(w,h); draw(cv); save(name,cv)
def i_home(cv):
    for i in range(8): cv.hline(7-i,1+i,2+2*i,'n')
    for i in range(1,7): cv.hline(7-i+1,1+i,2*i,'B')
    cv.rect(3,8,10,7,'w'); cv.vline(2,8,7,'n'); cv.vline(13,8,7,'n'); cv.hline(2,15,12,'n')
    cv.rect(7,10,3,5,'b'); cv.rect(4,9,2,2,'j'); cv.set(11,9,'j'); cv.set(11,10,'j')
def i_laptop(cv):
    cv.rect(2,2,12,9,'n'); cv.rect(3,3,10,7,'B'); cv.hline(3,3,10,'j'); cv.set(5,5,'i'); cv.hline(6,7,4,'j')
    cv.rect(0,11,16,2,'g'); cv.hline(0,11,16,'n'); cv.hline(1,13,14,'G'); cv.hline(6,12,4,'S')
def i_book(cv):
    cv.rect(1,2,7,12,'w'); cv.rect(8,2,7,12,'w'); cv.vline(0,2,13,'n'); cv.vline(15,2,13,'n'); cv.hline(0,14,16,'n'); cv.vline(7,2,13,'n'); cv.vline(8,2,13,'b')
    cv.hline(0,1,7,'n'); cv.hline(9,1,7,'n'); cv.hline(1,2,6,'n'); cv.hline(9,2,6,'n')
    for y in (5,7,9,11): cv.hline(2,y,4,'B'); cv.hline(10,y,4,'B')
def i_chart(cv):
    for (x,h,c) in ((1,5,'B'),(5,8,'b'),(9,11,'b'),(13,14,'n')):
        cv.rect(x,15-h,2,h,c)
    cv.hline(0,15,16,'n')
def i_cloud(cv):
    cv.ell(10,5,4.5,4,'i','W'); cv.ell(5.5,8,4,3,'i','W'); cv.ell(14,8.5,3.5,2.6,'i','W'); cv.rect(4,8,12,3,'i'); cv.hline(3,11,13,'W')
    cv.outline('n')
def i_coin(cv):
    cv.ell(6,6,5.6,5.6,'y','Y','z'); cv.rect(5,3,3,1,'Y'); cv.set(4,4,'Y'); cv.set(4,5,'Y'); cv.set(4,6,'Y'); cv.set(4,7,'Y'); cv.rect(5,8,3,1,'Y'); cv.set(7,6,'Y'); cv.set(6,6,'Y')
    cv.outline('H')
def i_clip(cv):
    cv.rect(2,2,12,13,'w'); cv.vline(1,2,14,'n'); cv.vline(14,2,14,'n'); cv.hline(1,15,14,'n'); cv.hline(1,2,14,'n'); cv.rect(5,0,6,3,'b'); cv.hline(6,1,4,'B')
    for y in (6,9,12):
        cv.rect(3,y,2,2,'m'); cv.hline(6,y,6,'G'); cv.hline(6,y+1,4,'g')
def i_cal(cv):
    cv.rect(1,3,14,12,'w'); cv.rect(1,3,14,3,'b'); cv.vline(0,3,13,'n'); cv.vline(15,3,13,'n'); cv.hline(0,15,16,'n'); cv.hline(0,2,16,'n'); cv.rect(4,1,1,3,'n'); cv.rect(11,1,1,3,'n')
    for y in (8,11):
        for x in (3,6,9,12): cv.rect(x,y,2,2,'B')
    cv.rect(9,11,2,2,'b')
def i_stack(cv):
    for (y,c,d) in ((9,'n','N'),(6,'b','n'),(3,'B','b')):
        for i in range(4): cv.hline(8-2*i-1,y+i,4*i+2,c)
        for i in range(4): cv.hline(1+2*i,y+4+i,14-4*i,c)
    cv.hline(7,3,2,'j')
def i_server(cv):
    for y in (1,6,11):
        cv.rect(1,y,14,4,'B'); cv.hline(1,y,14,'j'); cv.vline(0,y,4,'n'); cv.vline(15,y,4,'n'); cv.hline(0,y+3,16,'n'); cv.set(3,y+1,'m'); cv.set(5,y+1,'y'); cv.hline(8,y+1,5,'n')
def i_lock(cv):
    cv.rect(4,1,8,1,'q'); cv.vline(3,2,5,'q'); cv.vline(12,2,5,'q'); cv.rect(2,7,12,8,'y'); cv.hline(2,7,12,'z'); cv.rect(7,9,2,4,'H')
    cv.outline('H')
def i_search(cv):
    cv.ell(6,6,5,5,'j'); cv.ell(6,6,3.4,3.4,'i'); cv.line(10,10,14,14,'n'); cv.line(11,10,15,14,'n')
    cv.outline('n')
def i_star(cv):
    pass
def i_note(cv):
    i_book(cv)
for n,f in (('i_home',i_home),('i_laptop',i_laptop),('i_book',i_book),('i_chart',i_chart),('i_clip',i_clip),('i_cal',i_cal),('i_stack',i_stack),('i_server',i_server),('i_lock',i_lock),('i_search',i_search)):
    icon(n,f)
icon('i_cloud',i_cloud,19,14); icon('i_coin',i_coin,13,13)


# ── 동료 에피소드 보상(사진·소품·액자) ──
def photo(name, frame, bg, ground, draw):
    cv=Cv(16,14); cv.rect(0,0,16,13,frame); cv.rect(1,1,14,11,bg); cv.rect(1,8,14,4,ground); draw(cv)
    cv.rect(6,13,4,1,'d'); cv.outline(); save(name,cv)
def fig(cv,x,y,hair,top):
    cv.rect(x,y,2,2,'C'); cv.hline(x,y-1,2,hair); cv.rect(x,y+2,2,3,top)
def ep_lead1(cv):     # 마감 전날 밤의 커피: 밤 창문 + 커피잔 세 개
    cv.rect(1,1,14,7,'n'); cv.set(4,3,'z'); cv.set(11,2,'z'); cv.set(8,4,'i')
    for (x,c) in ((2,'w'),(6,'B'),(10,'p')):
        cv.rect(x,8,3,3,c); cv.set(x+3,9,c); cv.hline(x,8,3,'c')
    cv.set(3,6,'g'); cv.set(7,5,'g'); cv.set(11,6,'g')
def ep_senior1(cv):   # 점심 산책길: 남산 타워 + 길
    cv.ell(10,8,5,3,'a'); cv.vline(10,2,5,'S'); cv.rect(9,4,3,1,'S'); cv.line(3,12,6,8,'o'); cv.line(4,12,7,8,'o')
    fig(cv,3,5,'c','g')
def ep_peer1(cv):     # 점심 봇의 첫 국밥: 팀 넷 + 김 나는 국밥
    for (x,h,t) in ((2,'K','B'),(5,'c','g'),(9,'p','e'),(12,'q','n')): fig(cv,x,3,h,t)
    cv.rect(5,9,6,2,'c'); cv.hline(4,9,8,'X'); cv.hline(6,8,4,'C'); cv.set(6,7,'i'); cv.set(9,6,'i')
def cert(name, seal, body):
    cv=Cv(16,14); cv.rect(0,0,16,13,'n'); cv.rect(1,1,14,11,'w'); body(cv)
    cv.ell(12.5,9.5,2,2,seal); cv.set(12,9,'z'); cv.rect(6,13,4,1,'d'); cv.outline(); save(name,cv)
def b_check(cv):
    for y in (3,6,9): cv.set(3,y,'m'); cv.set(4,y+1,'m'); cv.set(5,y,'m'); cv.hline(7,y,5,'G')
def b_title(cv):
    cv.hline(3,3,10,'n'); cv.hline(4,5,8,'G'); cv.hline(4,7,6,'G')
def notebook(name, cover, band, sticker):
    cv=Cv(14,14); cv.rect(1,1,11,12,cover); cv.vline(1,1,12,band); cv.vline(2,1,12,band)
    cv.rect(12,2,1,10,'w'); cv.rect(5,4,5,3,'w'); cv.hline(6,5,3,'G'); sticker(cv); cv.outline(); save(name,cv)
def st_coffee(cv): cv.rect(6,9,3,3,'C'); cv.set(9,10,'C'); cv.hline(6,9,3,'c')
def st_succ(cv): cv.ell(7.5,10,2,1.6,'a','A','M'); cv.rect(6,11,3,2,'x')
def badge(name):
    cv=Cv(12,15); cv.line(3,0,5,5,'p'); cv.line(4,0,6,5,'p'); cv.line(8,0,6,5,'B'); cv.line(7,0,5,5,'B')
    cv.ell(6,9.5,5,5,'p'); cv.rect(6,5,5,10,'.')
    for j in range(5,15):
        for i in range(6,12):
            if ((i+.5-6)/5)**2+((j+.5-9.5)/5)**2<=1: cv.set(i,j,'B')
    cv.ell(6,9.5,2.6,2.6,'w'); cv.set(5,9,'r'); cv.set(6,9,'r'); cv.set(6,10,'r'); cv.set(7,9,'y')
    cv.outline(); save(name,cv)
photo('ep_lead1','O','C','W',ep_lead1); photo('ep_senior1','O','j','l',ep_senior1); photo('ep_peer1','n','M','W',ep_peer1)
cert('ep_lead2','m',b_check); cert('ep_senior3','y',b_title); cert('ep_peer3','p',b_title)
notebook('ep_lead3','c','D',st_coffee); notebook('ep_senior2','m','t',st_succ); badge('ep_peer2')


# ── 리바희 에피소드 보상 ──
def ep_bahee1(cv):    # 반짝이는 팀 책상: 깨끗한 책상 + 컵받침 위 검정 머그 + 반짝임
    cv.rect(1,7,14,2,'o'); cv.hline(1,7,14,'h'); cv.vline(3,9,3,'d'); cv.vline(12,9,3,'d')
    cv.rect(7,4,3,3,'k'); cv.hline(7,4,3,'q'); cv.set(10,5,'k'); cv.hline(6,7,5,'g')
    for (x,y) in ((3,3),(12,2),(13,5)): cv.set(x,y,'i')
    cv.set(2,2,'z'); cv.set(11,4,'z')
photo('ep_bahee1','n','j','W',ep_bahee1)
def ep_bahee2():      # "확인했나?" 검정 머그
    cv=Cv(14,13); cv.rect(2,2,8,10,'k'); cv.hline(2,2,8,'q'); cv.vline(2,3,8,'E')
    cv.rect(10,4,2,1,'k'); cv.rect(11,5,1,3,'k'); cv.rect(10,8,2,1,'k')
    cv.hline(4,6,4,'w'); cv.set(5,8,'w'); cv.set(7,8,'w'); cv.hline(3,12,6,'E')
    cv.outline(); save('ep_bahee2',cv)
ep_bahee2()
cert('ep_bahee3','m',b_check)

# ── 한지애 에피소드 보상 ──
def ep_jiae1(cv):     # 센서 꽂은 화분
    cv.rect(6,9,5,3,'O'); cv.hline(6,9,5,'d'); cv.ell(8.5,6,3,2.4,'l','L'); cv.vline(8,3,2,'v'); cv.set(10,4,'l')
    cv.vline(11,5,4,'S'); cv.set(11,4,'m'); cv.set(12,3,'z'); cv.set(13,2,'z')
photo('ep_jiae1','n','M','W',ep_jiae1)
def ep_jiae2():       # "할당량 확인!" 스티커
    cv=Cv(14,12); cv.ell(6.5,5.5,6,5,'y','Y'); cv.hline(3,4,7,'n'); cv.hline(3,6,5,'n'); cv.set(10,6,'r'); cv.set(10,7,'r')
    cv.outline(); save('ep_jiae2',cv)
ep_jiae2()
cert('ep_jiae3','y',b_title)

# ── 이예거 에피소드 보상 ──
def ep_yeager1(cv):   # 번개 스티커 노트북
    cv.rect(3,3,10,6,'n'); cv.rect(4,4,8,4,'B'); cv.hline(4,4,8,'j'); cv.rect(2,9,12,2,'g'); cv.hline(2,9,12,'S')
    cv.set(11,5,'y'); cv.set(10,6,'y'); cv.set(11,6,'y'); cv.set(10,7,'y')
photo('ep_yeager1','O','C','W',ep_yeager1)
def ep_yeager2():     # "배포 전 3초" 체크 카드
    cv=Cv(14,10); cv.rect(0,0,14,10,'w'); cv.rect(0,0,14,2,'x'); cv.hline(2,4,2,'m'); cv.hline(5,4,6,'G'); cv.hline(2,6,2,'m'); cv.hline(5,6,5,'G')
    cv.set(11,7,'y'); cv.set(10,8,'y')
    cv.outline(); save('ep_yeager2',cv)
ep_yeager2()
cert('ep_yeager3','x',b_check)

used=set(''.join(''.join(r) for r in ART.values()))-{'.'}
out=['// 자동 생성 파일: scripts/office-art.py 를 고친 뒤 python3 scripts/office-art.py 로 다시 만드세요.',
     'export const ART_PAL: Record<string, string> = '+json.dumps({k:v for k,v in PAL.items() if k in used},ensure_ascii=False),
     'export const ART: Record<string, string[]> = {']
for k,v in ART.items(): out.append(f'  {k}: {json.dumps(v)},')
out.append('}')
open(sys.argv[1] if len(sys.argv)>1 else 'src/data/officeArt.ts','w',encoding='utf-8').write('\n'.join(out)+'\n')

# 미리보기
try:
    from PIL import Image, ImageDraw
    S=6; cols=6; cellw=60*S//2; cellh=40*S//2
    names=list(ART); rows_n=math.ceil(len(names)/cols)
    im=Image.new('RGB',(cols*cellw,rows_n*cellh),'#d9dee6'); d=ImageDraw.Draw(im)
    for n,name in enumerate(names):
        g=ART[name]; ox=(n%cols)*cellw+6; oy=(n//cols)*cellh+14
        d.text((ox,oy-12),name,fill='black')
        for y,row in enumerate(g):
            for x,ch in enumerate(row):
                if ch!='.': d.rectangle([ox+x*S//2*1,oy+y*S//2,ox+x*S//2+S//2-1,oy+y*S//2+S//2-1],fill=PAL[ch])
    im.save('/tmp/office-art.png')
except Exception as e: print('preview skipped',e)
print(len(ART),'sprites')
