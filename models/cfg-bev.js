// 布局坐标：前=-X，后=+X，Y向上，Z为车宽；整体落地另统一减Y=.095。
// 横置动力轴沿Z；前置散热器风扇法线朝+X（车后）；位置由实际builder包围盒核验。
// 下列配件与车体均为通用 BEV 教学示意，不对应具体品牌车型。
window.MODEL_CFG = {
  key: 'bev', title: '纯电动 · BEV', tag: 'Battery Electric Vehicle',
  summary: '从动力电池到驱动电机，沿着能量流认识纯电动汽车。',
  parts: [
    { id:'battery', b:'battery', name:'动力电池包', color:'#6fa6d8', p: [-.05, .285, 0], opt: { len: 2.3, modules: 8 }, desc:'位于底盘中央的高压储能总成。包含电芯模组、冷却板、维修开关与电池管理单元。' },
    { id:'bms', b:'bms', name:'电池管理系统 BMS', color:'#72c7bc', p: [.65, .58, -.34], desc:'采集单体电压、温度与电流，估算 SOC / SOH，并管理电池保护和均衡。' },
    { id:'motor', b:'motor', name:'驱动电机', color:'#e8a573', p: [1.45, .53, -.17], opt: { r: .21, len: .5 }, desc:'将三相交流电转换为机械扭矩；制动时也可反向发电。' },
    { id:'inverter', b:'inverter', name:'电机控制器', color:'#d88d81', p: [1.66, .72, -.62], desc:'通过功率半导体将直流电逆变为可控的三相交流电。' },
    { id:'reducer', b:'reducer', name:'单速减速器', color:'#c3b089', p: [1.45, .53, .4], rot: [0, Math.PI / 2, 0], desc:'降低电机输出转速、放大扭矩，经差速器传递到半轴。' },
    { id:'obc', b:'obc', name:'车载充电机 OBC', color:'#9dabd7', p: [-1.49, .68, .38], desc:'交流慢充时把电网交流电转换成高压直流电。' },
    { id:'dcdc', b:'dcdc', name:'DC-DC 转换器', color:'#a1bd8c', p: [-1.19, .66, -.43], desc:'将动力电池高压降为低压，为车身电器和低压蓄电池供电。' },
    { id:'pdu', b:'pdu', name:'高压配电盒 PDU', color:'#caa0ae', p: [-.76, .65, -.1], desc:'通过母排、熔断器与接触器向高压负载分配电能。' },
    { id:'vcu', b:'vcu', name:'整车控制器 VCU', color:'#7ab7a7', p: [-1.02, .91, .37], desc:'协调扭矩请求、能量管理、故障诊断和整车工作状态。' },
    { id:'compressor', b:'compressor', name:'电动压缩机', color:'#bdab83', p: [-1.73, .5, -.48], desc:'由高压电机驱动，为空调和热管理系统压缩制冷剂。' },
    { id:'thermal', b:'thermal', name:'热管理系统', color:'#78aebc', p: [-2.08, .65, 0], rot: [0, Math.PI / 2, 0], desc:'通过电子水泵、换热器和阀组管理电池、电驱与座舱温度。' },
    { id:'chargeport', b:'port', name:'充电接口', color:'#b1a0ce', p: [1.18, .84, -.83], rot: [0, Math.PI, 0], desc:'连接外部电源，完成连接确认、充电通信与安全互锁。' },
    { id:'cabin', b:'cabin', name:'座舱内饰', color:'#b5bcb3', p:[-.15,.63,0], desc:'仪表、座椅和交互系统构成人机交互与驾乘空间。', shellPart:true },
    { id:'wheel', b:'wheel', name:'车轮与制动', color:'#b9bec5', p:[-1.45,.42,.86], desc:'轮胎、轮毂、制动盘和卡钳组成行驶与制动机构。', shellPart:true },
    { id:'body', b:'body', name:'车身壳体', color:'#a6c3d5', p:[0,.65,0], desc:'覆盖件、玻璃、灯组与车体骨架共同构成车身结构。', shellPart:true }
  ]
};
