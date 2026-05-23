/**
 * UNICORNS GROUP - Multi-Product Navigation Hub Router State Engine
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // Core Application Configuration Registry
    const appState = {
        activeTab: "home",
        menuIsOpen: false,
        terminalMessages: [
            "WARNING: Tab focus change captured on Candidate #0402.",
            "INTERCEPT: External screen sharing app blocked on Candidate #112.",
            "SECURITY: Copy-paste shortcut command blocked successfully.",
            "ENVIRONMENT: Continuous integrity check active... 0 leaks found."
        ]
    };

    // UI Document Node Element Selection Mappings
    const ui = {
        menuToggle: document.getElementById("menuToggle"),
        navMenu: document.getElementById("navMenu"),
        navItems: document.querySelectorAll(".nav-item:not(.dropdown-trigger)"),
        dropdownLinks: document.querySelectorAll(".dropdown-link-item:not(.upcoming-item)"),
        tabViews: document.querySelectorAll(".tab-content"),
        ctaRouters: document.querySelectorAll(".cta-router"),
        liveAlertLog: document.getElementById("liveAlertLog"),
        accordionCards: document.querySelectorAll(".accordion-card"),
        leadForm: document.getElementById("leadCaptureForm"),
        selectedProductInput: document.getElementById("selectedProductModule"),
        formFeedback: document.getElementById("formSuccessMessage")
    };

    // Master View Switcher Function
    const executeTabRouting = (targetId) => {
        if (!targetId) return;
        
        const cleanId = targetId.replace("#", "");
        const targetViewElement = document.getElementById(cleanId);
        
        if (targetViewElement) {
            // Drop visibility flags across all page view nodes
            ui.tabViews.forEach(view => view.classList.remove("active"));
            
            // Activate selected system view target
            targetViewElement.add ? targetViewElement.add("active") : targetViewElement.classList.add("active");
            appState.activeTab = cleanId;
            
            // Sync visible navigation text links highlights
            ui.navItems.forEach(item => {
                const pageAttr = item.getAttribute("data-page");
                item.classList.toggle("active", pageAttr === cleanId);
            });

            // Smooth scroll viewport window layout context back to absolute top
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Bootstrap collective click triggers mapping router links
    const operationalLinks = [...ui.navItems, ...ui.dropdownLinks, ...ui.ctaRouters];
    operationalLinks.forEach(trigger => {
        trigger.addEventListener("click", (e) => {
            const destinationPage = trigger.getAttribute("data-page");
            if (destinationPage) {
                e.preventDefault();
                window.location.hash = destinationPage;
                executeTabRouting(destinationPage);
                
                // Context Capture Strategy: If click contains product tags, sync it to the form
                const attachedProduct = trigger.getAttribute("data-product");
                if (attachedProduct && ui.selectedProductInput) {
                    ui.selectedProductInput.value = attachedProduct;
                }
                
                // Collapse mobile dropdown layouts if open
                if (appState.menuIsOpen) toggleMobileResponsiveNavbar();
            }
        });
    });

    // Mobile Navigation Controls
    const toggleMobileResponsiveNavbar = () => {
        appState.menuIsOpen = !appState.menuIsOpen;
        ui.navMenu.classList.toggle("active", appState.menuIsOpen);
        
        const spans = ui.menuToggle.querySelectorAll("span");
        if (appState.menuIsOpen) {
            spans[0].style.transform = "rotate(45deg) translate(4px, 4px)";
            spans[1].style.opacity = "0";
            spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
        } else {
            spans[0].style.transform = "none";
            spans[1].style.opacity = "1";
            spans[2].style.transform = "none";
        }
    };

    ui.menuToggle?.addEventListener("click", toggleMobileResponsiveNavbar);

    // Dynamic FAQ Accordion Click Operations
    ui.accordionCards.forEach(card => {
        card.addEventListener("click", () => {
            const isOpen = card.classList.contains("active");
            ui.accordionCards.forEach(c => c.classList.remove("active"));
            if (!isOpen) card.classList.add("active");
        });
    });

    // Live Simulated Threat Logs Rotation
    const initializeTerminalLoop = () => {
        setInterval(() => {
            if (ui.liveAlertLog) {
                ui.liveAlertLog.style.opacity = "0";
                setTimeout(() => {
                    const freshLog = appState.terminalMessages[Math.floor(Math.random() * appState.terminalMessages.length)];
                    ui.liveAlertLog.innerHTML = `<span class="time">[11:03:01]</span> <span class="msg-danger">${freshLog}</span>`;
                    ui.liveAlertLog.style.opacity = "1";
                }, 300);
            }
        }, 5000);
    };
    initializeTerminalLoop();

    // Frontend Conversion Intake Action Handling
    ui.leadForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const currentSubmitBtn = ui.leadForm.querySelector("button[type='submit']");
        const baseButtonLabel = currentSubmitBtn.textContent;
        
        currentSubmitBtn.disabled = true;
        currentSubmitBtn.textContent = "Allocating Sandbox Architecture Instance...";
        
        setTimeout(() => {
            currentSubmitBtn.textContent = "Evaluation Space Provisioned ✓";
            currentSubmitBtn.style.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
            
            if (ui.formFeedback) {
                ui.formFeedback.style.display = "block";
                ui.formFeedback.style.background = "rgba(16, 185, 129, 0.08)";
                ui.formFeedback.style.border = "1px solid rgba(16, 185, 129, 0.2)";
                ui.formFeedback.style.color = "#10B981";
                ui.formFeedback.innerHTML = `
                    <strong>Request Captured Successfully!</strong><br>
                    Generated Pilot Token: <code>UNICORN-SECURE-${Math.floor(100000 + Math.random() * 900000)}</code>.<br>
                    An enterprise solution expert will contact your department shortly via email.
                `;
            }
            
            setTimeout(() => {
                ui.leadForm.reset();
                if (ui.formFeedback) ui.formFeedback.style.display = "none";
                currentSubmitBtn.disabled = false;
                currentSubmitBtn.textContent = baseButtonLabel;
                currentSubmitBtn.style.background = "";
                // Reset standard readout default field value parameters
                if(ui.selectedProductInput) ui.selectedProductInput.value = "Secure Anti-Cheating Exam System";
            }, 7000);
            
        }, 1500);
    });

    // Hash Deep-Linking Initial Router Check Validation Checks
    if (window.location.hash) {
        executeTabRouting(window.location.hash);
    } else {
        executeTabRouting("home");
    }
});