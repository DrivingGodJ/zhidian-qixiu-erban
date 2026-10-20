// Shared labels for complete teaching layouts; no production vehicle is implied.
const names={bev:'纯电动 BEV',phev:'插电混动 PHEV',erev:'增程式 EREV',fcev:'氢燃料电池 FCEV'};
const layouts={
  bev:['动力电池、驱动电机与减速器构成主要驱动链路。','同时展示充电、配电、管理与热管理等通用配件。'],
  phev:['发动机、混动传动机构与电驱共同组成通用插混教学系统。','同时展示燃油、电池、充电、配电与热管理等配件。'],
  erev:['增程器负责发电，驱动电机负责驱动车轮。','同时展示燃油、排气、电池、充电与热管理等配件。'],
  fcev:['储氢、电堆、缓冲电池与电驱组成通用燃料电池教学系统。','同时展示空气供给、氢路、配电与热管理等配件。']
};
export const GENERIC_VEHICLE_PROFILES=Object.freeze(Object.fromEntries(Object.entries(names).map(([key,name])=>['generic-'+key,{
  id:'generic-'+key,name:name+' · 通用整车',year:'通用教学',powertrain:key,
  shell:['phev','erev'].includes(key)?'generic-suv':'generic-sedan',
  shellScope:'无品牌通用车体；集中展示该驱动形式的全部教学配件。',
  scope:'为学习组合的通用布局，不对应具体量产车型、品牌配置或原厂安装坐标。',
  confirmedLayout:layouts[key],sources:[]
}])));
export const getGenericVehicleProfile=key=>GENERIC_VEHICLE_PROFILES['generic-'+key]||null;
