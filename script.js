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
// Scroll reveal animations
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
// ROI Chart - Animated Canvas
// ============================================
const roiCanvas = document.getElementById('roiChart');
if (roiCanvas) {
    const ctx = roiCanvas.getContext('2d');
    const noiMonthly = 25852;
    const naasMonthly = 22500;
    const months = 12;
    const noiData = [];
    const naasData = [];
    for (let i = 1; i <= months; i++) {
        noiData.push(noiMonthly * i);
        naasData.push(naasMonthly * i);
    }

    let animationProgress = 0;
    let chartAnimated = false;

    function drawChart(progress) {
        const dpr = window.devicePixelRatio || 1;
        const rect = roiCanvas.parentElement.getBoundingClientRect();
        const w = rect.width;
        const h = Math.min(400, w * 0.55);

        roiCanvas.width = w * dpr;
        roiCanvas.height = h * dpr;
        roiCanvas.style.width = w + 'px';
        roiCanvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);

        const padLeft = 80;
        const padRight = 30;
        const padTop = 20;
        const padBottom = 50;
        const chartW = w - padLeft - padRight;
        const chartH = h - padTop - padBottom;

        const maxVal = noiData[months - 1];
        const stepX = chartW / (months - 1);

        // Grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const gridSteps = 5;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padTop + (chartH / gridSteps) * i;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(w - padRight, y);
            ctx.stroke();

            // Y-axis labels
            const val = maxVal - (maxVal / gridSteps) * i;
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '11px Poppins, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('$' + Math.round(val / 1000) + 'k', padLeft - 10, y + 4);
        }
        ctx.setLineDash([]);

        // X-axis labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Poppins, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < months; i++) {
            const x = padLeft + stepX * i;
            ctx.fillText('Mes ' + (i + 1), x, h - padBottom + 30);
        }

        const pointsToShow = Math.ceil(progress * months);
        const partialProgress = (progress * months) - Math.floor(progress * months);

        function getY(val) {
            return padTop + chartH - (val / maxVal) * chartH;
        }

        // Savings area fill
        if (pointsToShow > 1) {
            ctx.beginPath();
            ctx.moveTo(padLeft, getY(naasData[0]));
            for (let i = 1; i < pointsToShow && i < months; i++) {
                ctx.lineTo(padLeft + stepX * i, getY(naasData[i]));
            }
            for (let i = Math.min(pointsToShow - 1, months - 1); i >= 0; i--) {
                ctx.lineTo(padLeft + stepX * i, getY(noiData[i]));
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';
            ctx.fill();
        }

        // NOI line
        ctx.beginPath();
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let i = 0; i < pointsToShow && i < months; i++) {
            const x = padLeft + stepX * i;
            const y = getY(noiData[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // NaaS line
        ctx.beginPath();
        ctx.strokeStyle = '#16A34A';
        ctx.lineWidth = 3;
        for (let i = 0; i < pointsToShow && i < months; i++) {
            const x = padLeft + stepX * i;
            const y = getY(naasData[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Data points
        for (let i = 0; i < pointsToShow && i < months; i++) {
            const x = padLeft + stepX * i;
            // NOI dot
            ctx.beginPath();
            ctx.arc(x, getY(noiData[i]), 4, 0, Math.PI * 2);
            ctx.fillStyle = '#DC2626';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            // NaaS dot
            ctx.beginPath();
            ctx.arc(x, getY(naasData[i]), 4, 0, Math.PI * 2);
            ctx.fillStyle = '#16A34A';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Savings annotation at month 12
        if (progress >= 0.95) {
            const x12 = padLeft + stepX * 11;
            const yMid = (getY(noiData[11]) + getY(naasData[11])) / 2;
            const savings = noiData[11] - naasData[11];

            ctx.fillStyle = 'rgba(255, 107, 53, 0.95)';
            const boxW = 130;
            const boxH = 36;
            const fitsRight = (x12 + 12 + boxW) < w - padRight;
            const boxX = fitsRight ? x12 + 12 : x12 - boxW - 12;
            const boxY = yMid - boxH / 2;

            // Rounded rect
            const r = 8;
            ctx.beginPath();
            ctx.moveTo(boxX + r, boxY);
            ctx.lineTo(boxX + boxW - r, boxY);
            ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
            ctx.lineTo(boxX + boxW, boxY + boxH - r);
            ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
            ctx.lineTo(boxX + r, boxY + boxH);
            ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
            ctx.lineTo(boxX, boxY + r);
            ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
            ctx.closePath();
            ctx.fill();

            // Arrow
            ctx.beginPath();
            if (fitsRight) {
                ctx.moveTo(boxX, yMid);
                ctx.lineTo(boxX - 6, yMid - 5);
                ctx.lineTo(boxX - 6, yMid + 5);
            } else {
                ctx.moveTo(boxX + boxW, yMid);
                ctx.lineTo(boxX + boxW + 6, yMid - 5);
                ctx.lineTo(boxX + boxW + 6, yMid + 5);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Ahorras $' + Math.round(savings / 1000) + 'k', boxX + boxW / 2, yMid + 5);
        }
    }

    function animateChart() {
        animationProgress += 0.02;
        if (animationProgress > 1) animationProgress = 1;
        drawChart(animationProgress);
        if (animationProgress < 1) {
            requestAnimationFrame(animateChart);
        }
    }

    // Trigger on scroll
    const chartObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !chartAnimated) {
                chartAnimated = true;
                animateChart();
                chartObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    chartObserver.observe(roiCanvas);

    // Redraw on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (chartAnimated) drawChart(1);
        }, 150);
    });
}

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
    const pricePerEmployee = 75;
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
