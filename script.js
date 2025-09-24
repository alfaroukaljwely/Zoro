/**
 * Combines all functionality from main.js and inline scripts
 */

// Neural Network Background Animation
class NeuralNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.nodes = [];
    this.connections = [];
    this.signals = [];
    this.animationId = null;

    this.resize();
    this.createNodes();
    this.createConnections();
    this.animate();

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  createNodes() {
    this.nodes = [];
    const nodeCount = Math.floor((this.width * this.height) / 25000); // Reduced node count

    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.1, // Much slower movement
        vy: (Math.random() - 0.5) * 0.1, // Much slower movement
        energy: Math.random(),
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
      });
    }
  }

  createConnections() {
    this.connections = [];
    const maxDistance = 120; // Shorter connections for simpler look

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const connection = {
            nodeA: i,
            nodeB: j,
            distance: distance,
            strength: 1 - distance / maxDistance,
            energy: 0,
          };
          this.connections.push(connection);
          this.nodes[i].connections.push(connection);
          this.nodes[j].connections.push(connection);
        }
      }
    }
  }

  createSignal(nodeIndex) {
    if (Math.random() < 0.005) {
      // Much lower signal frequency
      this.signals.push({
        currentNode: nodeIndex,
        targetNode: null,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01, // Slower signals
        energy: 0.3 + Math.random() * 0.4, // Lower energy
        color: this.getSignalColor(),
      });
    }
  }

  getSignalColor() {
    const colors = [
      "#26c6da", // Electric blue
      "#00acc1", // Cyan
      "#ffd700", // Gold
      "#00bcd4", // Light cyan
      "#64b5f6", // Light blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateNodes() {
    this.nodes.forEach((node, index) => {
      // Update position
      node.x += node.vx;
      node.y += node.vy;

      // Boundary bounce
      if (node.x <= 0 || node.x >= this.width) node.vx *= -1;
      if (node.y <= 0 || node.y >= this.height) node.vy *= -1;

      // Keep in bounds
      node.x = Math.max(0, Math.min(this.width, node.x));
      node.y = Math.max(0, Math.min(this.height, node.y));

      // Update energy pulse
      node.pulsePhase += 0.005; // Much slower pulse
      node.energy = 0.2 + 0.3 * (Math.sin(node.pulsePhase) * 0.5 + 0.5); // Lower energy range

      // Create signals
      this.createSignal(index);
    });
  }

  updateSignals() {
    this.signals = this.signals.filter((signal) => {
      if (signal.targetNode === null) {
        // Find next node to travel to
        const currentNode = this.nodes[signal.currentNode];
        const availableConnections = currentNode.connections.filter(
          (conn) =>
            conn.nodeA === signal.currentNode ||
            conn.nodeB === signal.currentNode
        );

        if (availableConnections.length > 0) {
          const randomConnection =
            availableConnections[
              Math.floor(Math.random() * availableConnections.length)
            ];
          signal.targetNode =
            randomConnection.nodeA === signal.currentNode
              ? randomConnection.nodeB
              : randomConnection.nodeA;
          signal.progress = 0;
        } else {
          return false; // Remove signal if no connections
        }
      }

      signal.progress += signal.speed;

      if (signal.progress >= 1) {
        // Reached target node
        signal.currentNode = signal.targetNode;
        signal.targetNode = null;
        signal.energy *= 0.9; // Reduce energy

        if (signal.energy < 0.1) {
          return false; // Remove weak signals
        }
      }

      return true;
    });
  }

  draw() {
    // Clear canvas with fade effect
    this.ctx.fillStyle = "rgba(47, 54, 64, 0.05)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw connections
    this.connections.forEach((connection) => {
      const nodeA = this.nodes[connection.nodeA];
      const nodeB = this.nodes[connection.nodeB];

      const alpha = connection.strength * 0.15; // Much more subtle
      this.ctx.strokeStyle = `rgba(38, 198, 218, ${alpha})`; // Simple color
      this.ctx.lineWidth = connection.strength * 0.5; // Thinner lines
      this.ctx.beginPath();
      this.ctx.moveTo(nodeA.x, nodeA.y);
      this.ctx.lineTo(nodeB.x, nodeB.y);
      this.ctx.stroke();
    });

    // Draw nodes
    this.nodes.forEach((node) => {
      const radius = 1 + node.energy * 2; // Smaller nodes
      const alpha = 0.3 + node.energy * 0.4; // More subtle

      // Simple node core
      this.ctx.fillStyle = `rgba(38, 198, 218, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw signals (simplified)
    this.signals.forEach((signal) => {
      if (signal.targetNode !== null) {
        const currentNode = this.nodes[signal.currentNode];
        const targetNode = this.nodes[signal.targetNode];

        const x =
          currentNode.x + (targetNode.x - currentNode.x) * signal.progress;
        const y =
          currentNode.y + (targetNode.y - currentNode.y) * signal.progress;

        // Simple signal dot
        this.ctx.fillStyle = signal.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1 + signal.energy, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  animate() {
    this.updateNodes();
    this.updateSignals();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", () => this.resize());
  }
}

// Initialize Neural Network Background
let neuralNetwork = null;

function initNeuralBackground() {
  const canvas = document.getElementById("neuralCanvas");
  if (canvas && !neuralNetwork) {
    neuralNetwork = new NeuralNetwork(canvas);
  }
}

// Performance optimization: pause animation when tab is not visible
function handleVisibilityChange() {
  if (neuralNetwork) {
    if (document.hidden) {
      if (neuralNetwork.animationId) {
        cancelAnimationFrame(neuralNetwork.animationId);
        neuralNetwork.animationId = null;
      }
    } else {
      if (!neuralNetwork.animationId) {
        neuralNetwork.animate();
      }
    }
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange);

// Floating Bubbles Animation
function createFloatingBubbles() {
  const sections = document.querySelectorAll(
    ".pricing-section, .features-section, .best-package-section, .comparison, .why-choose-us, .testimonials"
  );

  sections.forEach((section) => {
    // Check if bubbles already exist
    if (section.querySelector(".floating-bubbles")) return;

    const bubblesContainer = document.createElement("div");
    bubblesContainer.className = "floating-bubbles";

    // Create 10 bubbles for each section
    for (let i = 1; i <= 10; i++) {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubblesContainer.appendChild(bubble);
    }

    section.appendChild(bubblesContainer);
  });
}

// Initialize bubbles when page loads
function initFloatingBubbles() {
  // Create bubbles immediately
  createFloatingBubbles();

  // Recreate bubbles if new sections are added dynamically
  const observer = new MutationObserver(() => {
    createFloatingBubbles();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Neural Network Background
  initNeuralBackground();

  // Initialize Floating Bubbles
  initFloatingBubbles();

  // Initialize AOS (Animate On Scroll)
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      offset: 100,
    });
  }

  // Hero Image Slider Functionality
  const initHeroImageSlider = () => {
    const sliderContainer = document.getElementById("heroImageSlider");
    if (!sliderContainer) return;

    const images = sliderContainer.querySelectorAll(".heroBannerImage");
    if (images.length < 2) return;

    let currentIndex = 0;
    const slideInterval = 7000; // 7 seconds between slides

    const showImage = (index) => {
      images.forEach((img, i) => {
        img.classList.remove("active", "fadeIn");
        if (i === index) {
          img.classList.add("active", "fadeIn");
        }
      });
    };

    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    };

    // Start the slideshow
    let slideTimer = setInterval(nextSlide, slideInterval);

    // Pause slideshow on hover
    sliderContainer.addEventListener("mouseenter", () => {
      clearInterval(slideTimer);
    });

    // Resume slideshow when mouse leaves
    sliderContainer.addEventListener("mouseleave", () => {
      slideTimer = setInterval(nextSlide, slideInterval);
    });

    // Pause slideshow when page is not visible (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(slideTimer);
      } else {
        slideTimer = setInterval(nextSlide, slideInterval);
      }
    });

    // Initialize first slide
    showImage(0);
  };

  // Initialize hero image slider
  initHeroImageSlider();

  // Set current year in footer
  const currentYearElement = document.getElementById("current-year");
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      e.preventDefault();
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for fixed header
          behavior: "smooth",
        });
      }
    });
  });

  // Header and Navigation
  const header = document.getElementById("header");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const backToTopBtn = document.getElementById("backToTop");
  const ctaButton = document.getElementById("ctaButton");

  // Mobile menu functionality
  if (mobileMenuBtn && navMenu) {
    const toggleMobileMenu = (isExpanded) => {
      mobileMenuBtn.setAttribute("aria-expanded", isExpanded);
      navMenu.classList.toggle("active", isExpanded);
      mobileMenuBtn.classList.toggle("active", isExpanded);
      document.body.style.overflow = isExpanded ? "hidden" : "";

      if (isExpanded) {
        document.addEventListener("keydown", handleEscapeKey);
      } else {
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        toggleMobileMenu(false);
      }
    };

    mobileMenuBtn.addEventListener("click", () => {
      const isExpanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
      toggleMobileMenu(!isExpanded);
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      const isClickInside =
        navMenu.contains(e.target) || mobileMenuBtn.contains(e.target);
      if (!isClickInside && navMenu.classList.contains("active")) {
        toggleMobileMenu(false);
      }
    });

    // Close mobile menu when clicking on a nav link
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 992) {
          toggleMobileMenu(false);
        }
      });
    });
  }

  // Header scroll effect
  if (header) {
    let lastScroll = 0;
    const headerHeight = header.offsetHeight;
    let ticking = false;

    const updateHeader = () => {
      const currentScroll = window.pageYOffset;

      // Add/remove scrolled class based on scroll position
      header.classList.toggle("scrolled", currentScroll > 50);

      // Only run the hide/show logic if not in mobile menu
      if (!navMenu || !navMenu.classList.contains("active")) {
        // Hide/show header on scroll
        if (currentScroll > lastScroll && currentScroll > headerHeight) {
          // Scrolling down
          header.classList.add("hide");
        } else {
          // Scrolling up
          header.classList.remove("hide");
        }
      }

      // Show/hide back to top button
      if (backToTopBtn) {
        backToTopBtn.classList.toggle("show", currentScroll > 300);
      }

      lastScroll = currentScroll <= 0 ? 0 : currentScroll;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateHeader(); // Initialize header state
  }

  // Back to top button
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      // Focus on header for keyboard users
      const header = document.querySelector("header");
      if (header) {
        header.setAttribute("tabindex", "-1");
        header.focus();
      }
    });
  }

  // Set active navigation link based on scroll position
  const setActiveLink = () => {
    const scrollPosition = window.scrollY + 100;

    document.querySelectorAll("section[id]").forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${sectionId}`
          );
        });
      }
    });
  };

  // Run on load and scroll
  window.addEventListener("load", setActiveLink);
  window.addEventListener("scroll", setActiveLink, { passive: true });

  // CTA Button hover effect
  if (ctaButton) {
    const updateCtaHover = (isHovered) => {
      const icon = ctaButton.querySelector("i");
      if (icon) {
        icon.style.transform = isHovered ? "translateX(-5px)" : "translateX(0)";
      }
    };

    ctaButton.addEventListener("mouseenter", () => updateCtaHover(true));
    ctaButton.addEventListener("mouseleave", () => updateCtaHover(false));
    ctaButton.addEventListener("focus", () => updateCtaHover(true));
    ctaButton.addEventListener("blur", () => updateCtaHover(false));
  }

  // Add animation to nav items on page load
  if (navLinks.length > 0) {
    navLinks.forEach((link, index) => {
      link.style.opacity = "0";
      link.style.transform = "translateY(10px)";
      link.style.transition = `opacity 0.3s ease ${
        index * 0.1
      }s, transform 0.3s ease ${index * 0.1}s`;

      // Trigger reflow
      void link.offsetWidth;

      link.style.opacity = "1";
      link.style.transform = "translateY(0)";
    });
  }

  // Handle reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = "auto";
  }

  // Initialize accordion functionality
  const accordionItems = document.querySelectorAll(".accordion-item");

  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    const panel = item.querySelector(".accordion-panel");
    const icon = header.querySelector(".fa-plus");

    header.addEventListener("click", () => {
      // Toggle the expanded state
      const isExpanded = header.getAttribute("aria-expanded") === "true";

      // Close all other accordion items
      document.querySelectorAll(".accordion-item").forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem
            .querySelector(".accordion-header")
            .setAttribute("aria-expanded", "false");
          otherItem.querySelector(".accordion-panel").style.maxHeight = null;
          otherItem.querySelector(".fa-plus").classList.remove("fa-minus");
          otherItem.querySelector(".fa-plus").classList.add("fa-plus");
        }
      });

      // Toggle current item
      if (!isExpanded) {
        header.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
        icon.classList.remove("fa-plus");
        icon.classList.add("fa-minus");
      } else {
        header.setAttribute("aria-expanded", "false");
        panel.style.maxHeight = null;
        icon.classList.remove("fa-minus");
        icon.classList.add("fa-plus");
      }
    });
  });

  // تحديد جميع العناصر التي تحتوي على سمة data-aos
  const animatedElements = document.querySelectorAll("[data-aos]");

  animatedElements.forEach((element) => {
    // إضافة الصنف الأساسي للتحريك
    element.classList.add("aos-init");

    // تعيين تأخير مخصص (إذا كان موجوداً)
    if (element.dataset.aosDelay) {
      element.style.transitionDelay = `${element.dataset.aosDelay}ms`;
    }

    // تعيين مدة مخصصة (إذا كانت موجودة)
    if (element.dataset.aosDuration) {
      element.style.transitionDuration = `${element.dataset.aosDuration}ms`;
    }

    // بدء مراقبة العنصر
    animateOnScrollObserver.observe(element);
  });
});

function updateCountdown() {
  const countdownContainer = document.querySelector(".cta-timer");
  if (!countdownContainer) return;

  const targetDateStr = countdownContainer.getAttribute("data-countdown-date");
  if (!targetDateStr) return;

  let countDownDate = new Date(targetDateStr).getTime();
  const now = Date.now();
  let distance = countDownDate - now;

  // عدد الميلي ثانية في 4 أيام
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;

  // ✅ لما التايمر يخلص، نرجع نعد من جديد لمدة 4 أيام
  if (distance < 0) {
    const newDate = new Date(now + fourDaysMs);
    countdownContainer.setAttribute(
      "data-countdown-date",
      newDate.toISOString()
    );
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("days").innerHTML = days.toString().padStart(2, "0");
  document.getElementById("hours").innerHTML = hours
    .toString()
    .padStart(2, "0");
  document.getElementById("minutes").innerHTML = minutes
    .toString()
    .padStart(2, "0");

  if (days < 1) {
    document.querySelector(".countdown").classList.add("animate-pulse");
  }
}

// Back to Top Button Functionality
const backToTopButton = document.getElementById("backToTop");

function toggleBackToTopButton() {
  if (window.pageYOffset > 300) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

window.addEventListener("scroll", toggleBackToTopButton);
backToTopButton.addEventListener("click", scrollToTop);

window.addEventListener("load", () => {
  // Initialize countdown timer with a 4-day countdown
  const countdownContainer = document.querySelector(".cta-timer");
  if (
    countdownContainer &&
    !countdownContainer.getAttribute("data-countdown-date")
  ) {
    const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
    const targetDate = new Date(Date.now() + fourDaysMs);
    countdownContainer.setAttribute(
      "data-countdown-date",
      targetDate.toISOString()
    );
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
});

// Add hover effect to pricing cards
const pricingCards = document.querySelectorAll(".pricing-card");
pricingCards.forEach((card) => {
  const orderButton = card.querySelector(".order-now-btn");

  card.addEventListener("mouseenter", function (e) {
    // Do not trigger card hover effect if hovering over the button
    if (orderButton && e.target === orderButton) return;

    if (!this.classList.contains("featured")) {
      pricingCards.forEach((otherCard) => {
        if (!otherCard.classList.contains("featured")) {
          otherCard.style.transform = "scale(0.98)";
          otherCard.style.opacity = "0.9";
        }
      });
      this.style.transform = "translateY(-10px)";
      this.style.opacity = "1";
    }
  });

  card.addEventListener("mouseleave", function () {
    if (!this.classList.contains("featured")) {
      pricingCards.forEach((otherCard) => {
        if (!otherCard.classList.contains("featured")) {
          otherCard.style.transform = "scale(1)";
          otherCard.style.opacity = "1";
        }
      });
    }
  });
});

// FAQ Accordion
document.addEventListener("click", (e) => {
  const header = e.target.closest(".accordion-header");
  if (!header) return;

  const item = header.parentElement;
  const isActive = item.classList.contains("active");

  document
    .querySelectorAll(".accordion-item")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".accordion-header")
    .forEach((h) => h.setAttribute("aria-expanded", "false"));

  if (!isActive) {
    item.classList.add("active");
    header.setAttribute("aria-expanded", "true");
  }
});
