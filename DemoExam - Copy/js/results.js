window.addEventListener('DOMContentLoaded', () => {
    let globalActiveProfilePayload = null;
    let finalExtractedDataResult = null;
    let currentlyActiveTabType = 'CORRECT'; // Tracks state: CORRECT, WRONG, SKIPPED

    const queryParams = new URLSearchParams(window.location.search);
    const selectedExamDocId = queryParams.get('id');

    if(!selectedExamDocId) {
        window.location.replace("dashboard.html");
        return;
    }

    const databaseVerificationCheck = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(databaseVerificationCheck);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const profileDocument = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (profileDocument.exists()) {
                        globalActiveProfilePayload = profileDocument.data();
                        extractEvaluationScorecardMetrics();
                    } else {
                        window.location.replace("login.html");
                    }
                } else {
                    window.location.replace("login.html");
                }
            });
        }
    }, 50);

    async function extractEvaluationScorecardMetrics() {
        if(!globalActiveProfilePayload || !window.db) return;

        try {
            const queryTarget = window.query(
                window.collection(window.db, "results"),
                window.where("examId", "==", selectedExamDocId),
                window.where("admissionNumber", "==", globalActiveProfilePayload.admissionNumber)
            );

            const documentSnapshot = await window.getDocs(queryTarget);

            if(documentSnapshot.empty) {
                alert("Evaluation Profile Records Error: Unable to extract matching completion scorecard keys.");
                window.location.replace("dashboard.html");
                return;
            }

            documentSnapshot.forEach(doc => { finalExtractedDataResult = doc.data(); });

            document.getElementById('resExamTitle').textContent = `${finalExtractedDataResult.subject} : ${finalExtractedDataResult.examTitle}`;
            document.getElementById('resScorePoints').textContent = `${finalExtractedDataResult.scorePoints} / ${finalExtractedDataResult.totalWeightMarks} M`;
            document.getElementById('resPercentage').textContent = `${finalExtractedDataResult.percentageScore}%`;
            document.getElementById('resCorrectCount').textContent = `${finalExtractedDataResult.correctCount} / ${finalExtractedDataResult.totalQuestions} Q`;
            
            document.getElementById('resStudentName').textContent = finalExtractedDataResult.studentName;
            document.getElementById('resAdmissionNumber').textContent = finalExtractedDataResult.admissionNumber;
            document.getElementById('resStandard').textContent = finalExtractedDataResult.standard;
            document.getElementById('resTimestamp').textContent = new Date(finalExtractedDataResult.submittedAt).toLocaleString();

            const badgeOutletNode = document.getElementById('resVerdictBadge');
            const bannerHeaderNode = document.getElementById('resultBannerHeader');
            const securityViolationBanner = document.getElementById('securityViolationBanner');

            if (finalExtractedDataResult.percentageScore === 0 && finalExtractedDataResult.correctCount === 0) {
                securityViolationBanner.classList.remove('hidden');
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-red-950 text-red-500 border border-red-600 shadow-sm animate-pulse">VIOLATION LOCKED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-red-950 via-neutral-950 to-red-950 px-6 py-8 text-center border-b border-red-900";
            } else if (finalExtractedDataResult.percentageScore >= 35) {
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-sm">PASSED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 px-6 py-8 text-center border-b border-emerald-800";
            } else {
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-900 shadow-sm">FAILED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-red-950 via-rose-950 to-red-950 px-6 py-8 text-center border-b border-red-900";
            }

            // POPULATE TAB NUMBER INTERACTION COUNTS WITH SAFETY FALLBACKS
            const correctArr = finalExtractedDataResult.correctQuestions || [];
            const wrongArr = finalExtractedDataResult.wrongQuestions || [];
            const skippedArr = finalExtractedDataResult.skippedQuestions || [];

            document.getElementById('countCorrectReview').textContent = correctArr.length;
            document.getElementById('countWrongReview').textContent = wrongArr.length;
            document.getElementById('countSkippedReview').textContent = skippedArr.length;

            // BIND THE TAB ACTION CLICKS INTERFACES
            setupInteractiveReviewTabsClickListeners();
            
            // INITIAL ENTRY RENDER: Load correct list first
            renderTabulatedQuestionsReviewList();

        } catch (error) {
            console.error("Critical analytics parser error:", error);
        }
    }

    function setupInteractiveReviewTabsClickListeners() {
        const correctTab = document.getElementById('tabBtnCorrect');
        const wrongTab = document.getElementById('tabBtnWrong');
        const skippedTab = document.getElementById('tabBtnSkipped');

        if(!correctTab || !wrongTab || !skippedTab) return;

        correctTab.addEventListener('click', () => {
            currentlyActiveTabType = 'CORRECT';
            updateActiveTabUIState(correctTab, [wrongTab, skippedTab], 'border-emerald-500', 'text-emerald-400', 'bg-emerald-950/20');
            renderTabulatedQuestionsReviewList();
        });

        wrongTab.addEventListener('click', () => {
            currentlyActiveTabType = 'WRONG';
            updateActiveTabUIState(wrongTab, [correctTab, skippedTab], 'border-red-500', 'text-red-400', 'bg-red-950/20');
            renderTabulatedQuestionsReviewList();
        });

        skippedTab.addEventListener('click', () => {
            currentlyActiveTabType = 'SKIPPED';
            updateActiveTabUIState(skippedTab, [correctTab, wrongTab], 'border-amber-500', 'text-amber-400', 'bg-amber-950/20');
            renderTabulatedQuestionsReviewList();
        });
    }

    function updateActiveTabUIState(activeNode, disabledNodesList, borderColorClass, textStyleClass, bgOverlayClass) {
        // Toggle selected styling onto focused node
        activeNode.className = `px-4 py-2 border-b-2 ${borderColorClass} ${textStyleClass} ${bgOverlayClass} rounded-t-lg transition-colors`;
        
        // Remove active styling allocations from inactive nodes
        disabledNodesList.forEach(node => {
            node.className = "px-4 py-2 border-b-2 border-transparent text-gray-400 hover:bg-gray-800/40 rounded-t-lg transition-colors";
        });
    }

    function renderTabulatedQuestionsReviewList() {
        const listContainer = document.getElementById('reviewQuestionsContainer');
        if(!listContainer || !finalExtractedDataResult) return;

        listContainer.innerHTML = "";
        let targetsDataArray = [];

        if (currentlyActiveTabType === 'CORRECT') targetsDataArray = finalExtractedDataResult.correctQuestions || [];
        else if (currentlyActiveTabType === 'WRONG') targetsDataArray = finalExtractedDataResult.wrongQuestions || [];
        else if (currentlyActiveTabType === 'SKIPPED') targetsDataArray = finalExtractedDataResult.skippedQuestions || [];

        if (targetsDataArray.length === 0) {
            listContainer.innerHTML = `<div class="text-center text-sm text-gray-500 py-8 border border-dashed border-gray-700/60 rounded-xl bg-gray-900/10">No examination items recorded under this categorization segment inside this scorecard report document.</div>`;
            return;
        }

        targetsDataArray.forEach(q => {
            const block = document.createElement('div');
            block.className = "bg-gray-900/40 p-4 border border-gray-700/60 rounded-xl space-y-3 text-sm";

            let structuralOptionsHTML = "";
            const keyIndicatorsList = ['A', 'B', 'C', 'D'];

            keyIndicatorsList.forEach(key => {
                let badgeMarkerClasses = "bg-gray-900/30 text-gray-400 border-gray-800";
                let suffixMessageHTML = "";

                if (key === q.correctKey) {
                    // Always highlight the correct answer in green
                    badgeMarkerClasses = "bg-emerald-950/80 text-emerald-400 border-emerald-800 font-bold";
                    suffixMessageHTML = ` <span class="text-[11px] font-bold text-emerald-500 font-mono uppercase bg-emerald-950 border border-emerald-900 px-1.5 py-0.2 rounded ml-2">✓ Verified Key</span>`;
                } else if (key === q.studentKey && currentlyActiveTabType === 'WRONG') {
                    // If it was a wrong choice, mark the student's selected key in red
                    badgeMarkerClasses = "bg-red-950/80 text-red-400 border-red-900 font-bold";
                    suffixMessageHTML = ` <span class="text-[11px] font-bold text-red-500 font-mono uppercase bg-red-950 border border-red-900 px-1.5 py-0.2 rounded ml-2">✗ Your Selection</span>`;
                }

                structuralOptionsHTML += `
                    <div class="flex items-center p-2.5 rounded-lg border ${badgeMarkerClasses} text-xs font-medium">
                        <span class="w-5 h-5 flex items-center justify-center font-mono font-bold bg-black/20 border border-white/5 rounded mr-2.5">${key}</span>
                        <span class="truncate">${q.options[key]}</span>
                        ${suffixMessageHTML}
                    </div>
                `;
            });

            block.innerHTML = `
                <div class="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-1.5 text-gray-400">
                    <span class="font-bold text-blue-400">ORIGINAL SHEET ENTRY NUMBER: #${q.qNumber}</span>
                    <span class="bg-gray-800 px-2 py-0.5 rounded text-gray-300 font-bold">${q.marks} Marks</span>
                </div>
                <div class="font-semibold text-white text-sm tracking-wide leading-relaxed">${q.text}</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    ${structuralOptionsHTML}
                </div>
            `;
            listContainer.appendChild(block);
        });
    }
});