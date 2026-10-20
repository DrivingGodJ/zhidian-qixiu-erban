// Original brand records are retained verbatim for provenance, not rendered as current specifications.
// Source: git HEAD ab2bcf8, videos/nev3d.js Hs.
export const LEGACY_BRANDS = Object.freeze({
  "byd": {
    "id": "byd",
    "name": "比亚迪 · e 平台 3.0",
    "sub": "王朝网 / 海洋网（秦、宋、海豹、海豚等）",
    "color": "#3b82f6",
    "tagline": "刀片电池 + 八合一电驱，电池车身一体化 CTB",
    "platform": "400V 高压平台，磷酸铁锂体系为主",
    "battery": {
      "title": "刀片电池（CTP，无模组）",
      "points": [
        "电芯为约 0.96m 的长条形\"刀片\"，直接排布成包，取消模组层级",
        "磷酸铁锂热稳定性好，针刺试验不起火，寿命长、循环次数高",
        "CTB 电池车身一体化：电池上壳体兼作乘员舱地板，车身扭转刚度大幅提升",
        "代价：包内几乎不可单独拆修，售后以整包更换或厂家维修为主"
      ]
    },
    "motor": {
      "title": "八合一电动力总成",
      "points": [
        "电机 + 减速器 + 逆变器 + DC-DC + OBC + PDU + BMS + VCU 八项集成",
        "永磁同步扁线电机，槽满率更高、功率密度更大",
        "前舱省出大量空间，集成度为全行业最高一档",
        "代价：单一零件损坏往往需要更换整个电驱总成"
      ]
    },
    "integration": "八合一电驱 + CTB 电池车身一体化，整车集成度全球领先",
    "repair": "集成度极高：电驱按总成更换、电池包不解体维修，钣喷与高压作业分线管理",
    "diag": "专用诊断仪 VDS（比亚迪官方），故障码与冻结帧需在 4S 体系读取"
  },
  "tesla": {
    "id": "tesla",
    "name": "特斯拉 · Model 3 / Y",
    "sub": "纯电标杆，软件定义汽车",
    "color": "#ef4444",
    "tagline": "大圆柱电芯 + 超高集成电驱桥，前备箱是标志",
    "platform": "400V 高压平台，部分车型已转向 48V 低压架构",
    "battery": {
      "title": "2170 / 4680 大圆柱电池",
      "points": [
        "成千上万颗小圆柱电芯（2170 或 4680）经串并联组成电池包",
        "全包灌胶结构：电芯间填充导热胶，散热好、刚性强",
        "代价：基本无法拆解维修，事故/故障后整包更换",
        "BMS 管理数千颗电芯，均衡策略是各家中最复杂的"
      ]
    },
    "motor": {
      "title": "高转速集成电驱桥",
      "points": [
        "常见前交流异步 + 后永磁同步双电机布置，电机最高转速 16000rpm 以上",
        "电机、减速器、逆变器深度集成为一个\"电驱桥\"整体",
        "逆变器用 SiC 碳化硅器件的车型效率更高",
        "转子/轴承磨损需整体换桥，街边修理厂难以单独处置"
      ]
    },
    "integration": "电驱桥整体化 + 电池灌胶 + 前备箱（前舱无传统动力总成）",
    "repair": "高度总成化：电驱桥、电池包均按总成更换；零部件开放度低，副厂件少",
    "diag": "诊断软件 Toolbox 3 需厂家账号授权，通用诊断仪只能读有限数据"
  },
  "baic": {
    "id": "baic",
    "name": "北汽 · E150EV",
    "sub": "油改电早期代表车型（对应体系课第2课）",
    "color": "#0ea5e9",
    "tagline": "汽油版 E150 基础上改造：发动机舱改电机舱，底盘中部布置动力电池",
    "platform": "早期 300V 级高压平台，磷酸铁锂分箱布置",
    "battery": {
      "title": "磷酸铁锂电池（分箱式布置）",
      "points": [
        "磷酸铁锂电芯分箱布置于底盘中部与后排座椅下方，带独立 BMS 管理",
        "电池箱外挂于底板，涉水和托底风险高——举升检查先看箱体外壳有无变形/渗漏",
        "高压线束沿车身纵梁走线，需重点检查波纹管磨损与固定",
        "原车 12V 系统与新增高压系统并存，改装接插件多、虚接故障率高"
      ]
    },
    "motor": {
      "title": "永磁同步电机 + 单速减速器",
      "points": [
        "发动机舱改为电机舱，永磁同步电机直驱单速减速器",
        "高压系统沿原车纵梁布线，绝缘与互锁故障比专用平台更常见",
        "学习意义：油改电是理解\"专用平台\"设计合理性的最好对照"
      ]
    },
    "integration": "油改电：在原车底盘上加装三电系统，集成度低、改装点多",
    "repair": "集成度低、改装接插件多，绝缘与高压互锁故障高发；检查电池箱固定螺栓力矩标记",
    "diag": "早期车型诊断依赖通用解码仪 + 厂家专检，故障码覆盖不全时需查电路图手动排查"
  },
  "jac": {
    "id": "jac",
    "name": "江淮 · iEV5",
    "sub": "国产三元锂路线代表（对应体系课第3课）",
    "color": "#f59e0b",
    "tagline": "三元锂电池 + 液冷热管理，底盘中部电池包布置",
    "platform": "早期 300V 级高压平台，三元锂 + 液冷 + 加热膜",
    "battery": {
      "title": "三元锂电池包（液冷 + 加热膜）",
      "points": [
        "三元锂单体电压约 3.6V，能量密度高、低温性能好，但热稳定性相对差",
        "电池包置于底盘中部，液冷板 + 加热膜双向热管理，结构比风冷复杂",
        "BMS 策略：三元体系更强调热失控预警，检修时告警阈值更敏感",
        "对比铁锂：铁锂 3.2V/单体、寿命长成本低，但低温衰减大、需 SOC 修正"
      ]
    },
    "motor": {
      "title": "永磁同步电驱 + 独立电控",
      "points": [
        "电机、电控分体布置（区别于比亚迪八合一），单件可换性较好",
        "电机控制器独立散热，检查冷却液管路有无渗漏、接插件有无烧蚀",
        "国产早期三元车的冷却液为电池与电机共用回路，换液需按厂家规程排气"
      ]
    },
    "integration": "电池包底盘中置、电机电控分体，集成度中等",
    "repair": "分体结构单件可换性好；重点检查液冷管路渗漏与加热膜绝缘",
    "diag": "厂家专检 + 通用解码仪并用，热管理相关故障需读 BMS 数据流定位"
  },
  "ningde": {
    "id": "ningde",
    "name": "宁德时代系 · 800V（蔚来 / 理想 / 小米等）",
    "sub": "换电、超充、碳化硅是关键词",
    "color": "#22c55e",
    "tagline": "CTP 方形电芯 + 800V 碳化硅平台，可换电、可超充",
    "platform": "800V 高压平台，快充功率可达 400kW+",
    "battery": {
      "title": "CTP 方形铝壳电池（可换电）",
      "points": [
        "方形铝壳电芯直接成包（CTP），宁德时代供应全行业多数品牌",
        "蔚来换电体系：电池可 3 分钟整体更换，\"电池坏了换一块\"成为可能",
        "三元锂能量密度高、冬季性能好，磷酸铁锂版本近年也快速普及",
        "800V 平台充电电流小、线束更细，但器件耐压要求翻倍"
      ]
    },
    "motor": {
      "title": "SiC 碳化硅电控 + 热泵",
      "points": [
        "800V 母线配 SiC MOSFET 逆变器，损耗低、效率高、支持超快充",
        "电驱多为永磁同步 + 部分双电机四驱，水冷/油冷并行",
        "热泵空调 + 电池电机余热回收是标配，热管理系统比 400V 车型复杂",
        "检修时注意：800V 系统绝缘耐压标准更高，必须使用对应等级的表具与防护"
      ]
    },
    "integration": "电驱集成度适中（单件可换性较好），换电结构是独有差异",
    "repair": "集成度适中、单件可换性较好；蔚来换电车型电池属资产运营，维修路径完全不同",
    "diag": "各品牌专用软件（蔚来 NIO Service、理想、小米 X-Service），协议互不通用"
  }
});

// New teaching statements below are scoped to these primary manufacturer sources.
export const BRAND_SOURCES = Object.freeze({
  blade:{name:'比亚迪：Blade Battery 技术说明（2023）',url:'https://www.byd.com/eu/blog/BYDs-revolutionary-Blade-Battery-all-you-need-to-know.html'},
  bydDrive:{name:'比亚迪：ATTO 3 / e-Platform 3.0 八合一总成',url:'https://www.byd.com/iq/car/atto3'},
  bydMotor:{name:'比亚迪：ATTO 3 官方产品手册，PMSM 规格',url:'https://www.byd.com/content/dam/byd-site/id/brochure/ATTO3-BROCHURE.pdf'},
  qilin:{name:'宁德时代：麒麟 CTP 3.0 发布资料（2022）',url:'https://www.catl.com/en/news/958.html'},
  teslaCell:{name:'Tesla：电池设计与 4680 电芯说明',url:'https://www.tesla.com/learn/engineering-tesla-vehicle-batteries-safety-durability-longevity'},
  teslaMotor:{name:'Tesla：2012 年报，三相感应电机与铜转子',url:'https://ir.tesla.com/_flysystem/s3/sec/000119312513096241/d452995d10k-gen_0.pdf'},
  teslaDiag:{name:'Tesla：诊断软件、Service Mode 与 Toolbox',url:'https://service.tesla.com/en-US/diagnostic-software'},
  huawei:{name:'华为：DriveONE 七合一发布资料（2020）',url:'https://www.huawei.com/cn/news/2020/11/huawei-driveone'},
  dmi:{name:'比亚迪：DM-i 与 EHS 单速直接耦合说明',url:'https://www.byd.com/es-es/news-list/tecnologia-dmi-dual-mode-prioriza-motor-electrico'},
  ths:{name:'丰田：THS 功率分流与行星机构原理（1997）',url:'https://global.toyota/en/detail/7889139'},
  octovalve:{name:'Tesla：2017–2023 Model 3 热泵 Octovalve 维修资料',url:'https://service.tesla.com/docs/Model3/ServiceManual/en-us/GUID-20919F82-A219-4B79-B6E6-132F297D8817.html'},
  denso:{name:'DENSO：喷气增焓热泵与气液分离器',url:'https://www.denso.com/global/en/products/lineup/pick-up/hpacs/'},
  mirai:{name:'丰田：第二代 Mirai 电堆技术论文（2021）',url:'https://global.toyota/pages/global_toyota/mobility/technology/toyota-technical-review/TTR_Vol66_E.pdf'},
  miraiLayout:{name:'丰田：第二代 Mirai 系统布置（2020）',url:'https://global.toyota/pages/news/images/2020/12/09/1200/20201209_01_02_en.pdf'},
  nexo:{name:'现代：上一代 NEXO 官方技术资料（2021）',url:'https://www.hyundai.news/de/pressemappen-archiv/nexo-2021/der-hyundai-nexo-pressetext.html'},
  egmp:{name:'现代：E-GMP 电驱与 400V / 800V 充电（2020）',url:'https://www.hyundai.com/worldwide/en/newsroom/detail/0000000812'}
});

export const BRAND_VARIANTS = Object.freeze({
  'byd-blade':{part:'battery',name:'比亚迪 · 刀片电池',scope:'2020 年发布的 Blade 架构；观察长条电芯。',facts:['长而扁的磷酸铁锂电芯，直接成组提高空间利用率。','观察长条电芯阵列、包体与高压连接的关系。'],axes:['长条方形电芯 · LFP','刀片阵列直接成组','具体长度、包体和 CTB 配置随车型而变'],sources:['blade']},
  'catl-ctp':{part:'battery',name:'宁德时代 · 麒麟 CTP 3.0',scope:'2022 年公开的麒麟电池系统。',facts:['结构横梁、液冷板与隔热垫集成为多功能弹性夹层。','液冷功能件置于相邻电芯之间，扩大换热接触。'],axes:['方形电芯阵列','电芯间多功能换热夹层','CTP 是成组技术；不等于整车 800V 或可换电'],sources:['qilin']},
  'tesla-4680':{part:'battery',name:'Tesla · 4680 圆柱电芯',scope:'4680 电芯架构示意；适用车型与电池版本需另行核对。',facts:['以圆柱电芯阵列观察单体间隔、包体与热管理空间。','Tesla 同时使用自制 4680 与外购电芯；化学体系和包结构随版本变化。'],axes:['大圆柱电芯阵列','电芯隔热与热管理围绕圆柱排列','4680 不能概括全部 Model 3 / Y 电池'],sources:['teslaCell']},
  'byd-pmsm':{part:'motor',name:'比亚迪 · 永磁八合一电驱',scope:'ATTO 3 / e-Platform 3.0 的 PMSM 与八合一集成示意。',facts:['永磁转子与三相定子相配合，减速机构负责扭矩传递。','八合一包含电机、传动、MCU、OBC、DC-DC、PDU、BMS 与 VCU 功能。'],axes:['永磁同步电机','电机、传动与电力电子功能集成','看转子磁体、平行轴传动和电子功能区'],charging:['OBC、DC-DC 与 PDU 纳入八合一功能','同时集成电驱、MCU、BMS、VCU','本图观察总成功能区，不表示独立 OBC 的原厂外形'],sources:['bydDrive','bydMotor']},
  'tesla-induction':{part:'motor',name:'Tesla · 历史感应电驱',scope:'Tesla 2012 年报所述 Roadster / Model S 技术路线。',facts:['三相感应电机通过转子感应电流建立磁场，铜转子是该代公开特点。','观察鼠笼转子、定子与单速减速机构；与永磁转子的磁场来源不同。'],axes:['三相感应电机 · 铜鼠笼转子','单速减速机构与受控三相供电','历史路线；不代表全部现售 Tesla 电机'],sources:['teslaMotor']},
  'huawei-driveone':{part:'motor',name:'华为 · DriveONE 七合一',scope:'2020 年发布的 DriveONE 多合一动力域方案。',facts:['MCU、电机、减速器、DC-DC、OBC、PDU、BCU 七大部件融合。','观察机械动力腔与电力电子功能腔的集成关系。'],axes:['电机与电控协同；本图重点为集成范围','七大部件融合为动力域方案','不以“七合一”推断全部后续产品的转子与电压'],charging:['OBC、DC-DC、PDU 与 BCU 纳入七合一','同时集成 MCU、电机和减速器','本图观察总成功能区，不表示独立充电机的原厂外形'],sources:['huawei']},
  'byd-dmi-ehs':{part:'dht',name:'比亚迪 · DM-i EHS',scope:'官方 DM-i 单速直接耦合 EHS 架构原理。',facts:['以电驱为主，发动机可发电，也可在相应工况参与机械驱动。','观察驱动、发电与直接耦合路径；示意齿数和比例经过简化。'],axes:['单速、直接耦合的电混系统','串联与并联工况由系统协调','不将通用 DHT 的“2–3 挡”套用于本例'],sources:['dmi']},
  'toyota-ths':{part:'dht',name:'丰田 · THS 功率分流',scope:'1997 年公开的 THS 功率分流原理；后续代际结构另有变化。',facts:['行星齿轮功率分流机构连接发动机、发电机与驱动端。','调节发动机、发电机和电机转速，实现电控无级变速作用。'],axes:['行星齿轮功率分流','发电与机械驱动路径共同分配发动机功率','与单速直接耦合方案的机械约束不同'],sources:['ths']},
  'tesla-octovalve':{part:'thermal',name:'Tesla · Octovalve 阀组',scope:'热泵版 Model 3 维修资料所示的冷却液阀组。',facts:['以多通道阀组观察冷却液支路切换与管路组织。','冷却液阀组是热管理中的一部分，制冷剂循环还包含压缩机等部件。'],axes:['集中式冷却液多通道阀组','切换冷却液支路','不是整套热泵，也不是制冷剂膨胀阀'],sources:['octovalve']},
  'denso-heatpump':{part:'thermal',name:'DENSO · 喷气增焓热泵',scope:'DENSO 官方公开的热泵空调系统原理。',facts:['电动压缩机带喷气增焓功能，增加低温时循环制冷剂质量流量。','集成阀气液分离器分离中间压力气体，再送入压缩机。'],axes:['压缩机、气液分离器和换热器组成循环','制冷剂两级节流与气体补入','本例观察制冷剂循环，应与冷却液阀组区分层级'],sources:['denso']},
  'toyota-mirai':{part:'fuelStack',name:'丰田 · 第二代 Mirai 电堆',scope:'2020 年发布、2021 技术论文的第二代 Mirai。',facts:['公开电堆为 330 片电池层叠，减薄单电池与双极板以缩小堆体。','电堆、升压器与功率控制单元布置在前舱；示意层片使用抽样数量。'],axes:['第二代 Mirai · 330 片','减薄层叠单元与双极板','前舱电堆、升压与控制单元集成布置'],sources:['mirai','miraiLayout']},
  'hyundai-nexo':{part:'fuelStack',name:'现代 · 上一代 NEXO 电堆',scope:'2018 代 NEXO，采用 2021 官方资料规格。',facts:['该代公开资料为 440 片燃料电池单元，电堆位于前舱。','观察层叠堆体、端板与供气接口；示意层片数量不是实际片数。'],axes:['2018 代 NEXO · 440 片','层叠堆体、端板与接口','与 2025 发布的新一代 NEXO 分开识别'],sources:['nexo']}
});

// Corrected versions preserve the original five profiles' teaching topics.
// Historic case profiles are observation guides where the old course omitted model year.
export const BRAND_PROFILES = Object.freeze({
  byd:{name:'比亚迪 · 专用电动平台',scope:'以 ATTO 3 八合一与 Blade 公开方案为例。',rows:[['电池','刀片电池使用长条 LFP 电芯；CTB 车身集成、电压和包体尺寸需按具体车型区分。'],['电驱','ATTO 3 官方手册列永磁同步电机；八合一描述的是功能集成范围。'],['集成','识别电机、传动、充电、配电和控制功能之间的边界与连接。'],['维修','先核对总成零件号、密封与冷却工艺；集成度不能直接决定必须整包或整总成更换。'],['诊断','沿“故障码—数据流—功能区”定位；通用示意不能给出车型针脚、标定值或拆修许可。']],note:'按车型与年款区分电压平台、CTB 结构和总成维修边界。',sources:['blade','bydDrive','bydMotor']},
  tesla:{name:'Tesla · 不同代际的电池与电驱',scope:'历史感应电驱、4680 电芯与诊断工具分别按资料识别。',rows:[['电池','4680 与外购电芯同时存在；电芯格式、化学体系和包体结构按车型与版本核对。'],['电驱','历史 Model S / Roadster 的感应电机，可与永磁电机比较磁场来源。'],['集成','电驱桥、结构电池、低压架构属于不同代际和不同设计维度。'],['维修','以该代维修手册确定允许更换的部件及装配流程，不把灌胶或整包更换概括为全部车型规则。'],['诊断','Tesla 提供免费 Service Mode；Toolbox / Service Mode Plus 等高级资源需要相应订阅，安全相关权限另有条件。']],note:'电芯格式、48V 低压架构与诊断权限分别核对车型、代际和所在地区。',sources:['teslaCell','teslaMotor','teslaDiag']},
  baic:{name:'北汽 · E150EV 历史案例',scope:'历史车型案例；年款未注明，具体参数以实车与对应维修资料为准。',rows:[['电池','对照底置电池箱、BMS 和高压连接；化学体系、分箱与额定电压须读该车铭牌和维修资料。'],['电驱','分别识别电机、控制器与减速器的作用，观察前舱空间利用。'],['集成','比较既有车身空间与专用纯电平台的布置思路；通用模型不代表 E150EV 的准确装车位置。'],['维修','检查箱体变形、渗漏、固定和线束磨损；不以品牌直接推断故障发生率。'],['诊断','按 VIN 与年款选择电路图、故障码定义和测试步骤，避免把通用针脚当成原车针脚。']],note:'历史车型的电池体系、平台电压与维修参数按对应年款核对。',sources:[]},
  jac:{name:'江淮 · iEV5 历史案例',scope:'历史车型案例；比较化学体系、热管理与分体布置时，需先确认年款。',rows:[['电池','比较三元与 LFP 的特性时，实际电池体系与热管理配置仍需按该车铭牌和厂家资料确认。'],['电驱','分别理解电机、电控与减速器，避免以分体或集成的外观推断可维修级别。'],['集成','对照储能、控制和冷却系统如何连接，不由品牌名称推断共用冷却回路。'],['维修','检查液位、渗漏、排气和电气绝缘；介质、加注量及排气程序按对应工艺。'],['诊断','从温度、压差、保护原因等数据形成诊断证据；不同化学体系都需要温度监测、均衡与保护。']],note:'两种电池化学体系都需要完整的温度监测、均衡、SOC 估算与保护管理。',sources:[]},
  ningde:{name:'宁德时代 · 电池供应商与整车平台',scope:'以 2022 麒麟 CTP 3.0 为例，区分电池技术和整车功能。',rows:[['电池','麒麟 CTP 3.0 将结构、隔热和换热功能集成到电芯间夹层。'],['电驱','电池供应商品牌本身不确定电机类型、逆变器材料或电驱供应商。'],['集成','CTP、800V、热泵和换电分别描述不同系统能力，不能由其中一项推出其他配置。'],['维修','先查车辆对应电池型号、固定、密封和售后工艺；是否换电由具体车辆与运营体系决定。'],['诊断','电池供应商不构成跨车企通用诊断协议，使用相应整车厂资料确定诊断定义。']],note:'将电池成组技术、整车电压、换电和热管理作为四个独立维度识别。',sources:['qilin']}
});

const GROUPS = {
  battery:{name:'电池成组',part:'battery',variants:['byd-blade','catl-ctp','tesla-4680'],axes:['电芯形态','成组与换热','适用范围'],intro:'先看电芯形态，再看成组和换热路径。化学体系、平台电压与可换电能力需要分别核对。'},
  motor:{name:'电驱与传动',part:'motor',variants:['byd-pmsm','tesla-induction','huawei-driveone'],axes:['磁场与转子','集成关系','观察重点'],intro:'电机原理与总成集成是两个维度：比较永磁转子和感应转子，再找出减速、逆变与控制功能区。'},
  charging:{name:'充电与配电集成',part:'obc',variants:['byd-pmsm','huawei-driveone'],axes:['充电与配电功能','同时集成的功能','观察层级'],intro:'在八合一与七合一总成里找到 OBC、DC-DC 和 PDU。这里观察功能集成，具体电路、功率与维修边界仍按车型资料。'},
  hybrid:{name:'混动传动',part:'dht',variants:['byd-dmi-ehs','toyota-ths'],axes:['动力耦合','功率路径','适用范围'],intro:'沿发动机、发电机和驱动电机追踪功率路径，比较直接耦合与行星功率分流。'},
  thermal:{name:'热管理',part:'thermal',variants:['tesla-octovalve','denso-heatpump'],axes:['观察对象','循环组织','观察层级'],intro:'比较冷却液阀组与制冷剂热泵系统时，先区分介质与功能层级，再理解阀组、压缩机和换热器的联系。'},
  fuelStack:{name:'燃料电池',part:'fuelStack',variants:['toyota-mirai','hyundai-nexo'],axes:['电堆版本','公开结构','配套布置'],intro:'识别层叠电池、端板与接口，比较有明确代际的两种电堆。模型采用抽样层片表达结构。'}
};
const LESSON_GROUPS={1:['battery','motor','hybrid','fuelStack'],2:['battery'],3:['battery','motor'],4:['motor'],5:['battery','motor'],6:['charging'],7:['motor','battery','charging'],8:['charging'],13:['charging'],20:['thermal'],21:['motor'],22:['thermal'],24:['charging'],27:['charging'],38:['motor'],39:['thermal'],40:['thermal'],43:['battery'],44:['battery'],46:['battery'],50:['battery','motor','hybrid','fuelStack']};
const PART_GROUPS={battery:['battery'],motor:['motor'],inverter:['motor'],reducer:['motor'],obc:['charging'],dcdc:['charging'],pdu:['charging'],dht:['hybrid'],phevEngine:['hybrid'],thermal:['thermal'],compressor:['thermal'],ptc:['thermal'],fuelStack:['fuelStack']};
const PART_NAMES={battery:'动力电池包',motor:'驱动电机',inverter:'电机控制器',reducer:'减速器',obc:'车载充电机',dcdc:'DC-DC 转换器',pdu:'高压配电盒',dht:'混动传动',phevEngine:'混动发动机',thermal:'热管理系统',compressor:'电动压缩机',ptc:'PTC 加热器',fuelStack:'燃料电池堆'};
export function brandComparisonConfig(course){
  const groups=course.lessonId?LESSON_GROUPS[course.lessonId]:PART_GROUPS[course.partId];
  if(!groups)return null;
  const profiles=course.lessonId===3?['baic']:course.lessonId===5?['jac','byd']:course.lessonId===7?['tesla','ningde']:course.lessonId===1||course.lessonId===50?Object.keys(BRAND_PROFILES):groups[0]==='battery'?['byd','tesla','ningde']:groups[0]==='motor'?['byd','tesla']:[];
  return {groups,profiles};
}

// Keep original lesson/quiz data untouched; narrow outdated broad statements in
// the displayed copy while preserving each old lesson's subject and structure.
export function contextualBrandBody(body,lessonId){
  if(lessonId===3)return body.replace('改装接插件多，虚接故障率高','需检查新增接插件的接触与固定状态').replace('其线束改接点多、防护等级参差，绝缘与互锁故障反而更常见','应核对线束、防护和维修工艺，绝缘与互锁状态仍须测量确认');
  if(lessonId===5)return body.replace('BMS策略随化学体系不同而不同——三元更强调热失控预警，铁锂更强调均衡与SOC估算修正','不同电芯的BMS标定不同；三元与铁锂都需要温度监测、均衡、SOC估算与保护').replace('国标循环寿命：铁锂≥2000次级','循环寿命需结合电芯版本与测试条件核对');
  if(lessonId===7)return body.replace('800V车普遍兼容400V充电（升压或双充策略），反之400V车不能用800V超充桩','兼容性取决于充电桩输出范围、车辆支持的电压与协议。现代E-GMP公开采用电机和逆变器将400V升至800V；不能只看“800V桩”的名称判断其他车辆是否可用');
  return body;
}

const mounted=new WeakMap();let sequence=0;
/** At most two model frames exist, including while changing the comparison system. */
export function mountBrandComparisons(container,course){
  const config=brandComparisonConfig(course);if(!config)return null;
  mounted.get(container)?.();const doc=container.ownerDocument;
  const el=(tag,className,text)=>{const n=doc.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n};
  const section=el('section','lesson-visuals brand-comparisons');section.dataset.kind='brand';
  const heading=el('h2','lesson-visual-title','品牌结构对照');heading.id='brand-comparison-'+ ++sequence;section.setAttribute('aria-labelledby',heading.id);
  const toolbar=el('div','brand-comparison-toolbar'),focus=el('p','lesson-visual-focus'),grid=el('div','lesson-visual-grid');grid.dataset.count='2';
  const matrix=el('div','brand-comparison-matrix'),profiles=el('div','brand-profile-list'),sources=el('details','brand-sources');sources.append(el('summary','','本区资料与适用范围'));
  const sourceList=el('ul');sources.append(sourceList);
  section.append(heading,toolbar,focus);
  const courseNote={3:'本课选取 E150EV 历史车型案例。年款未注明，电池体系、电压与布置须按实车铭牌和对应维修资料核对。',5:'本课比较 iEV5 与 e6 的历史技术路线，并通过 Blade 和集成电驱观察平台演进。不同年份的电芯、热管理和平台参数应分别识别。',7:'电芯格式、低压架构、平台电压和快充兼容能力需按车型及代际分别核对。历史平台案例不能覆盖全部现售车型。'}[course.lessonId];
  if(courseNote)section.append(el('p','brand-course-note',courseNote));
  section.append(grid,matrix,el('p','lesson-visual-disclaimer','品牌架构参考 · 教学结构示意，非原厂 CAD。零件比例与数量经过简化；不表示当前课程车型装配了这些品牌方案。'));
  if(config.profiles.length){const h=el('h3','brand-profile-heading','品牌与平台说明');section.append(h,profiles);for(const id of config.profiles){const p=BRAND_PROFILES[id],detail=el('details','brand-profile');detail.dataset.brand=id;detail.append(el('summary','',p.name));const body=el('div','brand-profile-body');body.append(el('p','brand-scope',p.scope));const dl=el('dl');for(const [name,text]of p.rows){const row=el('div');row.append(el('dt','',name),el('dd','',text));dl.append(row)}body.append(dl,el('p','brand-profile-note',p.note));detail.append(body);profiles.append(detail)}}
  section.append(sources);container.append(section);
  let frames=[],currentGroup=config.groups[0],chosen=[],alive=true;
  const scrollHost=container.closest('#lessonContent');
  function keepPosition(action){const top=scrollHost?.scrollTop,left=scrollHost?.scrollLeft;action();if(scrollHost){scrollHost.scrollTop=top;scrollHost.scrollLeft=left}}
  function releaseFrames(){for(const frame of frames){frame.src='about:blank';frame.remove()}frames=[];grid.replaceChildren()}
  function currentPart(){return currentGroup==='motor'&&['motor','inverter','reducer'].includes(course.builder)?course.builder:currentGroup==='charging'&&['obc','dcdc','pdu'].includes(course.builder)?course.builder:GROUPS[currentGroup].part}
  function genericPart(){return course.partId&&course.builder?course.builder:currentPart()}
  function generic(){return {name:'通用'+(PART_NAMES[genericPart()]||course.title||'结构'),scope:'用于认识本课部件的通用教学模型。',facts:['观察部件、连接与功能分区；不提供品牌或车型参数。'],axes:['通用结构示意','结合本课原理识别功能','实际结构与维修工艺以对应车型资料为准'],sources:[]}}
  function showDocumentation(){
    matrix.replaceChildren();const table=el('table'),caption=el('caption','','对照要点'),thead=el('thead'),tr=el('tr');tr.append(el('th','','观察维度'));for(const key of chosen){const h=el('th','',(key==='generic'?generic():BRAND_VARIANTS[key]).name);h.scope='col';tr.append(h)}thead.append(tr);const tbody=el('tbody');GROUPS[currentGroup].axes.forEach((axis,i)=>{const row=el('tr');const h=el('th','',axis);h.scope='row';row.append(h);for(const key of chosen){const variant=key==='generic'?generic():BRAND_VARIANTS[key],axes=currentGroup==='charging'&&variant.charging?variant.charging:variant.axes,cell=el('td','',axes[i]);cell.dataset.label=variant.name;row.append(cell)}tbody.append(row)});table.append(caption,thead,tbody);matrix.append(table);
    sourceList.replaceChildren();const ids=new Set(chosen.flatMap(key=>key==='generic'?[]:BRAND_VARIANTS[key].sources));for(const id of config.profiles)for(const source of BRAND_PROFILES[id].sources)ids.add(source);if(course.lessonId===7)ids.add('egmp');
    for(const id of ids){const source=BRAND_SOURCES[id],li=el('li'),a=el('a','',source.name);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);sourceList.append(li)}
    sources.hidden=!ids.size;
  }
  function addPane(index,defaultKey){
    const group=GROUPS[currentGroup],card=el('figure','lesson-visual-card brand-model-card'),header=el('div','lesson-visual-card-header'),label=el('label','lesson-visual-selector');label.append(el('span','',index?'右侧方案':'左侧方案'));
    const select=el('select');select.setAttribute('aria-label',(index?'右侧':'左侧')+group.name+'方案');for(const key of [...group.variants,'generic']){const option=el('option','',key==='generic'?generic().name:BRAND_VARIANTS[key].name);option.value=key;select.append(option)}select.value=defaultKey;label.append(select);
    const frame=el('iframe','lesson-visual-frame');frame.id='brand-model-'+sequence+'-'+index;frame.loading='eager';frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.setAttribute('referrerpolicy','same-origin');
    const interact=el('button','lesson-visual-interact','操作模型');interact.type='button';interact.setAttribute('aria-controls',frame.id);const caption=el('figcaption','lesson-visual-caption'),scope=el('p','brand-scope'),facts=el('ul','brand-model-facts'),status=el('p','lesson-visual-status');status.setAttribute('role','status');caption.append(scope,facts,status);
    let interactive=false,loaded=false,failed=false,expectedKey=defaultKey;
    function setInteractive(value){interactive=value&&loaded&&!failed;card.dataset.interactive=String(interactive);frame.tabIndex=interactive?0:-1;frame.inert=!interactive;interact.disabled=!loaded||failed;interact.textContent=interactive?'结束操作':'操作模型';interact.setAttribute('aria-pressed',String(interactive));interact.setAttribute('aria-label',interact.textContent+'：'+frame.title);status.textContent=failed?'模型暂时无法加载，可继续阅读对照说明。':interactive?'拖动旋转，完成后点“结束操作”继续阅读。':loaded?'模型预览中，可继续滚动阅读。':'正在准备模型，可继续滚动阅读。'}
    function show(key){if(expectedKey===key&&!failed&&frame.hasAttribute('src'))return;const variant=key==='generic'?generic():BRAND_VARIANTS[key];expectedKey=key;chosen[index]=key;scope.textContent=variant.scope;facts.replaceChildren(...variant.facts.map(text=>el('li','',text)));loaded=failed=false;frame.title=variant.name+' · '+group.name+'教学结构示意';const query=new URLSearchParams({part:key==='generic'?genericPart():currentPart(),title:variant.name,compare:'1'});if(key!=='generic')query.set('variant',key);frame.src='/models/component.html?'+query;setInteractive(false)}
    select.addEventListener('change',()=>keepPosition(()=>{show(select.value);showDocumentation()}));interact.addEventListener('click',()=>setInteractive(!interactive));frame.addEventListener('load',()=>{if(!alive||!frame.isConnected)return;try{const win=frame.contentWindow,actual=win.componentStudio?.model?.userData?.variant?.id||win.componentStudio?.variant?.id;loaded=win.__COMPONENT_READY===true&&win.location.href===frame.src;failed=!!win.document.querySelector('#modelLoading.error')||loaded&&(expectedKey==='generic'?!!actual:actual!==expectedKey)}catch{loaded=false;failed=true}setInteractive(interactive)});frame.addEventListener('error',()=>{failed=true;setInteractive(false)});
    header.append(label,interact);card.append(header,frame,caption);grid.append(card);frames.push(frame);show(defaultKey);
  }
  function showGroup(key){releaseFrames();currentGroup=key;section.dataset.group=key;focus.textContent=GROUPS[key].intro;chosen=[];addPane(0,GROUPS[key].variants[0]);addPane(1,GROUPS[key].variants[1]);showDocumentation()}
  if(config.groups.length>1){const label=el('label','brand-system-selector');label.append(el('span','','对照系统'));const select=el('select');for(const key of config.groups){const option=el('option','',GROUPS[key].name);option.value=key;select.append(option)}select.addEventListener('change',()=>keepPosition(()=>showGroup(select.value)));label.append(select);toolbar.append(label)}else toolbar.hidden=true;
  showGroup(currentGroup);
  const unmount=()=>{if(!alive)return;alive=false;releaseFrames();section.remove();if(mounted.get(container)===unmount)mounted.delete(container)};mounted.set(container,unmount);return unmount;
}
