console.log('Script cargado. ¡Hola, NaaS!');

/*
============================================
Particles JS
============================================
*/
particlesJS('particles-js', {
  "particles": {
    "number": {
      "value": 80,
      "density": {
        "enable": true,
        "value_area": 800
      }
    },
    "color": {
      "value": "#ffffff"
    },
    "shape": {
      "type": "circle",
      "stroke": {
        "width": 0,
        "color": "#000000"
      },
      "polygon": {
        "nb_sides": 5
      }
    },
    "opacity": {
      "value": 0.5,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 1,
        "opacity_min": 0.1,
        "sync": false
      }
    },
    "size": {
      "value": 3,
      "random": true,
      "anim": {
        "enable": false,
        "speed": 40,
        "size_min": 0.1,
        "sync": false
      }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 6,
      "direction": "none",
      "random": false,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "repulse"
      },
      "onclick": {
        "enable": true,
        "mode": "push"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 400,
        "line_linked": {
          "opacity": 1
        }
      },
      "bubble": {
        "distance": 400,
        "size": 40,
        "duration": 2,
        "opacity": 8,
        "speed": 3
      },
      "repulse": {
        "distance": 200,
        "duration": 0.4
      },
      "push": {
        "particles_nb": 4
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true
});

// Animación de entrada para las tarjetas
const cards = document.querySelectorAll('.feature-card');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, {
    threshold: 0.1 // La animación se dispara cuando el 10% del elemento es visible
});

cards.forEach(card => {
    observer.observe(card);
});

// Smooth scrolling para los enlaces de anclaje
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// NUEVO: Calculadora de precios
const inputColaboradores = document.getElementById('num-colaboradores');
const resultadoPrecio = document.getElementById('resultado-precio');

function formatCurrencyMXN(value) {
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
}

function calcularPrecio(colaboradores) {
    if (!Number.isFinite(colaboradores) || colaboradores < 0) return 0;
    const tarifa = colaboradores > 100 ? 50 : 75;
    return colaboradores * tarifa;
}

function actualizarResultado() {
    const valor = Number(inputColaboradores?.value || 0);
    const total = calcularPrecio(valor);
    if (resultadoPrecio) {
        resultadoPrecio.textContent = `Total mensual: ${formatCurrencyMXN(total)} + IVA`;
    }
}

if (inputColaboradores) {
    ['input', 'change'].forEach(evt => inputColaboradores.addEventListener(evt, actualizarResultado));
}

