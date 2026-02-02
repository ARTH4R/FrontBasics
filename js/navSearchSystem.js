/* =====================================
   SMART SEARCH SYSTEM (FINAL VERSION)
   ===================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ---------- DATA (MATCH HTML) ---------- */
    const searchData = [

        // Beginner
        {
            title: "บทนำ Introduction",
            category: "Beginner",
            description: "แนะนำโครงสร้างพื้นฐานของเว็บไซต์",
            url: "./lesson-introduction.html"
        },
        {
            title: "HTML พื้นฐาน",
            category: "Beginner",
            description: "ศึกษาองค์ประกอบสำคัญของภาษา HTML",
            url: "./lesson-basics-html.html"
        },
        {
            title: "CSS พื้นฐาน",
            category: "Beginner",
            description: "ศึกษาองค์ประกอบสำคัญของภาษา CSS",
            url: "./lesson-basics-css.html"
        },
        {
            title: "Class และ Selection",
            category: "Beginner",
            description: "เรียนรู้การเลือกและจัดกลุ่ม element เพื่อการตกแต่งด้วย CSS",
            url: "./lesson-basics-class-and-selection.html"
        },
        {
            title: "ฟอร์มและองค์ประกอบอินพุต",
            category: "Beginner",
            description: "เชี่ยวชาญการสร้างฟอร์ม HTML ด้วยประเภทอินพุตต่าง ๆ",
            url: "./lesson-html-form.html"
        },

        // Intermediate
        {
            title: "Flexbox และ Grid Layout",
            category: "Intermediate",
            description: "เรียนรู้เทคนิคการจัดวาง CSS สมัยใหม่",
            url: "./lesson-css-layout.html"
        },
        {
            title: "มัลติมีเดียและการเข้าถึง",
            category: "Intermediate",
            description: "เพิ่มรูปภาพ เสียง และวิดีโอลงในหน้าเว็บ",
            url: "./lesson-html-media.html"
        },
        {
            title: "แอนิเมชันและเอฟเฟกต์",
            category: "Intermediate",
            description: "เพิ่มชีวิตชีวาให้เว็บไซต์ด้วยแอนิเมชัน CSS",
            url: "./lesson-css-animation.html"
        },
        {
            title: "Hover & Effects",
            category: "Intermediate",
            description: "สร้างเอฟเฟกต์ให้กับการใช้งานของผู้ใช้",
            url: "#"
        },

        // Advanced
        {
            title: "เหตุการณ์และความโต้ตอบ",
            category: "Advanced",
            description: "จัดการการโต้ตอบของผู้ใช้ด้วย event listener",
            url: "./lesson-js-event.html"
        },
        {
            title: "JavaScript พื้นฐาน",
            category: "Advanced",
            description: "เริ่มต้นเรียนการเขียนคำสั่งและโปรแกรมเบื้องต้น",
            url: "#"
        }
    ];

    /* ---------- DEFAULT (FIRST CLICK) ---------- */
    const defaultResults = [
        searchData.find(i => i.title.includes("บทนำ")),
        searchData.find(i => i.title === "HTML พื้นฐาน"),
        searchData.find(i => i.title === "CSS พื้นฐาน")
    ].filter(Boolean);

    /* ---------- ELEMENTS ---------- */
    const desktop = {
        input: document.getElementById("searchInput"),
        box: document.getElementById("searchSuggestions")
    };

    const mobile = {
        input: document.getElementById("mobileSearchInput"),
        box: document.getElementById("mobileSearchSuggestions")
    };

    /* ---------- UTILS ---------- */
    const normalize = str => str.toLowerCase().trim();

    const debounce = (fn, delay = 200) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    /* ---------- SEARCH ENGINE ---------- */
    function searchEngine(query) {
        const keywords = normalize(query).split(/\s+/);

        return searchData
            .map(item => {
                let score = 0;
                const title = normalize(item.title);
                const category = normalize(item.category);
                const desc = normalize(item.description);

                keywords.forEach(word => {
                    if (title.includes(word)) score += 3;
                    else if (category.includes(word)) score += 2;
                    else if (desc.includes(word)) score += 1;
                });

                return score > 0 ? { ...item, score } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);
    }

    /* ---------- RENDER ---------- */
    function render(box, results) {
        if (!box) return;

        if (!results.length) {
            box.innerHTML = `<div class="no-results">ไม่พบผลลัพธ์</div>`;
            box.classList.add("active");
            return;
        }

        box.innerHTML = results.map(item => `
            <a href="${item.url}" class="suggestion-item">
                <div class="suggestion-header">
                    <div class="suggestion-title">${item.title}</div>
                    <div class="suggestion-category">${item.category}</div>
                </div>
                <div class="suggestion-description">${item.description}</div>
            </a>
        `).join("");

        box.classList.add("active");
    }

    function close(box) {
        box?.classList.remove("active");
    }

    /* ---------- BIND SEARCH ---------- */
    function bind({ input, box }) {
        if (!input || !box) return;

        const handleInput = debounce(value => {
            if (!value.trim()) {
                render(box, defaultResults);
                return;
            }
            render(box, searchEngine(value));
        });

        input.addEventListener("input", e => {
            handleInput(e.target.value);
        });

        input.addEventListener("keydown", e => {
            if (e.key === "Enter" && input.value.trim()) {
                window.location.href =
                    `./search-results.html?q=${encodeURIComponent(input.value.trim())}`;
            }
        });

        input.addEventListener("focus", () => {
            if (!input.value.trim()) {
                render(box, defaultResults);
            } else {
                render(box, searchEngine(input.value));
            }
        });
    }

    bind(desktop);
    bind(mobile);

    /* ---------- CLICK OUTSIDE ---------- */
    document.addEventListener("click", e => {
        if (!e.target.closest(".search-container")) {
            close(desktop.box);
            close(mobile.box);
        }
    });

});
