window.addEventListener('DOMContentLoaded', () => {
    let activeStudentProfile = null;
    let selectedExamPayload = null;
    let evaluationCountdownInterval = null;
    let examSubmittedStatusFlag = false;

    // Track dynamic client selections globally for palette manipulation
    let organizedGlobalQuestions = [];
    const clientResponsesTrackingMap = {};
    const reviewFlagsActiveSet = new Set();

    // Tracking variables for page layout control shifts
    let currentQuestionPointerIndex = 0;

    // Three-Strike Tolerances Counter Memory
    let violationStrikesCounter = 3;

    // Fetch URL string targeting hash query variables
    const queryParams = new URLSearchParams(window.location.search);
    const targetExamDocId = queryParams.get('id');

    if(!targetExamDocId) {
        window.location.replace("dashboard.html");
        return;
    }

    // 1. Strict Anti-Cheating Security Locks
    document.addEventListener('contextmenu', e => e.preventDefault()); // Block right-clicks
    document.addEventListener('copy', e => e.preventDefault());         // Block copying text
    document.addEventListener('paste', e => e.preventDefault());        // Block pasting text

    // Anti-Screenshot keyboard listener trick
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            handleStrictAppSwitchViolation("Screen snapshot detection exception caught.");
        }
    });

    // 3 Warning System Handler Interceptor
    function handleStrictAppSwitchViolation(customMessageString) {
        if(document.getElementById('instructionsGateBlock').classList.contains('hidden')) {
            if(examSubmittedStatusFlag) return;

            violationStrikesCounter--;

            const badgeNode = document.getElementById('warningStrikesCounterBadge');
            
            if (violationStrikesCounter <= 0) {
                examSubmittedStatusFlag = true;
                if(badgeNode) {
                    badgeNode.className = "bg-red-950 text-red-500 border border-red-600 px-2.5 py-0.5 rounded-md font-black font-mono tracking-wider animate-pulse";
                    badgeNode.textContent = "0 / 3 - LOCKOUT FORCE";
                }
                
                document.body.innerHTML = "<div class='bg-black h-screen w-screen flex flex-col items-center justify-center text-red-500 font-bold text-center p-4 text-lg space-y-3'><div>CRITICAL SECURITY LOCKOUT</div><p class='text-sm text-gray-400 max-w-md font-medium'>You depleted all 3 configuration warnings by continuously switching tabs, minimizing your viewport, answering phone calls, or bringing up system overlay blocks. Your test sheet has been locked and submitted automatically with a failure grade penalty.</p></div>";
                
                executeAutomatedExamSubmission(true);
            } else {
                if(badgeNode) {
                    badgeNode.className = "bg-red-950 text-red-400 border border-red-900 px-2.5 py-0.5 rounded-md font-extrabold font-mono tracking-wider animate-bounce";
                    badgeNode.textContent = `${violationStrikesCounter} / 3 WARNINGS LEFT`;
                }

                const interfaceNoticeText = customMessageString || "App/tab switch, notification pull-down, or screen window focus minimization detected.";
                alert(`⚠️ SECURITY INTEGRITY WARNING ⚠️\n\n${interfaceNoticeText}\n\nYou have left the secure testing workspace. Continuous adjustments will deplete your warning count. Once it hits zero, your exam will auto-submit immediately.\n\nRemaining Warning Strikes: ${violationStrikesCounter} / 3`);
            }
        }
    }

    window.addEventListener('blur', () => handleStrictAppSwitchViolation());
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            handleStrictAppSwitchViolation();
        }
    });

    // Secure Session Validation Engine Loop
    const initialSessionCheck = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(initialSessionCheck);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const profileSnapshot = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (profileSnapshot.exists()) {
                        activeStudentProfile = profileSnapshot.data();
                        queryTargetExamDetails();
                    } else {
                        window.location.replace("login.html");
                    }
                } else {
                    window.location.replace("login.html");
                }
            });
        }
    }, 50);

    // Retrieve Exam Data Matrix Profile Configurations from Database Node
    async function queryTargetExamDetails() {
        try {
            const examSnapshot = await window.getDoc(window.doc(window.db, "exams", targetExamDocId));
            if(!examSnapshot.exists()) {
                alert("Target examination document structure not found.");
                window.location.replace("dashboard.html");
                return;
            }

            selectedExamPayload = examSnapshot.data();

            document.getElementById('examHeaderTitle').textContent = selectedExamPayload.title;
            document.getElementById('instExamTitle').textContent = selectedExamPayload.title;
            document.getElementById('instExamDetails').innerHTML = `
                Subject Focus Stream: <span class="text-white font-bold">${selectedExamPayload.subject}</span><br>
                Allocated Testing Timeframe Window: <span class="text-white font-bold">${selectedExamPayload.duration} Minutes</span><br>
                Overall Structural Points Weight: <span class="text-white font-bold">${selectedExamPayload.totalMarks} Marks</span><br><br>
                Guidelines: ${selectedExamPayload.instructions}
            `;

            if(localStorage.getItem(`exam_timer_${targetExamDocId}`)) {
                startAssessmentProcessingPipeline();
            }

        } catch (err) {
            console.error("Exam data pipeline compilation mapping issue:", err);
        }
    }

    // Intercept Initialization Entry Point Button Hook Action Events
    document.getElementById('initializeExamBtn').addEventListener('click', () => {
        if (!document.hasFocus()) {
            alert("SYSTEM ACCESS DENIED:\n\nAn active phone call overlay, network interruption, or system application pop-up is running on your device.\n\nDisconnect all active cellular/VoIP voice calls and close background banners before attempting to initialize this exam.");
            return;
        }

        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch(e) { console.log("Device interface blocked automatic execution fullscreen locks."); }
        
        startAssessmentProcessingPipeline();
    });

    // Main Engine Processing Core Controller Architecture Loop
    function startAssessmentProcessingPipeline() {
        document.getElementById('instructionsGateBlock').classList.add('hidden');
        document.getElementById('liveExamForm').classList.remove('hidden');

        organizedGlobalQuestions = [...selectedExamPayload.questions];
        for (let i = organizedGlobalQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [organizedGlobalQuestions[i], organizedGlobalQuestions[j]] = [organizedGlobalQuestions[j], organizedGlobalQuestions[i]];
        }

        renderQuestionnaireCanvas();
        generateInteractiveReviewPalette();
        switchActiveQuestionDisplayViewport(0);
        initializeClockTrackerEngine();
    }

    // Render Shuffled Item Question Array Structure
    function renderQuestionnaireCanvas() {
        const outlet = document.getElementById('questionnaireRenderOutlet');
        outlet.innerHTML = "";

        organizedGlobalQuestions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.id = `question_wrapper_container_page_${idx}`;
            block.className = "hidden bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md space-y-4 transition-all duration-300";
            
            // Render optional Base64 inline question attachments if present
            let questionAttachmentHTML = "";
            if (q.qImgData) {
                questionAttachmentHTML = `
                    <div class="w-full flex justify-start pt-1 pb-2">
                        <img src="${q.qImgData}" alt="Question Attachment" 
                             class="w-full max-w-sm md:max-w-md h-auto object-contain rounded-lg border border-gray-700 shadow-inner bg-gray-900/40">
                    </div>
                `;
            }

            let choicesHTML = "";
            const trackingKeys = ['A', 'B', 'C', 'D'];
            trackingKeys.sort(() => Math.random() - 0.5);

            trackingKeys.forEach(key => {
                // Render optional option item inline thumbnails
                let optionImgHTML = "";
                if (q.optImagesData && q.optImagesData[key]) {
                    optionImgHTML = `
                        <div class="mt-2 w-full">
                            <img src="${q.optImagesData[key]}" alt="Option ${key} Image Data Asset" 
                                 class="max-w-xs h-24 w-auto object-contain rounded border border-gray-700/50 bg-gray-950 shadow-sm">
                        </div>
                    `;
                }

                choicesHTML += `
                    <label class="flex flex-col justify-between bg-gray-900/50 hover:bg-gray-700/40 p-3.5 rounded-lg border border-gray-700/60 transition-colors cursor-pointer text-sm font-medium text-gray-300">
                        <div class="flex items-center space-x-3 w-full">
                            <input type="radio" name="response_mapping_${q.id}" value="${key}" data-index-link="${idx}"
                                class="mcq-input-choice-node h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800">
                            <span>${key}: ${q.options[key]}</span>
                        </div>
                        ${optionImgHTML}
                    </label>
                `;
            });

            block.innerHTML = `
                <div class="flex justify-between items-center border-b border-gray-700/40 pb-2">
                    <span class="text-sm font-bold text-gray-400 font-mono">QUESTION BLOCK ITEM #${idx + 1} OF ${organizedGlobalQuestions.length}</span>
                    <span class="bg-blue-950 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-900 font-bold font-mono">${q.marks} Marks</span>
                </div>
                <div class="text-base font-semibold text-white">${q.text}</div>
                
                ${questionAttachmentHTML}

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    ${choicesHTML}
                </div>
                
                <div class="flex justify-between items-center pt-3 border-t border-gray-700/30 text-xs font-semibold">
                    <button type="button" class="clear-selection-btn text-gray-400 hover:text-white bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-700/40 transition-colors" data-id="${q.id}" data-index-link="${idx}">
                        Clear Response
                    </button>
                    <button type="button" class="toggle-bookmark-btn bg-gray-900 border border-gray-700 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-md flex items-center space-x-1 transition-all" data-index-link="${idx}">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" id="bookmark_svg_icon_${idx}" style="fill-opacity: 0.15;"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                        <span id="bookmark_text_node_${idx}">Mark for Review</span>
                    </button>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-700/50 mt-4">
                    <button type="button" id="prev_action_btn_node_${idx}" class="prev-step-action-hook bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-30 transition-all">
                        ← Previous
                    </button>
                    <div class="flex items-center space-x-2">
                        <button type="button" id="next_action_btn_node_${idx}" class="next-step-action-hook bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-30 transition-all">
                            Skip / Next →
                        </button>
                        <button type="button" id="save_next_btn_node_${idx}" class="save-next-step-action-hook bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-black text-xs transition-all shadow-md">
                            Save & Next ✓
                        </button>
                    </div>
                </div>
            `;
            outlet.appendChild(block);
        });

        document.querySelectorAll('.mcq-input-choice-node').forEach(elem => {
            elem.addEventListener('change', executeSelectionChangeInterceptor);
        });

        document.querySelectorAll('.clear-selection-btn').forEach(btn => {
            btn.addEventListener('click', executeClearResponseEngineAction);
        });

        document.querySelectorAll('.toggle-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', executeReviewBookmarkTogglePipeline);
        });

        organizedGlobalQuestions.forEach((_, idx) => {
            const pBtn = document.getElementById(`prev_action_btn_node_${idx}`);
            const nBtn = document.getElementById(`next_action_btn_node_${idx}`);
            const sBtn = document.getElementById(`save_next_btn_node_${idx}`);

            if(idx === 0) pBtn.disabled = true;
            
            pBtn.addEventListener('click', () => switchActiveQuestionDisplayViewport(currentQuestionPointerIndex - 1));
            
            if(idx === organizedGlobalQuestions.length - 1) {
                nBtn.textContent = "View Questionnaire Summary";
                sBtn.textContent = "Save Response Final ✓";
                
                // FIXED: Replaced native alerts with custom safe alerts to prevent full-screen exit violations
                nBtn.addEventListener('click', () => {
                    showSafeExamSystemModal("Use the right-side palette to review answers, or click the Submit button to finalize score charts.");
                });
                
                sBtn.addEventListener('click', () => {
                    showSafeExamSystemModal("Response verified! Click 'Submit Examination' inside the right-side grid panel to upload files.");
                });
            } else {
                nBtn.addEventListener('click', () => switchActiveQuestionDisplayViewport(currentQuestionPointerIndex + 1));
                sBtn.addEventListener('click', () => switchActiveQuestionDisplayViewport(currentQuestionPointerIndex + 1));
            }
        });
    }

    function switchActiveQuestionDisplayViewport(targetIdx) {
        if (targetIdx < 0 || targetIdx >= organizedGlobalQuestions.length) return;

        const currentActiveBox = document.getElementById(`question_wrapper_container_page_${currentQuestionPointerIndex}`);
        if (currentActiveBox) currentActiveBox.className = "hidden";

        currentQuestionPointerIndex = targetIdx;

        const targetViewBox = document.getElementById(`question_wrapper_container_page_${currentQuestionPointerIndex}`);
        if (targetViewBox) targetViewBox.className = "block bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md space-y-4 animate-fadeIn";

        document.querySelectorAll('.palette-cell-node').forEach(node => node.classList.remove('ring-4', 'ring-blue-400'));
        const activeMatrixIndicatorBadge = document.getElementById(`palette_badge_indicator_id_${targetIdx}`);
        if (activeMatrixIndicatorBadge) activeMatrixIndicatorBadge.classList.add('ring-4', 'ring-blue-400');
    }

    function generateInteractiveReviewPalette() {
        const matrixContainer = document.getElementById('paletteMatrixGridNumbers');
        matrixContainer.innerHTML = "";

        organizedGlobalQuestions.forEach((_, idx) => {
            const numBtn = document.createElement('button');
            numBtn.type = "button";
            numBtn.id = `palette_badge_indicator_id_${idx}`;
            numBtn.className = "palette-cell-node bg-gray-900 text-gray-400 border border-gray-700 text-sm font-bold p-2 rounded-lg font-mono text-center transition-all hover:bg-gray-700 hover:text-white shadow-sm";
            numBtn.textContent = idx + 1;

            numBtn.addEventListener('click', () => switchActiveQuestionDisplayViewport(idx));
            matrixContainer.appendChild(numBtn);
        });
    }

    function refreshSpecificIndexCellBadgeColor(idx) {
        const targetCellNode = document.getElementById('palette_badge_indicator_id_' + idx);
        if(!targetCellNode) return;

        const isAnswered = !!clientResponsesTrackingMap[idx];
        const isFlagged = reviewFlagsActiveSet.has(idx);

        targetCellNode.className = "palette-cell-node text-sm font-bold p-2 rounded-lg font-mono text-center transition-all shadow-sm ";
        if(idx === currentQuestionPointerIndex) targetCellNode.classList.add('ring-4', 'ring-blue-400');

        if (isAnswered && isFlagged) {
            targetCellNode.classList.add('bg-purple-600', 'text-white', 'border-purple-500');
        } else if (isFlagged) {
            targetCellNode.classList.add('bg-amber-500', 'text-white', 'border-amber-400');
        } else if (isAnswered) {
            targetCellNode.classList.add('bg-blue-600', 'text-white', 'border-blue-500');
        } else {
            targetCellNode.classList.add('bg-gray-900', 'text-gray-400', 'border-gray-700', 'hover:bg-gray-700', 'hover:text-white');
        }
    }

    function executeSelectionChangeInterceptor(e) {
        const itemIdx = parseInt(e.target.getAttribute('data-index-link'));
        clientResponsesTrackingMap[itemIdx] = e.target.value;
        refreshSpecificIndexCellBadgeColor(itemIdx);
    }

    function executeClearResponseEngineAction(e) {
        const itemIdx = parseInt(e.target.getAttribute('data-index-link'));
        const internalQId = e.target.getAttribute('data-id');

        const radios = document.getElementsByName(`response_mapping_${internalQId}`);
        for(let r of radios) { r.checked = false; }

        delete clientResponsesTrackingMap[itemIdx];
        refreshSpecificIndexCellBadgeColor(itemIdx);
    }

    function executeReviewBookmarkTogglePipeline(e) {
        const buttonNode = e.target.closest('.toggle-bookmark-btn');
        const itemIdx = parseInt(buttonNode.getAttribute('data-index-link'));

        const targetSvgIcon = document.getElementById(`bookmark_svg_icon_${itemIdx}`);
        const targetTextNode = document.getElementById('bookmark_text_node_' + itemIdx);

        if(reviewFlagsActiveSet.has(itemIdx)) {
            reviewFlagsActiveSet.delete(itemIdx);
            targetTextNode.textContent = "Mark for Review";
            if(targetSvgIcon) targetSvgIcon.style.fillOpacity = "0.15";
        } else {
            reviewFlagsActiveSet.add(itemIdx);
            targetTextNode.textContent = "Bookmarked!";
            if(targetSvgIcon) targetSvgIcon.style.fillOpacity = "1";
        }

        refreshSpecificIndexCellBadgeColor(itemIdx);
    }

    function initializeClockTrackerEngine() {
        const storageKey = `exam_timer_${targetExamDocId}`;
        let remainingSecondsDurationValue = 0;

        if(localStorage.getItem(storageKey)) {
            remainingSecondsDurationValue = parseInt(localStorage.getItem(storageKey));
        } else {
            remainingSecondsDurationValue = selectedExamPayload.duration * 60;
            localStorage.setItem(storageKey, remainingSecondsDurationValue);
        }

        const clockOutletNode = document.getElementById('countdownTimerClock');

        evaluationCountdownInterval = setInterval(() => {
            remainingSecondsDurationValue--;
            localStorage.setItem(storageKey, remainingSecondsDurationValue);

            let calculatedMins = Math.floor(remainingSecondsDurationValue / 60);
            let calculatedSecs = remainingSecondsDurationValue % 60;

            let formattedMins = calculatedMins < 10 ? "0" + calculatedMins : calculatedMins;
            let formattedSecs = calculatedSecs < 10 ? "0" + calculatedSecs : calculatedSecs;

            clockOutletNode.textContent = `${formattedMins}:${formattedSecs}`;

            if(remainingSecondsDurationValue <= 0) {
                clearInterval(evaluationCountdownInterval);
                clockOutletNode.textContent = "00:00";
                examSubmittedStatusFlag = true;
                executeAutomatedExamSubmission(false);
            }
        }, 1000);
    }

    document.getElementById('liveExamForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if(confirm("Are you sure you want to finalize and submit your answers?")) {
            examSubmittedStatusFlag = true;
            executeAutomatedExamSubmission(false);
        }
    });

    async function executeAutomatedExamSubmission(isForceLockoutViolation = false) {
        clearInterval(evaluationCountdownInterval);
        
        const manualSubmitBtn = document.getElementById('manualSubmitBtn');
        if(manualSubmitBtn) {
            manualSubmitBtn.disabled = true;
            manualSubmitBtn.textContent = "Processing Grade Matrices...";
        }

        let compiledCorrectAnswersCalculations = 0;
        let finalEarnedPointsSummaryScore = 0;
        const trackingResponsesSubmissionMap = {};

        const correctQuestionsList = [];
        const wrongQuestionsList = [];
        const skippedQuestionsList = [];

        const penaltyValueFactor = selectedExamPayload.negativeMarks !== undefined ? parseFloat(selectedExamPayload.negativeMarks) : 0;

        organizedGlobalQuestions.forEach((q, idx) => {
            const selectedValueString = clientResponsesTrackingMap[idx] || "";
            trackingResponsesSubmissionMap[q.id] = selectedValueString;

            const questionMetaData = {
                qNumber: idx + 1,
                text: q.text,
                options: q.options,
                correctKey: q.correct,
                studentKey: selectedValueString,
                marks: q.marks
            };

            if (selectedValueString === "") {
                skippedQuestionsList.push(questionMetaData);
            } else if (selectedValueString === q.correct) {
                compiledCorrectAnswersCalculations++;
                finalEarnedPointsSummaryScore += q.marks;
                correctQuestionsList.push(questionMetaData);
            } else {
                finalEarnedPointsSummaryScore -= penaltyValueFactor;
                wrongQuestionsList.push(questionMetaData);
            }
        });

        if (finalEarnedPointsSummaryScore < 0) {
            finalEarnedPointsSummaryScore = 0;
        }

        let finalComputedPercentage = Math.round((finalEarnedPointsSummaryScore / selectedExamPayload.totalMarks) * 100) || 0;
        
        if (isForceLockoutViolation === true) {
            compiledCorrectAnswersCalculations = 0;
            finalEarnedPointsSummaryScore = 0;
            finalComputedPercentage = 0;
        }

        const resultsPayloadSchema = {
            examId: targetExamDocId,
            examTitle: selectedExamPayload.title,
            subject: selectedExamPayload.subject,
            admissionNumber: activeStudentProfile.admissionNumber,
            studentName: activeStudentProfile.studentName,
            standard: activeStudentProfile.standard,
            totalQuestions: organizedGlobalQuestions.length,
            correctCount: compiledCorrectAnswersCalculations,
            scorePoints: finalEarnedPointsSummaryScore,
            totalWeightMarks: selectedExamPayload.totalMarks,
            percentageScore: finalComputedPercentage,
            submittedAt: new Date().toISOString(),
            correctQuestions: correctQuestionsList,
            wrongQuestions: wrongQuestionsList,
            skippedQuestions: skippedQuestionsList
        };

        try {
            await window.addDoc(window.collection(window.db, "results"), resultsPayloadSchema);
            localStorage.removeItem(`exam_timer_${targetExamDocId}`);
            window.location.replace(`result.html?id=${targetExamDocId}`);
        } catch (err) {
            console.error("Critical submission anomaly dropped:", err);
            window.location.replace(`result.html?id=${targetExamDocId}`);
        }
    }
});