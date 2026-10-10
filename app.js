'use strict';
const cases = {
  mujoco: [
    {id:'mujoco-flat', name:'近似平地', meta:'基础控制 / PPO 对照', title:'近似平地着陆', tag:'MUJOCO / 平地工况', description:'观察近似平整地面上的着陆过程，以及稳定支撑后加入 PPO 对姿态与受力的影响。', focus:'左右使用相同工况。结合平台倾角和四足受力曲线判断差异，不仅看模型是否运动。'},
    {id:'mujoco-slope', name:'约 7° 斜坡', meta:'基础控制 / PPO 对照', title:'约 7° 斜坡着陆', tag:'MUJOCO / 斜坡工况', description:'在相同斜坡工况下，对比基础控制器与加入足力残差 PPO 后的平台姿态和足力变化。', focus:'先看左右平台倾角，再看下方四足接触力和 PPO 残差曲线。PPO 主要在稳定支撑阶段介入。'},
    {id:'mujoco-step', name:'约 49 mm 台阶', meta:'单腿高差 / PPO 对照', title:'约 49 mm 单腿台阶着陆', tag:'MUJOCO / 台阶工况', description:'单腿位置的地面高差使各腿先后触地，展示基础控制和足力残差策略在该工况中的表现。', focus:'关注先触地腿与其余腿的受力变化，区分触地阶段的基础控制作用和后续 PPO 残差作用。'},
    {id:'mujoco-composite', name:'随机复合地形', meta:'固定样例 / PPO 对照', title:'随机复合地形着陆', tag:'MUJOCO / 复合地形', description:'展示随机工况集合中的一个固定样例，左右两组使用同一地形与初始条件进行对照。', focus:'这是一段已录制样例，不是实时随机生成地形；单段视频也不能证明对任意未知地形都有效。'}
  ],
  adams: [
    {id:'adams-v26-composite', name:'V2.6 防侧滑', meta:'复合地形 / PPO 关闭', title:'V2.6 防侧滑 · 复合地形', tag:'ADAMS / V2.6', description:'Adams 多体动力学模型在复合地形上的防侧滑控制演示，保留真实模型运动与接触过程。', focus:'关注足端横向移动和平台姿态。该录像为基础控制器效果，不是 PPO 在 Adams 中的对照实验。'},
    {id:'adams-v27-composite', name:'V2.7 水平修正', meta:'复合地形 / PPO 关闭', title:'V2.7 平台水平修正 · 复合地形', tag:'ADAMS / V2.7', description:'展示平台水平修正控制下的复合地形着陆过程。控制由 MATLAB/Simulink 与 Adams 联合执行。', focus:'观察触地前后四腿动作和平台倾角变化。下降过程含上层辅助，不能全部归因为落架独立控制。'},
    {id:'adams-flat', name:'V2.7 平地', meta:'封版工况 / PPO 关闭', title:'V2.7 平地着陆', tag:'ADAMS / 平地工况', description:'以平地作为基础参照工况，展示接触建立、载荷转移与最终支撑状态。', focus:'注意触地冲击、回弹及稳定后的腿部运动；平地表现不代表全部非平地工况都通过。'},
    {id:'adams-step', name:'V2.7 · 50 mm 台阶', meta:'封版工况 / PPO 关闭', title:'V2.7 · 50 mm 台阶着陆', tag:'ADAMS / 台阶工况', description:'展示单腿位置存在 50 mm 高差时的着陆与支撑调整。', focus:'重点观察不同腿先后接触、腿部调节以及最终支撑状态；本段是历史仿真录像，不是实时控制。'}
  ]
};
const player = document.querySelector('#player');
const list = document.querySelector('#case-list');
const error = document.querySelector('#video-error');
let platform = 'mujoco';
let selected = 'mujoco-slope';
let toastTimer;
function renderList() {
  list.replaceChildren();
  cases[platform].forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'case-button'; button.dataset.id = item.id;
    button.setAttribute('aria-current', String(item.id === selected));
    button.setAttribute('aria-controls', 'player');
    const number = document.createElement('span'); number.className = 'case-number'; number.textContent = String(index + 1).padStart(2, '0');
    const copy = document.createElement('span'); copy.className = 'case-text';
    const title = document.createElement('span'); title.className = 'case-name'; title.textContent = item.name;
    const subtitle = document.createElement('span'); subtitle.className = 'case-meta'; subtitle.textContent = item.meta;
    const arrow = document.createElement('span'); arrow.className = 'case-arrow'; arrow.textContent = '▷'; arrow.setAttribute('aria-hidden', 'true');
    copy.append(title, subtitle); button.append(number, copy, arrow);
    button.addEventListener('click', () => selectCase(item.id)); list.append(button);
  });
  document.querySelector('#case-count').textContent = `${cases[platform].length} 段视频`;
}
function selectCase(id) {
  const item = cases[platform].find(entry => entry.id === id);
  if (!item) return;
  selected = id; player.pause(); error.hidden = true;
  player.poster = `media/${id}.png`; player.src = `media/${id}.mp4`;
  player.setAttribute('aria-label', item.title); player.load();
  document.querySelector('#case-tag').textContent = item.tag;
  document.querySelector('#case-title').textContent = item.title;
  document.querySelector('#case-description').textContent = item.description;
  document.querySelector('#case-focus').textContent = item.focus;
  document.querySelector('#video-link').href = `media/${id}.mp4`;
  document.querySelectorAll('.case-button').forEach(button => button.setAttribute('aria-current', String(button.dataset.id === id)));
}
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => {
  if (platform === button.dataset.platform) return;
  platform = button.dataset.platform;
  selected = platform === 'mujoco' ? 'mujoco-slope' : 'adams-v27-composite';
  document.querySelectorAll('[data-platform]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.platform === platform)));
  document.querySelector('#platform-description').textContent = platform === 'mujoco' ? '基础控制器与基础控制器＋PPO，在相同工况下对比。' : '详细机构的多体动力学演示。本组视频均为基础控制器，PPO 关闭。';
  document.querySelector('#playlist-note').textContent = platform === 'mujoco' ? '左侧：V2.5R-S 基础控制器；右侧：基础控制器＋足力残差 PPO。' : 'V2.6 / V2.7 力矩控制支线；MATLAB/Simulink 联合 Adams 仿真。';
  renderList(); selectCase(selected);
}));
player.addEventListener('error', () => { error.hidden = false; });
player.addEventListener('loadedmetadata', () => { error.hidden = true; });
document.querySelector('#share').addEventListener('click', async () => {
  let message;
  if (location.protocol === 'file:') message = '这是本地预览，请分享发布后的在线网址。';
  else {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); message = '链接已复制；能否访问取决于网站的分享权限。'; }
    catch { message = '请复制浏览器地址栏中的完整网址进行分享。'; }
  }
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
});
renderList();
