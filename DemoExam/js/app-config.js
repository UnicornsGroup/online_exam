/**
 * White-Label Portal Configuration Matrix
 * Centralize all dynamic branding and educational data to support simple rebranding.
 */
const appConfig = {
  // 1. Core Branding Metadata
  institutionName: "Demo Coaching Institute",
  shortName: "SEA",
  logoPath: "assets/logo/logo.png",
  fallbackLogoUrl: "https://via.placeholder.com/150?text=Academy+Logo",
  emailDomain: "portal.com", // results in SEA20260002@portal.com

  // 2. Official Contact Information (Injected automatically into printable Question Papers & Merit PDFs)
  contactDetails: {
    address: "262, Tirupati Rajnagar, Abu Highway, Palanpur, Gujarat – 385001",
    website: "www.surajenglishacademy.in",
    mobile: "+91 94273 92046",
    whatsapp: "+91 89801 90101"
  },

  // 3. Educational Standards Configuration Array
  standards: [
    "STD 08 (GM)",
    "STD 08 (EM)",
    "STD 09 (GM)",
    "STD 10 (GM)"
  ]
};

// Export to Global window object for system accessibility
window.appConfig = appConfig;


/**
 * Automatically applies brand configuration to active DOM elements on screen
 */
function applyPortalDynamicBranding() {
  const config = window.appConfig;
  if (!config) return;

  // A. Dynamically re-write page meta title tags
  if (document.title.includes("Suraj English Academy")) {
    document.title = document.title.replace("Suraj English Academy", config.institutionName);
  } else if (document.title.includes("SEA")) {
    document.title = document.title.replace("SEA", config.shortName);
  }

  // B. Branded Text Headers
  document.querySelectorAll('header span, h2, h1, p').forEach(el => {
    // Process text updates safely
    if (el.textContent.includes("Suraj English Academy")) {
      // Fixed: Converted broken text to a proper global Regular Expression
      el.textContent = el.textContent.replace(/Suraj English Academy/g, config.institutionName);
    }
    if (el.textContent.includes("SEA Admin")) {
      el.textContent = el.textContent.replace(/SEA Admin/g, `${config.shortName} Admin`);
    }
  });

  // C. Update Dynamic Input Placeholders (Like Adm. ID e.g., SEA20260002)
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    if (input.placeholder && input.placeholder.includes("SEA")) {
      // Fixed: Converted broken text to a proper global Regular Expression
      input.placeholder = input.placeholder.replace(/SEA/g, config.shortName);
    }
  });

  // D. Update Image Branding Asset URLs and Fail-Safe Placeholders
  const logoImages = document.querySelectorAll('img[alt="Logo"], img[alt="Coaching Logo"]');
  logoImages.forEach(img => {
    img.src = config.logoPath;
    img.onerror = () => {
      img.src = config.fallbackLogoUrl;
      // Prevent infinite loop if fallback image also fails
      img.onerror = null; 
    };
  });

  // E. Dynamically Build Class Standards Select Element Dropdowns
  const studStdSelect = document.getElementById('studStd');
  if (studStdSelect) {
    const defaultPlaceholderOption = studStdSelect.options[0];
    studStdSelect.innerHTML = '';
    if (defaultPlaceholderOption) {
      studStdSelect.appendChild(defaultPlaceholderOption);
    }
    config.standards.forEach(std => {
      const opt = document.createElement('option');
      opt.value = std;
      opt.textContent = std;
      studStdSelect.appendChild(opt);
    });
  }

  // F. Dynamically Build Create Exam Target Standards Checkboxes Group
  const standardsCheckboxGroup = document.getElementById('standardsCheckboxGroup');
  if (standardsCheckboxGroup) {
    standardsCheckboxGroup.innerHTML = '';
    config.standards.forEach(std => {
      const label = document.createElement('label');
      label.className = "flex items-center space-x-2.5 cursor-pointer";
      label.innerHTML = `
        <input type="checkbox" value="${std}" class="std-checkbox rounded text-blue-600 bg-gray-700 border-gray-600">
        <span>${std}</span>
      `;
      standardsCheckboxGroup.appendChild(label);
    });
  }
}

// Fire the branding engine as soon as elements are interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyPortalDynamicBranding);
} else {
  applyPortalDynamicBranding();
}