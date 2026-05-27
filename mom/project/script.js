const { jsPDF } = window.jspdf;

const dayNamesGujarati = ["રવિવાર", "સોમવાર", "મંગળવાર", "બુધવાર", "ગુરુવાર", "શુક્રવાર", "શનિવાર"];

// 1. Core State Elements
let calculatedWorkingDays = []; 
let currentStep = 0;            
let formData = {};              
let selectedMonthValue = "";    

// Screen Elements Context Bindings
let screens = {}, nextBtn, prevBtn, stepCounter, stepPercentage, progressBar, questionCard, reviewContainer, resetBtn;

function bindDOMElements() {
    screens = {
        welcome: document.getElementById('screen-1'),
        wizard: document.getElementById('screen-2'),
        review: document.getElementById('screen-3'),
        pdf: document.getElementById('screen-4')
    };
    nextBtn = document.getElementById('next-btn');
    prevBtn = document.getElementById('prev-btn');
    stepCounter = document.getElementById('step-counter');
    stepPercentage = document.getElementById('step-percentage');
    progressBar = document.getElementById('progress-bar');
    questionCard = document.getElementById('question-card');
    reviewContainer = document.getElementById('review-container');
    resetBtn = document.getElementById('reset-btn');
}

// 2. Global Toast Message Engine
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-2xl shadow-xl text-xs font-semibold text-white transform translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto flex items-center gap-2 ${
        type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-indigo-600'
    }`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> <p class="font-gujarati">${message}</p>`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-2', 'opacity-0'); }, 40);
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// 3. Automated Month Generation Logic Block (SKIPS SUNDAYS)
function generateWorkingDaysList(monthString) {
    const [year, month] = monthString.split('-').map(Number);
    const dateCursor = new Date(year, month - 1, 1);
    const daysList = [];

    while (dateCursor.getMonth() === month - 1) {
        const dayOfWeekIndex = dateCursor.getDay();
        
        // Skip Sunday completely (0 = Sunday)
        if (dayOfWeekIndex !== 0) {
            const dayFormatted = String(dateCursor.getDate()).padStart(2, '0');
            const monthFormatted = String(dateCursor.getMonth() + 1).padStart(2, '0');
            const fullDateStr = `${dayFormatted}-${monthFormatted}-${dateCursor.getFullYear()}`;
            
            daysList.push({
                dateStr: fullDateStr,
                dayName: dayNamesGujarati[dayOfWeekIndex]
            });
        }
        dateCursor.setDate(dateCursor.getDate() + 1);
    }
    return daysList;
}

// 4. Router Screen Switchboard Engine Layout Control
function switchScreen(target) {
    Object.values(screens).forEach(s => {
        if (s) {
            s.classList.add('hidden');
            s.style.setProperty('display', 'none', 'important');
        }
    });
    
    if (target) {
        target.classList.remove('hidden');
        if (target === screens.welcome) {
            target.style.setProperty('display', 'flex', 'important');
        } else {
            target.style.setProperty('display', 'block', 'important');
        }
    }
    
    if (resetBtn) {
        if (target !== screens.welcome) resetBtn.classList.remove('hidden');
        else resetBtn.classList.add('hidden');
    }
}

// 5. Day Wizard Form Step Drawing Engine
function renderWizardStep() {
    if (calculatedWorkingDays.length === 0) return;
    
    const currentDayObj = calculatedWorkingDays[currentStep];
    const stepCountTotal = calculatedWorkingDays.length;
    const progressPct = Math.round((currentStep / stepCountTotal) * 100);
    
    if (stepCounter) stepCounter.textContent = `દિવસો પ્રગતિ: ${currentStep + 1} / ${stepCountTotal}`;
    if (stepPercentage) stepPercentage.textContent = `${progressPct}%`;
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    const activeDateEl = document.getElementById('wizard-active-date');
    const activeDayEl = document.getElementById('wizard-active-day');
    if (activeDateEl) activeDateEl.textContent = currentDayObj.dateStr;
    if (activeDayEl) activeDayEl.textContent = currentDayObj.dayName;

    const savedDayData = formData[currentDayObj.dateStr] || {};
    
    const initialMatrix = {
        "સિંગ": { "આવક": "", "વપરાશ": "", "બાકી": "" },
        "તલ": { "આવક": "", "વપરાશ": "", "બાકી": "" },
        "મરચું": { "આવક": "", "વપરાશ": "", "બાકી": "" },
        "હળદર": { "આવક": "", "વપરાશ": "", "બાકી": "" },
        "રાય": { "આવક": "", "વપરાશ": "", "બાકી": "" }
    };

    const activeStateMatrix = savedDayData.inventory_table || initialMatrix;

    let rowsHtml = Object.keys(initialMatrix).map(itemKey => {
        return `
            <tr class="grid-data-row border-b border-slate-200 dark:border-slate-700 text-center" data-item="${itemKey}">
                <td class="p-2.5 text-left font-semibold font-gujarati text-xs bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white">${itemKey}</td>
                <td class="p-1"><input type="number" data-sub="આવક" value="${activeStateMatrix[itemKey]?.["આવક"] || ''}" placeholder="0" class="w-full p-1.5 text-xs text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"></td>
                <td class="p-1"><input type="number" data-sub="વપરાશ" value="${activeStateMatrix[itemKey]?.["વપરાશ"] || ''}" placeholder="0" class="w-full p-1.5 text-xs text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"></td>
                <td class="p-1"><input type="number" data-sub="બાકી" value="${activeStateMatrix[itemKey]?.["બાકી"] || ''}" placeholder="0" class="w-full p-1.5 text-xs text-center bg-transparent border border-amber-300 dark:border-amber-900 text-amber-600 font-bold rounded-md"></td>
            </tr>
        `;
    }).join('');

    if (questionCard) {
        questionCard.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold font-gujarati mb-1 text-slate-500">લાભાર્થીઓની સંખ્યા *</label>
                    <input type="number" id="wizard-beneficiary" value="${savedDayData.beneficiary_count || ''}" placeholder="દા.ત. ૧૨૦" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-sans text-sm text-slate-900 dark:text-white">
                </div>
                <div>
                    <label class="block text-xs font-bold font-gujarati mb-1 text-slate-500">વાનગીનું નામ (મરજીયાત)</label>
                    <input type="text" id="wizard-dish" value="${savedDayData.dish_name || ''}" placeholder="દા.ત. ખીચડી (જો હોય તો)" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-gujarati text-sm text-slate-900 dark:text-white">
                </div>
            </div>

            <div class="space-y-1">
                <label class="block text-xs font-bold font-gujarati text-slate-500">ગોળ-મસાલા આવક-વપરાશ અને બાકી સ્ટોક વિગત *</label>
                <div class="overflow-x-auto w-full border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
                    <table class="w-full text-left border-collapse min-w-[320px]">
                        <thead>
                            <tr class="bg-slate-100 dark:bg-slate-900 text-[11px] font-bold border-b border-slate-200 dark:border-slate-700 text-center">
                                <th class="p-2 text-left font-gujarati text-slate-700 dark:text-slate-300">મસાલા નામ</th>
                                <th class="p-2 font-gujarati text-emerald-600">આવક</th>
                                <th class="p-2 font-gujarati text-indigo-600">વપરાશ</th>
                                <th class="p-2 font-gujarati text-red-500">બાકી</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    if (prevBtn) prevBtn.disabled = currentStep === 0;
    if (nextBtn) nextBtn.textContent = currentStep === stepCountTotal - 1 ? "માસિક સમરી ચકાસો 🔍" : "આગળનો દિવસ";
}

// 6. Day Step Data State Capture
function captureStepInputValues() {
    if (calculatedWorkingDays.length === 0) return;
    const currentDayObj = calculatedWorkingDays[currentStep];
    
    const benEl = document.getElementById('wizard-beneficiary');
    const dishEl = document.getElementById('wizard-dish');
    const benCount = benEl ? benEl.value.trim() : "";
    const dishName = dishEl ? dishEl.value.trim() : "";

    const rowElements = document.querySelectorAll('.grid-data-row');
    const tableMatrix = {};
    rowElements.forEach(row => {
        const itemKey = row.getAttribute('data-item');
        tableMatrix[itemKey] = {
            "આવક": row.querySelector('[data-sub="આવક"]').value.trim(),
            "વપરાશ": row.querySelector('[data-sub="વપરાશ"]').value.trim(),
            "બાકી": row.querySelector('[data-sub="બાકી"]').value.trim()
        };
    });

    formData[currentDayObj.dateStr] = {
        beneficiary_count: benCount,
        dish_name: dishName,
        inventory_table: tableMatrix
    };
}

// CRITICAL UPDATE: "વાનગીનું નામ" is now completely optional
function validateStepConstraints() {
    const benEl = document.getElementById('wizard-beneficiary');
    const benCount = benEl ? benEl.value.trim() : "";

    if (!benCount) {
        showToast("કૃપા કરીને આ દિવસ માટે લાભાર્થી સંખ્યા ભરો.", "error");
        return false;
    }
    return true;
}

// 7. Monthly Summary Compiler Panel Layout
function compileReviewFeed() {
    if (!reviewContainer) return;
    reviewContainer.innerHTML = '';
    calculatedWorkingDays.forEach((day, idx) => {
        const value = formData[day.dateStr] || {};
        
        let inventoryBreakdownSnippet = '';
        if (value.inventory_table) {
            inventoryBreakdownSnippet = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 text-[11px]">
                ${Object.keys(value.inventory_table).map(k => `
                    <div class="p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                        <span class="font-bold text-indigo-600 font-gujarati block border-b border-slate-50 dark:border-slate-800 mb-0.5">${k}</span>
                        આ:<b>${value.inventory_table[k]["આવક"] || 0}</b> વ:<b>${value.inventory_table[k]["વપરાશ"] || 0}</b> <span class="text-red-500 font-bold">બ:<b>${value.inventory_table[k]["બાકી"] || 0}</b></span>
                    </div>
                `).join('')}
            </div>`;
        }

        const componentRow = document.createElement('div');
        componentRow.className = "p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl";
        componentRow.innerHTML = `
            <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/60 pb-1.5 mb-1.5">
                <span class="text-xs font-bold font-sans text-slate-500">${day.dateStr} (${day.dayName})</span>
                <button type="button" class="text-xs font-bold text-indigo-600 hover:underline cursor-pointer quick-edit-action" data-target-step="${idx}">ડેટા સુધારો</button>
            </div>
            <div class="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
                <p class="font-gujarati">લાભાર્થી સંખ્યા: <b class="font-sans">${value.beneficiary_count || 0}</b> | વાનગી: <b>${value.dish_name || '<span class="text-slate-400 italic">ખાલી છોડેલ</span>'}</b></p>
                ${inventoryBreakdownSnippet}
            </div>
        `;
        reviewContainer.appendChild(componentRow);
    });

    reviewContainer.querySelectorAll('.quick-edit-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            currentStep = parseInt(e.target.getAttribute('data-target-step'), 10);
            switchScreen(screens.wizard);
            renderWizardStep();
        });
    });
}

// 8. Multi-Page Monthly Printable Document Compilation
function buildDocumentPreviewDOM() {
    const tableContainerBody = document.getElementById('pdf-table-dynamic-rows');
    if (!tableContainerBody) return;
    tableContainerBody.innerHTML = '';

    const labelEl = document.getElementById('pdf-month-header-label');
    // if (labelEl) labelEl.textContent = `માસિક રિપોર્ટ પત્રક સમયગાળો: ${selectedMonthValue} `;

    calculatedWorkingDays.forEach((day, index) => {
        const dayData = formData[day.dateStr] || {};
        const matrix = dayData.inventory_table || {};

        const tableRowElement = document.createElement('tr');
        tableRowElement.className = "border-b border-black text-center font-bold text-[10px] bg-white";
        
        tableRowElement.innerHTML = `
            <td class="border-r border-black p-1.5 font-sans font-normal">${index + 1}</td>
            <td class="border-r border-black p-1.5 text-[10px]">${day.dayName}</td>
            <td class="border-r border-black p-1.5 font-sans font-normal">${day.dateStr}</td>
            <td class="border-r border-black p-1.5 font-sans font-normal">${dayData.beneficiary_count || '0'}</td>
            <td class="border-r border-black p-1.5 text-[10px] font-normal">${dayData.dish_name || '-'}</td>
            
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["સિંગ"]?.["આવક"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["સિંગ"]?.["વપરાશ"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans text-red-600">${matrix["સિંગ"]?.["બાકી"] || '0'}</td>
            
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["તલ"]?.["આવક"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["તલ"]?.["વપરાશ"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans text-red-600">${matrix["તલ"]?.["બાકી"] || '0'}</td>
            
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["મરચું"]?.["આવક"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["મરચું"]?.["વપરાશ"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans text-red-600">${matrix["મરચું"]?.["બાકી"] || '0'}</td>
            
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["હળદર"]?.["આવક"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["હળદર"]?.["વપરાશ"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans text-red-600">${matrix["હળદર"]?.["બાકી"] || '0'}</td>
            
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["રાય"]?.["આવક"] || '0'}</td>
            <td class="border-r border-black p-1 font-sans font-normal">${matrix["રાય"]?.["વપરાશ"] || '0'}</td>
            <td class="border border-black p-1 font-sans text-red-600">${matrix["રાય"]?.["બાકી"] || '0'}</td>
        `;
        
        tableContainerBody.appendChild(tableRowElement);
    });

    const stampEl = document.getElementById('pdf-timestamp');
    if (stampEl) stampEl.textContent = new Date().toLocaleString('gu-IN');
    
    document.getElementById('pdf-render-template').classList.remove('hidden');
    document.getElementById('preview-placeholder').classList.add('hidden');
    
    document.getElementById('pdf-status-title').textContent = "આખા મહિનાનું રિપોર્ટ પત્રક તૈયાર છે!";
    document.getElementById('pdf-loading-icon').textContent = "🎉";
    document.getElementById('pdf-actions').classList.remove('hidden');
}

// 9. Cache Hard Reset Routine
function hardClearApplicationCache(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('monthly_masala_target_month');
    localStorage.removeItem('monthly_masala_form_cache');
    localStorage.removeItem('monthly_masala_step_index');
    formData = {};
    calculatedWorkingDays = [];
    currentStep = 0;
    selectedMonthValue = "";
    const banner = document.getElementById('resume-banner');
    if (banner) banner.classList.add('hidden');
    switchScreen(screens.welcome);
    showToast("માસિક ડેટા ક્લીયર કરી રીસેટ કરવામાં આવ્યું છે.", "info");
}

// 10. Register explicit interactive logic links (Safely inside initialization context)
function attachEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    document.getElementById('start-btn').addEventListener('click', (e) => {
        e.preventDefault();
        
        const monthInputEl = document.getElementById('target-month-picker');
        let monthInput = monthInputEl ? monthInputEl.value : "";
        
        if (!monthInput) {
            const now = new Date();
            monthInput = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (monthInputEl) monthInputEl.value = monthInput;
        }

        if (monthInput !== selectedMonthValue || calculatedWorkingDays.length === 0) {
            selectedMonthValue = monthInput;
            formData = {};
            currentStep = 0;
            calculatedWorkingDays = generateWorkingDaysList(selectedMonthValue);
            localStorage.setItem('monthly_masala_target_month', selectedMonthValue);
            localStorage.setItem('monthly_masala_form_cache', JSON.stringify(formData));
            localStorage.setItem('monthly_masala_step_index', '0');
        }

        if (calculatedWorkingDays.length === 0) {
            showToast("પસંદ કરેલા મહિનામાં કોઈ કામકાજના દિવસો મળ્યા નથી.", "error");
            return;
        }

        switchScreen(screens.wizard);
        renderWizardStep();
    });

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep > 0) {
            captureStepInputValues();
            currentStep--;
            renderWizardStep();
        }
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validateStepConstraints()) {
            captureStepInputValues();
            if (currentStep < calculatedWorkingDays.length - 1) {
                currentStep++;
                renderWizardStep();
            } else {
                compileReviewFeed();
                switchScreen(screens.review);
            }
            localStorage.setItem('monthly_masala_form_cache', JSON.stringify(formData));
            localStorage.setItem('monthly_masala_step_index', currentStep.toString());
        }
    });

    document.getElementById('back-to-wizard-btn').addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen(screens.wizard);
        renderWizardStep();
    });

    document.getElementById('generate-pdf-btn').addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen(screens.pdf);
        document.getElementById('pdf-actions').classList.add('hidden');
        document.getElementById('preview-placeholder').classList.remove('hidden');
        document.getElementById('pdf-render-template').classList.add('hidden');
        
        setTimeout(() => { buildDocumentPreviewDOM(); }, 450);
    });

    document.getElementById('download-pdf-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const docLayoutDom = document.getElementById('pdf-render-template');
        showToast("આખા મહિનાની પીડીએફ કન્વર્ઝન પ્રક્રિયા સક્રિય છે...", "info");

        try {
            const computedCanvas = await html2canvas(docLayoutDom, {
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imageBinaryPayload = computedCanvas.toDataURL('image/jpeg', 1.0);
            const exportPdfInstance = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            const outputWidthMetric = 297; 
            const maxPageHeightLimit = 210; 
            const outputHeightMetric = (computedCanvas.height * outputWidthMetric) / computedCanvas.width;
            
            let remainingPayloadHeight = outputHeightMetric;
            let runningYPositionOffset = 0;

            exportPdfInstance.addImage(imageBinaryPayload, 'JPEG', 0, runningYPositionOffset, outputWidthMetric, outputHeightMetric, undefined, 'FAST');
            remainingPayloadHeight -= maxPageHeightLimit;

            while (remainingPayloadHeight >= 0) {
                runningYPositionOffset = remainingPayloadHeight - outputHeightMetric;
                exportPdfInstance.addPage();
                exportPdfInstance.addImage(imageBinaryPayload, 'JPEG', 0, runningYPositionOffset, outputWidthMetric, outputHeightMetric, undefined, 'FAST');
                remainingPayloadHeight -= maxPageHeightLimit;
            }

            exportPdfInstance.save(`Masala_Vaprash_Patrak_${selectedMonthValue}.pdf`);
            showToast("માસિક પત્રક ફાઇલ ડાઉનલોડ થઈ ગઈ છે.", "success");
        } catch (err) {
            console.error(err);
            showToast("પીડીએફ ડાઉનલોડ પ્રક્રિયામાં ક્ષતિ આવી.", "error");
        }
    });

    if (resetBtn) resetBtn.addEventListener('click', hardClearApplicationCache);
    const restartBtn = document.getElementById('restart-app-btn');
    if (restartBtn) restartBtn.addEventListener('click', hardClearApplicationCache);
}

// 11. App LifeCycle Initialization
function initApp() {
    bindDOMElements();
    
    // Set default month selector to present month automatically
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthInput = document.getElementById('target-month-picker');
    if (monthInput) monthInput.value = currentMonthStr;

    // LocalStorage Persistent Hydration Cache Sync Layer Check
    const cachedMonth = localStorage.getItem('monthly_masala_target_month');
    const cachedData = localStorage.getItem('monthly_masala_form_cache');
    const cachedStep = localStorage.getItem('monthly_masala_step_index');

    if (cachedMonth && cachedData) {
        selectedMonthValue = cachedMonth;
        formData = JSON.parse(cachedData);
        calculatedWorkingDays = generateWorkingDaysList(selectedMonthValue);
        if (monthInput) monthInput.value = selectedMonthValue;

        if (cachedStep !== null) {
            currentStep = parseInt(cachedStep, 10);
            const banner = document.getElementById('resume-banner');
            if (banner) banner.classList.remove('hidden');
        }
    }

    attachEventListeners();
}

// DOM Initialization trigger
window.addEventListener('DOMContentLoaded', initApp);