export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

const HAND_CONNECTIONS: ReadonlyArray<[number, number]> = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

// Key face mesh contour connections covering face oval, eyes, brows, nose, lips
const FACE_MESH_CONNECTIONS: ReadonlyArray<[number, number]> = [
  // Face oval
  [10,338],[338,297],[297,332],[332,284],[284,251],[251,389],[389,356],[356,454],
  [454,323],[323,361],[361,288],[288,397],[397,365],[365,379],[379,378],[378,400],
  [400,377],[377,152],[152,148],[148,176],[176,149],[149,150],[150,136],[136,172],
  [172,58],[58,132],[132,93],[93,234],[234,127],[127,162],[162,21],[21,54],
  [54,103],[103,67],[67,109],[109,10],
  // Left eye
  [33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],
  [133,173],[173,157],[157,158],[158,159],[159,160],[160,161],[161,246],[246,33],
  // Right eye
  [362,382],[382,381],[381,380],[380,374],[374,373],[373,390],[390,249],[249,263],
  [263,466],[466,388],[388,387],[387,386],[386,385],[385,384],[384,398],[398,362],
  // Left eyebrow
  [70,63],[63,105],[105,66],[66,107],[107,55],[55,65],[65,52],[52,53],[53,46],
  // Right eyebrow
  [300,293],[293,334],[334,296],[296,336],[336,285],[285,295],[295,282],[282,283],[283,276],
  // Nose bridge
  [168,6],[6,197],[197,195],[195,5],[5,4],[4,1],[1,19],[19,94],[94,2],
  // Outer lips
  [61,185],[185,40],[40,39],[39,37],[37,0],[0,267],[267,269],[269,270],[270,409],
  [409,291],[291,375],[375,321],[321,405],[405,314],[314,17],[17,84],[84,181],
  [181,91],[91,146],[146,61],
  // Inner lips
  [78,191],[191,80],[80,81],[81,82],[82,13],[13,312],[312,311],[311,310],[310,415],
  [415,308],[308,324],[324,318],[318,402],[402,317],[317,14],[14,87],[87,178],
  [178,88],[88,95],[95,78],
];

// Lip landmark indices used for blow intensity
const LIP_HIGHLIGHT = [13, 14, 61, 291, 37, 0, 267, 17, 84, 181, 91];

export function drawHand(canvas: HTMLCanvasElement, landmarks: Landmark[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  HAND_CONNECTIONS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
    ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
    ctx.stroke();
  });

  landmarks.forEach((lm, i) => {
    ctx.beginPath();
    ctx.arc(lm.x * W, lm.y * H, i === 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#00FFE0' : '#ffffff';
    ctx.fill();
  });

  const xs = landmarks.map(l => l.x * W);
  const ys = landmarks.map(l => l.y * H);
  const minX = Math.min(...xs) - 12;
  const maxX = Math.max(...xs) + 12;
  const minY = Math.min(...ys) - 12;
  const maxY = Math.max(...ys) + 12;
  ctx.strokeStyle = '#00FFE0';
  ctx.lineWidth = 2;
  ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Draw full face mesh — all 478 landmarks + key contour connections.
 * Replaces the minimal drawLips() for full visualization.
 */
export function drawFaceMesh(canvas: HTMLCanvasElement, landmarks: Landmark[]): void {
  if (!landmarks || landmarks.length < 400) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  // Mesh connection lines
  ctx.strokeStyle = 'rgba(0, 255, 224, 0.22)';
  ctx.lineWidth = 0.8;
  for (const [a, b] of FACE_MESH_CONNECTIONS) {
    if (!landmarks[a] || !landmarks[b]) continue;
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
    ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
    ctx.stroke();
  }

  // All landmark dots — tiny, subtle
  ctx.fillStyle = 'rgba(0, 255, 224, 0.45)';
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    ctx.beginPath();
    ctx.arc(lm.x * W, lm.y * H, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight lip points used for blow intensity
  ctx.fillStyle = '#00FFE0';
  for (const i of LIP_HIGHLIGHT) {
    if (!landmarks[i]) continue;
    ctx.beginPath();
    ctx.arc(landmarks[i].x * W, landmarks[i].y * H, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCameraError(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width || 640;
  const H = canvas.height || 360;
  canvas.width = W;
  canvas.height = H;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // The canvas is CSS-mirrored (scaleX(-1)) for the selfie view; counter-flip
  // here so this error text reads forwards instead of backwards.
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#fff';
  ctx.font = "bold 20px 'Bebas Neue'";
  ctx.textAlign = 'center';
  ctx.fillText('CAMERA ACCESS DENIED', W / 2, H / 2 - 16);
  ctx.font = "13px 'Space Grotesk'";
  ctx.fillStyle = '#555';
  ctx.fillText('Allow camera permissions and refresh.', W / 2, H / 2 + 16);
  ctx.restore();
}
