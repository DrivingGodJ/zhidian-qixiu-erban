// Architecture references, not OEM CAD or workshop coordinates.
// p / rot / scale describe a teaching scene with a 2.9 m wheelbase. A confirmed
// part has evidence for its vehicle zone / role, never millimetre-accurate placement.
// Small controllers without a reliable location are intentionally not placed.
const FRAME = Object.freeze({front:'-X',up:'+Y',lateral:'Z',wheelbase:2.9,groundShiftY:-.095});
const HALF_PI=Math.PI/2;
const S=(id,title,url,details,kind='official')=>({id,title,url,details,kind});
const P=(id,b,name,p,desc,evidence,extra={})=>({id,b,name,p,desc,evidence,confidence:'confirmed',...extra});
const motor=(id,x,z,evidence,extra={})=>P(id,'motor',x<0?'前桥驱动电机':'后桥驱动电机',[x,.52,z],'电机轴横跨车宽，机械输出经减速与差速机构驱动本桥车轮。',evidence,{opt:{r:.18,len:.4},...extra});
const reducer=(id,x,z,evidence,extra={})=>P(id,'reducer','单速减速与差速机构',[x,.53,z],'与驱动电机同属电驱总成，完成减速与差速。',evidence,{rot:[0,HALF_PI,0],...extra});
const inverter=(id,x,z,evidence,extra={})=>P(id,'inverter','电驱功率电子功能区',[x,1.0,z],'逆变器随电驱总成布置，控制驱动电机。',evidence,extra);
const flatPack=(p,len,evidence,extra={})=>P('battery','battery','地板下动力电池包',p,'平铺于乘员舱地板下方。',evidence,{opt:{len,modules:8},...extra});

export const VEHICLE_PROFILES=Object.freeze({
  'su7-rwd-2024':{
    id:'su7-rwd-2024',name:'小米 SU7 标准版 · 后驱',year:'2024',powertrain:'bev',shell:'su7',
    shellScope:'去标 SU7 外观；内部为后驱与地板电池架构示意。',
    scope:'按 2024 首发配置表选定标准后驱代表。未复刻该车完整维修布置图；前舱附件与小型控制器不作原厂定位。',
    coordinateFrame:FRAME,
    confirmedLayout:['CTB 一体化电池结构。','标准版为后置永磁同步电机；不适用于 Max 前后双电机四驱。'],
    architecture:{drivenAxles:['rear'],electricDriveLocations:['rear'],batteryLayout:'flat-floor',engineLocation:null},
    sources:[
      S('xiaomi-su7-2024-spec','小米 SU7 · 2024 首发参数配置表','https://s1.xiaomiev.com/activity-outer-assets/0328/env/SU7%E5%8F%82%E6%95%B0%E9%85%8D%E7%BD%AE%E8%A1%A8328.pdf','已读取官方 PDF 第2页：标准版后永磁/同步电机、无前电机、CTB 一体化电池；与 Pro/Max 分列。'),
      S('byd-blade-shape','BYD · Blade 长方片电芯公开结构','https://prod.byd.com/en/car/atto3','用于核对已由小米首发参数表确认的弗迪 Blade 电芯长方片形态；不将 ATTO 3 托盘当作 SU7 原厂托盘。'),
      S('xiaomi-ctb-2024','小米 2024 年度报告 · 智能电动汽车','https://ir.mi.com/system/files-encrypted/nasdaq_kms/assets/2025/04/24/5-27-15/%E8%8B%B1%E6%96%87.pdf','确认 CTB 电池结构；不据此推断单独控制器位置。')
    ],
    parts:[
      {...flatPack([-.05,.285,0],2.3,['xiaomi-su7-2024-spec','xiaomi-ctb-2024','byd-blade-shape']),geometry:'su7BladePack'},
      {...motor('motor',1.45,-.18,['xiaomi-su7-2024-spec'],{name:'后桥永磁同步驱动电机'}),geometry:'su7RearMotor'},
      {...reducer('reducer',1.45,.43,['xiaomi-su7-2024-spec'],{confidence:'schematic'}),geometry:'su7Reducer'},
      {...inverter('inverter',1.45,-.18,['xiaomi-su7-2024-spec'],{confidence:'schematic'}),geometry:'su7Inverter'}
    ]
  },
  'atto3-fwd-2023':{
    id:'atto3-fwd-2023',name:'BYD ATTO 3 · 前驱',year:'2022–2023',powertrain:'bev',shell:'generic-suv',
    shellScope:'无品牌通用 SUV 外壳；参考 2022–2023 ATTO 3 内部架构。',
    scope:'早期 e-Platform 3.0 前驱车型；不套用后续 ATTO 3 Evo 的后驱布局。',coordinateFrame:FRAME,
    confirmedLayout:['前桥电驱，前轮驱动。','Blade 电池在车底；前电驱采用八合一集成架构。'],
    architecture:{drivenAxles:['front'],electricDriveLocations:['front'],batteryLayout:'flat-floor',engineLocation:null,integration:'8-in-1'},
    sources:[
      S('byd-atto3-launch-2023','BYD ATTO 3 · 2023 英国官方上市资料','https://bydukmedia.com/en/archive/byd-atto-3.html','2023 上市档案明确前轮驱动、永磁同步电机、Blade 电池和八合一电驱；不采用 Evo 新车型配置。'),
      S('byd-atto3-platform','BYD ATTO 3 · e-Platform 3.0','https://www.byd.com/en/car/atto3.html','官方列八合一电驱和 Blade 电池；教学中把电机、减速和功率电子分区显示，未把 OBC/VCU/BMS 随意分散摆放。')
    ],
    parts:[
      {...flatPack([.15,.285,0],2.05,['byd-atto3-launch-2023','byd-atto3-platform'],{name:'Blade 地板电池包'}),geometry:'atto3BladePack'},
      {...motor('motor',-1.45,-.18,['byd-atto3-launch-2023','byd-atto3-platform']),geometry:'atto3EightMotor'},
      {...reducer('reducer',-1.45,.43,['byd-atto3-platform']),geometry:'atto3Reducer'},
      {...inverter('inverter',-1.45,-.18,['byd-atto3-platform'],{name:'八合一电驱 · 集成功率电子功能区'}),geometry:'atto3PowerDeck'}
    ]
  },
  'model3-rwd-2023':{
    id:'model3-rwd-2023',name:'Tesla Model 3 · 后驱',year:'2023 · 改款前',powertrain:'bev',shell:'model3',
    shellScope:'2018 改款前同代 Model 3 社区去标外观参考；内部为 2023 后驱架构示意，非精准 2023 车壳。',
    scope:'2017–2023 平台的后驱代表；不将历史 Model S 感应电机或 4680 电芯直接当作本车配置。',coordinateFrame:FRAME,
    confirmedLayout:['高压电池安装在地板下。','后桥电驱位于后轮之间，逆变器在驱动总成内；后驱版本不放前电机。'],
    architecture:{drivenAxles:['rear'],electricDriveLocations:['rear'],batteryLayout:'flat-floor',engineLocation:null,integration:'rear-drive-inverter'},
    sources:[
      S('tesla-model3-subsystems','Tesla 2017–2023 Model 3 · Motor Types','https://www.tesla.com/ownersmanual/2017_2023_model3/en_us/GUID-E414862C-CFA1-4A0B-9548-BE21C32CAA58.html','官方说明后电机为液冷永磁同步、AWD 前电机为感应；本图仅重建后驱结构，不采用历史 Model S 鼠笼转子。'),
      S('tesla-model3-erg','Tesla Model 3 · 官方应急响应指南','https://www.teslamotors.com/sites/default/files/downloads/Model_3_Emergency_Response_Guide_en.pdf','指南第21–23页：地板电池、前电机仅双电机车型具备、后轮间电驱及总成内逆变器。'),
      S('tesla-model3-3du','Tesla 2017–2023 Model 3 · 后驱动单元维修资料','https://service.tesla.com/docs/Model3/ServiceManual/en-us/GUID-583E8FAD-019D-479D-96B7-7A52C31C75B7.html','官方维修图确认后副车架上的后驱动单元；教学外壳拆分不复刻原厂铸件。')
    ],
    parts:[
      {...flatPack([-.05,.285,0],2.3,['tesla-model3-erg']),geometry:'model3BatteryCase'},
      {...motor('motor',1.45,-.18,['tesla-model3-erg','tesla-model3-3du','tesla-model3-subsystems']),geometry:'model3RearMotor'},
      {...reducer('reducer',1.45,.43,['tesla-model3-3du']),geometry:'model3Reducer'},
      {...inverter('inverter',1.45,-.18,['tesla-model3-erg']),geometry:'model3Inverter'}
    ]
  },
  'xc60-t8-er-2022':{
    id:'xc60-t8-er-2022',name:'Volvo XC60 T8 · Extended Range',year:'2022 升级后–2023',powertrain:'phev',shell:'xc60',
    shellScope:'去标 XC60 外观；内部参考 T8 Extended Range 轴分离混动架构。',
    scope:'前发动机/自动变速器与后 ERAD；不使用通用双电机 DHT，也不使用平铺 BEV 电池。',coordinateFrame:FRAME,
    confirmedLayout:['发动机驱动前轮，后桥电机驱动后轮。','混合动力电池沿中央隧道布置；Extended Range 增加电芯层并升级后电机。'],
    architecture:{drivenAxles:['front','rear'],electricDriveLocations:['rear'],batteryLayout:'center-tunnel',engineLocation:'front-transverse',transmission:'transverse-automatic'},
    sources:[
      S('volvo-xc60-drive','Volvo XC60 Recharge · Drive systems','https://www.volvocars.com/en-sa/support/car/xc60-recharge-plug-in-hybrid/20w46/article/5703fde98d987c7ec0a8015167678871/','官方系统图：前燃油驱动、后电驱、隧道电池、曲轴集成起动发电机。'),
      S('volvo-er-2022','Volvo · 2022 Extended Range 官方发布','https://www.volvocars.com/us/media/press-releases/11C10482DFEF2BC9/','2022-03-14：18.8kWh 三层电芯电池与更强的后电机；适用于 XC60 等 SPA Recharge。'),
      S('volvo-xc60-transmission','Volvo XC60 Recharge · Transmission','https://www.volvocars.com/en-ca/support/car/xc60-recharge-plug-in-hybrid/20w46/article/f1df148bc7f01a62c0a81f6f0b6b960e/38c6be44c7f4a3bec0a81f6f02df3f94/82619c168e5ba7c4c0a8015116fd8e74/','前发动机机械传动由自动变速器完成；外形是横置自动变速机构教学剖示。')
    ],
    parts:[
      {...P('engine','phevEngine','前置横向发动机',[-1.45,.74,.25],'前置四缸发动机经前部自动变速器驱动前轮。',['volvo-xc60-drive'],{rot:[0,HALF_PI,0]}),geometry:'volvoFourCylinder'},
      {...P('transmission','dht','前桥自动变速器',[-1.45,.65,-.42],'与前发动机相邻的机械自动变速器。',['volvo-xc60-transmission'],{geometry:'transverseAutomatic',rot:[0,HALF_PI,0]}),geometry:'volvoEightAT'},
      {...P('battery','battery','中央隧道高压电池',[-.2,.46,0],'窄长电池沿乘员舱中央隧道布置。',['volvo-xc60-drive','volvo-er-2022'],{geometry:'tunnelBattery',opt:{len:1.72,width:.31,height:.26,modules:8}}),geometry:'volvoTunnelPack'},
      {...motor('motor',1.55,-.15,['volvo-xc60-drive','volvo-er-2022'],{name:'后桥 ERAD 电机',opt:{r:.16,len:.34}}),geometry:'volvoEradMotor'},
      {...reducer('reducer',1.55,.37,['volvo-xc60-drive'],{scale:[.8,.8,.8],name:'ERAD 后桥减速机构'}),geometry:'volvoEradReducer'},
      {...inverter('inverter',1.55,-.15,['volvo-xc60-drive'],{p:[1.55,.98,-.15],scale:[.85,.85,.85],confidence:'schematic',name:'后电驱功率电子功能区'}),geometry:'volvoEradInverter'}
    ]
  },
  'li-l7-2023':{
    id:'li-l7-2023',name:'理想 L7 · 双电机增程四驱',year:'2023',powertrain:'erev',shell:'generic-suv',
    shellScope:'无品牌通用 SUV 外壳；参考 2023 理想 L7 主总成布置。',
    scope:'前增程器发电，前后电驱驱动车轮；不等同于只有后电机的通用增程布局。',coordinateFrame:FRAME,
    confirmedLayout:['前部增程器与前电驱共存；前后双电机四驱。','动力电池平铺于中部地板，燃油箱在电池后方、后电驱前方。'],
    architecture:{drivenAxles:['front','rear'],electricDriveLocations:['front','rear'],batteryLayout:'flat-floor',engineLocation:'front-generator-only',fuelTankLocation:'behind-battery'},
    sources:[
      S('li-l7-launch-2023','理想 L7 · 2023 官方上市资料','https://ir.lixiang.com/zh-hant/news-releases/news-release-details/li-auto-inc-launches-li-l7-five-seat-flagship-family-suv/','2023-02-08：五合一前电驱、三合一后电驱、1.5L 四缸增程器与 42.8kWh 电池。'),
      S('li-l7-rescue','理想 L7 Max 2023款 · 官方高压系统/救援图','https://manuals.lixiang.com/zh-cn/X032023MAX/20250916140032/topic-2022-C91C882F-001.html','已核对官方 X03-OM-058 / X03-OM-078 俯视与侧视图：地板电池、包后燃油箱、前后高压动力区。')
    ],
    parts:[
      {...P('rex','rex','前置增程器',[-1.43,.94,.05],'前舱发动机与发电机负责发电，电机驱动车轮。',['li-l7-launch-2023','li-l7-rescue'],{rot:[0,HALF_PI,0]}),geometry:'liL7Rex'},
      {...motor('motor-front',-1.45,-.28,['li-l7-launch-2023','li-l7-rescue'],{name:'前桥五合一电驱 · 电机',p:[-1.45,.32,-.28],opt:{r:.13,len:.26}}),geometry:'liL7FrontMotor'},
      {...reducer('reducer-front',-1.45,.25,['li-l7-launch-2023'],{p:[-1.45,.36,.25],scale:[.6,.6,.6],name:'前电驱减速功能区'}),geometry:'liL7FrontReducer'},
      {...flatPack([-.35,.285,0],1.5,['li-l7-rescue'],{opt:{len:1.5,modules:6}}),geometry:'liL7Pack'},
      {...P('fuelTank','fuelTank','电池后方燃油箱',[.92,.5,0],'燃油箱位于平铺电池后部与后桥动力区之前。',['li-l7-rescue'],{opt:{len:.5,w:.82}}),geometry:'liL7FuelTank'},
      {...motor('motor',1.58,-.13,['li-l7-launch-2023','li-l7-rescue'],{name:'后桥三合一电驱 · 电机',opt:{r:.18,len:.4}}),geometry:'liL7RearMotor'},
      {...reducer('reducer',1.58,.43,['li-l7-launch-2023'],{name:'后电驱减速功能区'}),geometry:'liL7RearReducer'},
      {...inverter('inverter',1.58,-.13,['li-l7-launch-2023'],{name:'后电驱逆变功能区'}),geometry:'liL7RearInverter'}
    ]
  },
  'mirai-gen2-2021':{
    id:'mirai-gen2-2021',name:'Toyota Mirai · 第二代',year:'2020 发布 / 2021',powertrain:'fcev',shell:'generic-sedan',
    shellScope:'无品牌通用轿车外壳；参考第二代 Mirai 后驱燃料电池架构。',
    scope:'与第一代 Mirai 前驱/座椅下电堆不同；三罐形状和位置仅按架构关系归一。',coordinateFrame:FRAME,
    confirmedLayout:['燃料电池系统移至前舱，电驱在后桥。','三氢罐呈 T 形：中央纵向长罐，加后部两只横罐。','小型高压电池在后排之后、后轴上方区域。'],
    architecture:{drivenAxles:['rear'],electricDriveLocations:['rear'],batteryLayout:'behind-rear-seats',engineLocation:null,fuelStackLocation:'front',hydrogenTanks:{count:3,topology:'T',axes:['x','z','z']}},
    sources:[
      S('toyota-mirai2-layout','Toyota · The New Mirai 官方发布','https://newsroom.toyota.eu/the-new-toyota-mirai/','官方明确前舱电堆、后驱、T 形三罐、后排之后的锂电池；最长罐纵置于中央地板下，两小罐横置。'),
      S('toyota-mirai2-tech','Toyota Technical Review · 第二代 Mirai','https://global.toyota/pages/global_toyota/mobility/technology/toyota-technical-review/TTR_Vol66_E.pdf','第二代燃料电池与储氢系统的技术布置参考。')
    ],
    parts:[
      {...P('fuelStack','fuelStack','前舱燃料电池系统',[-1.42,.83,0],'电堆与燃料电池功率转换及辅助系统集中在前舱。',['toyota-mirai2-layout']),geometry:'mirai2FuelSystem'},
      {...P('h2tanks','h2tanks','T 形三储氢罐',[.05,.46,0],'中央长罐沿车身纵向；后排下与行李厢下各有一只横向罐。',['toyota-mirai2-layout','toyota-mirai2-tech'],{geometry:'miraiTankSet'}),geometry:'mirai2TankSet'},
      {...motor('motor',1.52,-.18,['toyota-mirai2-layout'],{opt:{r:.16,len:.34}}),geometry:'mirai2RearMotor'},
      {...reducer('reducer',1.52,.37,['toyota-mirai2-layout'],{scale:[.8,.8,.8]}),geometry:'mirai2Reducer'},
      {...P('battery','battery','后排之后缓冲电池',[1.42,1.06,0],'小型高压缓冲电池位于后排座椅之后；与地板下储氢罐分层布置。',['toyota-mirai2-layout'],{opt:{len:.64,modules:2},scale:[1,.8,.65]}),geometry:'mirai2BufferPack'}
    ]
  },
  'nexo-2018':{
    id:'nexo-2018',name:'Hyundai NEXO · 第一代',year:'2018 代 / 2020 救援资料',powertrain:'fcev',shell:'generic-suv',
    shellScope:'无品牌通用 SUV 外壳；参考第一代 NEXO 前驱燃料电池架构。',
    scope:'限定第一代 NEXO，不套用 2025 年发布的新一代系统或参数。',coordinateFrame:FRAME,
    confirmedLayout:['前舱燃料电池系统与前桥电驱，前轮驱动。','后地板下三只横向氢罐；缓冲高压电池在行李厢区域。'],
    architecture:{drivenAxles:['front'],electricDriveLocations:['front'],batteryLayout:'rear-luggage',engineLocation:null,fuelStackLocation:'front',hydrogenTanks:{count:3,topology:'rear-three-transverse',axes:['z','z','z']}},
    sources:[
      S('hyundai-nexo-erg','Hyundai NEXO · 官方应急响应指南','https://www.hyundai.com/content/dam/hyundai/au/en/documents/NEXO_Emergency_Response_Guide_Australia_2020.pdf','2020 指南第10页实车系统位置图、第11–12页部件说明及第29页前驱拖运说明：前舱电堆/电驱、后横向三罐、行李厢电池。')
    ],
    parts:[
      {...P('fuelStack','fuelStack','前舱燃料电池系统',[-1.44,1.0,0],'燃料电池功率模块位于前舱，与下方驱动电机和减速器分层布置。',['hyundai-nexo-erg'],{scale:[.85,.85,.85]}),geometry:'nexo1FuelSystem'},
      {...motor('motor',-1.45,-.24,['hyundai-nexo-erg'],{p:[-1.45,.37,-.24],opt:{r:.14,len:.3}}),geometry:'nexo1FrontMotor'},
      {...reducer('reducer',-1.45,.32,['hyundai-nexo-erg'],{p:[-1.45,.38,.32],scale:[.7,.7,.7]}),geometry:'nexo1Reducer'},
      {...P('h2tanks','h2tanks','后部三横向储氢罐',[.83,.46,0],'三只瓶轴均横跨车宽，沿车身纵向前后排列；不是 Mirai 的中央纵向长罐。',['hyundai-nexo-erg'],{geometry:'nexoTankSet'}),geometry:'nexo1TankSet'},
      {...P('battery','battery','后行李厢缓冲电池',[1.43,.91,0],'高压缓冲电池在行李厢区域，与后地板下氢罐分层。',['hyundai-nexo-erg'],{opt:{len:.65,modules:2},scale:[1,.8,.65]}),geometry:'nexo1BufferPack'}
    ]
  }
});

export const DEFAULT_VEHICLE_PROFILES=Object.freeze({bev:'su7-rwd-2024',phev:'xc60-t8-er-2022',erev:'li-l7-2023',fcev:'mirai-gen2-2021'});
export const getVehicleProfile=id=>Object.prototype.hasOwnProperty.call(VEHICLE_PROFILES,id)?VEHICLE_PROFILES[id]:null;
