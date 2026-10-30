// Accessibility & Anti-Flicker Synchronous Check
(function() {
    const theme = localStorage.getItem('pc_theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if (document.body) document.body.classList.add('dark-mode');
    }
    const size = parseInt(localStorage.getItem('pc_font_size') || '100');
    if (size !== 100) {
        document.documentElement.style.fontSize = size + '%';
    }
})();

// Global Security & Sanitization Helper
window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5iGfkr0hMNEgXjLruxQg-LM1Igu41gBU",
  authDomain: "paradigm-classes.firebaseapp.com",
  projectId: "paradigm-classes",
  storageBucket: "paradigm-classes.firebasestorage.app",
  messagingSenderId: "999886632912",
  appId: "1:999886632912:web:eb991af6f847f20142ebd5",
  measurementId: "G-4G99FH33J4"
};

// Initialize Firebase using global window.firebase from compat imports
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Helper to fetch list from a specific document
async function getList(docId) {
    try {
        const snapshot = await db.collection('appData').doc(docId).get();
        if (snapshot.exists) {
            return snapshot.data().list || [];
        }
        return [];
    } catch (error) {
        console.error(`🔥 Firebase Permission Error getting ${docId}:`, error.message);
        if(docId !== 'admin') {
            alert(`Database Read Error: Firebase is blocking data access. Please check your internet connection or Firestore rules.\n\n${error.message}`);
        }
        throw error; // Stop execution to prevent empty arrays from overwriting existing data
    }
}

// Helper to save list to a specific document
async function setList(docId, list) {
    try {
        await db.collection('appData').doc(docId).set({ list });
    } catch (error) {
        console.error(`🔥 Firebase Permission Error setting ${docId}:`, error.message);
        alert(`Database Write Error: Firebase is blocking data modifications. Please set Firestore Security Rules to 'true'.\n\n${error.message}`);
    }
}

// Automatic coin sync helper for students who have watched video lectures
async function syncStudentCoins(students) {
    if (!students || !Array.isArray(students) || students.length === 0) return students;
    let isModified = false;
    students.forEach(student => {
        const completed = Array.from(new Set(student.completedLectures || []));
        const rewarded = new Set(student.rewardedLectures || []);
        let unrewardedCount = 0;
        
        completed.forEach(key => {
            if (!rewarded.has(key)) {
                rewarded.add(key);
                unrewardedCount++;
            }
        });

        if (unrewardedCount > 0) {
            student.rewardedLectures = Array.from(rewarded);
            student.coins = (student.coins || 0) + (unrewardedCount * 10);
            isModified = true;
        }
    });

    if (isModified) {
        try {
            await setList('students', students);
        } catch (e) {
            console.error("Auto coin backfill save failed:", e);
        }
    }
    return students;
}

const DB = {
    getStudents: async () => {
        const students = await getList('students');
        return await syncStudentCoins(students);
    },
    setStudents: async (students) => await setList('students', students),
    
    getAlumni: async () => await getList('alumni'),
    setAlumni: async (alumni) => await setList('alumni', alumni),
    
    getTeachers: async () => await getList('teachers'),
    setTeachers: async (teachers) => await setList('teachers', teachers),
    
    getSalaries: async () => await getList('salaries'),
    setSalaries: async (salaries) => await setList('salaries', salaries),

    getAttendance: async () => await getList('attendance'),
    setAttendance: async (attendance) => await setList('attendance', attendance),

    getCourses: async () => await getList('courses'),
    setCourses: async (courses) => await setList('courses', courses),
    
    getSlides: async () => await getList('slides'),
    setSlides: async (slides) => await setList('slides', slides),

    getSlideSections: async () => {
        try {
            const list = await getList('slideSections');
            if (!list || list.length === 0) {
                const defaultSections = [
                    { id: "IX", title: "Class IX Slides" },
                    { id: "X", title: "Class X Slides" },
                    { id: "XI", title: "Class XI Slides" },
                    { id: "XII", title: "Class XII Slides" },
                    { id: "MISC", title: "Miscellaneous (MISC) Slides" }
                ];
                await setList('slideSections', defaultSections);
                return defaultSections;
            }
            return list;
        } catch (e) {
            console.error("Error getting slideSections:", e);
            return [
                { id: "IX", title: "Class IX Slides" },
                { id: "X", title: "Class X Slides" },
                { id: "XI", title: "Class XI Slides" },
                { id: "XII", title: "Class XII Slides" },
                { id: "MISC", title: "Miscellaneous (MISC) Slides" }
            ];
        }
    },
    setSlideSections: async (sections) => await setList('slideSections', sections),

    getNoteSections: async () => {
        try {
            const list = await getList('noteSections');
            if (!list || list.length === 0) {
                const defaultNoteSections = [
                    { id: "sec_ix_chem", title: "Chemistry (Class IX)" },
                    { id: "sec_ix_phy", title: "Physics (Class IX)" },
                    { id: "sec_ix_bio", title: "Biology (Class IX)" },
                    { id: "sec_x_chem", title: "Chemistry (Class X)" },
                    { id: "sec_x_phy", title: "Physics (Class X)" },
                    { id: "sec_xii_phy_ch1", title: "Class XII Physics - CH 1 Electric Fields and Charges" },
                    { id: "sec_xii_phy_ch2", title: "Class XII Physics - CH 2 Electrostatic Potential and Capacitance" }
                ];
                await setList('noteSections', defaultNoteSections);
                return defaultNoteSections;
            }
            return list;
        } catch (e) {
            console.error("Error getting noteSections:", e);
            return [
                { id: "sec_ix_chem", title: "Chemistry (Class IX)" },
                { id: "sec_ix_phy", title: "Physics (Class IX)" },
                { id: "sec_ix_bio", title: "Biology (Class IX)" },
                { id: "sec_x_chem", title: "Chemistry (Class X)" },
                { id: "sec_x_phy", title: "Physics (Class X)" },
                { id: "sec_xii_phy_ch1", title: "Class XII Physics - CH 1 Electric Fields and Charges" },
                { id: "sec_xii_phy_ch2", title: "Class XII Physics - CH 2 Electrostatic Potential and Capacitance" }
            ];
        }
    },
    setNoteSections: async (sections) => await setList('noteSections', sections),

    getNotes: async () => {
        try {
            const list = await getList('notes');
            if (!list || list.length === 0) {
                const defaultNotes = [
                    { id: "n1", sectionId: "sec_ix_chem", title: "Chemistry CH 3 Atoms & Molecules", link: "Notes/IX_SCIENCE/ATOMSANDMOLECULES.pdf" },
                    { id: "n2", sectionId: "sec_ix_chem", title: "Chemistry CH 4 Structure of Atom", link: "Notes/IX_SCIENCE/STRUCTUREOFATOMS.pdf" },
                    { id: "n3", sectionId: "sec_ix_phy", title: "Physics CH 3 Gravitation", link: "Notes/IX_SCIENCE/GRAVITATION.pdf" },
                    { id: "n4", sectionId: "sec_ix_phy", title: "Physics CH 4 Work, Energy & Power", link: "Notes/IX_SCIENCE/WORKENERGYANDPOWER.pdf" },
                    { id: "n5", sectionId: "sec_ix_bio", title: "Biology CH 1 The Fundamental Unit of Life - Tissues", link: "Notes/IX_SCIENCE/TISSUE.pdf" },
                    { id: "n6", sectionId: "sec_ix_bio", title: "Biology CH 5 Why Do We Fall Ill?", link: "Notes/IX_SCIENCE/WHYDOWEFALLILL.pdf" },
                    { id: "n7", sectionId: "sec_x_chem", title: "Chemistry CH 1 Chemical Reactions & Equations", link: "notes/X_Science/Chemistry CH 1 Chemical Reactions & Equations.pdf" },
                    { id: "n8", sectionId: "sec_x_chem", title: "Chemistry CH 2 Acids, Bases & Salts", link: "notes/X_Science/Chemistry CH 2 Acids, Bases & Salts.pdf" },
                    { id: "n9", sectionId: "sec_x_chem", title: "Chemistry CH 3 Metals & Non Metals", link: "notes/X_Science/Chemistry CH 3 Metals & Non Metals.pdf" },
                    { id: "n10", sectionId: "sec_x_chem", title: "Chemistry CH 4 Carbon & Its Compounds", link: "notes/X_Science/Chemistry CH 4 Carbon & Its Compounds.pdf" },
                    { id: "n11", sectionId: "sec_x_chem", title: "Carbon and Its Compounds (My Personal)", link: "notes/X_Science/Carbon & Its Compounds.pdf" },
                    { id: "n12", sectionId: "sec_x_phy", title: "Physics CH 1 Electricity", link: "notes/X_Science/Physics CH 1 Electricity.pdf" },
                    { id: "n13", sectionId: "sec_x_phy", title: "Physics CH 2 Magnetic Effect of Electric Current", link: "notes/X_Science/Physics CH 2 Magnetic Effect of Electric Current.pdf" },
                    { id: "n14", sectionId: "sec_x_phy", title: "Physics CH 3 Reflection", link: "notes/X_Science/Physics CH 3 Reflection.pdf" },
                    { id: "n15", sectionId: "sec_x_phy", title: "Physics CH 4 Refraction", link: "notes/X_Science/Physics CH 4 Refraction.pdf" },
                    { id: "n16", sectionId: "sec_x_phy", title: "Physics CH 5 Eye & the Colourful World", link: "notes/X_Science/Physics CH 5 Eye & the Colourful World.pdf" },
                    { id: "n17", sectionId: "sec_xii_phy_ch1", title: "Chemistry CH 1 Chemical Reactions & Equations", link: "notes/X_Science/Chemistry CH 1 Chemical Reactions & Equations.pdf" },
                    { id: "n18", sectionId: "sec_xii_phy_ch2", title: "Physics CH 1 Electricity", link: "notes/X_Science/Physics CH 1 Electricity.pdf" }
                ];
                await setList('notes', defaultNotes);
                return defaultNotes;
            }
            return list;
        } catch (e) {
            console.error("Error getting notes:", e);
            return [];
        }
    },
    setNotes: async (notes) => await setList('notes', notes),

    getVideoLectures: async () => {
        try {
            const list = await getList('videoLectures');
            if (list.length === 0) {
                const response = await fetch('js/default_lectures.json');
                const defaultList = await response.json();
                await setList('videoLectures', defaultList);
                return defaultList;
            }
            return list;
        } catch (e) {
            console.error("Error fetching videoLectures:", e);
            return [];
        }
    },
    setVideoLectures: async (lectures) => await setList('videoLectures', lectures),
    
    getAdmin: async () => {
        try {
            const snapshot = await db.collection('appData').doc('admin').get();
            if (snapshot.exists) {
                return snapshot.data();
            }
            return { id: "admin", password: "admin123" };
        } catch (e) {
            throw e;
        }
    },
    setAdmin: async (admin) => {
        await db.collection('appData').doc('admin').set(admin);
    },

    getTests: async () => await getList('tests'),
    setTests: async (tests) => await setList('tests', tests),

    getAssignments: async () => {
        try {
            const list = await getList('assignments');
            if (!list || list.length === 0) {
                const defaultAssignments = [
                    {
                        id: "asg_01",
                        title: "Class X Science - Carbon Compounds Balancing & Isomerism",
                        subject: "Chemistry",
                        targetClass: "X",
                        dueDate: "2026-11-10",
                        description: "Solve NCERT exercise questions 1 to 12 along with drawing all structural isomers of Pentane and Hexane. Submit clear step-by-step solutions.",
                        resourceLink: "Notes/X_Science/Carbon & Its Compounds.pdf",
                        createdAt: "2026-10-25",
                        createdBy: "Teacher Shneh Rawat",
                        submissions: []
                    },
                    {
                        id: "asg_02",
                        title: "Class XII Physics - Gauss Law & Electrostatic Potential Numericals",
                        subject: "Physics",
                        targetClass: "XII",
                        dueDate: "2026-11-12",
                        description: "Complete numerical problems on electric flux through cylinders and spherical shells from Chapter 1 & 2 workbook.",
                        resourceLink: "notes/X_Science/Physics CH 1 Electricity.pdf",
                        createdAt: "2026-10-26",
                        createdBy: "Teacher Shneh Rawat",
                        submissions: []
                    },
                    {
                        id: "asg_03",
                        title: "Class XI Mathematics - Relations, Functions & Domain Calculation",
                        subject: "Mathematics",
                        targetClass: "XI",
                        dueDate: "2026-11-15",
                        description: "Determine domain and range for given square-root and fractional rational functions. Verify with graphical sketch.",
                        resourceLink: "",
                        createdAt: "2026-10-27",
                        createdBy: "Teacher Shneh Rawat",
                        submissions: []
                    },
                    {
                        id: "asg_04",
                        title: "Class IX Science - Atoms and Molecules Mole Concept Sheet",
                        subject: "Chemistry",
                        targetClass: "IX",
                        dueDate: "2026-11-14",
                        description: "Calculate molar masses and number of Avogadro particles in given gram samples from Chapter 3.",
                        resourceLink: "Notes/IX_SCIENCE/ATOMSANDMOLECULES.pdf",
                        createdAt: "2026-10-28",
                        createdBy: "Teacher Shneh Rawat",
                        submissions: []
                    }
                ];
                await setList('assignments', defaultAssignments);
                return defaultAssignments;
            }
            return list;
        } catch (e) {
            console.error("Error getting assignments:", e);
            return [];
        }
    },
    setAssignments: async (assignments) => await setList('assignments', assignments),

    getOnlineAssessments: async () => {
        try {
            const list = await getList('onlineAssessments');
            if (!list || list.length === 0) {
                const defaultAssessments = [
                    {
                        id: "exam_01",
                        title: "Class X Science: Chemical Reactions & Equations Mock Assessment",
                        targetClass: "X",
                        subject: "Chemistry",
                        durationMinutes: 15,
                        totalMarks: 20,
                        negativeMarking: 0,
                        published: true,
                        questions: [
                            {
                                id: 1,
                                questionText: "Which of the following is an example of an exothermic displacement reaction?",
                                options: [
                                    "Reaction of Calcium oxide with water",
                                    "Reaction of Iron with Copper sulphate solution",
                                    "Thermite reaction (Fe2O3 + 2Al -> 2Fe + Al2O3)",
                                    "Decomposition of Lead nitrate"
                                ],
                                correctOption: 2,
                                explanation: "The reaction of Iron(III) oxide with Aluminium is a displacement reaction that releases tremendous heat, melting the iron produced (Thermite process)."
                            },
                            {
                                id: 2,
                                questionText: "What is the oxidation state change of Manganese in: MnO2 + 4HCl -> MnCl2 + Cl2 + 2H2O?",
                                options: [
                                    "+4 to +2 (Reduced)",
                                    "+2 to +4 (Oxidized)",
                                    "0 to +2",
                                    "+4 to 0"
                                ],
                                correctOption: 0,
                                explanation: "MnO2 has Mn in +4 oxidation state, which changes to MnCl2 (+2). Manganese gains electrons and is therefore reduced."
                            },
                            {
                                id: 3,
                                questionText: "Corrosion of copper forms a green coating of which compound?",
                                options: [
                                    "CuSO4",
                                    "Basic copper carbonate [CuCO3·Cu(OH)2]",
                                    "CuO",
                                    "CuCl2"
                                ],
                                correctOption: 1,
                                explanation: "Copper reacts with moist CO2 in air to form a green coating of basic copper carbonate [CuCO3·Cu(OH)2]."
                            },
                            {
                                id: 4,
                                questionText: "Which gas is flushed in bags of potato chips to prevent rancidity?",
                                options: [
                                    "Oxygen",
                                    "Carbon dioxide",
                                    "Nitrogen",
                                    "Argon"
                                ],
                                correctOption: 2,
                                explanation: "Nitrogen is an unreactive inert gas that replaces oxygen in sealed packaging to prevent oxidation and rancidity of oils."
                            },
                            {
                                id: 5,
                                questionText: "When Ferrous sulphate crystals (green) are heated in a dry test tube, what color residue remains?",
                                options: [
                                    "White (Anhydrous FeSO4)",
                                    "Reddish brown (Fe2O3)",
                                    "Black (FeO)",
                                    "Yellow (FeCl3)"
                                ],
                                correctOption: 1,
                                explanation: "2FeSO4(s) --heat--> Fe2O3(s) + SO2(g) + SO3(g). Fe2O3 is reddish-brown ferric oxide."
                            }
                        ],
                        attempts: []
                    },
                    {
                        id: "exam_02",
                        title: "Class XII Physics: Electrostatics & Coulomb's Law Speed Test",
                        targetClass: "XII",
                        subject: "Physics",
                        durationMinutes: 20,
                        totalMarks: 20,
                        negativeMarking: 0.25,
                        published: true,
                        questions: [
                            {
                                id: 1,
                                questionText: "The electric flux through a closed Gaussian surface enclosing an electric dipole is:",
                                options: [
                                    "q / ε0",
                                    "2q / ε0",
                                    "Zero",
                                    "Infinity"
                                ],
                                correctOption: 2,
                                explanation: "By Gauss's Law, total electric flux equals net enclosed charge divided by ε0. For an electric dipole, q_net = (+q) + (-q) = 0. Therefore, flux = 0."
                            },
                            {
                                id: 2,
                                questionText: "Two point charges +q and +4q are separated by a distance d. Where should a third charge Q be placed on the line joining them so that the system remains in equilibrium?",
                                options: [
                                    "d/3 from +q",
                                    "d/2 from +q",
                                    "2d/3 from +q",
                                    "d/4 from +q"
                                ],
                                correctOption: 0,
                                explanation: "At distance x from +q: k*q*Q / x^2 = k*(4q)*Q / (d-x)^2 => (d-x)^2 = 4x^2 => d - x = 2x => 3x = d => x = d/3."
                            },
                            {
                                id: 3,
                                questionText: "What is the SI unit of Electric Permittivity of free space (ε0)?",
                                options: [
                                    "N·m²/C²",
                                    "C²/(N·m²)",
                                    "N/C",
                                    "V/m"
                                ],
                                correctOption: 1,
                                explanation: "From F = q1*q2 / (4πε0 r²), ε0 = q1*q2 / (4π F r²), which yields units of C² / (N·m²)."
                            },
                            {
                                id: 4,
                                questionText: "Inside a uniformly charged hollow spherical conductor, the electric field intensity E is:",
                                options: [
                                    "Uniform and non-zero",
                                    "Zero at all interior points",
                                    "Inversely proportional to distance squared",
                                    "Proportional to radius"
                                ],
                                correctOption: 1,
                                explanation: "There is no enclosed charge inside any concentric Gaussian surface interior to a hollow conductor, so E = 0 everywhere inside."
                            },
                            {
                                id: 5,
                                questionText: "The work done in moving an electron between two points on an equipotential surface is:",
                                options: [
                                    "1.6 × 10^-19 J",
                                    "Dependent on the path taken",
                                    "Zero",
                                    "Equal to the electric potential"
                                ],
                                correctOption: 2,
                                explanation: "Work done W = q * ΔV. On an equipotential surface, ΔV = 0, so W = 0."
                            }
                        ],
                        attempts: []
                    },
                    {
                        id: "exam_03",
                        title: "Class XI Mathematics: Functions, Domain & Sets Assessment",
                        targetClass: "XI",
                        subject: "Mathematics",
                        durationMinutes: 15,
                        totalMarks: 20,
                        negativeMarking: 0,
                        published: true,
                        questions: [
                            {
                                id: 1,
                                questionText: "What is the domain of the real-valued function f(x) = √(9 - x²)?",
                                options: [
                                    "(-3, 3)",
                                    "[-3, 3]",
                                    "(-∞, -3] ∪ [3, ∞)",
                                    "[0, 3]"
                                ],
                                correctOption: 1,
                                explanation: "For f(x) to be real, 9 - x² ≥ 0 => x² ≤ 9 => -3 ≤ x ≤ 3. Domain is [-3, 3]."
                            },
                            {
                                id: 2,
                                questionText: "If A and B are two disjoint non-empty sets, then n(A ∩ B) is equal to:",
                                options: [
                                    "0",
                                    "n(A) + n(B)",
                                    "1",
                                    "Undefined"
                                ],
                                correctOption: 0,
                                explanation: "Disjoint sets have no elements in common, meaning A ∩ B = ∅, so n(A ∩ B) = 0."
                            },
                            {
                                id: 3,
                                questionText: "The range of the function f(x) = |x - 2| / (x - 2) for x ≠ 2 is:",
                                options: [
                                    "All Real Numbers (R)",
                                    "[-1, 1]",
                                    "{-1, 1}",
                                    "{0, 1}"
                                ],
                                correctOption: 2,
                                explanation: "For x > 2, (x-2)/(x-2) = +1. For x < 2, -(x-2)/(x-2) = -1. Hence range is the discrete set {-1, 1}."
                            },
                            {
                                id: 4,
                                questionText: "If a set S has 4 elements, how many non-empty proper subsets does it possess?",
                                options: [
                                    "16",
                                    "15",
                                    "14",
                                    "12"
                                ],
                                correctOption: 2,
                                explanation: "Total subsets = 2^4 = 16. Excluding the empty set and the set itself (improper), non-empty proper subsets = 16 - 2 = 14."
                            },
                            {
                                id: 5,
                                questionText: "Let f(x) = x² and g(x) = 2x + 1. The composite function (f ∘ g)(x) is:",
                                options: [
                                    "2x² + 1",
                                    "4x² + 4x + 1",
                                    "4x² + 1",
                                    "2x² + 4x + 1"
                                ],
                                correctOption: 1,
                                explanation: "(f ∘ g)(x) = f(g(x)) = f(2x + 1) = (2x + 1)² = 4x² + 4x + 1."
                            }
                        ],
                        attempts: []
                    },
                    {
                        id: "exam_04",
                        title: "NDA Mathematics & GAT Speed Mock",
                        targetClass: "NDA",
                        subject: "NDA Prep",
                        durationMinutes: 20,
                        totalMarks: 25,
                        negativeMarking: 0.33,
                        published: true,
                        questions: [
                            {
                                id: 1,
                                questionText: "What is the value of (1 + i)^4 + (1 - i)^4?",
                                options: [
                                    "-8",
                                    "8",
                                    "-4",
                                    "0"
                                ],
                                correctOption: 0,
                                explanation: "(1+i)² = 2i, so (1+i)⁴ = (2i)² = -4. Similarly, (1-i)² = -2i, so (1-i)⁴ = (-2i)² = -4. Total = -4 + (-4) = -8."
                            },
                            {
                                id: 2,
                                questionText: "In a right-angled triangle ABC with right angle at B, tan A = 3/4. What is the value of sin C?",
                                options: [
                                    "3/5",
                                    "4/5",
                                    "3/4",
                                    "5/4"
                                ],
                                correctOption: 1,
                                explanation: "With tan A = 3/4, opposite is 3, adjacent is 4, hypotenuse is 5. Angle C has opposite side AB = 4. Hence sin C = 4/5."
                            },
                            {
                                id: 3,
                                questionText: "The headquarter of the Indian Naval Academy (INA) is located at:",
                                options: [
                                    "Khadakwasla, Pune",
                                    "Ezhimala, Kerala",
                                    "Dundigal, Hyderabad",
                                    "Dehradun, Uttarakhand"
                                ],
                                correctOption: 1,
                                explanation: "The Indian Naval Academy is located at Ezhimala, Kannur district, Kerala."
                            },
                            {
                                id: 4,
                                questionText: "What is the maximum number of acute angles a convex quadrilateral can possess?",
                                options: [
                                    "1",
                                    "2",
                                    "3",
                                    "4"
                                ],
                                correctOption: 2,
                                explanation: "The sum of interior angles is 360°. If it had 4 acute angles (< 90°), their sum would be < 360°, which is impossible. Thus, maximum is 3."
                            },
                            {
                                id: 5,
                                questionText: "Which article of the Indian Constitution deals with the Right to Equality before Law?",
                                options: [
                                    "Article 14",
                                    "Article 19",
                                    "Article 21",
                                    "Article 32"
                                ],
                                correctOption: 0,
                                explanation: "Article 14 ensures equality before the law and equal protection of laws within India."
                            }
                        ],
                        attempts: []
                    }
                ];
                await setList('onlineAssessments', defaultAssessments);
                return defaultAssessments;
            }
            return list;
        } catch (e) {
            console.error("Error getting onlineAssessments:", e);
            return [];
        }
    },
    setOnlineAssessments: async (assessments) => await setList('onlineAssessments', assessments),

    formatDate: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    },

    // currentUser remains in localStorage since it's session-based per physical device
    getCurrentUser: () => JSON.parse(localStorage.getItem('pc_currentUser') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('pc_currentUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('pc_currentUser'),

    getAnnouncement: async () => {
        try {
            const snapshot = await db.collection('appData').doc('announcement').get();
            if (snapshot.exists) {
                return snapshot.data() || { text: "", enabled: false };
            }
            return { text: "Welcome to Paradigm Classes! Admissions are now open for the academic session 2026-2027. Enroll today!", enabled: true };
        } catch (e) {
            console.error("Error getting announcement:", e.message);
            return { text: "", enabled: false };
        }
    },
    setAnnouncement: async (announcement) => {
        try {
            await db.collection('appData').doc('announcement').set(announcement);
        } catch (e) {
            console.error("Error setting announcement:", e.message);
            alert("Database Error setting announcement: " + e.message);
        }
    },

    getAuditLogs: async () => {
        try {
            const logs = await getList('auditLogs');
            return logs || [];
        } catch (e) {
            console.warn("Error getting audit logs:", e);
            return [];
        }
    },
    addAuditLog: async (action, details, user = 'admin') => {
        try {
            const logs = await getList('auditLogs');
            const newLog = {
                id: 'log_' + Date.now(),
                action,
                details,
                user,
                timestamp: new Date().toISOString()
            };
            logs.unshift(newLog);
            if (logs.length > 200) logs.length = 200; // keep last 200 logs
            await setList('auditLogs', logs);
            return newLog;
        } catch (e) {
            console.warn("Error recording audit log:", e);
        }
    },

    getClassAnnouncements: async () => {
        try {
            const list = await getList('classAnnouncements');
            return list || [];
        } catch (e) {
            console.warn("Error getting class announcements:", e);
            return [];
        }
    },
    setClassAnnouncements: async (announcements) => await setList('classAnnouncements', announcements),
    
    initData: async () => {
        try {
            // Only set default admin if the admin doc truly doesn't exist
            const snapshot = await db.collection('appData').doc('admin').get();
            if (!snapshot.exists) {
                await DB.setAdmin({ id: "admin", password: "admin123" });
            }
        } catch (e) {
            console.error("Firebase init check failed:", e.message);
            // Do not seed any dummy data to prevent accidental overwrites
        }
    }
};

// Dynamic Announcement Marquee Injector
async function initAnnouncementBanner() {
    try {
        const ann = await DB.getAnnouncement();
        if (ann && ann.enabled && ann.text && ann.text.trim().length > 0) {
            if (document.querySelector('.pc-marquee-banner')) return;

            const style = document.createElement('style');
            style.textContent = `
                .pc-marquee-banner {
                    background: linear-gradient(90deg, #1e3a8a 0%, #d97706 50%, #1e3a8a 100%);
                    color: white;
                    padding: 0.5rem 0;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    position: fixed;
                    left: 0;
                    right: 0;
                    z-index: 999; /* Positioned just below navbar z-index of 1000 so dropdowns overlap it */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
                    border-bottom: 2px solid #b45309;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    white-space: nowrap;
                }
                
                @keyframes pcMarqueeSmooth {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
                
                .pc-marquee-track {
                    display: inline-block;
                    white-space: nowrap;
                    padding-left: 100%;
                    animation: pcMarqueeSmooth 25s linear infinite;
                    will-change: transform;
                }
                
                .pc-marquee-banner:hover .pc-marquee-track {
                    animation-play-state: paused;
                }
                
                body.has-marquee {
                    padding-top: 36px !important; /* Safer body shift down using padding-top */
                }
            `;
            document.head.appendChild(style);

            const banner = document.createElement('div');
            banner.className = 'pc-marquee-banner';
            banner.innerHTML = `
                <div class="pc-marquee-track">📢 ${ann.text}</div>
            `;

            document.body.prepend(banner);
            document.body.classList.add('has-marquee');

            // Dynamic Positioning Adjustment Logic based on real-time navbar height
            function adjustMarqueePosition() {
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    banner.style.top = `${navbar.offsetHeight}px`;
                } else {
                    banner.style.top = '80px'; // Fallback
                }
            }

            // Run alignment instantly and on resize
            adjustMarqueePosition();
            window.addEventListener('resize', adjustMarqueePosition);
            
            // Re-verify after load/render cycles
            setTimeout(adjustMarqueePosition, 100);
            setTimeout(adjustMarqueePosition, 500);
        }
    } catch (e) {
        console.error("Announcement banner failed to load:", e);
    }
}

// Dynamic Auth Navbar sync
async function initNavbarAuth() {
    try {
        const user = DB.getCurrentUser();
        const navCta = document.querySelector('.nav-cta');
        const mobileMenu = document.getElementById('mobileMenu');
        const isDashboardPage = window.location.pathname.includes('-dashboard.html');

        // Helper to log out globally
        window.handleGlobalLogout = (e) => {
            if (e) e.preventDefault();
            DB.logout();
            window.location.href = 'index.html';
        };

        if (user && user.role) {
            // Logged in state
            const dashboardUrl = user.role === 'teacher' ? 'teacher-dashboard.html' : 
                                 (user.role === 'admin' ? 'admin-dashboard.html' : 
                                 (user.role === 'parent' ? 'parent-dashboard.html' : 'student-dashboard.html'));

            if (navCta && !isDashboardPage) {
                navCta.style.display = 'flex';
                navCta.style.gap = '0.5rem';
                navCta.style.alignItems = 'center';
                
                // Show both Dashboard and Logout buttons
                navCta.innerHTML = `
                    <a class="btn" href="${dashboardUrl}" style="background: #1e40af; color: white; border: none; padding: 0.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 0.375rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 38px; box-sizing: border-box;">DASHBOARD</a>
                    <button class="btn" onclick="handleGlobalLogout(event)" style="background: transparent; color: #dc2626; border: 2px solid #dc2626; padding: 0.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 0.375rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 38px; box-sizing: border-box;">LOGOUT</button>
                `;
            }

            if (mobileMenu) {
                // Remove existing CTAs
                const existingCtas = mobileMenu.querySelectorAll('.mobile-cta, .mobile-logout, .mobile-dashboard');
                existingCtas.forEach(el => el.remove());

                if (!isDashboardPage) {
                    const dashboardLink = document.createElement('a');
                    dashboardLink.className = 'mobile-link mobile-dashboard';
                    dashboardLink.href = dashboardUrl;
                    dashboardLink.style.fontWeight = 'bold';
                    dashboardLink.style.color = '#1e40af';
                    dashboardLink.textContent = 'Dashboard';
                    mobileMenu.appendChild(dashboardLink);
                }

                const logoutLink = document.createElement('a');
                logoutLink.className = 'mobile-cta mobile-logout';
                logoutLink.href = '#';
                logoutLink.style.background = '#dc2626';
                logoutLink.style.color = 'white';
                logoutLink.style.marginTop = '0.5rem';
                logoutLink.textContent = 'LOGOUT';
                logoutLink.onclick = handleGlobalLogout;
                mobileMenu.appendChild(logoutLink);
            }
        } else {
            // Logged out state
            if (navCta && !isDashboardPage) {
                navCta.style.display = ''; // reset to stylesheet default
                navCta.innerHTML = `
                    <a class="btn btn-primary" href="login.html">LOGIN</a>
                `;
            }

            if (mobileMenu) {
                const existingCtas = mobileMenu.querySelectorAll('.mobile-cta, .mobile-logout, .mobile-dashboard');
                existingCtas.forEach(el => el.remove());

                const loginCta = document.createElement('a');
                loginCta.className = 'mobile-cta';
                loginCta.href = 'login.html';
                loginCta.textContent = 'LOGIN';
                mobileMenu.appendChild(loginCta);
            }
        }
    } catch (e) {
        console.error("Navbar Auth check failed:", e);
    }
}

// Dynamic Accessibility Widget Setup
function initAccessibilityWidget() {
    try {
        if (document.querySelector('.pc-accessibility-widget')) return;

        // 1. Inject Accessibility Panel CSS Styles
        const style = document.createElement('style');
        style.textContent = `
            .pc-accessibility-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 99px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                padding: 6px 12px;
                z-index: 1500;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            body.dark-mode .pc-accessibility-widget {
                background: rgba(30, 41, 59, 0.85);
                border-color: rgba(71, 85, 105, 0.8);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            }

            .pc-acc-btn {
                background: transparent;
                border: none;
                color: #1e293b;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }

            body.dark-mode .pc-acc-btn {
                color: #f8fafc;
            }

            .pc-acc-btn:hover {
                background: rgba(30, 58, 138, 0.1);
                transform: scale(1.15);
            }

            body.dark-mode .pc-acc-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .pc-acc-icon {
                width: 18px;
                height: 18px;
                transition: transform 0.3s ease;
                stroke: currentColor;
            }

            .pc-acc-divider {
                width: 1px;
                height: 20px;
                background: #cbd5e1;
                margin: 0 8px;
            }

            body.dark-mode .pc-acc-divider {
                background: #475569;
            }

            .pc-acc-label {
                position: absolute;
                font-size: 0.6rem;
                font-weight: 700;
                bottom: -1px;
            }

            .pc-theme-toggle-btn:hover .pc-acc-icon {
                transform: rotate(20deg);
            }
        `;
        document.head.appendChild(style);

        // 2. Create accessibility widget panel DOM element
        const widget = document.createElement('div');
        widget.className = 'pc-accessibility-widget';
        widget.innerHTML = `
            <button class="pc-acc-btn" onclick="adjustTextSize(-10)" title="Decrease Text Size" style="padding-bottom: 2px;">
                <svg class="pc-acc-icon" fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 13H5" />
                </svg>
                <span class="pc-acc-label" style="bottom: 0px;">A-</span>
            </button>
            
            <button class="pc-acc-btn pc-acc-size-indicator" onclick="resetTextSize()" title="Reset Text Size" style="font-size: 0.8rem; font-weight: 700; min-width: 45px; letter-spacing: -0.02em;">
                100%
            </button>

            <button class="pc-acc-btn" onclick="adjustTextSize(10)" title="Increase Text Size" style="padding-bottom: 2px;">
                <svg class="pc-acc-icon" fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span class="pc-acc-label" style="bottom: 0px;">A+</span>
            </button>

            <div class="pc-acc-divider"></div>

            <button class="pc-acc-btn pc-theme-toggle-btn" onclick="toggleTheme()" title="Toggle Theme">
                <svg class="pc-acc-icon pc-sun-icon" fill="none" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
                    <circle cx="12" cy="12" r="5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <svg class="pc-acc-icon pc-moon-icon" fill="none" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            </button>
        `;
        document.body.appendChild(widget);

        // 3. Sync theme & size configuration to widget view
        const theme = localStorage.getItem('pc_theme') || 'light';
        const sunIcons = document.querySelectorAll('.pc-sun-icon');
        const moonIcons = document.querySelectorAll('.pc-moon-icon');
        if (theme === 'dark') {
            sunIcons.forEach(i => i.style.display = 'block');
            moonIcons.forEach(i => i.style.display = 'none');
        } else {
            sunIcons.forEach(i => i.style.display = 'none');
            moonIcons.forEach(i => i.style.display = 'block');
        }

        const size = parseInt(localStorage.getItem('pc_font_size') || '100');
        const indicators = document.querySelectorAll('.pc-acc-size-indicator');
        indicators.forEach(ind => ind.textContent = size + '%');

    } catch (e) {
        console.error("Accessibility widget failed to initialize:", e);
    }
}

// Global window actions for accessibility functions
window.toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('pc_theme', isDark ? 'dark' : 'light');
    
    const sunIcons = document.querySelectorAll('.pc-sun-icon');
    const moonIcons = document.querySelectorAll('.pc-moon-icon');
    if (isDark) {
        sunIcons.forEach(i => i.style.display = 'block');
        moonIcons.forEach(i => i.style.display = 'none');
    } else {
        sunIcons.forEach(i => i.style.display = 'none');
        moonIcons.forEach(i => i.style.display = 'block');
    }
};

window.adjustTextSize = (delta) => {
    let size = parseInt(localStorage.getItem('pc_font_size') || '100');
    size = Math.min(130, Math.max(80, size + delta));
    localStorage.setItem('pc_font_size', size);
    document.documentElement.style.fontSize = size + '%';
    
    const indicators = document.querySelectorAll('.pc-acc-size-indicator');
    indicators.forEach(ind => ind.textContent = size + '%');
};

window.resetTextSize = () => {
    localStorage.setItem('pc_font_size', '100');
    document.documentElement.style.fontSize = '100%';
    
    const indicators = document.querySelectorAll('.pc-acc-size-indicator');
    indicators.forEach(ind => ind.textContent = '100%');
};

// Fire initialization payload
DB.initData();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAnnouncementBanner, 0);
        setTimeout(initNavbarAuth, 0);
        setTimeout(initAccessibilityWidget, 0);
    });
} else {
    if (document.body) {
        setTimeout(initAnnouncementBanner, 0);
        setTimeout(initNavbarAuth, 0);
        setTimeout(initAccessibilityWidget, 0);
    } else {
        window.addEventListener('load', () => {
            initAnnouncementBanner();
            initNavbarAuth();
            initAccessibilityWidget();
        });
    }
}

