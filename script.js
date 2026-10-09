const canvas = document.getElementById('radarCanvas');
const ctx = canvas.getContext('2d');

const valAngulo = document.getElementById('valAngulo');
const valDistancia = document.getElementById('valDistancia');
const historialLista = document.getElementById('historialLista');
const lblUnidades = document.querySelectorAll('.lblUnidad');

// Elementos del Modal
const modalConfig = document.getElementById('modalConfig');
const btnConfigurar = document.getElementById('btnConfigurar');
const btnGuardarConfig = document.getElementById('btnGuardarConfig');
const btnCerrarConfig = document.getElementById('btnCerrarConfig');
const selectUnidad = document.getElementById('selectUnidad');

// Configuración fija
const maxDistanciaCm = 130; // Distancia máxima en cm fijada a 130
let unidadMedida = 'cm';     // 'cm', 'm', 'km'

// Centro del radar en el canvas
const cx = canvas.width / 2;
const cy = canvas.height - 30;
const maxRango = 200; // Radio en píxeles

let lecturas = []; 
let ultimaLectura = { angulo: 0, distancia: 0 };

// Convertir distancia según la unidad elegida
function formatearDistancia(distCm) {
  if (unidadMedida === 'm') {
    return (distCm / 100).toFixed(2);
  } else if (unidadMedida === 'km') {
    return (distCm / 100000).toFixed(4);
  }
  return distCm;
}

// Dibujar cuadrícula / rejilla del radar
function dibujarRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
  ctx.lineWidth = 1.5;

  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxRango / 4) * r, Math.PI, 2 * Math.PI);
    ctx.stroke();
  }

  for (let a = 0; a <= 180; a += 30) {
    let rad = (a * Math.PI) / 180;
    let x = cx - maxRango * Math.cos(rad);
    let y = cy - maxRango * Math.sin(rad);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

// Actualizar vista de barrido
function actualizarVista(angulo, distancia) {
  dibujarRadar();

  valAngulo.textContent = angulo;
  valDistancia.textContent = formatearDistancia(distancia);

  ultimaLectura = { angulo, distancia };

  let rad = (angulo * Math.PI) / 180;

  // Dibujar aguja de barrido
  let xBarrido = cx - maxRango * Math.cos(rad);
  let yBarrido = cy - maxRango * Math.sin(rad);

  ctx.strokeStyle = 'rgba(0, 255, 204, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(xBarrido, yBarrido);
  ctx.stroke();

  // Si se detecta un objeto dentro de los 130 cm
  if (distancia > 0 && distancia <= maxDistanciaCm) {
    let rObj = (distancia / maxDistanciaCm) * maxRango;
    let xObj = cx - rObj * Math.cos(rad);
    let yObj = cy - rObj * Math.sin(rad);

    lecturas.push({ x: xObj, y: yObj, alpha: 1.0 });
  }

  // Renderizar ecos rojos con desvanecimiento
  for (let i = lecturas.length - 1; i >= 0; i--) {
    let p = lecturas[i];
    ctx.fillStyle = `rgba(255, 50, 50, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fill();

    p.alpha -= 0.015;
    if (p.alpha <= 0) {
      lecturas.splice(i, 1);
    }
  }
}

// REGISTRAR LECTURA EN EL HISTORIAL
function agregarAlHistorial(angulo, distancia) {
  const emptyMsg = historialLista.querySelector('.empty-msg');
  if (emptyMsg) emptyMsg.remove();

  const esVisible = distancia > 0 && distancia <= maxDistanciaCm;
  const resultadoTexto = esVisible ? 'Objeto visible' : 'Objeto no visible';
  const badgeClase = esVisible ? 'status-visible' : 'status-oculto';

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <div>
      <strong>${angulo}°</strong> | ${formatearDistancia(distancia)} ${unidadMedida}
    </div>
    <span class="status-badge ${badgeClase}">${resultadoTexto}</span>
  `;

  historialLista.insertBefore(item, historialLista.firstChild);
}

// MODAL DE CONFIGURACIÓN
btnConfigurar.addEventListener('click', () => {
  selectUnidad.value = unidadMedida;
  modalConfig.classList.remove('hidden');
});

btnCerrarConfig.addEventListener('click', () => {
  modalConfig.classList.add('hidden');
});

btnGuardarConfig.addEventListener('click', () => {
  unidadMedida = selectUnidad.value;

  lblUnidades.forEach(lbl => lbl.textContent = unidadMedida);

  dibujarRadar();
  modalConfig.classList.add('hidden');
});

// MODO SIMULACIÓN EN VIVO
let simAngulo = 0;
let simDir = 1;
let simInterval = null;

const btnSimular = document.getElementById('btnSimular');

btnSimular.addEventListener('click', () => {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
    btnSimular.textContent = 'Iniciar Simulación';
    btnSimular.classList.remove('activo');

    agregarAlHistorial(ultimaLectura.angulo, ultimaLectura.distancia);
  } else {
    btnSimular.textContent = 'Detener Simulación';
    btnSimular.classList.add('activo');

    simInterval = setInterval(() => {
      simAngulo += simDir;
      if (simAngulo >= 180 || simAngulo <= 0) simDir *= -1;

      let simDistancia;
      if (simAngulo >= 60 && simAngulo <= 110) {
        // Objeto detectado en rango (entre 20cm y 60cm)
        simDistancia = Math.floor(Math.random() * (60 - 20 + 1)) + 20;
      } else {
        // Fuera de rango (>130cm)
        simDistancia = maxDistanciaCm + 20;
      }

      actualizarVista(simAngulo, simDistancia);
    }, 30);
  }
});

// Limpiar historial
document.getElementById('btnLimpiarHistorial').addEventListener('click', () => {
  historialLista.innerHTML = '<div class="empty-msg">No hay capturas registradas aún.</div>';
});

// Renderizar cuadrícula estática inicial
dibujarRadar();