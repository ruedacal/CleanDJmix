module.exports = {
    content: ["./web/studio.html", "./web/js/studio/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "ui-monospace", "monospace"],
                display: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
