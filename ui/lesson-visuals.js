// Lesson IDs are the stored DATA.lessons IDs, not the repeated chapter numbers.
// All descriptions summarize lessons.js and the existing model configurations.
import { VEHICLE_PROFILES, DEFAULT_VEHICLE_PROFILES } from '../models/vehicle-profiles.js';
import { GENERIC_VEHICLE_PROFILES } from '../models/generic-profiles.js';
export const WHOLE_VEHICLE_OPTIONS = Object.freeze({...GENERIC_VEHICLE_PROFILES, ...VEHICLE_PROFILES});
const VEHICLES = {
  bev: {name: '纯电动 BEV', note: '动力电池供能，经电控驱动电机。'},
  phev: {name: '插电混动 PHEV', note: '发动机与电驱并存，保留油箱和排气系统。'},
  erev: {name: '增程式 EREV', note: '增程器发电，车轮由驱动电机驱动。'},
  fcev: {name: '氢燃料电池 FCEV', note: '氢罐储氢、电堆发电，电池参与功率缓冲。'}
};
const COMPONENTS = {
  battery: {name: '动力电池包', note: '观察包体、模组布置与连接位置。'},
  bms: {name: '电池管理系统 BMS', note: '认识电池管理单元与采集连接结构。'},
  motor: {name: '驱动电机', note: '认识定子、转子与电机接线位置。'},
  inverter: {name: '电机控制器', note: '认识电控总成、散热与高压连接。'},
  reducer: {name: '单速减速器', note: '观察齿轮机构与传动结构。'},
  obc: {name: '车载充电机 OBC', note: '交流充电时，将交流电转换为直流电。'},
  dcdc: {name: 'DC-DC 转换器', note: '把动力电池高压降为低压，给低压系统供电。'},
  pdu: {name: '高压配电盒 PDU', note: '观察高压分配与支路连接。'},
  vcu: {name: '整车控制器 VCU', note: '认识控制器壳体与接插件。'},
  chargeport: {name: '充电接口', note: '观察接口、端子与连接位置。'},
  thermal: {name: '热管理系统', note: '观察散热器、风扇与冷却连接。'},
  compressor: {name: '电动压缩机', note: '认识电驱动压缩机与制冷剂管路连接。'},
  ptc: {name: 'PTC 加热器', note: '认识电加热总成及进出水连接。'}
};
const parts = (focus, ...models) => ({kind: 'parts', focus, models});
const whole = (focus, comparison = 'phev') => ({kind: 'whole', focus, comparison});

// Safety organization, PPE, rescue, tool use and emergency response remain text
// lessons: unrelated vehicle models would distract from their learning goals.
export const LESSON_VISUALS = Object.freeze({
  1: whole('沿电池与电驱认识纯电主线，再对照另一种动力形式的主总成与能源来源。'),
  2: parts('把电池包与管理单元对应起来，理解储能总成与监测管理的分工。', 'battery', 'bms'),
  3: whole('对照具体车型的纯电与插混布局，辨认电池、电驱与前舱动力部件。'),
  4: parts('先辨认电机与电控：控制器把直流逆变为三相交流，电机输出机械扭矩。', 'motor', 'inverter'),
  5: parts('观察电池包与BMS的关系；电池化学体系仍以铭牌和课程资料为准。', 'battery', 'bms'),
  6: parts('从充电接口找到交流充电的车端整流部件，区分连接与电能转换。', 'chargeport', 'obc'),
  7: whole('对照不同车型的电池与电驱位置；电压平台和功率器件类型不能由外观判断。'),
  8: parts('两者都是电能转换部件：OBC服务交流充电，DC-DC服务低压供电。', 'obc', 'dcdc'),
  10: parts('先指认电池包和高压配电部件，再按本课流程理解断电与验电的先后。', 'battery', 'pdu'),
  11: parts('电控与OBC内的电容可能保留残余电能；观察部件结构，带电状态须靠验电确认。', 'inverter', 'obc'),
  13: parts('对照高压配电盒与电控，理解接触器通断、预充与母线电容的关系。', 'pdu', 'inverter'),
  17: parts('认识高压支路和插接位置；互锁监测连接完整性，绝缘状态不能从外观判断。', 'pdu', 'chargeport'),
  19: parts('对照BMS与电池包，理解采集、估算、均衡和保护围绕同一个储能总成展开。', 'bms', 'battery'),
  20: parts('沿电池包的冷却连接观察热管理部件，理解电芯热量向冷却回路传递。', 'battery', 'thermal'),
  21: parts('区分电机与减速器的职责：一个输出扭矩，一个降低转速并传递动力。', 'motor', 'reducer'),
  22: parts('对照制冷与电加热总成，认识电动空调和热管理的不同执行部件。', 'compressor', 'ptc'),
  23: parts('制动回收时电机转为发电状态，回收电能进入动力电池。', 'motor', 'battery'),
  24: parts('低压系统为控制器供电；对照DC-DC与控制单元理解车辆唤醒的供电基础。', 'dcdc', 'vcu'),
  25: parts('区分整车协调与电池管理的职责，认识参与通信的控制单元。', 'vcu', 'bms'),
  26: parts('诊断仪通过控制器读取故障码和数据流；此处用于认识控制单元。', 'vcu'),
  27: whole('本课讲解高压动力与低压控制系统，以及 DC-DC 的供电转换；整车对比用于观察电池与电驱位置。'),
  29: parts('把诊断对象落实到控制单元，再按问诊、验证、读码、定位、复验形成闭环。', 'vcu', 'bms'),
  30: parts('把整车状态与电池采集数据对应起来，认识控制单元与数据来源。', 'vcu', 'bms'),
  31: parts('先区分BMS采集管理问题与电池本体问题，再按数据流定位。', 'bms', 'battery'),
  32: parts('观察配电与接口连接；高压互锁使用低压信号回路监测连接完整性。', 'pdu', 'chargeport'),
  33: parts('以配电支路和驱动电机为观察对象，理解绝缘故障需要分段定位。', 'pdu', 'motor'),
  34: parts('沿充电接口到OBC认识慢充车端链路，再结合课程检查连接与控制信号。', 'chargeport', 'obc'),
  35: parts('沿快充接口到配电部件认识车端链路，区分外部充电设备与车内部件。', 'chargeport', 'pdu'),
  36: parts('观察充电端子与连接位置，理解连接确认、锁止和充电终止的先后关系。', 'chargeport'),
  37: parts('对照配电与电池管理单元，按唤醒、自检、预充、主接触器的顺序分析。', 'pdu', 'bms'),
  38: parts('先观察电机与电控，也可把右侧切换为减速器，区分驱动链路中的故障对象。', 'motor', 'inverter', 'reducer'),
  39: parts('把电池温度问题与冷却回路对应起来，再按课程检查循环、液位与连接。', 'battery', 'thermal'),
  40: parts('对照压缩机与PTC，先区分制冷故障和电加热故障涉及的执行部件。', 'compressor', 'ptc'),
  42: parts('把图上的电源、控制器与连接器对应到实物；针脚定义仍以本课电路图和资料为准。', 'pdu', 'vcu'),
  43: parts('先从外部结构认识电池包的检修层级，再阅读本课开包条件与流程。', 'battery'),
  44: parts('把电池单体一致性与BMS均衡管理对应起来，理解压差与SOC数据的来源。', 'battery', 'bms'),
  45: parts('认识BMS与电池包的连接关系，再理解更换后的参数匹配与标定。', 'bms', 'battery'),
  46: parts('区分电池本体与管理数据来源，再用课程中的容量、内阻和温升方法评估。', 'battery', 'bms'),
  49: parts('分别找到案例中的充电接口与电池包，再回到课程核对分段测量和修复验证。', 'chargeport', 'battery'),
  50: whole('对照不同动力形式的能源来源、发电与驱动部件，复习整车结构主线。', 'fcev')
});

const mounted = new WeakMap();
let sequence = 0;

/** Append a self-contained observation block. Returns an optional unmount callback. */
export function mountLessonVisuals(container, lessonId, options = {}) {
  if (!container?.ownerDocument || typeof container.append !== 'function') throw new TypeError('A DOM container is required.');
  mounted.get(container)?.();
  const config = LESSON_VISUALS[Number(lessonId)];
  if (!config) return () => {};
  const document = container.ownerDocument;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const section = node('section', 'lesson-visuals');
  section.dataset.lessonId = String(lessonId);
  section.dataset.kind = config.kind;
  const heading = node('h2', 'lesson-visual-title', config.kind === 'whole' ? options.brandOnly ? '对照车型内部架构' : '对照整车动力结构' : '观察本课相关结构');
  heading.id = 'lesson-visual-title-' + ++sequence;
  section.setAttribute('aria-labelledby', heading.id);
  section.append(heading, node('p', 'lesson-visual-focus', config.focus));
  const grid = node('div', 'lesson-visual-grid');
  grid.dataset.count = config.kind === 'whole' || config.models.length > 1 ? '2' : '1';
  const frames = [];
  const frameObservers = new Set();
  const scrollHost = container.closest('#lessonContent');

  function addPane(keys, kind) {
    const catalog = kind === 'whole' ? options.brandOnly ? VEHICLE_PROFILES : WHOLE_VEHICLE_OPTIONS : COMPONENTS;
    const card = node('figure', 'lesson-visual-card');
    const header = node('div', 'lesson-visual-card-header');
    const frame = node('iframe', 'lesson-visual-frame');
    frame.id = 'lesson-visual-frame-' + sequence + '-' + frames.length;
    frame.loading = 'eager';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    frame.setAttribute('referrerpolicy', 'same-origin');
    const caption = node('figcaption', 'lesson-visual-caption');
    const note = node('p', 'lesson-visual-model-note');
    const profileLayout = kind === 'whole' ? node('ul', 'lesson-profile-layout') : null;
    const profileSources = kind === 'whole' ? node('details', 'lesson-profile-sources') : null;
    if (profileSources) profileSources.append(node('summary', '', '车型资料与来源'));
    const status = node('p', 'lesson-visual-status', '正在准备 3D 模型…');
    status.setAttribute('role', 'status');
    const interact = node('button', 'lesson-visual-interact', '操作模型');
    interact.type = 'button';
    interact.setAttribute('aria-controls', frame.id);
    let interactive = false, loaded = false, failed = false, readinessObserver = null, shownKey = '';
    function setInteractive(enabled) {
      interactive = enabled && loaded && !failed;
      card.dataset.interactive = String(interactive);
      frame.tabIndex = interactive ? 0 : -1;
      frame.inert = !interactive;
      interact.disabled = !loaded || failed;
      interact.textContent = interactive ? '结束操作' : '操作模型';
      interact.setAttribute('aria-pressed', String(interactive));
      interact.setAttribute('aria-label', interact.textContent + '：' + frame.title);
      status.textContent = failed ? '模型暂时无法加载，可继续阅读本课讲解。'
        : interactive ? '拖动旋转，滚轮或双指缩放；完成后点“结束操作”继续阅读。'
        : loaded ? '模型预览中，可继续滚动阅读。'
        : '正在准备 3D 模型，可继续滚动阅读。';
    }
    interact.addEventListener('click', () => setInteractive(!interactive));
    caption.append(note);
    if (profileLayout) caption.append(profileLayout, profileSources);
    caption.append(status);
    function show(key) {
      const model = catalog[key];
      if (shownKey === key && !failed) return;
      shownKey = key;
      readinessObserver?.disconnect();
      frameObservers.delete(readinessObserver);
      frame.title = (kind === 'whole' ? model.year + ' · ' : '') + model.name + ' · 本课结构观察';
      note.textContent = kind === 'whole' ? model.year + ' · ' + VEHICLES[model.powertrain].name : model.note;
      if (profileLayout) {
        profileSources.hidden = !model.sources.length;
        profileLayout.replaceChildren(...model.confirmedLayout.map(text => node('li', '', text)));
        while (profileSources.children.length > 1) profileSources.lastChild.remove();
        const list = node('ul');
        for (const source of model.sources) {
          const item = node('li'), link = node('a', '', source.title);
          link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
          item.append(link);
          list.append(item);
        }
        profileSources.append(list);
      }
      loaded = failed = false;
      setInteractive(false);
      const query = new URLSearchParams(kind === 'whole'
        ? {profile: key, embed: '1', compare: '1', shell: 'xray'}
        : {part: key, title: model.name, compare: '1'});
      frame.src = kind === 'whole' ? '/models/' + model.powertrain + '.html?' + query : '/models/component.html?' + query;
    }
    if (keys.length > 1) {
      const label = node('label', 'lesson-visual-selector');
      const objectLabel = kind === 'whole' ? options.brandOnly ? '车型版本' : '动力形式 / 车型' : '对比对象';
      label.append(node('span', '', (frames.length ? '右侧' : '左侧') + objectLabel));
      const select = node('select');
      select.setAttribute('aria-label', (frames.length ? '右侧' : '左侧') + objectLabel);
      if (kind === 'whole') {
        const generic = node('optgroup'); generic.label = '通用动力形式 · 全配件';
        for (const key of keys.filter(key => key.startsWith('generic-'))) {
          const option = node('option', '', catalog[key].name); option.value = key; generic.append(option);
        }
        if (generic.children.length) select.append(generic);
        for (const powertrain of Object.keys(VEHICLES)) {
          const group = node('optgroup'); group.label = '品牌车型 · ' + VEHICLES[powertrain].name;
          for (const key of keys.filter(key => !key.startsWith('generic-') && catalog[key].powertrain === powertrain)) {
            const option = node('option', '', catalog[key].year + ' · ' + catalog[key].name);
            option.value = key; group.append(option);
          }
          if (group.children.length) select.append(group);
        }
      } else {
        for (const key of keys) {
          const option = node('option', '', catalog[key].name);
          option.value = key; select.append(option);
        }
      }
      select.value = keys[0];
      select.addEventListener('change', () => {
        const view = document.defaultView, top = scrollHost ? scrollHost.scrollTop : view.scrollY, left = view.scrollX;
        show(select.value);
        if (scrollHost) scrollHost.scrollTop = top;
        else if (view.scrollY !== top) view.scrollTo({left, top, behavior: 'instant'});
      });
      label.append(select); header.append(label);
    } else {
      const object = node('div', 'lesson-visual-object');
      object.append(node('span', 'lesson-visual-object-label', '观察对象'), node('h3', '', catalog[keys[0]].name));
      header.append(object);
    }
    header.append(interact);
    frame.addEventListener('load', () => {
      if (!frame.isConnected) return;
      function inspect() {
        try {
          const win = frame.contentWindow;
          failed = !!win.document.querySelector('#modelLoading.error');
          loaded = kind === 'whole'
            ? win.__STUDIO_READY === true && win.studio?.profile?.id === shownKey
            : win.__COMPONENT_READY === true;
        } catch { failed = true; loaded = false; }
        setInteractive(interactive);
      }
      inspect();
      readinessObserver?.disconnect();
      frameObservers.delete(readinessObserver);
      if (frame.contentDocument?.body) {
        readinessObserver = new MutationObserver(inspect);
        readinessObserver.observe(frame.contentDocument.body, {subtree: true, attributes: true, childList: true, attributeFilter: ['class', 'hidden', 'data-model-ready']});
        frameObservers.add(readinessObserver);
      }
    });
    frame.addEventListener('error', () => { failed = true; setInteractive(false); });
    show(keys[0]);
    card.append(header, frame, caption); grid.append(card); frames.push(frame);
  }

  if (config.kind === 'whole') {
    const ids = Object.keys(options.brandOnly ? VEHICLE_PROFILES : WHOLE_VEHICLE_OPTIONS);
    const left = options.brandOnly ? DEFAULT_VEHICLE_PROFILES.bev : 'generic-bev', right = options.brandOnly ? DEFAULT_VEHICLE_PROFILES[config.comparison] : 'generic-' + config.comparison;
    addPane([left, ...ids.filter(id => id !== left)], 'whole');
    addPane([right, ...ids.filter(id => id !== right)], 'whole');
  } else {
    addPane([config.models[0]], 'parts');
    if (config.models.length > 1) addPane(config.models.slice(1), 'parts');
  }
  section.append(grid);
  container.append(section);
  let active = true;
  const unmount = () => {
    if (!active) return;
    active = false;
    for (const observer of frameObservers) observer.disconnect();
    for (const frame of frames) { frame.src = 'about:blank'; frame.remove(); }
    section.remove();
    if (mounted.get(container) === unmount) mounted.delete(container);
  };
  mounted.set(container, unmount);
  return unmount;
}
