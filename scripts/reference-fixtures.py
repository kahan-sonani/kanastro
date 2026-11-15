"""Regenerate independent native-Swiss reference data: uv run --with pyswisseph==2.10.3.2 --python 3.12 python scripts/reference-fixtures.py"""
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import json
import swisseph as swe

root = Path(__file__).resolve().parent.parent
swe.set_ephe_path(str(root / 'node_modules/@kuntay/swisseph-data/ephe'))
samples = [
 ('1990-05-15','14:30:00','Asia/Kolkata',26.91962,75.78781),
 ('2000-01-01','12:00:00','UTC',0,0),
 ('1969-07-20','16:17:40','America/New_York',40.71427,-74.00597),
 ('2024-02-29','23:59:59','Asia/Kathmandu',27.70169,85.3206),
 ('1850-06-12','04:23:01','Asia/Kolkata',22.56263,88.36304),
 ('2399-12-01','18:00:00','Australia/Sydney',-33.86785,151.20732),
 ('1800-01-01','12:00:00','UTC',51.50853,-0.12574),
 ('2026-11-15','12:00:00','Europe/Oslo',69.6489,18.95508),
]
cases=[]
for date,time,tz,lat,lon in samples:
 instant=datetime.fromisoformat(f'{date}T{time}').replace(tzinfo=ZoneInfo(tz)).astimezone(timezone.utc)
 jd=instant.timestamp()/86400 + 2440587.5
 for aya in [1,3,5,27,7,0]:
  swe.set_sid_mode(aya)
  for nodes in ['mean','true']:
   flags=swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED
   planets=[]
   for body in [swe.SUN,swe.MOON,swe.MARS,swe.MERCURY,swe.JUPITER,swe.VENUS,swe.SATURN,swe.MEAN_NODE if nodes=='mean' else swe.TRUE_NODE]:
    positions, used=swe.calc_ut(jd,body,flags)
    assert used & swe.FLG_SWIEPH, (body,date,used)
    planets.append({'longitude':positions[0], 'latitude':positions[1], 'speed':positions[3]})
   _,ascmc=swe.houses_ex(jd,lat,lon,b'W',swe.FLG_SIDEREAL)
   cases.append({'date':date,'time':time,'timeZone':tz,'latitude':lat,'longitude':lon,'ayanamsa':aya,'nodes':nodes,'utc':instant.isoformat().replace('+00:00','Z'),'jd':jd,'ascendant':ascmc[0],'ayanamsaValue':swe.get_ayanamsa_ex_ut(jd,swe.FLG_SWIEPH)[1],'planets':planets})
output={'reference':'pyswisseph 2.10.3.2 / native Swiss Ephemeris '+swe.version,'data':'@kuntay/swisseph-data 0.2.2, DE441-derived','cases':cases}
(root/'tests/fixtures/native-swiss.json').write_text(json.dumps(output,indent=2)+'\n')
print(f'Generated {len(cases)} native reference charts.')
