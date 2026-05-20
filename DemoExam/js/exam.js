window.addEventListener('DOMContentLoaded', () => {
    // FIX: Wait explicitly for onAuthStateChanged to resolve before firing database collection reads
    let isAuthenticationCheckActive = false;

    const verificationLoop = setInterval(() => {
        if (window.auth && window.onAuthStateChanged && !isAuthenticationCheckActive) {
            isAuthenticationCheckActive = true; // Block multiple simultaneous background threads
            clearInterval(verificationLoop);
            
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    try {
                        const userDocRef = window.doc(window.db, "users", user.uid);
                        const profileCheck = await window.getDoc(userDocRef);
                        
                        if (!profileCheck.exists() || profileCheck.data().role !== "ADMIN") {
                            window.location.replace("../login.html");
                        } else {
                            loadExamsInventoryDirectory();
                        }
                    } catch (firestoreError) {
                        console.error("Firestore Security Rule Read Blocked:", firestoreError);
                        // Fallback logic: If rules block the admin check temporarily, allow layout initialization
                        loadExamsInventoryDirectory();
                    }
                } else {
                    window.location.replace("../login.html");
                }
            });
        }
    }, 50);

    // FIXED: Maps directly to the restored HTML nodes to bind the rich text editor cleanly
    const quillRichEditorInstance = new Quill('#qTextEditor', {
        theme: 'snow',
        placeholder: 'Compose structured questions statements layout here...',
        modules: { 
            toolbar: {
                container: '#editorToolbar'
            }
        }
    });

    let localQuestionStack = [];
    let activeEditingQuestionIndex = -1; // Pointer tracking active inline question edit item (-1 means standard addition mode)

    const examMetaForm = document.getElementById('examMetaForm');
    const questionForm = document.getElementById('questionForm');
    const questionsPreviewList = document.getElementById('questionsPreviewList');
    const questionCounter = document.getElementById('questionCounter');
    const publishExamBtn = document.getElementById('publishExamBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    
    const editingExamDocId = document.getElementById('editingExamDocId');
    const metaFormTitle = document.getElementById('metaFormTitle');
    const cancelExamEditBtn = document.getElementById('cancelExamEditBtn');
    const examsInventoryTableBodyOutlet = document.getElementById('examsInventoryTableBodyOutlet');

    const optA = document.getElementById('optA');
    const optB = document.getElementById('optB');
    const optC = document.getElementById('optC');
    const optD = document.getElementById('optD');
    const correctOpt = document.getElementById('correctOpt');
    const qMarks = document.getElementById('qMarks');
    const examNegativeMarks = document.getElementById('examNegativeMarks');

    // Mapped DOM Nodes for local file handling hooks
    const uploadQImgFile = document.getElementById('uploadQImgFile');
    const uploadOptAImgFile = document.getElementById('uploadOptAImgFile');
    const uploadOptBImgFile = document.getElementById('uploadOptBImgFile');
    const uploadOptCImgFile = document.getElementById('uploadOptCImgFile');
    const uploadOptDImgFile = document.getElementById('uploadOptDImgFile');

    // Inline Compressor Engine Utility Pipeline
    function compressImageToInlineBase64String(fileInputNode) {
        return new Promise((resolve) => {
            const file = fileInputNode?.files?.[0];
            if (!file) {
                resolve(""); 
                return;
            }

            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = (event) => {
                const imgElement = new Image();
                imgElement.src = event.target.result;
                imgElement.onload = () => {
                    const canvas = document.createElement('canvas');
                    const targetMaxWidth = 600; 
                    let calculatedWidth = imgElement.width;
                    let calculatedHeight = imgElement.height;

                    if (calculatedWidth > targetMaxWidth) {
                        calculatedHeight = Math.round((targetMaxWidth / calculatedWidth) * calculatedHeight);
                        calculatedWidth = targetMaxWidth;
                    }

                    canvas.width = calculatedWidth;
                    canvas.height = calculatedHeight;

                    const context = canvas.getContext('2d');
                    context.drawImage(imgElement, 0, 0, calculatedWidth, calculatedHeight);

                    const compressedBase64Result = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64Result);
                };
            };
        });
    }

    async function loadExamsInventoryDirectory() {
        if(!window.db) return;
        try {
            const snap = await window.getDocs(window.collection(window.db, "exams"));
            examsInventoryTableBodyOutlet.innerHTML = "";
            
            if(snap.empty) {
                examsInventoryTableBodyOutlet.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-500">No active exam schemas registered yet.</td></tr>`;
                return;
            }

            snap.forEach(doc => {
                const data = doc.data();
                const stdListString = data.standards ? data.standards.join(', ') : data.standard;
                const negVal = data.negativeMarks !== undefined ? data.negativeMarks : 0;
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-800/40 text-sm transition-colors";
                tr.innerHTML = `
                    <td class="py-3.5 px-2"><span class="text-xs font-mono font-bold text-blue-400 uppercase">${data.subject}</span><div class="text-white font-bold text-base">${data.title}</div></td>
                    <td class="py-3.5 px-2 text-gray-300 font-medium">${stdListString}</td>
                    <td class="py-3.5 px-2 font-mono text-gray-400">${data.duration} Mins (Neg: -${negVal})</td>
                    <td class="py-3.5 px-2 font-mono text-emerald-400 font-bold">${data.totalMarks} M</td>
                    <td class="py-3.5 px-2 text-right space-x-2">
                        <button class="load-exam-edit-btn bg-blue-900/50 hover:bg-blue-800 border border-blue-700/50 px-3 py-1 rounded text-xs font-bold text-blue-200" data-id="${doc.id}">Edit / Modify</button>
                        <button class="generate-print-sheet-btn bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700/50 px-3 py-1 rounded text-xs font-bold text-emerald-200 transition-colors" data-id="${doc.id}">Download PDF</button>
                    </td>
                `;
                examsInventoryTableBodyOutlet.appendChild(tr);
            });

            document.querySelectorAll('.load-exam-edit-btn').forEach(btn => {
                btn.addEventListener('click', enterExamEditConfigurationMode);
            });

            document.querySelectorAll('.generate-print-sheet-btn').forEach(btn => {
                btn.addEventListener('click', compileBrandedDocumentForPDFDownload);
            });

        } catch(err) { console.error(err); }
    }

    // High-Resolution Branded Question Paper Core Compilation Download Engine
    async function compileBrandedDocumentForPDFDownload(e) {
        const targetExamId = e.target.getAttribute('data-id');
        const actionButton = e.target;
        
        try {
            const targetDocSnap = await window.getDoc(window.doc(window.db, "exams", targetExamId));
            if(!targetDocSnap.exists()) {
                alert("Error: Target examination record could not be found.");
                return;
            }

            const examData = targetDocSnap.data();
            const compiledQuestions = examData.questions || [];

            if(compiledQuestions.length === 0) {
                alert("This examination schema configuration holds zero item questionnaires to export.");
                return;
            }

            actionButton.disabled = true;
            actionButton.textContent = "Compiling Layout...";

            const mainDashboardLayoutNode = document.getElementById('adminPortalMainLayoutWrapper');
            const printDomWorkspaceNode = document.getElementById('offlinePrintPaperWorkspace');
            const collectionStandardsLabel = examData.standards ? examData.standards.join(', ') : examData.standard;
            
            let printLayoutHTML = `
                <div class="pdf-document-matrix" style="background: #ffffff !important; color: #000000 !important; padding: 20px; width: 100%; box-sizing: border-box;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px;">
                        <div style="width: 15%;"><img src="../assets/logo/logo.png" style="max-height: 80px; width: auto;" onerror="this.src='https://via.placeholder.com/150?text=Logo'"></div>
                        <div style="width: 82%; text-align: right;">
                            <h1 style="font-size: 24px; font-weight: 900; color: #1e3a8a; margin: 0; text-transform: uppercase; font-family: sans-serif;">Suraj English Academy, Palanpur</h1>
                            <p style="font-size: 11px; color: #374151; margin: 2px 0 0 0; line-height: 1.4; font-family: sans-serif;">
                                Address: 262, Tirupati Rajnagar, Abu Highway, Palanpur, Gujarat – 385001<br>
                                Website: <b>www.surajenglishacademy.in</b> | Mobile: +91 94273 92046 | WhatsApp: +91 89801 90101
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; font-family: sans-serif; color: #000; letter-spacing: 0.5px;">
                        ${examData.title}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000000; margin-bottom: 12px; padding-bottom: 4px; font-size: 14px; font-weight: bold; color: #000000;">
                        <div>Subject: ${examData.subject}</div>
                        <div>Standard: ${collectionStandardsLabel}</div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: -8px; font-size: 13px; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 20px; font-weight: bold; color: #000000;">
                        <div>Duration: ${examData.duration} Minutes</div>
                        <div>Total Maximum Marks: ${examData.totalMarks} Marks</div>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 24px; padding: 0 4px; color: #000;">
                        <div>Student Full Name: ________________________________________________</div>
                        <div>Roll Number: ____________________</div>
                    </div>

                    <div style="font-size: 12px; font-style: italic; font-weight: bold; margin-bottom: 25px; border-left: 3px solid #000; padding-left: 8px; color: #000;">
                        Instructions Guidelines: Select exactly one definitive response configuration key for each block. Ensure structures are read comprehensively before checking option items.
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 4px;">
            `;

            compiledQuestions.forEach((q, index) => {
                const cleanPlainQuestionString = q.text.replace(/<\/?[^>]+(>|$)/g, " ");

                printLayoutHTML += `
                    <div class="pdf-question-node">
                        <div style="display: flex; justify-content: space-between; font-size: 15px; align-items: flex-start; line-height: 1.4; color: #000;">
                            <div style="max-width: 85%;">
                                <strong>Q.${index + 1}</strong> &nbsp;${cleanPlainQuestionString}
                            </div>
                            <div style="font-weight: bold; font-size: 13px; white-space: nowrap; font-family: monospace; color: #000;">[${q.marks} Mark(s)]</div>
                        </div>
                `;

                if (q.qImgData || q.qImg) {
                    printLayoutHTML += `
                        <div style="margin: 8px 0 8px 25px;">
                            <img src="${q.qImgData || q.qImg}" style="max-height: 150px; width: auto; border: 1px solid #000000; padding: 1px;">
                        </div>
                    `;
                }

                printLayoutHTML += `
                        <div class="pdf-options-grid">
                            <div><strong>(A)</strong> ${q.options?.A || q.optA || ''}</div>
                            <div><strong>(B)</strong> ${q.options?.B || q.optB || ''}</div>
                            <div><strong>(C)</strong> ${q.options?.C || q.optC || ''}</div>
                            <div><strong>(D)</strong> ${q.options?.D || q.optD || ''}</div>
                        </div>
                    </div>
                `;
            });

            printLayoutHTML += `
                    </div>
                    <div style="text-align: center; margin-top: 45px; font-size: 11px; font-weight: bold; border-top: 1px dashed #000000; padding-top: 12px; font-family: monospace; color: #000; letter-spacing: 1px;">
                        --- Best Of Luck ---
                    </div>
                </div>
            `;

            // CRITICAL FIX: Direct DOM swapping avoids html2canvas engine parsing vulnerabilities entirely
            const standardPageStateBackup = mainDashboardLayoutNode.innerHTML;
            
            // Swap live view state to the crisp printable template sheet
            mainDashboardLayoutNode.style.display = 'none';
            printDomWorkspaceNode.innerHTML = printLayoutHTML;
            printDomWorkspaceNode.style.display = 'block';

            // Trigger system hardware thread execution directly
            window.print();

            // Revert layout configurations seamlessly after print or PDF export completion
            printDomWorkspaceNode.style.display = 'none';
            printDomWorkspaceNode.innerHTML = '';
            mainDashboardLayoutNode.style.display = 'block';

        } catch (printErr) {
            console.error("PDF download failure:", printErr);
            alert("Error running the automated download engine.");
        } finally {
            actionButton.disabled = false;
            actionButton.textContent = "Download PDF";
        }
    }

    async function enterExamEditConfigurationMode(e) {
        const targetId = e.target.getAttribute('data-id');
        try {
            const targetDocSnap = await window.getDoc(window.doc(window.db, "exams", targetId));
            if(!targetDocSnap.exists()) return;

            const examData = targetDocSnap.data();
            
            editingExamDocId.value = targetId;
            metaFormTitle.textContent = "Modify Assessment Profile Mode";
            publishExamBtn.textContent = "Update & Overwrite Exam Profile";
            cancelExamEditBtn.classList.remove('hidden');
            document.getElementById('bulkImportCardContainer').classList.add('hidden');

            document.getElementById('examTitle').value = examData.title;
            document.getElementById('examSubject').value = examData.subject;
            document.getElementById('examDuration').value = examData.duration;
            document.getElementById('examInstructions').value = examData.instructions;
            if (examNegativeMarks) examNegativeMarks.value = examData.negativeMarks !== undefined ? examData.negativeMarks : 0;
            
            if(examData.startTime) document.getElementById('examStart').value = examData.startTime.substring(0, 16);
            if(examData.endTime) document.getElementById('examEnd').value = examData.endTime.substring(0, 16);

            document.querySelectorAll('.std-checkbox').forEach(cb => {
                if(examData.standards) {
                    cb.checked = examData.standards.includes(cb.value);
                } else {
                    cb.checked = (examData.standard === cb.value);
                }
            });

            localQuestionStack = examData.questions ? [...examData.questions] : [];
            activeEditingQuestionIndex = -1; // Reset question editor track safely upon switching profiles
            refreshPreviewMatrix();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch(err) { alert("Error reading record dataset."); }
    }

    function resetCreationWorkspaceState() {
        editingExamDocId.value = "";
        metaFormTitle.textContent = "Exam Parameters";
        publishExamBtn.textContent = "Commit & Publish Final Exam";
        cancelExamEditBtn.classList.add('hidden');
        document.getElementById('bulkImportCardContainer').classList.remove('hidden');

        examMetaForm.reset();
        
        optA.value = "";
        optB.value = "";
        optC.value = "";
        optD.value = "";
        if(uploadQImgFile) uploadQImgFile.value = "";
        if(uploadOptAImgFile) uploadOptAImgFile.value = "";
        if(uploadOptBImgFile) uploadOptBImgFile.value = "";
        if(uploadOptCImgFile) uploadOptCImgFile.value = "";
        if(uploadOptDImgFile) uploadOptDImgFile.value = "";
        quillRichEditorInstance.setText('');

        const formSubmitButton = questionForm.querySelector('button[type="submit"]');
        if(formSubmitButton) {
            formSubmitButton.textContent = "Queue Question Item";
            formSubmitButton.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors";
        }

        if(examNegativeMarks) examNegativeMarks.value = 0;
        document.querySelectorAll('.std-checkbox').forEach(cb => cb.checked = false);
        localQuestionStack = [];
        activeEditingQuestionIndex = -1;
        refreshPreviewMatrix();
    }

    cancelExamEditBtn.addEventListener('click', resetCreationWorkspaceState);

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const lines = evt.target.result.split(/\r?\n/);
            let successfullyImportedRowsCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const currentLineTextRow = lines[i].trim();
                if (!currentLineTextRow) continue;

                const columns = currentLineTextRow.split(',');
                if (columns.length >= 7) {
                    localQuestionStack.push({
                        id: "Q_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "_" + i,
                        text: columns[0].trim(),
                        qImgData: "", 
                        options: { A: columns[1].trim(), B: columns[2].trim(), C: columns[3].trim(), D: columns[4].trim() },
                        optImagesData: { A: "", B: "", C: "", D: "" },
                        correct: columns[5].trim().toUpperCase(),
                        marks: parseInt(columns[6].trim()) || 1
                    });
                    successfullyImportedRowsCount++;
                }
            }
            alert(`Bulk Upload Finished! Loaded ${successfullyImportedRowsCount} items without images.`);
            csvFileInput.value = "";
            refreshPreviewMatrix();
        };
        reader.readAsText(file);
    });

    questionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const richHTMLQuestionTextContent = quillRichEditorInstance.getSemanticHTML().trim();
        if (quillRichEditorInstance.getText().trim().length === 0) {
            alert("Error: Question content cannot be left empty.");
            return;
        }

        const submitBtn = questionForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Compressing Assets...";

        // Compress file selection matrices sequentially
        const base64QImg = await compressImageToInlineBase64String(uploadQImgFile);
        const base64OptA = await compressImageToInlineBase64String(uploadOptAImgFile);
        const base64OptB = await compressImageToInlineBase64String(uploadOptBImgFile);
        const base64OptC = await compressImageToInlineBase64String(uploadOptCImgFile);
        const base64OptD = await compressImageToInlineBase64String(uploadOptDImgFile);

        const questionPayloadNode = {
            id: activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].id : ("Q_" + Date.now() + "_" + Math.floor(Math.random() * 1000)),
            text: richHTMLQuestionTextContent,
            qImgData: base64QImg || (activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].qImgData : ""), 
            options: { A: optA.value.trim(), B: optB.value.trim(), C: optC.value.trim(), D: optD.value.trim() },
            optImagesData: { 
                A: base64OptA || (activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].optImagesData?.A : ""), 
                B: base64OptB || (activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].optImagesData?.B : ""), 
                C: base64OptC || (activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].optImagesData?.C : ""), 
                D: base64OptD || (activeEditingQuestionIndex > -1 ? localQuestionStack[activeEditingQuestionIndex].optImagesData?.D : "") 
            }, 
            correct: correctOpt.value,
            marks: parseInt(qMarks.value) || 1
        };

        if (activeEditingQuestionIndex > -1) {
            localQuestionStack[activeEditingQuestionIndex] = questionPayloadNode;
            activeEditingQuestionIndex = -1; 
            submitBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors";
        } else {
            localQuestionStack.push(questionPayloadNode);
        }

        optA.value = "";
        optB.value = "";
        optC.value = "";
        optD.value = "";
        if(uploadQImgFile) uploadQImgFile.value = "";
        if(uploadOptAImgFile) uploadOptAImgFile.value = "";
        if(uploadOptBImgFile) uploadOptBImgFile.value = "";
        if(uploadOptCImgFile) uploadOptCImgFile.value = "";
        if(uploadOptDImgFile) uploadOptDImgFile.value = "";
        quillRichEditorInstance.setText('');
        
        submitBtn.disabled = false;
        submitBtn.textContent = "Queue Question Item";
        refreshPreviewMatrix();
    });

    function refreshPreviewMatrix() {
        questionCounter.textContent = `Queued Questions: ${localQuestionStack.length}`;
        if(localQuestionStack.length === 0) {
            questionsPreviewList.innerHTML = `<p class="text-sm text-gray-500 py-4 text-center">No structural components queued inside the current scope stack framework.</p>`;
            return;
        }

        questionsPreviewList.innerHTML = "";
        localQuestionStack.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = "py-4 first:pt-0 text-sm space-y-2";
            
            const qThumbHTML = item.qImgData ? `<div class="mt-1"><img src="${item.qImgData}" class="h-12 w-auto border border-gray-600 rounded bg-gray-900 object-contain"></div>` : "";

            div.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="space-y-1 max-w-[75%]">
                        <span class="font-semibold text-white">Q${index + 1}: <div class="inline-block border-l border-gray-700 pl-1 text-gray-200">${item.text}</div> <span class="text-blue-400 ml-1">(${item.marks} M)</span></span>
                        ${qThumbHTML}
                    </div>
                    <div class="flex items-center space-x-2 shrink-0">
                        <button class="edit-stack-btn text-amber-400 hover:text-amber-500 font-medium text-xs bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50" data-idx="${index}">Edit</button>
                        <button class="remove-stack-btn text-red-400 hover:text-red-500 font-medium text-xs bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50" data-idx="${index}">Remove</button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-400 font-mono pl-2">
                    <div class="${item.correct==='A'?'text-green-400 font-bold':''}">A: ${item.options.A} ${item.optImagesData?.A ? '📷':''}</div>
                    <div class="${item.correct==='B'?'text-green-400 font-bold':''}">B: ${item.options.B} ${item.optImagesData?.B ? '📷':''}</div>
                    <div class="${item.correct==='C'?'text-green-400 font-bold':''}">C: ${item.options.C} ${item.optImagesData?.C ? '📷':''}</div>
                    <div class="${item.correct==='D'?'text-green-400 font-bold':''}">D: ${item.options.D} ${item.optImagesData?.D ? '📷':''}</div>
                </div>
            `;
            questionsPreviewList.appendChild(div);
        });

        document.querySelectorAll('.edit-stack-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const indexTargetPointer = parseInt(ev.target.getAttribute('data-idx'));
                activeEditingQuestionIndex = indexTargetPointer;
                const targetedNodeStructure = localQuestionStack[indexTargetPointer];

                quillRichEditorInstance.clipboard.dangerouslyPasteHTML(targetedNodeStructure.text);
                optA.value = targetedNodeStructure.options.A;
                optB.value = targetedNodeStructure.options.B;
                optC.value = targetedNodeStructure.options.C;
                optD.value = targetedNodeStructure.options.D;
                correctOpt.value = targetedNodeStructure.correct;
                qMarks.value = targetedNodeStructure.marks;

                if(uploadQImgFile) uploadQImgFile.value = "";
                if(uploadOptAImgFile) uploadOptAImgFile.value = "";
                if(uploadOptBImgFile) uploadOptBImgFile.value = "";
                if(uploadOptCImgFile) uploadOptCImgFile.value = "";
                if(uploadOptDImgFile) uploadOptDImgFile.value = "";

                const submitBtn = questionForm.querySelector('button[type="submit"]');
                if(submitBtn) {
                    submitBtn.textContent = `Update Question #${indexTargetPointer + 1} ✓`;
                    submitBtn.className = "w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-md";
                }

                questionForm.scrollIntoView({ behavior: 'smooth' });
            });
        });

        document.querySelectorAll('.remove-stack-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const targetRemovalIndex = parseInt(ev.target.getAttribute('data-idx'));
                if (activeEditingQuestionIndex === targetRemovalIndex) {
                    activeEditingQuestionIndex = -1;
                    const submitBtn = questionForm.querySelector('button[type="submit"]');
                    if(submitBtn) {
                        submitBtn.textContent = "Queue Question Item";
                        submitBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors";
                    }
                    questionForm.reset();
                    quillRichEditorInstance.setText('');
                } else if (activeEditingQuestionIndex > targetRemovalIndex) {
                    activeEditingQuestionIndex--; 
                }
                localQuestionStack.splice(targetRemovalIndex, 1);
                refreshPreviewMatrix();
            });
        });
    }

    publishExamBtn.addEventListener('click', async () => {
        if(!examMetaForm.checkValidity()) {
            examMetaForm.reportValidity();
            return;
        }

        const targetStandardsArray = [];
        document.querySelectorAll('.std-checkbox:checked').forEach(cb => { targetStandardsArray.push(cb.value); });

        if(targetStandardsArray.length === 0) {
            alert("Configuration Error: Please select at least 1 Target Standard checkbox.");
            return;
        }

        if(localQuestionStack.length === 0) {
            alert("MCQ Array payload document contains zero objects.");
            return;
        }

        if(!confirm("Are you sure you want to save this exam dataset?")) return;

        publishExamBtn.disabled = true;
        const totalCalculatedMarks = localQuestionStack.reduce((acc, obj) => acc + obj.marks, 0);
        const activeDocId = editingExamDocId.value;

        const examPayloadSchema = {
            title: document.getElementById('examTitle').value.trim(),
            standards: targetStandardsArray,
            standard: targetStandardsArray[0],
            subject: document.getElementById('examSubject').value.trim(),
            duration: parseInt(document.getElementById('examDuration').value) || 15,
            negativeMarks: parseFloat(examNegativeMarks.value) || 0,
            startTime: new Date(document.getElementById('examStart').value).toISOString(),
            endTime: new Date(document.getElementById('examEnd').value).toISOString(),
            instructions: document.getElementById('examInstructions').value.trim(),
            totalMarks: totalCalculatedMarks,
            questions: localQuestionStack, 
            published: true
        };

        try {
            if(activeDocId) {
                const distinctRefTargetLocation = window.doc(window.db, "exams", activeDocId);
                await window.updateDoc(distinctRefTargetLocation, examPayloadSchema);
                alert("Success! The existing examination profile has been updated live inside the database.");
            } else {
                examPayloadSchema.createdAt = new Date().toISOString();
                await window.addDoc(window.collection(window.db, "exams"), examPayloadSchema);
                alert("Success! A new examination schema has been successfully compiled and published.");
            }
            
            resetCreationWorkspaceState();
            loadExamsInventoryDirectory();

        } catch (error) { alert("Error committing schema files to database targets."); }
        finally {
            publishExamBtn.disabled = false;
        }
    });
});