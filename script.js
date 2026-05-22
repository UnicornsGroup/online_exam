/**
 * UNICORNS GROUP - Core Application State & Client-Side Single Page Router Engine
 * Validated Implementation for GitHub Pages Deployments
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- State & Config Scope Registry ---
    const appState = {
        activeRoute: "home",
        mobileMenuOpen: false,
        terminalMessages: [
            "WARNING: Tab focus change captured on Candidate #0912.",
            "INTERCEPT: External display mirror mechanism terminated.",
            "SECURITY: Copy-paste attempt localized and expunged.",
            "AUDIT LOG: Key integrity checksum validation completed."
        ]
    };

    // --- Node Interface Map ---
    const nodes = {
        mobileToggle: document.getElementById("mobileToggle"),
        navMenu: document.getElementById("navMenu"),
        navLinks: document.querySelectorAll(".nav-link"),
        pageViews: document.querySelectorAll(".page-view"),
        routeTriggers: document.querySelectorAll(".route-cta-trigger"),
        simulatedLog: document.getElementById("simulatedLog"),
        faqItems: document.querySelectorAll(".faq-item"),
        leadForm: document.getElementById("staticLeadCaptureForm"),
        formFeedback: document.getElementById("formSubmissionFeedback")
    };

    // --- Absolute Client Router Core ---
    const executeClientNavigation = (targetRouteId) => {
        if (!targetRouteId) return;
        
        // Clean hash parameters from targetRouteId string
        const routeCleanId = targetRouteId.replace("#", "");
        const activeTargetSection = document.getElementById(routeCleanId);
        
        if (activeTargetSection) {
            // Drop visibility flags across all views
            nodes.pageViews.forEach(view => view.classList.remove("active"));
            
            // Activate selected system view target
            activeTargetSection.classList.add("active");
            appState.activeRoute = routeCleanId;
            
            // Sync visible navigation indicators
            nodes.navLinks.forEach(link => {
                const linkTarget = link.getAttribute("data-route");
                link.classList.toggle("active", linkTarget === routeCleanId);
            });

            // Smooth viewport layout resetting
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Wire up tracking links directly
    const registerNavigationListeners = () => {
        // Universal collector matching header links and floating structural CTAs
        const universalClickTargets = [...nodes.navLinks, ...nodes.routeTriggers];
        
        universalClickTargets.forEach(element => {
            element.addEventListener("click", (event) => {
                const targetRoute = event.currentTarget.getAttribute("data-route");
                if (targetRoute) {
                    event.preventDefault();
                    window.location.hash = targetRoute;
                    executeClientNavigation(targetRoute);
                    
                    if (appState.mobileMenuOpen) toggleMobileMenuInterface();
                }
            });
        });
    };

    // --- Mobile Interface Layout Toggle ---
    const toggleMobileMenuInterface = () => {
        appState.mobileMenuOpen = !appState.mobileMenuOpen;
        nodes.navMenu.classList.toggle("active", appState.mobileMenuOpen);
        
        const spanBars = nodes.mobileToggle.querySelectorAll("span");
        if (appState.mobileMenuOpen) {
            spanBars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
            spanBars[1].style.opacity = "0";
            spanBars[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
        } else {
            spanBars[0].style.transform = "none";
            spanBars[1].style.opacity = "1";
            spanBars[2].style.transform = "none";
        }
    };

    nodes.mobileToggle?.addEventListener("click", toggleMobileMenuInterface);

    // --- FAQ Presentation Interactivity Component ---
    nodes.faqItems.forEach(item => {
        item.addEventListener("click", () => {
            const isExpanded = item.classList.contains("expanded-state");
            nodes.faqItems.forEach(el => el.classList.remove("expanded-state"));
            if (!isExpanded) item.classList.add("expanded-state");
        });
    });

    // --- Simulated Micro-Terminal Log Cycle ---
    const startTerminalRotation = () => {
        setInterval(() => {
            if (nodes.simulatedLog) {
                nodes.simulatedLog.style.opacity = "0";
                setTimeout(() => {
                    const dynamicPhrase = appState.terminalMessages[Math.floor(Math.random() * appState.terminalMessages.length)];
                    nodes.simulatedLog.innerHTML = `<span class="c-dim">[17:41:32]</span> <span class="c-red">${dynamicPhrase}</span>`;
                    nodes.simulatedLog.style.opacity = "1";
                }, 300);
            }
        }, 5000);
    };

    // --- Frontend Lead Processing Sandbox ---
    nodes.leadForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const executionButton = nodes.leadForm.querySelector("button[type='submit']");
        const fallbackText = executionButton.textContent;
        
        executionButton.disabled = true;
        executionButton.textContent = "Connecting to Evaluation Enclave Matrix...";
        
        setTimeout(() => {
            executionButton.textContent = "Secure Sandbox Ready ✓";
            executionButton.style.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
            
            if (nodes.formFeedback) {
                nodes.formFeedback.style.display = "block";
                nodes.formFeedback.style.background = "rgba(16, 185, 129, 0.08)";
                nodes.formFeedback.style.border = "1px solid rgba(16, 185, 129, 0.2)";
                nodes.formFeedback.style.color = "#10B981";
                nodes.formFeedback.innerHTML = `
                    <strong>Secure Instance Ready for Ingestion!</strong><br>
                    Generated Instance Authorization Handle: <code>UCG-${Math.floor(100000 + Math.random() * 900000)}</code>.<br>
                    Our core engineers will reach out to you within 2 business hours.
                `;
            }
            
            setTimeout(() => {
                nodes.leadForm.reset();
                if (nodes.formFeedback) nodes.formFeedback.style.display = "none";
                executionButton.disabled = false;
                executionButton.textContent = fallbackText;
                executionButton.style.background = "";
            }, 7000);
            
        }, 1200);
    });

    // --- Init Bootstrap Routine ---
    const initializeApplicationRouter = () => {
        registerNavigationListeners();
        startTerminalRotation();
        
        // Read hash path values if page triggers deep-links
        if (window.location.hash) {
            executeClientNavigation(window.location.hash);
        } else {
            executeClientNavigation("home");
        }
    };

    initializeApplicationRouter();
});