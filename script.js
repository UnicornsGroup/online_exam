/**
 * UNICORNS GROUP - Multi-Product Roadmap Routing Engine
 */

document.addEventListener("DOMContentLoaded", () => {
    
    const hubConfig = {
        activeTab: "home",
        menuIsOpen: false,
        simulatedLogs: [
            "WARNING: Tab focus change captured on Candidate #0402.",
            "INTERCEPT: External screen sharing app blocked on Candidate #112.",
            "SECURITY: Copy-paste shortcut command blocked successfully."
        ]
    };

    const elements = {
        menuToggle: document.getElementById("menuToggle"),
        navMenu: document.getElementById("navMenu"),
        navItems: document.querySelectorAll(".nav-item:not(.dropdown-trigger)"),
        dropdownLinks: document.querySelectorAll(".dropdown-link-item:not(.upcoming-item)"),
        tabViews: document.querySelectorAll(".tab-content"),
        ctaRouters: document.querySelectorAll(".cta-router"),
        liveAlertLog: document.getElementById("liveAlertLog"),
        leadForm: document.getElementById("leadCaptureForm"),
        formFeedback: document.getElementById("formSuccessMessage")
    };

    const runEcosystemNavigation = (targetId) => {
        if (!targetId) return;
        
        const cleanId = targetId.replace("#", "");
        const matchedSection = document.getElementById(cleanId);
        
        if (matchedSection) {
            elements.tabViews.forEach(view => view.classList.remove("active"));
            matchedSection.classList.add("active");
            hubConfig.activeTab = cleanId;
            
            // Highlight matching nav elements if applicable
            elements.navItems.forEach(item => {
                const pageAttr = item.getAttribute("data-page");
                item.classList.toggle("active", pageAttr === cleanId);
            });

            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Compile collective action array node hooks
    const interactiveClickNodes = [...elements.navItems, ...elements.dropdownLinks, ...elements.ctaRouters];
    interactiveClickNodes.forEach(trigger => {
        trigger.addEventListener("click", (e) => {
            const pageHandle = trigger.getAttribute("data-page");
            if (pageHandle) {
                e.preventDefault();
                window.location.hash = pageHandle;
                runEcosystemNavigation(pageHandle);
                
                if (hubConfig.menuIsOpen) toggleMobileMenu();
            }
        });
    });

    const toggleMobileMenu = () => {
        hubConfig.menuIsOpen = !hubConfig.menuIsOpen;
        elements.navMenu.classList.toggle("active", hubConfig.menuIsOpen);
        
        const structuralBars = elements.menuToggle.querySelectorAll("span");
        if (hubConfig.menuIsOpen) {
            structuralBars[0].style.transform = "rotate(45deg) translate(4px, 4px)";
            structuralBars[1].style.opacity = "0";
            structuralBars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
        } else {
            structuralBars[0].style.transform = "none";
            structuralBars[1].style.opacity = "1";
            structuralBars[2].style.transform = "none";
        }
    };

    elements.menuToggle?.addEventListener("click", toggleMobileMenu);

    // Form pipeline capture
    elements.leadForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const actionBtn = elements.leadForm.querySelector("button[type='submit']");
        actionBtn.disabled = true;
        actionBtn.textContent = "Processing Module Evaluation Allocation Request...";
        
        setTimeout(() => {
            actionBtn.textContent = "Consultation Ticket Created ✓";
            if (elements.formFeedback) {
                elements.formFeedback.style.display = "block";
                elements.formFeedback.innerHTML = `
                    <strong>Ecosystem Routing Successful!</strong><br>
                    Our technical product management division has generated system request code: <code>MODULE-${Math.floor(100000 + Math.random() * 900000)}</code>.
                `;
            }
        }, 1200);
    });

    if (window.location.hash) {
        runEcosystemNavigation(window.location.hash);
    } else {
        runEcosystemNavigation("home");
    }
});