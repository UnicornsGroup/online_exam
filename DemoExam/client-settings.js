// =========================================================================
// 🎯 THE ONLY FILE YOU NEED TO CHANGE FOR A NEW WHITE-LABEL CLIENT!
// =========================================================================

const clientPortalSettings = {
    // 🏢 1. BRANDING & TEXT METRICS
    instituteName: "DEMO APP", // The name of the institute/brand using this portal
    taglineText: "ONLINE EXAM Portal",
    brandedLogoUrl: "assets/logo/logo.png", // Path to their logo file inside this folder
    emailDomainSuffix: "surajenglishacademy.in",
    
    // 🎨 2. THEME UTILITIES (Tailwind accent class configurations)
    accentColorClass: "blue-600",
    hoverColorClass: "blue-700",

    // 🔑 3. DEDICATED PRIVATE FIREBASE KEY CONFIGURATIONS
    firebaseConfig: {
        apiKey: "AIzaSyCmh1IgoP5OJaILVIEu98vHRDIDWM1ltMA",
    	authDomain: "demoexam-e6780.firebaseapp.com",
    	projectId: "demoexam-e6780",
   	storageBucket: "demoexam-e6780.firebasestorage.app",
    	messagingSenderId: "504643921191",
    	appId: "1:504643921191:web:045ca36481aa7c622cb502"
    }
};

// Bind parameters globally to system memory so all code windows read from this master config
window.clientPortalSettings = clientPortalSettings;
