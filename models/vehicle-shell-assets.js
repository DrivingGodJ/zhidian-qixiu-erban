// Acquisition outcomes only. An unavailable exterior stays explicitly generic.
export const VEHICLE_SHELL_ASSETS=Object.freeze({
  'su7-rwd-2024':{shell:'su7',available:true,asset:'./assets/su7-debadged.glb',loader:'./su7-shell.js',exportName:'loadSU7Shell',assetScope:'SU7 社区去标外观参考',license:'CC-BY-4.0'},
  'xc60-t8-er-2022':{shell:'xc60',available:true,asset:'./assets/xc60-recharge-debadged.glb',loader:'./xc60-shell.js',exportName:'loadXC60Shell',assetScope:'2023 XC60 Recharge 社区去标外观参考',license:'CC-BY-4.0'},
  'model3-rwd-2023':{
    shell:'model3',available:true,asset:'./assets/model3-2018-debadged.glb',loader:'./model3-shell.js',exportName:'loadModel3Shell',license:'CC-BY-4.0',
    assetScope:'2018 改款前同代 Model 3 社区去标外观；内部代表 2023 后驱，不是精准 2023 车壳。',
    author:'Ameer Studio',source:'https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f',
    publicDownload:'https://raw.githubusercontent.com/pedrosoandre/carros/0a56de377f02f2574d781f6920fed08d6423ec2f/assets/tesla-model.glb'
  },
  'atto3-fwd-2023':{
    shell:'generic-suv',available:false,
    reason:'未取得符合 2022–2023 外观要求的公开授权源文件。Nazh Design 的 CC BY 候选标为2024，官方匿名下载返回401；其他候选含非商业许可，不能据预览提取网格。',
    candidate:'https://sketchfab.com/3d-models/692058cf280d49408c2fb0a10157343e'
  },
  'li-l7-2023':{
    shell:'generic-suv',available:false,
    reason:'找到 Quore 的 Li Auto L7，但许可仅 CC BY-NC 4.0，官方匿名下载返回401；当前没有可复用的公开源文件。',
    candidate:'https://sketchfab.com/3d-models/0203b32240124b228168de2e89a2f4f2'
  },
  'mirai-gen2-2021':{
    shell:'generic-sedan',available:false,
    reason:'找到 CC BY 候选，但未核清第二代车型和原始制作来源，官方匿名下载返回401；未取得可核验的第二代源文件。',
    candidate:'https://sketchfab.com/3d-models/950cd22ab63d4723b468f25da0fd5ec0'
  },
  'nexo-2018':{
    shell:'generic-suv',available:false,
    reason:'“Nexo 2020”候选作者明确称由 Hunyuan AI 生成，不能充当精确实车外形；另一可下载候选为2026新一代，不匹配2018代。官方匿名下载也返回401。',
    candidate:'https://sketchfab.com/3d-models/60fc6777280a46a19c7fa664ed7458bb'
  }
});
