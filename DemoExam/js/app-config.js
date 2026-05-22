/**
 * White-Label Portal Configuration Matrix
 */
const appConfig = {
  institutionName: "Dummy Institution Name",
  shortName: "SEA",
  logoPath: "assets/logo/logo.png",
  fallbackLogoUrl: "https://via.placeholder.com/150?text=Academy+Logo",
  emailDomain: "portal.com",

  contactDetails: {
    address: "262, Tirupati Rajnagar, Abu Highway, Palanpur, Gujarat – 385001",
    website: "www.surajenglishacademy.in",
    mobile: "+91 94273 92046",
    whatsapp: "+91 89801 90101"
  },

  standards: [
    "STD 08 (GM)",
    "STD 08 (EM)",
    "STD 09 (GM)",
    "STD 10 (GM)"
  ]
};

window.appConfig = appConfig;

function applyPortalDynamicBranding() {
  const config = window.appConfig;
  if (!config) return;

  // A. Dynamically rewrite page meta title tags based on attributes
  const titleEl = document.querySelector('title');
  if (titleEl) {
    if (titleEl.getAttribute('data-brand') === 'full') {
      titleEl.textContent = `${config.institutionName} - Assessment Portal`;
    } else {
      titleEl.textContent = `${config.shortName} - Terminal`;
    }
  }

  // B. Branded Text Headers & Elements using data attributes
  document.querySelectorAll('[data-brand="institution"]').forEach(el => {
    el.textContent = config.institutionName;
  });

  document.querySelectorAll('[data-brand="short"]').forEach(el => {
    el.textContent = config.shortName;
  });
  
  document.querySelectorAll('[data-brand="admin"]').forEach(el => {
    el.textContent = `${config.shortName} Admin`;
  });

  // C. Update Dynamic Input Placeholders safely
  document.querySelectorAll('input[data-brand-placeholder="admission"]').forEach(input => {
    input.placeholder = `e.g., ${config.shortName}20260002`;
  });

  // D. Update Image Branding Asset URLs safely
  document.querySelectorAll('img[data-brand="logo"]').forEach(img => {
    img.src = config.logoPath;
    img.onerror = () => {
      img.src = config.fallbackLogoUrl;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyPortalDynamicBranding);
} else {
  applyPortalDynamicBranding();
}