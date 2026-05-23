/**
 * UNICORNS GROUP - Interactive Router State & Lead Framework
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // Core Application Page Tracking State
    const currentAppConfig = {
        activeTab: "home",
        menuIsOpen: false,
        simulatedLogs: [
            "WARNING: Tab focus change captured on Candidate #0402.",
            "INTERCEPT: External screen sharing app blocked on Candidate #112.",
            "SECURITY: Copy-paste shortcut command blocked successfully.",
            "SYSTEM: Continuous integrity check running... 0 leaks found."
        ]
    };

    // UI Nodes Selector Cache Map
    const elements = {
        menuToggle: document.getElementById("menuToggle"),
        navMenu: document.getElementById("navMenu"),
        navItems: document.querySelectorAll(".nav-item"),
        tabViews: document.querySelectorAll(".tab-content"),
        ctaRouters: document.querySelectorAll(".cta-router"),
        liveAlertLog: document.getElementById("liveAlertLog"),
        accordionCards: document.querySelectorAll(".accordion-card"),
        leadForm: document.getElementById("leadCaptureForm"),
        formFeedback: document.getElementById("formSuccessMessage")
    };

    // Client Page Switching Router Configuration
    const switchActiveViewTo = (targetId) => {
        if (!targetId) return;
        
        const cleanId = targetId.replace("#", "");
        const matchedSection = document.getElementById(cleanId);
        
        if (matchedSection) {
            // Hide all pages
            elements.tabViews.forEach(view => view.classList.remove("active"));
            
            // Show selected page
            matchedSection.classList.add("active");
            currentAppConfig.activeTab = cleanId;
            
            // Sync visible navigation highlights
            elements.navItems.forEach(item => {
                const routeAttr = item.getAttribute("data-page");
                item.classList.toggle("active", routeAttr === cleanId);
            });

            // Smooth scroll page view context back to absolute top
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Bootstrap click triggers for menus and quick setup button links
    const combinedRoutingNodes = [...elements.navItems, ...elements.ctaRouters];
    combinedRoutingNodes.forEach(trigger => {
        trigger.addEventListener("click", (e) => {
            const pageHandle = trigger.getAttribute("data-page");
            if (pageHandle) {
                e.preventDefault();
                window.location.hash = pageHandle;
                switchActiveViewTo(pageHandle);
                
                if (currentAppConfig.menuIsOpen) toggleMobileResponsiveMenu();
            }
        });
    });

    // Mobile Hamburger Toggle Mechanics
    const toggleMobileResponsiveMenu = () => {
        currentAppConfig.menuIsOpen = !currentAppConfig.menuIsOpen;
        elements.navMenu.classList.toggle("active", currentAppConfig.menuIsOpen);
        
        const structuralBars = elements.menuToggle.querySelectorAll("span");
        if (currentAppConfig.menuIsOpen) {
            structuralBars[0].style.transform = "rotate(45deg) translate(4px, 4px)";
            structuralBars[1].style.opacity = "0";
            structuralBars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
        } else {
            structuralBars[0].style.transform = "none";
            structuralBars[1].style.opacity = "1";
            structuralBars[2].style.transform = "none";
        }
    };

    elements.menuToggle?.addEventListener("click", toggleMobileResponsiveMenu);

    // FAQ Drawer Accordion Click Actions
    elements.accordionCards.forEach(card => {
        card.addEventListener("click", () => {
            const dynamicOpenState = card.classList.contains("active");
            elements.accordionCards.forEach(c => c.classList.remove("active"));
            if (!dynamicOpenState) card.classList.add("active");
        });
    });

    // Live Simulated Mock Terminal Log Interchanging Component
    const triggerTerminalMessageRotation = () => {
        setInterval(() => {
            if (elements.liveAlertLog) {
                elements.liveAlertLog.style.opacity = "0";
                setTimeout(() => {
                    const messageString = currentAppConfig.simulatedLogs[Math.floor(Math.random() * currentAppConfig.simulatedLogs.length)];
                    elements.liveAlertLog.innerHTML = `<span class="time">[10:16:01]</span> <span class="msg-danger">${messageString}</span>`;
                    elements.liveAlertLog.style.opacity = "1";
                }, 300);
            }
        }, 5000);
    };
    triggerTerminalMessageRotation();

    // Frontend Lead Submission Form Handling Setup
    elements.leadForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const actionBtn = elements.leadForm.querySelector("button[type='submit']");
        const fallbackText = actionBtn.textContent;
        
        actionBtn.disabled = true;
        actionBtn.textContent = "Setting Up Your Security Sandbox Environment...";
        
        // Emulating static security token assignment processing delays
        setTimeout(() => {
            actionBtn.textContent = "Sandbox Configured ✓";
            actionBtn.style.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
            
            if (elements.formFeedback) {
                elements.formFeedback.style.display = "block";
                elements.formFeedback.style.background = "rgba(16, 185, 129, 0.08)";
                elements.formFeedback.style.border = "1px solid rgba(16, 185, 129, 0.2)";
                elements.formFeedback.style.color = "#10B981";
                elements.formFeedback.innerHTML = `
                    <strong>Success! Your system evaluation copy is ready.</strong><br>
                    We have generated testing reference ID: <code>UNICORN-${Math.floor(100000 + Math.random() * 900000)}</code>.<br>
                    Check your email inbox shortly for authorization guides.
                `;
            }
            
            setTimeout(() => {
                elements.leadForm.reset();
                if (elements.formFeedback) elements.formFeedback.style.display = "none";
                actionBtn.disabled = false;
                actionBtn.textContent = fallbackText;
                actionBtn.style.background = "";
            }, 6000);
            
        }, 1500);
    });

    // Initial Launch Routine
    if (window.location.hash) {
        switchActiveViewTo(window.location.hash);
    } else {
        switchActiveViewTo("home");
    }
});