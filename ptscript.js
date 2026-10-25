const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Optional: animate hamburger lines here
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links li a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Navbar Scroll Effect
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Typing Animation
const texts = ["Frontend Developer", "BCA Student", "UI/UX Enthusiast"];
let count = 0;
let index = 0;
let currentText = "";
let letter = "";
const typingElement = document.querySelector('.typing-text');

function type() {
    if (count === texts.length) {
        count = 0;
    }
    currentText = texts[count];
    letter = currentText.slice(0, ++index);
    
    // Update the DOM
    if(typingElement) {
        typingElement.innerHTML = `${letter} <span class="cursor">|</span>`;
    }

    if (letter.length === currentText.length) {
        count++;
        index = 0;
        setTimeout(type, 2000); // Pause before starting next word
    } else {
        setTimeout(type, 100); // Typing speed
    }
}

// Start typing animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(type, 1000);
});

// Scroll Animations (Intersection Observer)
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});

// Formal Particle Background (tsParticles)
document.addEventListener('DOMContentLoaded', () => {
    if (typeof tsParticles !== 'undefined') {
        tsParticles.load("tsparticles", {
            particles: {
                number: {
                    value: 40,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: ["#6366f1", "#ec4899", "#cbd5e1"] },
                links: {
                    enable: true,
                    distance: 150,
                    color: "#6366f1",
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
                    direction: "none",
                    random: false,
                    straight: false,
                    outModes: { default: "bounce" }
                },
                size: { value: { min: 1, max: 3 } },
                opacity: {
                    value: 0.5,
                    animation: { enable: true, speed: 1, minimumValue: 0.1 }
                }
            },
            interactivity: {
                events: {
                    onHover: { enable: true, mode: "grab" },
                    onClick: { enable: true, mode: "push" }
                },
                modes: {
                    grab: { distance: 140, links: { opacity: 0.5 } },
                    push: { quantity: 4 }
                }
            },
            detectRetina: true
        });
    }
});