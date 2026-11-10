// Eel Compatibility Stub para entornos estáticos / Figma Sandbox
(function() {
    if (typeof window !== 'undefined' && !window.eel) {
        window.eel = {
            _exposed: {},
            expose: function(fn, name) {
                var n = name || (fn && fn.name);
                if (n) {
                    window.eel._exposed[n] = fn;
                    window[n] = fn;
                }
            }
        };
    }
})();
