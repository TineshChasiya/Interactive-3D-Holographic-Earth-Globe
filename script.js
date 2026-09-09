const canvas = document.getElementById('globeCanvas');
const ctx = canvas.getContext('2d');
const initCanvas = () =>{
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
};
window.addEventListener('resize', initCanvas);
initCanvas();
const state = {
    globeRadius: Math.min(window.innerWidth, window.innerHeight) * 0.32,
    rotationX: 0.3,
    rotationY: 0,
    targetRotationX: 0.3,
    targetRotationY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    scale: 1
};
const stars = Array.from({ length: 200 }, () =>
({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 1.5,
    alpha: Math.random()
}));
const handlePointerStart = (clientX, clientY) => {
    state.isDragging = true;
    state.startX = clientX;
    state.startY = clientY;
};
const handlePointerMove = (clientX, clientY) => {
    if (!state.isDragging) return;
    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;
    state.targetRotationY += deltaX * 0.005;
    state.targetRotationX += deltaY * 0.005;
    state.startX = clientX;
    state.startY = clientY;
};
const handlePointerEnd = () => {
    state.isDragging = false;
};
window.addEventListener('mousedown', e =>handlePointerStart(e.clientX, e.clientY));
window.addEventListener('mousemove', e =>handlePointerMove(e.clientX, e.clientY));
window.addEventListener('mouseup',handlePointerEnd);
window.addEventListener('touchstart', e =>handlePointerStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
window.addEventListener('touchmove', e =>handlePointerMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
window.addEventListener('touchend',handlePointerEnd);
window.addEventListener('wheel', e =>{
    state.scale += e.deltaY * -0.001;
    state.scale = Math.max(0.7, Math.min(state.scale, 1.8));
}, { passive: true });
const project = (x, y, z, cx, cy) =>{
    const cosY = Math.cos(state.rotationY);
    const sinY = Math.sin(state.rotationY);
    const x1 = x * cosY - z * sinY;
    const z1 = z * cosY + x * sinY;
    const cosX = Math.cos(state.rotationX);
    const sinX = Math.sin(state.rotationX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = z1 * cosX + y * sinX;
    const fov = 400;
    const alpha = fov / (fov + z2);
    return{
        x: cx + x1 * alpha * state.scale,
        y: cy + y2 * alpha * state.scale,
        depth: z2,
        scaleFactor: alpha
    };
};
const globePoints = [];
const latLines = 12;
const lonLines = 24;
for(let lat = -latLines; lat <= latLines; lat++){
    const phi = (lat * Math.PI) / (2 * latLines);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    for(let lon = 0; lon < lonLines; lon++){
        const theta = (lon * 2 * Math.PI) / lonLines;
        globePoints.push({
            x: Math.cos(theta) * cosPhi,
            y: sinPhi,
            z: Math.sin(theta) * cosPhi
        });
    }
}
const animate =()=>{
    state.rotationX += (state.targetRotationX - state.rotationX) * 0.1;
    state.rotationY += (state.targetRotationY - state.rotationY) * 0.1;
    if(!state.isDragging){
        state.targetRotationY += 0.003;
    }
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    ctx.fillStyle = 'rgba(3, 5, 15, 0.3)';
    ctx.fillRect(0, 0, currentWidth, currentHeight);
    const cx = currentWidth / 2;
    const cy = currentHeight / 2;
    const radius = state.globeRadius * state.scale;
    ctx.fillStyle = '#ffffff';
    stars.forEach(star =>{
        ctx.globalAlpha = star.alpha * 0.5
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    globePoints.forEach(p => {
        const projected = project(p.x * radius, p.y * radius, p.z * radius, cx, cy);
        if(projected.depth > -radius){
            let alpha = (projected.depth + radius) / (2 * radius);
            alpha = Math.max(0.1, alpha);
            ctx.fillStyle = `rgba(0, 243, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, 1.5 * projected.scaleFactor, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 0.7;
    for(let lat = -latLines; lat <= latLines; lat++){
        ctx.beginPath();
        let started = false;
        for(let lon = 0; lon <= lonLines; lon++){
            const phi = (lat * Math.PI) / (2 * latLines);
            const theta = (lon * 2 * Math.PI) / lonLines;
            const x = Math.cos(theta) * Math.cos(phi);
            const y = Math.sin(phi);
            const z = Math.sin(theta) * Math.cos(phi);
            const projected = project(x * radius, y * radius, z * radius, cx, cy);
            if(projected.depth > -radius){
                if(!started){
                    ctx.moveTo(projected.x, projected.y);
                    started = true;
                }else{
                    ctx.lineTo(projected.x, projected.y);
                }
            }
        }
        ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.1);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0)');
    gradient.addColorStop(0.8, 'rgba(0, 243, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0.3)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);