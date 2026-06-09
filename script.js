/**
BBO 3.0 (2026) — Biology & Bioinformatics Olympiad
script.js — Complete interactivity & Updated Knowledge Base
*/
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initHamburger();
    initActiveNavLinks();
    initTeamTabs();
    initScrollToTop();
    initScrollAnimations();
    initSmoothScroll();
    initRegisterIframe();
    initCustomCursor();
    initAccordions();
    initRulesProgress();
    initChatbot();
});

function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}

function initActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0.01 });
    sections.forEach(section => observer.observe(section));
}

function initTeamTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    if (!tabBtns.length) return;
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });
}

function initScrollToTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initScrollAnimations() {
    const animatables = document.querySelectorAll('.guest-card, .team-card, .partner-logo, .faq-item, .contact-card, .highlight-item, .overview-copy, .overview-stat-card, .section-card, .reg-stat');
    if (!animatables.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animatables.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = `opacity 0.55s ease ${(i % 5) * 0.06}s, transform 0.55s ease ${(i % 5) * 0.06}s`;
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    animatables.forEach(el => observer.observe(el));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const navbarHeight = document.getElementById('navbar')?.offsetHeight || 70;
            const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
        });
    });
}

function initRegisterIframe() {
    const iframe = document.getElementById('registrationIframe');
    const loading = document.getElementById('gformLoading');
    if (!iframe) return;
    const fallbackTimer = setTimeout(() => {
        if (loading) loading.style.display = 'none';
        iframe.style.opacity = '1';
    }, 5000);
    iframe.addEventListener('load', () => {
        clearTimeout(fallbackTimer);
        if (loading) loading.style.display = 'none';
        iframe.style.opacity = '1';
    });
}

function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!cursor || !supportsFinePointer) return;
    document.body.classList.add('cursor-ready');
    let lastTrail = 0;
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        const now = Date.now();
        if (now - lastTrail > 55) {
            createCursorTrail(e.clientX, e.clientY);
            lastTrail = now;
        }
    }, { passive: true });
    const interactiveSelector = 'a, button, input, .highlight-item, .guest-card, .team-card, .faq-item, .accordion-header, .partner-logo, .chatbot-panel';
    document.querySelectorAll(interactiveSelector).forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
}

function createCursorTrail(x, y) {
    const dot = document.createElement('span');
    dot.className = 'cursor-trail';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
}

function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.setAttribute('aria-expanded', 'false');
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            if (!item) return;
            const isActive = item.classList.toggle('active');
            header.setAttribute('aria-expanded', String(isActive));
            if (item.hasAttribute('data-rule')) item.classList.add('reviewed');
            updateRulesProgress();
        });
    });
}

function initRulesProgress() {
    updateRulesProgress();
    const copyBtn = document.getElementById('copyRulesBtn');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', async () => {
        const rules = Array.from(document.querySelectorAll('#rules .accordion-item')).map((item, index) => {
            const title = item.querySelector('.accordion-header span')?.textContent.trim() || `Rule ${index + 1}`;
            const body = item.querySelector('.accordion-content')?.textContent.trim() || '';
            return `${index + 1}. ${title}: ${body}`;
        }).join('\n');
        try {
            await navigator.clipboard.writeText(rules);
            const previous = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => { copyBtn.innerHTML = previous; }, 1500);
        } catch (error) {
            alert('Rules are ready, but your browser blocked automatic copying. Please select and copy manually.');
        }
    });
}

function updateRulesProgress() {
    const ruleItems = Array.from(document.querySelectorAll('#rules .accordion-item[data-rule]'));
    const progressBar = document.getElementById('rulesProgressBar');
    const progressText = document.getElementById('rulesProgressText');
    if (!ruleItems.length || !progressBar || !progressText) return;
    const reviewed = ruleItems.filter(item => item.classList.contains('reviewed')).length;
    const percent = Math.round((reviewed / ruleItems.length) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${reviewed}/${ruleItems.length} reviewed`;
}

function initChatbot() {
    const btn = document.getElementById('chatbot-btn');
    const panel = document.getElementById('chatbot-panel');
    const closeBtn = document.getElementById('chatbot-close');
    const messages = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const suggestionBtns = document.querySelectorAll('.chatbot-suggestions button');
    if (!btn || !panel || !closeBtn || !messages || !input || !sendBtn) return;

    const knowledgeBase = [
        { keywords: ['hello', 'hi', 'hey', 'assalam', 'salam'], answer: "Hi! 👋 I'm BioPC Bot. Ask me about BBO 3.0 (2026) deadline, syllabus, event format, registration, prizes, eligibility, or platforms." },
        { keywords: ['what is bbo', 'about bbo', 'overview', 'bbo 3.0'], answer: 'BBO 3.0 (2026) is a national-level Biology & Bioinformatics Olympiad by BioPC. Following a previous edition with 3,000+ participants, it promotes scientific excellence through competitive learning.' },
        { keywords: ['date', 'when', 'schedule', 'day', 'deadline', 'june'], answer: 'The registration deadline is <strong>30 June 2026 at 11:59 PM (BST)</strong>.' },
        { keywords: ['mode', 'hybrid', 'online', 'offline', 'platform', 'meet', 'testmoz', 'livemcq', 'venue'], answer: 'The event has two stages: <strong>Stage 1</strong> is an Online Elimination Round (via Google Meet, TestMoz, LiveMCQ). <strong>Stage 2</strong> is the Offline Final Round at the <strong>University of Chittagong (CU)</strong>.' },
        { keywords: ['register', 'registration', 'form', 'apply', 'join', 'sign up', 'link'], answer: 'Registration is completely <strong>free</strong>! You can apply here: <a href="https://forms.gle/3Gc7gKygh9GNpw8g6" target="_blank">Registration Form</a>.' },
        { keywords: ['eligibility', 'eligible', 'who can participate', 'undergraduate', 'graduate', 'student'], answer: 'Open to undergraduate and graduate students from any recognized university in any Life Science discipline (Biology, Biotech, Microbiology, Bioinformatics, Pharmacy, MBBS, etc.).' },
        { keywords: ['syllabus', 'topic', 'topics', 'prepare', 'study', 'subject'], answer: 'The final round features Advance MCQ Questions from Biotechnology, Biochemistry, Microbiology, Botany, Zoology, Biology IQ, Basic Bioinformatics & others.' },
        { keywords: ['prize', 'cash', 'money', 'reward', 'award', 'certificate', 'internship', 'top 10'], answer: 'Top 10 performers receive special awards, national-level certificates, and an <strong>internship opportunity with BioPC</strong>. All participants receive certificates.' },
        { keywords: ['fee', 'payment', 'cost', 'free', 'price'], answer: 'The online round is completely <strong>free</strong>. If you qualify for the offline final round, there is a small fee for program support.' },
        { keywords: ['team', 'teamwork', 'group', 'individual', 'solo'], answer: 'No teamwork is allowed. The Olympiad is strictly an <strong>individual competition</strong>.' },
        { keywords: ['fresher', 'first year', '1st year', 'year'], answer: 'Absolutely! Students from <strong>all academic years</strong>, including freshers and first-year students, are encouraged to join.' },
        { keywords: ['rules', 'regulation', 'guideline', 'policy'], answer: 'Rules cover eligibility, official platforms, and deadlines. Review them in the <a href="#rules">Rules section</a>.' },
        { keywords: ['faq', 'question', 'questions', 'common'], answer: 'You can find all common questions about registration fees, deadlines, platforms, and syllabus in the <a href="#faq">FAQ section</a>.' },
        { keywords: ['contact', 'email', 'phone', 'whatsapp', 'facebook', 'help'], answer: 'For support, visit the <a href="#contact">Contact section</a> or message our official Facebook page / WhatsApp (+880 1622-488559).' }
    ];
    
    const fallbackAnswers = [
        'I can help with the 2026 deadline, registration link, syllabus, rules, prizes, eligibility, or platforms. Try asking: “Where is the final round?”',
        'Good question. For official confirmation, check the relevant website section or contact BioPC.',
        'I may not have that exact detail yet. Ask about rules, syllabus, registration, deadline, or internship prizes.'
    ];

    function addMessage(text, type = 'bot', asHtml = false) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        if (asHtml) div.innerHTML = text;
        else div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
    }

    function addTyping() {
        const div = document.createElement('div');
        div.className = 'chat-message bot typing';
        div.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
    }

    function normalize(text) {
        return text.toLowerCase().replace(/[^a-z0-9৳\s.]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function getResponse(message) {
        const lower = normalize(message);
        let best = null;
        let bestScore = 0;
        knowledgeBase.forEach(entry => {
            const score = entry.keywords.reduce((total, keyword) => {
                return total + (lower.includes(normalize(keyword)) ? 1 : 0);
            }, 0);
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        });
        if (best) return best.answer;
        return fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    }

    function openBot() {
        panel.classList.add('open');
        if (messages.children.length === 0) {
            addMessage("Hi! I'm BioPC Bot 🧬 Ask me about BBO 3.0 (2026) registration, syllabus, venue, prizes, or eligibility.", 'bot');
        }
        setTimeout(() => input.focus(), 50);
    }

    function sendCurrentMessage(textFromSuggestion = '') {
        const text = (textFromSuggestion || input.value).trim();
        if (!text) return;
        addMessage(text, 'user');
        input.value = '';
        const typing = addTyping();
        setTimeout(() => {
            typing.remove();
            addMessage(getResponse(text), 'bot', true);
        }, 420);
    }

    btn.addEventListener('click', () => {
        if (panel.classList.contains('open')) panel.classList.remove('open');
        else openBot();
    });
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    sendBtn.addEventListener('click', () => sendCurrentMessage());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendCurrentMessage();
        if (e.key === 'Escape') panel.classList.remove('open');
    });
    suggestionBtns.forEach(button => {
        button.addEventListener('click', () => sendCurrentMessage(button.dataset.question || button.textContent));
    });
}