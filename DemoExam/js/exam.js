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
                options.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-500">No active exam schemas registered yet.</td></tr>`;
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
                    <td class="py-3.5 px-2 text-right">
                        <button class="load-exam-edit-btn bg-blue-900/50 hover:bg-blue-800 border border-blue-700/50 px-3 py-1 rounded text-xs font-bold text-blue-200" data-id="${doc.id}">Edit / Modify</button>
                    </td>
                `;
                examsInventoryTableBodyOutlet.appendChild(tr);
            });

            document.querySelectorAll('.load-exam-edit-btn').forEach(btn => {
                btn.addEventListener('click', enterExamEditConfigurationMode);
            });

        } catch(err) { console.error(err); }
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
            // Retain pre-existing asset string configurations if no fresh file stream is uploaded during modifications
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
            // Overwrite item payload data at the specific active editing index block pointer position
            localQuestionStack[activeEditingQuestionIndex] = questionPayloadNode;
            activeEditingQuestionIndex = -1; // Clear editing pipeline tracking variable
            submitBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors";
        } else {
            // Append fresh data matrix node straight onto compiled runtime data structure array
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

        // Bind Question Modification Listener Hooks
        document.querySelectorAll('.edit-stack-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const indexTargetPointer = parseInt(ev.target.getAttribute('data-idx'));
                activeEditingQuestionIndex = indexTargetPointer;
                const targetedNodeStructure = localQuestionStack[indexTargetPointer];

                // Load database values back up into front-end visual workspace containers
                quillRichEditorInstance.clipboard.dangerouslyPasteHTML(targetedNodeStructure.text);
                optA.value = targetedNodeStructure.options.A;
                optB.value = targetedNodeStructure.options.B;
                optC.value = targetedNodeStructure.options.C;
                optD.value = targetedNodeStructure.options.D;
                correctOpt.value = targetedNodeStructure.correct;
                qMarks.value = targetedNodeStructure.marks;

                // Clear input element cached stream references during initial editing steps
                if(uploadQImgFile) uploadQImgFile.value = "";
                if(uploadOptAImgFile) uploadOptAImgFile.value = "";
                if(uploadOptBImgFile) uploadOptBImgFile.value = "";
                if(uploadOptCImgFile) uploadOptCImgFile.value = "";
                if(uploadOptDImgFile) uploadOptDImgFile.value = "";

                // Shift Submit Button configuration layout parameters to show modification state
                const submitBtn = questionForm.querySelector('button[type="submit"]');
                if(submitBtn) {
                    submitBtn.textContent = `Update Question #${indexTargetPointer + 1} ✓`;
                    submitBtn.className = "w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-md";
                }

                // Smooth viewport scrolling up to manual form constructor matrix block
                questionForm.scrollIntoView({ behavior: 'smooth' });
            });
        });

        document.querySelectorAll('.remove-stack-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const targetRemovalIndex = parseInt(ev.target.getAttribute('data-idx'));
                // Safely handle resetting active modification indexes if editing target row gets deleted
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
                // FIXED: Resolved duplicate window.doc nested wrapper references to map direct to correct target path string structures
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