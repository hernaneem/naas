// ============================================
// Header scroll effect
// ============================================
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ============================================
// Mobile hamburger menu
// ============================================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const overlay = document.querySelector('.mobile-overlay');

function toggleMenu() {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
}

hamburger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Close menu when clicking a nav link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            toggleMenu();
        }
    });
});

// ============================================
// Feature tabs
// ============================================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.dataset.tabContent === tab) {
                content.classList.add('active');
                // Re-trigger reveal animations for newly visible cards
                content.querySelectorAll('.reveal').forEach(el => {
                    el.classList.remove('is-visible');
                    setTimeout(() => observer.observe(el), 50);
                });
            }
        });
    });
});

// ============================================
// Scroll reveal animations (staggered)
// ============================================
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
});

// Apply a small staggered delay to reveal items within the same group
function applyStagger() {
    document.querySelectorAll('.features-grid, .metrics-grid, .testimonials-grid, .value-props').forEach(group => {
        const items = group.querySelectorAll('.reveal');
        items.forEach((el, i) => {
            el.style.setProperty('--reveal-delay', Math.min(i * 70, 420) + 'ms');
        });
    });
}
applyStagger();

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});

// ============================================
// Metrics counter animation
// ============================================
const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const prefix = target >= 1000 ? '+' : '+';
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);

                if (target >= 1000) {
                    el.textContent = prefix + current.toLocaleString('es-MX') + suffix;
                } else {
                    el.textContent = prefix + current + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                }
            }

            requestAnimationFrame(updateCounter);
            counterObserver.unobserve(el);
        }
    });
}, {
    threshold: 0.5
});

document.querySelectorAll('.metric-number').forEach(el => {
    counterObserver.observe(el);
});

// ============================================
// Smooth scrolling for anchor links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Only handle pure hash links on the current page
        if (href.startsWith('#')) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ============================================
// Partners Calculator
// ============================================
const calcClients = document.getElementById('calcClients');
const calcEmployees = document.getElementById('calcEmployees');
if (calcClients && calcEmployees) {
    const pricePerEmployee = 105;
    const commissionRate = 0.20;

    function updateCalc() {
        const clients = parseInt(calcClients.value);
        const employees = parseInt(calcEmployees.value);
        const mrr = clients * employees * pricePerEmployee;
        const monthly = mrr * commissionRate;
        const annual = monthly * 12;

        document.getElementById('calcClientsVal').textContent = clients;
        document.getElementById('calcEmployeesVal').textContent = employees;
        document.getElementById('calcMonthly').textContent = '$' + monthly.toLocaleString('es-MX');
        document.getElementById('calcAnnual').textContent = '$' + annual.toLocaleString('es-MX');
    }

    calcClients.addEventListener('input', updateCalc);
    calcEmployees.addEventListener('input', updateCalc);
    updateCalc();
}

// ============================================
// Pricing Builder
// ============================================
const pbEmployees = document.getElementById('pbEmployees');
if (pbEmployees) {
    const MODULES = {
        base: { name: 'Nómina', price: 45 },
        asistencias: { name: 'Turnos y asistencias', price: 25 },
        talento: { name: 'Onboarding y gestión de talento', price: 35 }
    };
    // A partir de este volumen el precio se cotiza a la medida.
    const QUOTE_THRESHOLD = 1000;

    const toggles = {
        asistencias: document.getElementById('pbModAsistencias'),
        talento: document.getElementById('pbModTalento')
    };

    function money(n) {
        return '$' + n.toLocaleString('es-MX');
    }

    function updateBuilder() {
        const employees = parseInt(pbEmployees.value);
        const active = [MODULES.base];

        Object.keys(toggles).forEach(key => {
            const card = document.querySelector(`.pb-module[data-module="${key}"]`);
            const on = toggles[key].checked;
            card.classList.toggle('is-active', on);
            card.querySelector('.pb-toggle-text').textContent = on ? 'Agregado' : 'Agregar';
            if (on) active.push(MODULES[key]);
        });

        const perPerson = active.reduce((sum, m) => sum + m.price, 0);
        const isQuote = employees >= QUOTE_THRESHOLD;

        document.getElementById('pbEmployeesVal').textContent =
            isQuote ? '1,000+' : employees.toLocaleString('es-MX');
        document.getElementById('pbPerPerson').textContent = money(perPerson);

        document.getElementById('pbLines').innerHTML = active.map(m => `
            <li>
                <span class="pb-line-name">${m.name}</span>
                <span class="pb-line-price">${money(m.price)}</span>
            </li>`).join('');

        const totalLabel = document.getElementById('pbTotalLabel');
        const totalAmount = document.getElementById('pbTotal');
        const note = document.getElementById('pbNote');

        if (isQuote) {
            totalLabel.textContent = 'Volumen alto';
            totalAmount.textContent = 'Contactar ventas';
            totalAmount.classList.add('is-quote');
            note.textContent = 'Arriba de 1,000 colaboradores armamos un precio a tu medida.';
        } else {
            totalLabel.textContent = 'Total mensual';
            totalAmount.textContent = money(perPerson * employees);
            totalAmount.classList.remove('is-quote');
            note.textContent = `Para ${employees.toLocaleString('es-MX')} colaboradores, más IVA.`;
        }
    }

    pbEmployees.addEventListener('input', updateBuilder);
    Object.values(toggles).forEach(t => t.addEventListener('change', updateBuilder));
    updateBuilder();
}
